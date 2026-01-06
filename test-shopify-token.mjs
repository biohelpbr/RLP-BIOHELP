/**
 * Script de teste para validar o token Shopify Admin API
 * Uso: node test-shopify-token.mjs
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SHOP = process.env.SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN

console.log('='.repeat(60))
console.log('🔍 Validação do Token Shopify Admin API')
console.log('='.repeat(60))

// Verificar variáveis
console.log('\n📋 Variáveis de ambiente:')
console.log(`  SHOPIFY_STORE_DOMAIN: ${SHOP ? '✅ ' + SHOP : '❌ NÃO CONFIGURADO'}`)
console.log(`  SHOPIFY_ADMIN_API_TOKEN: ${TOKEN ? '✅ ' + TOKEN.substring(0, 10) + '...' : '❌ NÃO CONFIGURADO'}`)

if (!SHOP || !TOKEN) {
  console.log('\n❌ ERRO: Faltam variáveis de ambiente!')
  console.log('\nAdicione ao .env.local:')
  console.log('  SHOPIFY_STORE_DOMAIN=sua-loja.myshopify.com')
  console.log('  SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx')
  console.log('\nPara obter o token:')
  console.log('  1. Acesse Shopify Admin → Settings → Apps and sales channels')
  console.log('  2. Clique em "Develop apps"')
  console.log('  3. Crie ou selecione um app')
  console.log('  4. Em "API credentials", gere um Admin API access token')
  console.log('  5. Certifique-se de que os scopes read_customers e write_customers estão habilitados')
  process.exit(1)
}

// Teste 1: REST API - Shop info
console.log('\n🧪 Teste 1: REST API (shop.json)')
const restUrl = `https://${SHOP}/admin/api/2024-10/shop.json`
console.log(`  URL: ${restUrl}`)

try {
  const restRes = await fetch(restUrl, {
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
  })
  
  console.log(`  Status: ${restRes.status} ${restRes.statusText}`)
  
  if (restRes.ok) {
    const data = await restRes.json()
    console.log('  ✅ Sucesso!')
    console.log(`  Loja: ${data.shop?.name}`)
    console.log(`  Domínio: ${data.shop?.myshopify_domain}`)
    console.log(`  Plano: ${data.shop?.plan_name}`)
  } else {
    const text = await restRes.text()
    console.log('  ❌ Erro:', text.substring(0, 200))
  }
} catch (error) {
  console.log('  ❌ Erro de conexão:', error.message)
}

// Teste 2: GraphQL API - Query simples
console.log('\n🧪 Teste 2: GraphQL API (shop query)')
const graphqlUrl = `https://${SHOP}/admin/api/2024-10/graphql.json`
console.log(`  URL: ${graphqlUrl}`)

try {
  const graphqlRes = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          shop {
            name
            myshopifyDomain
            plan {
              displayName
            }
          }
        }
      `
    }),
  })
  
  console.log(`  Status: ${graphqlRes.status} ${graphqlRes.statusText}`)
  
  if (graphqlRes.ok) {
    const data = await graphqlRes.json()
    if (data.errors) {
      console.log('  ⚠️ GraphQL Errors:', JSON.stringify(data.errors, null, 2))
    } else {
      console.log('  ✅ Sucesso!')
      console.log(`  Loja: ${data.data?.shop?.name}`)
      console.log(`  Plano: ${data.data?.shop?.plan?.displayName}`)
    }
  } else {
    const text = await graphqlRes.text()
    console.log('  ❌ Erro:', text.substring(0, 200))
  }
} catch (error) {
  console.log('  ❌ Erro de conexão:', error.message)
}

// Teste 3: Verificar scopes (customers)
console.log('\n🧪 Teste 3: Verificar acesso a Customers')

try {
  const customersRes = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          customers(first: 1) {
            nodes {
              id
              email
            }
          }
        }
      `
    }),
  })
  
  console.log(`  Status: ${customersRes.status}`)
  
  if (customersRes.ok) {
    const data = await customersRes.json()
    if (data.errors) {
      console.log('  ⚠️ Erro de permissão:')
      data.errors.forEach(e => console.log(`    - ${e.message}`))
      console.log('\n  💡 Solução: Adicione os scopes read_customers e write_customers ao app')
    } else {
      console.log('  ✅ Acesso a Customers OK!')
      console.log(`  Total de customers encontrados: ${data.data?.customers?.nodes?.length || 0}`)
    }
  } else {
    const text = await customersRes.text()
    console.log('  ❌ Erro:', text.substring(0, 200))
  }
} catch (error) {
  console.log('  ❌ Erro de conexão:', error.message)
}

console.log('\n' + '='.repeat(60))
console.log('Fim do teste')
console.log('='.repeat(60))
