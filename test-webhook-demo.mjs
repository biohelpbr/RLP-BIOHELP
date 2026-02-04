/**
 * Script para demonstração - simula webhook de pedido Shopify
 * Cria um pedido novo para demonstrar o fluxo completo
 */

import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'b9b1d73c7cba48e73fcd273e0c86dcc4ce50d71ca8e134adde8bb96a0f349146'
const WEBHOOK_URL = process.env.WEBHOOK_TEST_URL || 'http://localhost:3002/api/webhooks/shopify/orders/paid'
const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'biohelp-dev.myshopify.com'

// Gerar ID único para o pedido (timestamp)
const orderId = Date.now()
const orderNumber = 2000 + Math.floor(Math.random() * 1000)

// Payload de exemplo de um pedido Shopify
const orderPayload = {
  id: orderId,
  admin_graphql_api_id: `gid://shopify/Order/${orderId}`,
  order_number: orderNumber,
  email: 'sponsor@biohelp.test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_price: '250.00',
  subtotal_price: '250.00',
  total_tax: '0.00',
  currency: 'BRL',
  financial_status: 'paid',
  fulfillment_status: null,
  cancelled_at: null,
  customer: {
    id: 7934865473570,
    email: 'sponsor@biohelp.test',
    first_name: 'Sponsor',
    last_name: 'Teste'
  },
  line_items: [
    {
      id: orderId + 1,
      admin_graphql_api_id: `gid://shopify/LineItem/${orderId + 1}`,
      product_id: 8000000000001,
      variant_id: 9000000000001,
      title: 'Lemon Dreams 30 doses',
      quantity: 1,
      price: '159.00',
      sku: 'LEMON-30'
    },
    {
      id: orderId + 2,
      admin_graphql_api_id: `gid://shopify/LineItem/${orderId + 2}`,
      product_id: 8000000000002,
      variant_id: 9000000000002,
      title: 'Creatina Monohidratada',
      quantity: 1,
      price: '91.00',
      sku: 'CREATINA-300'
    }
  ]
}

// Gerar HMAC para autenticar o webhook
const rawBody = JSON.stringify(orderPayload)
const hmac = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody, 'utf8')
  .digest('base64')

console.log('='.repeat(60))
console.log('🧪 DEMONSTRAÇÃO: Simulação de Pedido Shopify')
console.log('='.repeat(60))
console.log('')
console.log('📦 Detalhes do Pedido:')
console.log(`   Número: #${orderPayload.order_number}`)
console.log(`   ID: ${orderPayload.id}`)
console.log(`   Cliente: ${orderPayload.email}`)
console.log(`   Total: R$ ${orderPayload.total_price}`)
console.log('')
console.log('📋 Itens:')
orderPayload.line_items.forEach((item, i) => {
  console.log(`   ${i+1}. ${item.title} (${item.quantity}x) - R$ ${item.price}`)
})
console.log('')
console.log('🔐 Webhook:')
console.log(`   URL: ${WEBHOOK_URL}`)
console.log(`   Shop: ${SHOP_DOMAIN}`)
console.log(`   HMAC: ${hmac.substring(0, 20)}...`)
console.log('')
console.log('⏳ Enviando webhook...')
console.log('')

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Hmac-Sha256': hmac,
      'X-Shopify-Topic': 'orders/paid',
      'X-Shopify-Shop-Domain': SHOP_DOMAIN,
      'X-Shopify-Api-Version': '2024-10',
      'X-Shopify-Webhook-Id': `webhook-${orderId}`
    },
    body: rawBody
  })

  const responseText = await response.text()
  let responseJson
  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = { raw: responseText }
  }
  
  console.log('📬 Resposta:')
  console.log(`   Status: ${response.status} ${response.statusText}`)
  
  if (response.ok) {
    console.log('')
    console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!')
    console.log('')
    console.log('📊 Resultado:')
    if (responseJson.orderId) {
      console.log(`   Order ID (Supabase): ${responseJson.orderId}`)
    }
    if (responseJson.memberId) {
      console.log(`   Member ID: ${responseJson.memberId}`)
    }
    if (responseJson.cv) {
      console.log(`   CV do Pedido: ${responseJson.cv.orderCV}`)
      console.log(`   CV Mensal Atual: ${responseJson.cv.monthlyCV}`)
      console.log(`   Status: ${responseJson.cv.status}`)
    }
    if (responseJson.commissions) {
      console.log(`   Comissões Criadas: ${responseJson.commissions.created}`)
    }
    console.log('')
    console.log('🔍 Verificar no Supabase:')
    console.log('   1. Tabela "orders" - pedido registrado')
    console.log('   2. Tabela "order_items" - itens do pedido')
    console.log('   3. Tabela "cv_ledger" - CV registrado')
    console.log('   4. Tabela "commission_ledger" - comissões geradas')
    console.log('   5. Tabela "members" - CV atualizado')
  } else {
    console.log('')
    console.log('❌ ERRO ao processar webhook')
    console.log(`   Resposta: ${JSON.stringify(responseJson, null, 2)}`)
  }
} catch (error) {
  console.error('❌ Erro de conexão:', error.message)
}

console.log('')
console.log('='.repeat(60))
