/**
 * Webhook: Shopify Orders Cancelled
 * SPEC: Seção 7.3, 8.3 - Handler de webhooks com idempotência
 * 
 * Funcionalidades:
 * - Receber webhook do Shopify quando pedido é cancelado
 * - Validar assinatura HMAC (segurança)
 * - Reverter CV quando pedido é cancelado
 * - Atualizar status do pedido para 'cancelled'
 * - Registrar reversão no cv_ledger
 * - Recalcular CV mensal
 * - Verificar se status deve voltar para 'pending'
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
  createCVLedgerReversalEntries,
  getCurrentMonthYear,
  isActiveCV
} from '@/lib/cv/calculator'

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

  logWebhookEvent('orders/cancelled', shopifyOrderId, 'received', {
    email: extractedData.customerEmail,
    total: extractedData.totalAmount
  })

  const supabase = createServiceClient()

  // 6. Buscar pedido existente
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, member_id, total_cv, status')
    .eq('shopify_order_id', shopifyOrderId)
    .single()

  if (!existingOrder) {
    logWebhookEvent('orders/cancelled', shopifyOrderId, 'skipped', {
      reason: 'Order not found in database'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order not found, nothing to cancel'
    })
  }

  // 7. Verificar se já foi cancelado ou reembolsado
  if (existingOrder.status === 'cancelled' || existingOrder.status === 'refunded') {
    logWebhookEvent('orders/cancelled', shopifyOrderId, 'skipped', {
      reason: `Order already ${existingOrder.status}`
    })
    
    return NextResponse.json({
      success: true,
      message: `Order already ${existingOrder.status}`
    })
  }

  logWebhookEvent('orders/cancelled', shopifyOrderId, 'processing', {
    orderId: existingOrder.id,
    memberId: existingOrder.member_id
  })

  // 8. Atualizar status do pedido
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', existingOrder.id)

  if (orderUpdateError) {
    logWebhookEvent('orders/cancelled', shopifyOrderId, 'error', {
      error: orderUpdateError.message
    })
    
    return NextResponse.json(
      { error: 'Failed to update order', details: orderUpdateError.message },
      { status: 500 }
    )
  }

  // 9. Se não tem membro associado, apenas marcar como cancelled
  if (!existingOrder.member_id) {
    logWebhookEvent('orders/cancelled', shopifyOrderId, 'success', {
      message: 'Order cancelled but no member associated'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order marked as cancelled (no member)'
    })
  }

  // 10. Verificar se o pedido tinha CV (status era 'paid')
  // Só reverter CV se o pedido estava pago
  if (existingOrder.status !== 'paid' || existingOrder.total_cv === 0) {
    logWebhookEvent('orders/cancelled', shopifyOrderId, 'success', {
      message: 'Order cancelled but no CV to reverse',
      previousStatus: existingOrder.status
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order cancelled (no CV to reverse)'
    })
  }

  // 11. Buscar itens do pedido para reversão
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, cv_value, title')
    .eq('order_id', existingOrder.id)

  const monthYear = getCurrentMonthYear()

  // 12. Criar entradas de reversão no cv_ledger
  if (orderItems && orderItems.length > 0) {
    const reversalEntries = createCVLedgerReversalEntries(
      existingOrder.member_id,
      existingOrder.id,
      orderItems,
      monthYear,
      'order_cancelled'
    )

    const { error: ledgerError } = await supabase
      .from('cv_ledger')
      .insert(reversalEntries)

    if (ledgerError) {
      console.error('[webhook] Erro ao criar reversão no cv_ledger:', ledgerError)
    }
  }

  // 13. Recalcular CV mensal do membro
  const { data: member } = await supabase
    .from('members')
    .select('id, status, current_cv_month, current_cv_month_year')
    .eq('id', existingOrder.member_id)
    .single()

  if (member) {
    // Calcular novo CV mensal
    const newMonthlyCV = (member.current_cv_month_year === monthYear)
      ? Math.max(0, (member.current_cv_month || 0) - existingOrder.total_cv)
      : 0 // Mês diferente, o CV já foi zerado

    // Verificar se status deve mudar
    const shouldBeActive = isActiveCV(newMonthlyCV)
    const newStatus = shouldBeActive ? 'active' : 'pending'

    const { error: memberUpdateError } = await supabase
      .from('members')
      .update({
        current_cv_month: newMonthlyCV,
        last_cv_calculation_at: new Date().toISOString(),
        status: newStatus
      })
      .eq('id', member.id)

    if (memberUpdateError) {
      console.error('[webhook] Erro ao atualizar member:', memberUpdateError)
    }

    // 14. Atualizar resumo mensal
    const { data: summary } = await supabase
      .from('cv_monthly_summary')
      .select('id, total_cv, orders_count')
      .eq('member_id', member.id)
      .eq('month_year', monthYear)
      .single()

    if (summary) {
      await supabase
        .from('cv_monthly_summary')
        .update({
          total_cv: Math.max(0, summary.total_cv - existingOrder.total_cv),
          orders_count: Math.max(0, summary.orders_count - 1)
        })
        .eq('id', summary.id)
    }

    const duration = Date.now() - startTime

    logWebhookEvent('orders/cancelled', shopifyOrderId, 'success', {
      memberId: member.id,
      orderId: existingOrder.id,
      reversedCV: existingOrder.total_cv,
      newMonthlyCV,
      statusChanged: newStatus !== member.status,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      success: true,
      orderId: existingOrder.id,
      memberId: member.id,
      cv: {
        reversedCV: existingOrder.total_cv,
        monthlyCV: newMonthlyCV,
        status: newStatus
      }
    })
  }

  const duration = Date.now() - startTime

  logWebhookEvent('orders/cancelled', shopifyOrderId, 'success', {
    orderId: existingOrder.id,
    duration: `${duration}ms`
  })

  return NextResponse.json({
    success: true,
    orderId: existingOrder.id,
    message: 'Order cancelled'
  })
}

