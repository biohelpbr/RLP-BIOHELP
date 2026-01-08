/**
 * Script para testar o webhook do Shopify localmente
 * Simula um pedido pago e verifica se o CV é calculado
 */

import crypto from 'crypto'

const WEBHOOK_SECRET = 'b9b1d73c7cba48e73fcd273e0c86dcc4ce50d71ca8e134adde8bb96a0f349146'
// Testar na Vercel (produção)
const WEBHOOK_URL = 'https://rlp-biohelp.vercel.app/api/webhooks/shopify/orders/paid'

// Payload de exemplo de um pedido Shopify
const orderPayload = {
  id: 8888888888888,  // ID diferente para novo teste
  order_number: 1002,
  email: 'sponsor@biohelp.test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_price: '150.00',
  subtotal_price: '150.00',
  total_tax: '0.00',
  currency: 'BRL',
  financial_status: 'paid',
  fulfillment_status: null,
  customer: {
    id: 8888888888888,
    email: 'sponsor@biohelp.test',
    first_name: 'Sponsor',
    last_name: 'Teste'
  },
  line_items: [
    {
      id: 1111111111111,
      product_id: 2222222222222,
      variant_id: 3333333333333,
      title: 'Produto Teste 1',
      quantity: 2,
      price: '50.00',
      sku: 'PROD-001'
    },
    {
      id: 4444444444444,
      product_id: 5555555555555,
      variant_id: 6666666666666,
      title: 'Produto Teste 2',
      quantity: 1,
      price: '50.00',
      sku: 'PROD-002'
    }
  ]
}

// Gerar HMAC para autenticar o webhook (Shopify usa base64!)
const rawBody = JSON.stringify(orderPayload)
const hmac = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody, 'utf8')
  .digest('base64')

console.log('=== Teste de Webhook Shopify ===\n')
console.log('URL:', WEBHOOK_URL)
console.log('Email do cliente:', orderPayload.email)
console.log('Total do pedido: R$', orderPayload.total_price)
console.log('Itens:', orderPayload.line_items.length)
console.log('HMAC gerado:', hmac.substring(0, 20) + '...')
console.log('\nEnviando webhook...\n')

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Hmac-Sha256': hmac,
      'X-Shopify-Topic': 'orders/paid',
      'X-Shopify-Shop-Domain': 'biohelp-dev.myshopify.com'
    },
    body: rawBody
  })

  const responseText = await response.text()
  
  console.log('Status:', response.status, response.statusText)
  console.log('Response:', responseText)
  
  if (response.ok) {
    console.log('\n✅ Webhook processado com sucesso!')
    console.log('\nPróximos passos:')
    console.log('1. Verifique no Supabase se o pedido foi registrado na tabela "orders"')
    console.log('2. Verifique se o CV foi registrado na tabela "cv_ledger"')
    console.log('3. Verifique se o current_cv do membro foi atualizado')
  } else {
    console.log('\n❌ Erro ao processar webhook')
  }
} catch (error) {
  console.error('Erro:', error.message)
}

