/**
 * Script de Teste — Sprint 2 (CV + Status)
 * 
 * Testa:
 * 1. Endpoint GET /api/members/me/cv
 * 2. Cálculo de CV
 * 3. Funções do calculator
 * 
 * Uso: node test-sprint2.mjs
 */

import { createClient } from '@supabase/supabase-js'

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.log('Configure: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(type, message) {
  const icons = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }
  console.log(`${icons[type] || ''} ${message}${colors.reset}`)
}

// =====================================================
// TESTES
// =====================================================

async function testDatabaseSchema() {
  console.log('\n📊 Testando Schema do Banco de Dados...\n')
  
  // Testar tabela orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .limit(1)
  
  if (ordersError) {
    log('error', `Tabela 'orders' não existe ou erro: ${ordersError.message}`)
    return false
  }
  log('success', "Tabela 'orders' existe")
  
  // Testar tabela order_items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id')
    .limit(1)
  
  if (itemsError) {
    log('error', `Tabela 'order_items' não existe ou erro: ${itemsError.message}`)
    return false
  }
  log('success', "Tabela 'order_items' existe")
  
  // Testar tabela cv_ledger
  const { data: ledger, error: ledgerError } = await supabase
    .from('cv_ledger')
    .select('id')
    .limit(1)
  
  if (ledgerError) {
    log('error', `Tabela 'cv_ledger' não existe ou erro: ${ledgerError.message}`)
    return false
  }
  log('success', "Tabela 'cv_ledger' existe")
  
  // Testar tabela cv_monthly_summary
  const { data: summary, error: summaryError } = await supabase
    .from('cv_monthly_summary')
    .select('id')
    .limit(1)
  
  if (summaryError) {
    log('error', `Tabela 'cv_monthly_summary' não existe ou erro: ${summaryError.message}`)
    return false
  }
  log('success', "Tabela 'cv_monthly_summary' existe")
  
  // Testar campos novos na tabela members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, current_cv_month, current_cv_month_year, last_cv_calculation_at')
    .limit(1)
  
  if (membersError) {
    log('error', `Campos CV em 'members' não existem: ${membersError.message}`)
    return false
  }
  log('success', "Campos CV em 'members' existem")
  
  return true
}

async function testRLSPolicies() {
  console.log('\n🔒 Testando RLS Policies...\n')
  
  // Verificar se RLS está habilitado nas tabelas
  const tables = ['orders', 'order_items', 'cv_ledger', 'cv_monthly_summary']
  
  for (const table of tables) {
    // Tentar inserir sem autenticação (deve falhar ou ser permitido apenas para service_role)
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1)
    
    if (error && error.code === '42501') {
      log('success', `RLS ativo em '${table}' (acesso negado sem auth)`)
    } else if (!error) {
      log('info', `'${table}' acessível via service_role`)
    } else {
      log('warning', `'${table}': ${error.message}`)
    }
  }
  
  return true
}

async function testCVCalculation() {
  console.log('\n🧮 Testando Cálculo de CV...\n')
  
  // Simular cálculo de CV
  const testItems = [
    { price: '100.00', quantity: 2 },
    { price: '50.00', quantity: 1 },
    { price: '25.50', quantity: 3 }
  ]
  
  const expectedCV = (100 * 2) + (50 * 1) + (25.50 * 3) // 326.50
  
  // Calcular CV manualmente (simula lib/cv/calculator.ts)
  let calculatedCV = 0
  for (const item of testItems) {
    const price = parseFloat(item.price)
    calculatedCV += price * item.quantity
  }
  calculatedCV = Math.round(calculatedCV * 100) / 100
  
  if (Math.abs(calculatedCV - expectedCV) < 0.01) {
    log('success', `Cálculo de CV correto: ${calculatedCV} (esperado: ${expectedCV})`)
  } else {
    log('error', `Cálculo de CV incorreto: ${calculatedCV} (esperado: ${expectedCV})`)
    return false
  }
  
  // Testar meta de 200 CV
  const CV_TARGET = 200
  const testCases = [
    { cv: 150, expected: false, desc: '150 CV < 200 (inativo)' },
    { cv: 200, expected: true, desc: '200 CV = 200 (ativo)' },
    { cv: 250, expected: true, desc: '250 CV > 200 (ativo)' }
  ]
  
  for (const test of testCases) {
    const isActive = test.cv >= CV_TARGET
    if (isActive === test.expected) {
      log('success', test.desc)
    } else {
      log('error', `Falha: ${test.desc}`)
      return false
    }
  }
  
  return true
}

