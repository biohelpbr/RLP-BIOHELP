/**
 * GET /api/admin/backfill-orders  — importa pedidos pagos históricos da Shopify
 * para `orders` + `order_items`, rodando DENTRO do app (auth de prod que já funciona).
 *
 * - Admin-only.  - Idempotente (pula shopify_order_id já existente).
 * - Grava só orders + order_items (cv=0). SEM comissão, SEM mexer em members/saldos.
 * - DRY-RUN por padrão; adicione `&apply=true` pra gravar.
 *
 * Params:
 *   since        data de corte (default 2026-06-01) — created_at >= since
 *   apply        true pra gravar (default false = dry-run)
 *   membersOnly  true pra importar só pedidos de quem é membro (default false = todos os pagos)
 *
 * Ex.: /api/admin/backfill-orders?since=2026-06-01            (dry-run)
 *      /api/admin/backfill-orders?since=2026-06-01&apply=true (grava)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isCurrentUserAdmin } from '@/lib/supabase/server'
import { shopifyGraphQL } from '@/lib/shopify/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ORDERS_QUERY = `
query Backfill($q: String!, $cursor: String) {
  orders(first: 50, after: $cursor, query: $q, sortKey: CREATED_AT) {
    edges { node {
      id name email createdAt
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 100) { edges { node {
        id title quantity sku
        originalUnitPriceSet { shopMoney { amount } }
        product { id } variant { id }
      } } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}`

interface GqlOrders {
  orders: {
    edges: Array<{ node: any }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

export async function GET(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since') || '2026-06-01'
  const apply = searchParams.get('apply') === 'true'
  const membersOnly = searchParams.get('membersOnly') === 'true'

  const supabase = createServiceClient()

  // 1. membros: email -> id
  const { data: members } = await supabase
    .from('members').select('id, email').not('email', 'is', null)
  const emailToMember = new Map(
    (members ?? []).map((m: any) => [String(m.email).toLowerCase().trim(), m.id as string])
  )

  // 2. pedidos já no banco (idempotência)
  const existing = new Set<string>()
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('orders').select('shopify_order_id').range(from, from + 999)
    if (!data || data.length === 0) break
    data.forEach((o: any) => existing.add(o.shopify_order_id))
    if (data.length < 1000) break
  }

  // 3. paginar pedidos pagos da Shopify desde `since`
  const q = `created_at:>=${since} financial_status:paid`
  let cursor: string | null = null
  let found = 0, skipped = 0, notMember = 0, toInsert = 0, ordersIns = 0, itemsIns = 0, errors = 0
  const sample: string[] = []
  const errorMsgs: string[] = []

  do {
    const page = await shopifyGraphQL<GqlOrders>(ORDERS_QUERY, { q, cursor })
    const pageData = page.data
    if (page.errors.length || !pageData) {
      return NextResponse.json(
        { error: 'Falha na Shopify', detail: page.errors, since, dica: 'pode faltar o escopo read_orders no app' },
        { status: 502 }
      )
    }

    for (const { node: o } of pageData.orders.edges) {
      found++
      const email = String(o.email ?? '').toLowerCase().trim()
      const memberId = emailToMember.get(email) ?? null
      if (membersOnly && !memberId) { notMember++; continue }
      if (existing.has(o.id)) { skipped++; continue }
      toInsert++
      const items = (o.lineItems?.edges ?? []).map((e: any) => e.node)
      if (sample.length < 10) {
        sample.push(`${o.name} | ${email || '(s/ email)'} | R$${o.currentTotalPriceSet?.shopMoney?.amount} | ${items.length} item(ns) | membro:${memberId ? 'sim' : 'nao'}`)
      }

      if (apply) {
        try {
          const { data: ins, error: oErr } = await supabase.from('orders').insert({
            shopify_order_id: o.id,
            shopify_order_number: o.name,
            member_id: memberId,
            customer_email: email,
            total_amount: Number(o.currentTotalPriceSet?.shopMoney?.amount ?? 0),
            total_cv: 0,
            currency: o.currentTotalPriceSet?.shopMoney?.currencyCode ?? 'BRL',
            status: 'paid',
            paid_at: o.createdAt,
            shopify_data: o,
          }).select('id').single()
          if (oErr) throw oErr
          ordersIns++
          existing.add(o.id)

          if (items.length) {
            const rows = items.map((li: any) => ({
              order_id: ins!.id,
              shopify_line_item_id: li.id,
              product_id: li.product?.id ?? null,
              variant_id: li.variant?.id ?? null,
              sku: li.sku ?? null,
              title: li.title,
              quantity: li.quantity,
              price: Number(li.originalUnitPriceSet?.shopMoney?.amount ?? 0),
              cv_value: 0,
            }))
            const { error: iErr } = await supabase.from('order_items').insert(rows)
            if (iErr) throw iErr
            itemsIns += rows.length
          }
        } catch (e: any) {
          errors++
          if (errorMsgs.length < 5) errorMsgs.push(`${o.name}: ${e.message ?? e}`)
        }
      }
    }

    cursor = pageData.orders.pageInfo.hasNextPage ? pageData.orders.pageInfo.endCursor : null
  } while (cursor)

  return NextResponse.json({
    since, apply, membersOnly,
    encontrados: found,
    jaExistentes: skipped,
    naoMembro: notMember,
    novosAImportar: toInsert,
    ...(apply
      ? { gravados: ordersIns, itensGravados: itemsIns, erros: errors, errorMsgs }
      : { amostra: sample }),
    proximo: apply ? 'concluído' : 'adicione &apply=true na URL pra gravar de verdade',
  })
}
