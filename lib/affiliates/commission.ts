import { createServiceClient } from "@/lib/supabase/server"
import { affiliateTierPct, AFF_PERPETUAL_PCT } from "@/lib/commissions-v2/simulate"
import { hasUnlockedPerpetual } from "./gmv"

/**
 * F-V35 fase 3 — cálculo da comissão de afiliado no fechamento do mês.
 *
 * Regras (cliente):
 *   - Comissão da VENDA → Afiliado Atual = faixa(GMV do mês do Atual) × valor da venda.
 *   - PERPÉTUA → Afiliado Originador = 10% × valor da venda, SE:
 *       (a) o Originador é diferente do Atual (recompra via outro afiliado), e
 *       (b) o Originador já destravou (>=50k de GMV em algum mês).
 *   - Autocompra não entra (já marcada is_self_purchase, filtrada aqui).
 *
 * Idempotente por MÊS: se já houver comissão de afiliado lançada no reference_month,
 * `commit` recusa (evita pagar duas vezes). `commit=false` é dry-run (não grava).
 *
 * Nota: a regra de decaimento da perpétua (perder após 3 meses sem venda) fica como
 * refinamento — hoje "destravou" = bateu 50k em algum mês. [TBD-decay]
 */

const round2 = (n: number) => Math.round(n * 100) / 100

export interface AffiliateCommissionSummary {
  referenceMonth: string
  committed: boolean
  alreadyClosed: boolean
  affiliates: number
  salesConsidered: number
  saleCommissionTotal: number
  perpetualTotal: number
  rows: number
  error?: string
}

type SaleRow = {
  shopify_order_id: string
  order_id: string | null
  affiliate_member_id: string
  customer_email: string | null
  gross_amount: number | null
}

export async function computeAffiliateCommissions(
  referenceMonth: string,
  opts: { commit: boolean } = { commit: false },
): Promise<AffiliateCommissionSummary> {
  const supabase = createServiceClient()
  const base: AffiliateCommissionSummary = {
    referenceMonth,
    committed: false,
    alreadyClosed: false,
    affiliates: 0,
    salesConsidered: 0,
    saleCommissionTotal: 0,
    perpetualTotal: 0,
    rows: 0,
  }

  // Guarda de idempotência: mês já fechado?
  const { data: existing } = await supabase
    .from("commission_ledger")
    .select("id")
    .in("commission_type", ["affiliate_sale", "affiliate_perpetual"])
    .eq("reference_month", referenceMonth)
    .limit(1)
  if (existing && existing.length > 0) {
    if (opts.commit) return { ...base, alreadyClosed: true, error: "mês já fechado" }
    base.alreadyClosed = true
  }

  const { data: salesData, error } = await supabase
    .from("affiliate_sales")
    .select("shopify_order_id, order_id, affiliate_member_id, customer_email, gross_amount")
    .eq("reference_month", referenceMonth)
    .eq("is_self_purchase", false)
  if (error) return { ...base, error: error.message }

  const sales = (salesData || []) as SaleRow[]
  base.salesConsidered = sales.length
  if (sales.length === 0) return base

  // GMV por afiliado (define a faixa).
  const gmvByAffiliate = new Map<string, number>()
  for (const s of sales) {
    gmvByAffiliate.set(
      s.affiliate_member_id,
      round2((gmvByAffiliate.get(s.affiliate_member_id) ?? 0) + Number(s.gross_amount ?? 0)),
    )
  }
  base.affiliates = gmvByAffiliate.size

  // Originador por cliente.
  const emails = Array.from(new Set(sales.map((s) => (s.customer_email || "").toLowerCase()).filter(Boolean)))
  const originByEmail = new Map<string, string>()
  if (emails.length > 0) {
    const { data: origins } = await supabase
      .from("affiliate_customer_origin")
      .select("customer_email, originador_member_id")
      .in("customer_email", emails)
    for (const o of (origins || []) as Array<{ customer_email: string; originador_member_id: string }>) {
      originByEmail.set(o.customer_email.toLowerCase(), o.originador_member_id)
    }
  }

  // Cache de "destravou perpétua" por originador.
  const unlockedCache = new Map<string, boolean>()
  const isUnlocked = async (memberId: string): Promise<boolean> => {
    if (unlockedCache.has(memberId)) return unlockedCache.get(memberId)!
    const u = await hasUnlockedPerpetual(memberId)
    unlockedCache.set(memberId, u)
    return u
  }

  type Ledger = Record<string, unknown>
  const rows: Ledger[] = []

  for (const s of sales) {
    const gross = Number(s.gross_amount ?? 0)
    if (gross <= 0) continue
    const atual = s.affiliate_member_id
    const tier = affiliateTierPct(gmvByAffiliate.get(atual) ?? 0)

    // Comissão da venda → Atual.
    const saleComm = round2(gross * (tier / 100))
    if (saleComm > 0) {
      base.saleCommissionTotal = round2(base.saleCommissionTotal + saleComm)
      rows.push({
        member_id: atual,
        commission_type: "affiliate_sale",
        amount: saleComm,
        cv_base: gross,
        percentage: tier,
        source_order_id: s.order_id,
        reference_month: referenceMonth,
        description: `Afiliado — venda (${tier}% de R$${gross})`,
        metadata: { shopify_order_id: s.shopify_order_id, role: "atual" },
      })
    }

    // Perpétua → Originador (se diferente e destravado).
    const email = (s.customer_email || "").toLowerCase()
    const originador = email ? originByEmail.get(email) : undefined
    if (originador && originador !== atual && (await isUnlocked(originador))) {
      const perp = round2(gross * (AFF_PERPETUAL_PCT / 100))
      if (perp > 0) {
        base.perpetualTotal = round2(base.perpetualTotal + perp)
        rows.push({
          member_id: originador,
          commission_type: "affiliate_perpetual",
          amount: perp,
          cv_base: gross,
          percentage: AFF_PERPETUAL_PCT,
          source_order_id: s.order_id,
          reference_month: referenceMonth,
          description: `Afiliado — perpétua (${AFF_PERPETUAL_PCT}% de R$${gross})`,
          metadata: { shopify_order_id: s.shopify_order_id, role: "originador", atual },
        })
      }
    }
  }

  base.rows = rows.length

  if (opts.commit && !base.alreadyClosed && rows.length > 0) {
    const { error: insErr } = await supabase.from("commission_ledger").insert(rows)
    if (insErr) return { ...base, error: insErr.message }
    base.committed = true
  }

  return base
}