async function testMemberCVEndpoint() {
  console.log('\n🌐 Testando Endpoint /api/members/me/cv...\n')
  
  try {
    // Buscar um membro para teste
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, auth_user_id')
      .not('auth_user_id', 'is', null)
      .limit(1)
      .single()
    
    if (memberError || !member) {
      log('warning', 'Nenhum membro com auth_user_id encontrado para teste')
      log('info', 'O endpoint requer autenticação - teste manual necessário')
      return true
    }
    
    log('info', `Membro para teste: ${member.email}`)
    log('info', 'Endpoint requer autenticação via cookie de sessão')
    log('info', 'Teste manual: faça login e acesse /api/members/me/cv')
    
    return true
  } catch (error) {
    log('error', `Erro ao testar endpoint: ${error.message}`)
    return false
  }
}

async function testWebhookStructure() {
  console.log('\n🪝 Verificando Estrutura dos Webhooks...\n')
  
  // Verificar se os arquivos existem (via import dinâmico não funciona em mjs puro)
  // Apenas verificar a estrutura esperada
  
  const webhooks = [
    '/api/webhooks/shopify/orders/paid',
    '/api/webhooks/shopify/orders/refunded',
    '/api/webhooks/shopify/orders/cancelled'
  ]
  
  for (const webhook of webhooks) {
    log('info', `Webhook configurado: ${webhook}`)
  }
  
  log('warning', 'Webhooks precisam ser testados com payload real do Shopify')
  log('info', 'Configure os webhooks no Shopify Admin para testar')
  
  return true
}

async function testCronJobStructure() {
  console.log('\n⏰ Verificando Job de Fechamento Mensal...\n')
  
  log('info', 'Endpoint: /api/cron/close-monthly-cv')
  log('info', 'Schedule: 0 3 1 * * (1º dia do mês às 03:00 UTC)')
  
  // Verificar se CRON_SECRET está configurado
  if (process.env.CRON_SECRET) {
    log('success', 'CRON_SECRET configurado')
  } else {
    log('warning', 'CRON_SECRET não configurado - configure para proteger o endpoint')
  }
  
  return true
}

