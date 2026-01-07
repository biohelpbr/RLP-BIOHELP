/**
 * Script para aplicar migrations do Sprint 2
 * 
 * Este script lê os arquivos SQL e executa no Supabase
 * 
 * Uso: node apply-sprint2-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.log('Configure: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function executeSql(sql, description) {
  console.log(`\n📝 Executando: ${description}...`)
  
  try {
    // Usar a função rpc para executar SQL raw
    // Nota: Isso requer que a função esteja configurada no Supabase
    // Alternativa: usar o painel do Supabase diretamente
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // Se a função não existe, mostrar instruções
      if (error.message.includes('function') || error.code === '42883') {
        console.log('\n⚠️ A função exec_sql não está disponível.')
        console.log('Por favor, execute o SQL manualmente no Supabase Dashboard:')
        console.log('1. Acesse: https://supabase.com/dashboard')
        console.log('2. Vá para SQL Editor')
        console.log('3. Cole e execute o conteúdo dos arquivos:')
        console.log('   - supabase/migrations/20260107_sprint2_cv_tables.sql')
        console.log('   - supabase/migrations/20260107_sprint2_rls_policies.sql')
        return false
      }
      throw error
    }
    
    console.log(`✅ ${description} - Sucesso!`)
    return true
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`)
    return false
  }
}

async function checkTablesExist() {
  console.log('\n🔍 Verificando se as tabelas já existem...')
  
  const tables = ['orders', 'order_items', 'cv_ledger', 'cv_monthly_summary']
  const results = {}
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    results[table] = !error
    console.log(`  ${results[table] ? '✅' : '❌'} ${table}`)
  }
  
  return Object.values(results).every(v => v)
}

async function main() {
  console.log('═'.repeat(50))
  console.log('🚀 Aplicando Migrations do Sprint 2')
  console.log('═'.repeat(50))
  
  // Verificar se tabelas já existem
  const tablesExist = await checkTablesExist()
  
  if (tablesExist) {
    console.log('\n✅ Todas as tabelas já existem! Nenhuma migration necessária.')
    return
  }
  
  console.log('\n⚠️ Algumas tabelas não existem. Aplicando migrations...')
  
  // Ler arquivos SQL
  const cvTablesSql = readFileSync(
    join(__dirname, 'supabase/migrations/20260107_sprint2_cv_tables.sql'),
    'utf-8'
  )
  
  const rlsPoliciesSql = readFileSync(
    join(__dirname, 'supabase/migrations/20260107_sprint2_rls_policies.sql'),
    'utf-8'
  )
  
  console.log('\n📋 SQL a ser executado:')
  console.log('─'.repeat(50))
  console.log('\n1. Tabelas CV (orders, order_items, cv_ledger, cv_monthly_summary)')
  console.log('2. Políticas RLS para as novas tabelas')
  
  console.log('\n' + '═'.repeat(50))
  console.log('⚠️ AÇÃO NECESSÁRIA')
  console.log('═'.repeat(50))
  console.log('\nPor favor, execute os seguintes passos manualmente:')
  console.log('\n1. Acesse o Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql')
  console.log('\n2. No SQL Editor, execute primeiro:')
  console.log('   supabase/migrations/20260107_sprint2_cv_tables.sql')
  console.log('\n3. Depois execute:')
  console.log('   supabase/migrations/20260107_sprint2_rls_policies.sql')
  console.log('\n4. Após executar, rode novamente:')
  console.log('   node test-sprint2.mjs')
  
  // Mostrar preview do SQL
  console.log('\n' + '─'.repeat(50))
  console.log('📄 Preview do SQL (primeiras 50 linhas):')
  console.log('─'.repeat(50))
  console.log(cvTablesSql.split('\n').slice(0, 50).join('\n'))
  console.log('\n... (continua)')
}

main().catch(console.error)

