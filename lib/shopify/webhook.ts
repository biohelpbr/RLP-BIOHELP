/**
 * Utilitários para Webhooks do Shopify
 * SPEC: Seção 8.3 - Webhooks com idempotência
 * 
 * Funcionalidades:
 * - Validação HMAC para segurança
 * - Verificação de idempotência
 * - Processamento de eventos
 */

import { createHmac, timingSafeEqual } from 'crypto'

// =====================================================
// TIPOS
// =====================================================

export interface ShopifyWebhookHeaders {
  'x-shopify-hmac-sha256': string
  'x-shopify-topic': string
  'x-shopify-shop-domain': string
  'x-shopify-api-version': string
  'x-shopify-webhook-id': string
}

export interface ShopifyOrderWebhook {
  id: number
  admin_graphql_api_id: string
  order_number: number
  email: string
  financial_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'voided'
  fulfillment_status: string | null
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  line_items: Array<{
    id: number
    admin_graphql_api_id: string
    product_id: number | null
    variant_id: number | null
    title: string
    sku: string | null
    quantity: number
    price: string
  }>
  customer?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  refunds?: Array<{
    id: number
    created_at: string
    refund_line_items: Array<{
      id: number
      line_item_id: number
      quantity: number
      subtotal: string
    }>
  }>
}

// =====================================================
// VALIDAÇÃO HMAC
// =====================================================

/**
 * Valida a assinatura HMAC do webhook Shopify
 * 
 * @param rawBody - Body da requisição como string
 * @param hmacHeader - Header x-shopify-hmac-sha256
 * @returns true se válido, false caso contrário
 * 
 * SPEC 8.3: Validar assinatura HMAC (segurança)
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[webhook] SHOPIFY_WEBHOOK_SECRET não configurado')
    return false
  }

  try {
    const hash = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64')

    // Usar comparação segura contra timing attacks
    const hashBuffer = Buffer.from(hash)
    const hmacBuffer = Buffer.from(hmacHeader)

    if (hashBuffer.length !== hmacBuffer.length) {
      return false
    }

    return timingSafeEqual(hashBuffer, hmacBuffer)
  } catch (error) {
    console.error('[webhook] Erro ao verificar HMAC:', error)
    return false
  }
}

/**
 * Extrai e valida headers do webhook Shopify
 */
export function extractWebhookHeaders(
  headers: Headers
): ShopifyWebhookHeaders | null {
  const hmac = headers.get('x-shopify-hmac-sha256')
  const topic = headers.get('x-shopify-topic')
  const shopDomain = headers.get('x-shopify-shop-domain')
  const apiVersion = headers.get('x-shopify-api-version')
  const webhookId = headers.get('x-shopify-webhook-id')

  if (!hmac || !topic || !shopDomain) {
    console.error('[webhook] Headers obrigatórios ausentes')
    return null
  }

  return {
    'x-shopify-hmac-sha256': hmac,
    'x-shopify-topic': topic,
    'x-shopify-shop-domain': shopDomain,
    'x-shopify-api-version': apiVersion || '',
    'x-shopify-webhook-id': webhookId || ''
  }
}

/**
 * Verifica se o shop domain é válido (corresponde ao configurado)
 */
export function verifyShopDomain(shopDomain: string): boolean {
  const expectedDomain = process.env.SHOPIFY_STORE_DOMAIN

  if (!expectedDomain) {
    console.error('[webhook] SHOPIFY_STORE_DOMAIN não configurado')
    return false
  }

  // Normalizar domínios (remover protocolo e trailing slash)
  const normalize = (domain: string) => 
    domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')

  return normalize(shopDomain) === normalize(expectedDomain)
}

// =====================================================
// PROCESSAMENTO DE PEDIDOS
// =====================================================

/**
 * Extrai dados relevantes do webhook de pedido
 */
export function extractOrderData(webhook: ShopifyOrderWebhook) {
  return {
    shopifyOrderId: `gid://shopify/Order/${webhook.id}`,
    shopifyOrderNumber: String(webhook.order_number),
    customerEmail: webhook.email?.toLowerCase() || '',
    totalAmount: parseFloat(webhook.total_price),
    currency: webhook.currency,
    financialStatus: webhook.financial_status,
    paidAt: webhook.financial_status === 'paid' ? new Date().toISOString() : null,
    cancelledAt: webhook.cancelled_at,
    lineItems: webhook.line_items.map(item => ({
      id: String(item.id),
      productId: item.product_id ? String(item.product_id) : null,
      variantId: item.variant_id ? String(item.variant_id) : null,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price
    })),
    rawData: webhook
  }
}

/**
 * Converte status financeiro do Shopify para status interno
 */
export function mapFinancialStatus(
  shopifyStatus: ShopifyOrderWebhook['financial_status']
): 'pending' | 'paid' | 'refunded' | 'cancelled' {
  switch (shopifyStatus) {
    case 'paid':
      return 'paid'
    case 'refunded':
    case 'partially_refunded':
      return 'refunded'
    case 'voided':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// =====================================================
// HELPERS PARA LOGGING
// =====================================================

/**
 * Tipos de status para eventos de webhook
 */
export type WebhookEventStatus = 
  | 'received' 
  | 'processing' 
  | 'success' 
  | 'error' 
  | 'skipped'
  | 'commissions_created'
  | 'commissions_skipped'
  | 'commissions_error'

/**
 * Cria log estruturado para webhook
 */
export function logWebhookEvent(
  topic: string,
  orderId: string,
  status: WebhookEventStatus,
  details?: Record<string, unknown>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'shopify_webhook',
    topic,
    orderId,
    status,
    ...details
  }

  if (status === 'error') {
    console.error('[webhook]', JSON.stringify(logEntry))
  } else {
    console.info('[webhook]', JSON.stringify(logEntry))
  }
}