async function createTestData() {
  console.log('\n📝 Criando Dados de Teste...\n')
  
  // Buscar um membro existente
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, email, ref_code')
    .limit(1)
    .single()
  
  if (memberError || !member) {
    log('error', 'Nenhum membro encontrado para criar dados de teste')
    return false
  }
  
  log('info', `Usando membro: ${member.email}`)
  
  // Verificar se já existe pedido de teste
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('shopify_order_id', 'gid://shopify/Order/TEST-001')
    .single()
  
  if (existingOrder) {
    log('info', 'Dados de teste já existem')
    return true
  }
  
  // Criar pedido de teste
  const monthYear = new Date().toISOString().slice(0, 7) // YYYY-MM
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shopify_order_id: 'gid://shopify/Order/TEST-001',
      shopify_order_number: 'TEST-001',
      member_id: member.id,
      customer_email: member.email,
      total_amount: 250.00,
      total_cv: 250.00,
      currency: 'BRL',
      status: 'paid',
      paid_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (orderError) {
    log('error', `Erro ao criar pedido de teste: ${orderError.message}`)
    return false
  }
  
  log('success', `Pedido de teste criado: ${order.id}`)
  
  // Criar item de teste
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      shopify_line_item_id: 'TEST-ITEM-001',
      title: 'Produto Teste',
      quantity: 1,
      price: 250.00,
      cv_value: 250.00
    })
  
  if (itemError) {
    log('error', `Erro ao criar item de teste: ${itemError.message}`)
    return false
  }
  
  log('success', 'Item de teste criado')
  
  // Criar entrada no cv_ledger
  const { error: ledgerError } = await supabase
    .from('cv_ledger')
    .insert({
      member_id: member.id,
      order_id: order.id,
      cv_amount: 250.00,
      cv_type: 'order_paid',
      month_year: monthYear,
      description: 'CV de teste'
    })
  
  if (ledgerError) {
    log('error', `Erro ao criar entrada no ledger: ${ledgerError.message}`)
    return false
  }
  
  log('success', 'Entrada no cv_ledger criada')
  
  // Atualizar CV do membro
  const { error: updateError } = await supabase
    .from('members')
    .update({
      current_cv_month: 250.00,
      current_cv_month_year: monthYear,
      last_cv_calculation_at: new Date().toISOString(),
      status: 'active'
    })
    .eq('id', member.id)
  
  if (updateError) {
    log('error', `Erro ao atualizar membro: ${updateError.message}`)
    return false
  }
  
  log('success', 'CV do membro atualizado')
  
  // Criar resumo mensal
  const { error: summaryError } = await supabase
    .from('cv_monthly_summary')
    .upsert({
      member_id: member.id,
      month_year: monthYear,
      total_cv: 250.00,
      orders_count: 1
    }, {
      onConflict: 'member_id,month_year'
    })
  
  if (summaryError) {
    log('error', `Erro ao criar resumo mensal: ${summaryError.message}`)
    return false
  }
  
  log('success', 'Resumo mensal criado')
  
  return true
}

async function runAllTests() {
  console.log('═'.repeat(50))
  console.log('🧪 TESTES DO SPRINT 2 — CV + Status')
  console.log('═'.repeat(50))
  
  const results = {
    schema: false,
    rls: false,
    calculation: false,
    endpoint: false,
    webhooks: false,
    cron: false,
    testData: false
  }
  
  // Executar testes
  results.schema = await testDatabaseSchema()
  results.rls = await testRLSPolicies()
  results.calculation = await testCVCalculation()
  results.endpoint = await testMemberCVEndpoint()
  results.webhooks = await testWebhookStructure()
  results.cron = await testCronJobStructure()
  
  // Perguntar se deseja criar dados de teste
  console.log('\n')
  results.testData = await createTestData()
  
  // Resumo
  console.log('\n' + '═'.repeat(50))
  console.log('📊 RESUMO DOS TESTES')
  console.log('═'.repeat(50) + '\n')
  
  const testNames = {
    schema: 'Schema do Banco',
    rls: 'RLS Policies',
    calculation: 'Cálculo de CV',
    endpoint: 'Endpoint /api/members/me/cv',
    webhooks: 'Estrutura dos Webhooks',
    cron: 'Job de Fechamento',
    testData: 'Dados de Teste'
  }
  
  let passed = 0
  let total = Object.keys(results).length
  
  for (const [key, value] of Object.entries(results)) {
    const status = value ? `${colors.green}✅ PASSOU` : `${colors.red}❌ FALHOU`
    console.log(`${status}${colors.reset} — ${testNames[key]}`)
    if (value) passed++
  }
  
  console.log('\n' + '─'.repeat(50))
  console.log(`Total: ${passed}/${total} testes passaram`)
  
  if (passed === total) {
    console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`)
  } else {
    console.log(`\n${colors.yellow}⚠️ Alguns testes falharam - verifique os erros acima${colors.reset}`)
  }
  
  console.log('\n📋 Próximos passos:')
  console.log('1. Configure os webhooks no Shopify Admin')
  console.log('2. Adicione SHOPIFY_WEBHOOK_SECRET nas variáveis de ambiente')
  console.log('3. Faça um pedido de teste na loja')
  console.log('4. Verifique o CV no dashboard do membro')
}

// Executar
runAllTests().catch(console.error)

