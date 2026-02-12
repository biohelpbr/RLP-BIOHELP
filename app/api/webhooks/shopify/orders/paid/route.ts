/**
 * Webhook: Shopify Orders Paid
 * SPEC: Seção 7.3, 8.3 - Handler de webhooks com idempotência
 * 
 * Funcionalidades:
 * - Receber webhook do Shopify quando pedido é pago
 * - Validar assinatura HMAC (segurança)
 * - Verificar idempotência (não processar mesmo pedido 2x)
 * - Buscar member no Supabase por e-mail
 * - Criar registro em orders e order_items
 * - Calcular CV por item
 * - Registrar no cv_ledger
 * - Atualizar members.current_cv_month
 * - [Sprint 4] Calcular e registrar comissões no commission_ledger
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  verifyShopifyWebhook,
  extractWebhookHeaders,
  verifyShopDomain,
  extractOrderData,
  logWebhookEvent,
  ShopifyOrderWebhook
} from '@/lib/shopify/webhook'
import {
  processShopifyLineItems,
  createCVLedgerEntriesForOrder,
  calculateOrderCV,
  timestampToMonthYear,
  getCurrentMonthYear,
  isActiveCV
} from '@/lib/cv/calculator'
import { syncCustomerToShopify } from '@/lib/shopify/customer'
import {
  calculateAllCommissions,
  toCommissionLedgerInserts,
  getCurrentMonthStart,
  type MemberForCommission,
  type FastTrackWindow
} from '@/lib/commissions/calculator'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // 1. Extrair headers
  const webhookHeaders = extractWebhookHeaders(request.headers)
  if (!webhookHeaders) {
    return NextResponse.json(
      { error: 'Missing required headers' },
      { status: 400 }
    )
  }

  // 2. Ler body como texto para validação HMAC
  const rawBody = await request.text()
  
  // 3. Validar HMAC
  const isValidHmac = verifyShopifyWebhook(
    rawBody,
    webhookHeaders['x-shopify-hmac-sha256']
  )
  
  if (!isValidHmac) {
    console.error('[webhook] HMAC inválido')
    return NextResponse.json(
      { error: 'Invalid HMAC signature' },
      { status: 401 }
    )
  }

  // 4. Validar shop domain
  if (!verifyShopDomain(webhookHeaders['x-shopify-shop-domain'])) {
    console.error('[webhook] Shop domain inválido')
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 401 }
    )
  }

  // 5. Parse do body
  let orderData: ShopifyOrderWebhook
  try {
    orderData = JSON.parse(rawBody)
  } catch {
    console.error('[webhook] JSON inválido')
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const extractedData = extractOrderData(orderData)
  const shopifyOrderId = extractedData.shopifyOrderId

  logWebhookEvent('orders/paid', shopifyOrderId, 'received', {
    email: extractedData.customerEmail,
    total: extractedData.totalAmount
  })

  // 6. Verificar idempotência - pedido já processado?
  const supabase = createServiceClient()
  
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('shopify_order_id', shopifyOrderId)
    .single()

  if (existingOrder) {
    logWebhookEvent('orders/paid', shopifyOrderId, 'skipped', {
      reason: 'Order already exists',
      existingStatus: existingOrder.status
    })
    
    // Retornar 200 para o Shopify não reenviar
    return NextResponse.json({
      success: true,
      message: 'Order already processed',
      orderId: existingOrder.id
    })
  }

  // 7. Buscar membro por e-mail
  const { data: member } = await supabase
    .from('members')
    .select('id, ref_code, sponsor_id, status, current_cv_month, current_cv_month_year')
    .eq('email', extractedData.customerEmail.toLowerCase())
    .single()

  if (!member) {
    logWebhookEvent('orders/paid', shopifyOrderId, 'skipped', {
      reason: 'Member not found',
      email: extractedData.customerEmail
    })
    
    // Criar pedido mesmo sem membro (para rastreamento)
    await supabase.from('orders').insert({
      shopify_order_id: shopifyOrderId,
      shopify_order_number: extractedData.shopifyOrderNumber,
      member_id: null,
      customer_email: extractedData.customerEmail,
      total_amount: extractedData.totalAmount,
      total_cv: 0,
      currency: extractedData.currency,
      status: 'paid',
      paid_at: new Date().toISOString(),
      shopify_data: extractedData.rawData
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order saved but member not found',
      memberFound: false
    })
  }

  logWebhookEvent('orders/paid', shopifyOrderId, 'processing', {
    memberId: member.id
  })

  const monthYear = getCurrentMonthYear()

  // 8. Processar itens do pedido e calcular CV (via metafield ou fallback)
  // REGRA TBD-008: CV é definido por produto via metacampo/metafield
  const processedItems = processShopifyLineItems(
    extractedData.lineItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      // Passar properties/metafields se disponíveis no payload
      properties: (item as any).properties,
      metafields: (item as any).metafields
    })),
    'temp-order-id' // ID temporário, será atualizado após criar o pedido
  )

  // 9. Calcular CV total do pedido (soma dos CVs dos itens)
  const totalCV = calculateOrderCV(processedItems)

  // 10. Criar registro do pedido
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      shopify_order_id: shopifyOrderId,
      shopify_order_number: extractedData.shopifyOrderNumber,
      member_id: member.id,
      customer_email: extractedData.customerEmail,
      total_amount: extractedData.totalAmount,
      total_cv: totalCV,
      currency: extractedData.currency,
      status: 'paid',
      paid_at: new Date().toISOString(),
      shopify_data: extractedData.rawData
    })
    .select('id')
    .single()

  if (orderError || !newOrder) {
    logWebhookEvent('orders/paid', shopifyOrderId, 'error', {
      error: orderError?.message || 'Failed to create order'
    })
    
    return NextResponse.json(
      { error: 'Failed to create order', details: orderError?.message },
      { status: 500 }
    )
  }

  // 11. Atualizar order_id nos itens processados
  const orderItems = processedItems.map(item => ({
    ...item,
    order_id: newOrder.id
  }))

  // Remover cv_source antes de inserir (campo não existe na tabela)
  const orderItemsForInsert = orderItems.map(({ cv_source, ...item }) => item)

  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsForInsert)
    .select('id, cv_value, title')

  if (itemsError) {
    console.error('[webhook] Erro ao criar order_items:', itemsError)
  }

  // 12. Criar entradas no CV ledger
  if (insertedItems && insertedItems.length > 0) {
    const ledgerEntries = createCVLedgerEntriesForOrder(
      member.id,
      newOrder.id,
      insertedItems,
      monthYear
    )

    const { error: ledgerError } = await supabase
      .from('cv_ledger')
      .insert(ledgerEntries)

    if (ledgerError) {
      console.error('[webhook] Erro ao criar cv_ledger:', ledgerError)
    }
  }

  // 13. Atualizar CV mensal do membro
  const currentMonthCV = (member.current_cv_month_year === monthYear)
    ? (member.current_cv_month || 0) + totalCV
    : totalCV // Novo mês, reiniciar contagem

  const newStatus = isActiveCV(currentMonthCV) ? 'active' : member.status

  const { error: updateError } = await supabase
    .from('members')
    .update({
      current_cv_month: currentMonthCV,
      current_cv_month_year: monthYear,
      last_cv_calculation_at: new Date().toISOString(),
      status: newStatus
    })
    .eq('id', member.id)

  if (updateError) {
    console.error('[webhook] Erro ao atualizar member:', updateError)
  }

  // 13. Se status mudou para active, atualizar tag no Shopify
  if (newStatus === 'active' && member.status !== 'active') {
    // Buscar sponsor ref_code para a tag
    let sponsorRefCode: string | null = null
    if (member.sponsor_id) {
      const { data: sponsor } = await supabase
        .from('members')
        .select('ref_code')
        .eq('id', member.sponsor_id)
        .single()
      sponsorRefCode = sponsor?.ref_code || null
    }

    // Buscar nome e level do membro para sync (TBD-003)
    const { data: memberFull } = await supabase
      .from('members')
      .select('name, level')
      .eq('id', member.id)
      .single()

    // Atualizar tags no Shopify (em background, não bloquear resposta)
    syncCustomerToShopify({
      email: extractedData.customerEmail,
      firstName: memberFull?.name || '',
      refCode: member.ref_code,
      sponsorRefCode,
      level: memberFull?.level || 'membro',
      status: newStatus, // status atualizado (TBD-003)
    }).catch(err => {
      console.error('[webhook] Erro ao sync Shopify:', err)
    })
  }

  // 14. Atualizar ou criar resumo mensal
  const { data: existingSummary } = await supabase
    .from('cv_monthly_summary')
    .select('id, total_cv, orders_count')
    .eq('member_id', member.id)
    .eq('month_year', monthYear)
    .single()

  if (existingSummary) {
    await supabase
      .from('cv_monthly_summary')
      .update({
        total_cv: existingSummary.total_cv + totalCV,
        orders_count: existingSummary.orders_count + 1
      })
      .eq('id', existingSummary.id)
  } else {
    await supabase
      .from('cv_monthly_summary')
      .insert({
        member_id: member.id,
        month_year: monthYear,
        total_cv: totalCV,
        orders_count: 1
      })
  }

  // =====================================================
  // 15. [Sprint 4] CALCULAR E REGISTRAR COMISSÕES
  // =====================================================
  let commissionsCreated = 0
  try {
    // Buscar dados completos do comprador
    const { data: buyerData } = await supabase
      .from('members')
      .select('id, sponsor_id, level, status, name')
      .eq('id', member.id)
      .single()

    if (buyerData && buyerData.sponsor_id && totalCV > 0) {
      // Buscar sponsor (N0)
      const { data: sponsorData } = await supabase
        .from('members')
        .select('id, sponsor_id, level, status, name')
        .eq('id', buyerData.sponsor_id)
        .single()

      // Buscar grand sponsor (N1 do sponsor)
      let grandSponsorData: MemberForCommission | null = null
      if (sponsorData?.sponsor_id) {
        const { data: gs } = await supabase
          .from('members')
          .select('id, sponsor_id, level, status, name')
          .eq('id', sponsorData.sponsor_id)
          .single()
        if (gs) {
          grandSponsorData = {
            id: gs.id,
            sponsor_id: gs.sponsor_id,
            level: gs.level,
            status: gs.status,
            name: gs.name
          }
        }
      }

      // Buscar janela Fast-Track N1
      let fastTrackWindow: FastTrackWindow | null = null
      if (sponsorData) {
        const { data: ftw } = await supabase
          .from('fast_track_windows')
          .select('*')
          .eq('sponsor_id', sponsorData.id)
          .eq('member_id', buyerData.id)
          .eq('is_active', true)
          .single()
        
        if (ftw) {
          fastTrackWindow = {
            sponsor_id: ftw.sponsor_id,
            member_id: ftw.member_id,
            started_at: new Date(ftw.started_at),
            phase_1_ends_at: new Date(ftw.phase_1_ends_at),
            phase_2_ends_at: new Date(ftw.phase_2_ends_at),
            is_active: ftw.is_active
          }
        }
      }

      // Buscar janela Fast-Track N2 (para grand sponsor)
      let fastTrackWindowN2: FastTrackWindow | null = null
      if (grandSponsorData) {
        const { data: ftw2 } = await supabase
          .from('fast_track_windows')
          .select('*')
          .eq('sponsor_id', grandSponsorData.id)
          .eq('member_id', buyerData.id)
          .eq('is_active', true)
          .single()
        
        if (ftw2) {
          fastTrackWindowN2 = {
            sponsor_id: ftw2.sponsor_id,
            member_id: ftw2.member_id,
            started_at: new Date(ftw2.started_at),
            phase_1_ends_at: new Date(ftw2.phase_1_ends_at),
            phase_2_ends_at: new Date(ftw2.phase_2_ends_at),
            is_active: ftw2.is_active
          }
        }
      }

      // Preparar dados para cálculo
      const buyer: MemberForCommission = {
        id: buyerData.id,
        sponsor_id: buyerData.sponsor_id,
        level: buyerData.level,
        status: buyerData.status,
        name: buyerData.name
      }

      const sponsor: MemberForCommission | null = sponsorData ? {
        id: sponsorData.id,
        sponsor_id: sponsorData.sponsor_id,
        level: sponsorData.level,
        status: sponsorData.status,
        name: sponsorData.name
      } : null

      // Calcular todas as comissões
      const commissions = calculateAllCommissions(
        totalCV,
        newOrder.id,
        buyer,
        sponsor,
        grandSponsorData,
        fastTrackWindow,
        fastTrackWindowN2
      )

      // Converter para formato de inserção e salvar
      if (commissions.length > 0) {
        const ledgerInserts = toCommissionLedgerInserts(commissions, getCurrentMonthStart())
        
        const { error: commissionError } = await supabase
          .from('commission_ledger')
          .insert(ledgerInserts)

        if (commissionError) {
          console.error('[webhook] Erro ao criar comissões:', commissionError)
        } else {
          commissionsCreated = commissions.length
          logWebhookEvent('orders/paid', shopifyOrderId, 'commissions_created', {
            count: commissionsCreated,
            total: commissions.reduce((sum, c) => sum + c.amount, 0)
          })
        }
      }
    }
  } catch (commissionErr) {
    // Log do erro mas não falha o webhook
    console.error('[webhook] Erro no cálculo de comissões:', commissionErr)
  }

  // =====================================================
  // 16. [TBD-019] DETECTAR USO DE CUPOM CREATINA
  // =====================================================
  try {
    const creatineCoupon = extractedData.discountCodes?.find(
      (dc: { code: string }) => dc.code.toUpperCase().startsWith('CREATINA-')
    )

    if (creatineCoupon && member) {
      const couponCode = creatineCoupon.code.toUpperCase()
      console.info(`[webhook] Cupom creatina detectado: ${couponCode} (membro: ${member.id})`)

      // Buscar claim pelo coupon_code
      const { data: claim } = await supabase
        .from('free_creatine_claims')
        .select('id')
        .eq('coupon_code', couponCode)
        .eq('member_id', member.id)
        .single()

      if (claim) {
        // Atualizar com order_id
        await supabase
          .from('free_creatine_claims')
          .update({
            order_id: newOrder.id,
            status: 'claimed',
          })
          .eq('id', claim.id)

        console.info(`[webhook] Creatina claim atualizado: ${claim.id} → order ${newOrder.id}`)
      } else {
        // Cupom usado sem claim prévio — registrar mesmo assim
        const currentMonth = getCurrentMonthYear()
        await supabase
          .from('free_creatine_claims')
          .upsert({
            member_id: member.id,
            month_year: currentMonth,
            order_id: newOrder.id,
            coupon_code: couponCode,
            status: 'claimed',
          }, {
            onConflict: 'member_id,month_year'
          })

        console.info(`[webhook] Creatina claim criado retroativamente para ${member.id}`)
      }
    }
  } catch (creatineErr) {
    // Log mas não falha o webhook
    console.error('[webhook] Erro ao processar cupom creatina:', creatineErr)
  }

  const duration = Date.now() - startTime
  
  logWebhookEvent('orders/paid', shopifyOrderId, 'success', {
    memberId: member.id,
    orderId: newOrder.id,
    totalCV,
    newMonthlyCV: currentMonthCV,
    statusChanged: newStatus !== member.status,
    commissionsCreated,
    duration: `${duration}ms`
  })

  return NextResponse.json({
    success: true,
    orderId: newOrder.id,
    memberId: member.id,
    cv: {
      orderCV: totalCV,
      monthlyCV: currentMonthCV,
      status: newStatus
    },
    commissions: {
      created: commissionsCreated
    }
  })
}

