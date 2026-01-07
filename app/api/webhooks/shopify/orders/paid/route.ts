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

  // 8. Calcular CV total do pedido
  const totalCV = calculateOrderCV(extractedData.lineItems)
  const monthYear = getCurrentMonthYear()

  // 9. Criar registro do pedido
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

  // 10. Criar itens do pedido
  const orderItems = processShopifyLineItems(
    extractedData.lineItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price
    })),
    newOrder.id
  )

  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select('id, cv_value, title')

  if (itemsError) {
    console.error('[webhook] Erro ao criar order_items:', itemsError)
  }

  // 11. Criar entradas no CV ledger
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

  // 12. Atualizar CV mensal do membro
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

    // Buscar nome do membro para sync
    const { data: memberFull } = await supabase
      .from('members')
      .select('name')
      .eq('id', member.id)
      .single()

    // Atualizar tags no Shopify (em background, não bloquear resposta)
    syncCustomerToShopify({
      email: extractedData.customerEmail,
      firstName: memberFull?.name || '',
      refCode: member.ref_code,
      sponsorRefCode
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

  const duration = Date.now() - startTime
  
  logWebhookEvent('orders/paid', shopifyOrderId, 'success', {
    memberId: member.id,
    orderId: newOrder.id,
    totalCV,
    newMonthlyCV: currentMonthCV,
    statusChanged: newStatus !== member.status,
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
    }
  })
}

