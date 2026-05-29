// test-shopify-sync-tags.mjs
//
// F-V19 — valida as 3 correções do sync REST (B3/B4/B5) SEM chamar a API real.
// Exercita as funções puras reais de lib/shopify/customer.ts:
//   - generateMemberTags (B4: tag `subscriber` só quando ativo)
//   - mergeShopifyTags / isLrpManagedTag (B5: merge, nunca sobrescreve)
//
// O consent (B3) é alterado dentro do POST/PUT (createCustomer/updateCustomer),
// que dependem de fetch + env; aqui validamos o shape do helper de forma estática
// reimportando-o não é possível (interno), então documentamos o shape esperado.
//
// Run: node --experimental-strip-types test-shopify-sync-tags.mjs
//   (ou apenas `node test-shopify-sync-tags.mjs` no Node >= 22.18, type-stripping on)

import { generateMemberTags, mergeShopifyTags, isLrpManagedTag } from './lib/shopify/customer.ts'

function assert(cond, msg) {
  if (!cond) {
    console.error(`\n❌ ASSERT FALHOU: ${msg}`)
    process.exitCode = 1
  }
}

const base = {
  email: 'comprador@teste.com',
  firstName: 'Maria Souza',
  refCode: 'BH00042',
  sponsorRefCode: 'BH00001',
  level: 'membro',
}

console.log('=== F-V19 — sync de tags + consent ===\n')

// ---------------------------------------------------------------------------
// (a) Cliente NOVO ativo — tags finais (B4: subscriber presente)
// ---------------------------------------------------------------------------
const tagsNovoAtivo = generateMemberTags({ ...base, status: 'active' })
console.log('(a) Cliente novo ATIVO — tags finais:')
console.log('    ', tagsNovoAtivo)
assert(tagsNovoAtivo.includes('subscriber'), '(a) subscriber deve estar presente quando ativo')
assert(tagsNovoAtivo.includes('lrp_status:active'), '(a) lrp_status:active esperado')
assert(tagsNovoAtivo.includes('nivel:membro'), '(a) nivel:membro esperado')

// ---------------------------------------------------------------------------
// (b) Merge com status ATIVO preservando ['vip','aniversario:2020']
//     -> subscriber presente, vip preservada
// ---------------------------------------------------------------------------
const existentes = 'vip, aniversario:2020'
const mergedAtivo = mergeShopifyTags(existentes, generateMemberTags({ ...base, status: 'active' }))
console.log('\n(b) Merge status ATIVO — existentes [vip, aniversario:2020]:')
console.log('     tags finais:', mergedAtivo)
const setB = mergedAtivo.split(',').map((t) => t.trim())
assert(setB.includes('vip'), '(b) vip deve ser preservada')
assert(setB.includes('aniversario:2020'), '(b) aniversario:2020 deve ser preservada')
assert(setB.includes('subscriber'), '(b) subscriber presente (ativo)')
assert(setB.includes('lrp_status:active'), '(b) lrp_status:active esperado')

// ---------------------------------------------------------------------------
// (c) Mesmo cliente com status INATIVO
//     -> subscriber ausente, vip preservada
// ---------------------------------------------------------------------------
// Simula o estado já existente na Shopify após o sync ativo (tags LRP + subscriber + as do cliente)
const existentesPosAtivo = mergedAtivo
const mergedInativo = mergeShopifyTags(existentesPosAtivo, generateMemberTags({ ...base, status: 'inactive' }))
console.log('\n(c) Merge status INATIVO — partindo do estado ativo anterior:')
console.log('     estado anterior:', existentesPosAtivo)
console.log('     tags finais:   ', mergedInativo)
const setC = mergedInativo.split(',').map((t) => t.trim())
assert(!setC.includes('subscriber'), '(c) subscriber deve SAIR quando inativo')
assert(setC.includes('vip'), '(c) vip deve continuar preservada')
assert(setC.includes('aniversario:2020'), '(c) aniversario:2020 deve continuar preservada')
assert(setC.includes('lrp_status:inactive'), '(c) lrp_status:inactive esperado')
assert(!setC.includes('lrp_status:active'), '(c) lrp_status:active antigo deve ser substituído')

// ---------------------------------------------------------------------------
// Sanidade isLrpManagedTag + idempotência do merge
// ---------------------------------------------------------------------------
console.log('\n=== Sanidade ===')
assert(isLrpManagedTag('lrp_member'), 'lrp_member é gerenciada')
assert(isLrpManagedTag('nivel:membro'), 'nivel: é gerenciada')
assert(isLrpManagedTag('subscriber'), 'subscriber é gerenciada')
assert(!isLrpManagedTag('vip'), 'vip NÃO é gerenciada')
assert(!isLrpManagedTag('aniversario:2020'), 'aniversario:2020 NÃO é gerenciada')

// idempotência: aplicar o merge duas vezes com o mesmo input dá o mesmo resultado
const once = mergeShopifyTags(existentes, generateMemberTags({ ...base, status: 'active' }))
const twice = mergeShopifyTags(once, generateMemberTags({ ...base, status: 'active' }))
assert(once === twice, 'merge deve ser idempotente')
console.log('idempotência merge (ativo aplicado 2x):', once === twice ? 'OK ✅' : 'FALHOU ❌')

console.log('\nB3 (consent) — shape enviado no POST/PUT (createCustomer/updateCustomer):')
console.log('     email_marketing_consent =', JSON.stringify({
  state: 'subscribed',
  opt_in_level: 'single_opt_in',
  consent_updated_at: '<ISO timestamp>',
}))

console.log(process.exitCode ? '\n❌ Alguns asserts falharam.' : '\n✅ Todos os asserts passaram.')
