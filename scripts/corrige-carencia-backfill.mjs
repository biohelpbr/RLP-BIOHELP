/**
 * Corrige a carência dos lançamentos do backfill de 10/09.
 *
 * O trigger BEFORE INSERT `set_commission_available_at` calcula available_at a
 * partir de created_at (e sobrescreve qualquer valor enviado). Certo pra
 * comissão do mês corrente, errado pra lançamento retroativo: meses de julho e
 * agosto, já vencidos, ficaram com liberação em 15/10 e travaram R$26.520 que
 * as parceiras já tinham direito de sacar.
 *
 * Executado em produção em 21/09/26: 515 linhas, verificado 0 divergentes.
 * Reversível com scripts/rollback-carencia-backfill.mjs (snapshot em
 * backups/2026-09-21-carencia/).
 *
 * Regra aplicada (Net-15, a mesma do resto do sistema): a comissão do mês X
 * libera dia 15 do mês X+1.
 *
 * Só mexe em subscription_recurring — não toca em ativação nem em nada anterior.
 * Idempotente: relê antes de escrever e só corrige o que está divergente.
 *
 *   node scripts/corrige-carencia-backfill.mjs           # preview
 *   node scripts/corrige-carencia-backfill.mjs --commit  # aplica
 */
import { readFileSync } from "node:fs"
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n")
  .filter(l=>l && !l.startsWith("#") && l.includes("="))
  .map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,"")]}))
const H={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"}
const U=env.NEXT_PUBLIC_SUPABASE_URL
const COMMIT=process.argv.includes("--commit")
const brl=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})

const net15 = ref => { const [a,m]=ref.slice(0,7).split("-").map(Number)
  const m2=m===12?1:m+1, a2=m===12?a+1:a
  return `${a2}-${String(m2).padStart(2,"0")}-15T00:00:00Z` }

async function getAll(p){const o=[];for(let f=0;;f+=1000){
  const b=await (await fetch(`${U}/rest/v1/${p}&limit=1000&offset=${f}`,{headers:H})).json()
  o.push(...b); if(b.length<1000) return o}}

const rec = await getAll("commission_ledger?select=id,amount,reference_month,available_at&commission_type=eq.subscription_recurring&order=id.asc")
const corrigir = rec.filter(l => String(l.available_at).slice(0,10) !== net15(l.reference_month).slice(0,10))

const hoje=new Date()
const liberaAgora = corrigir.filter(l => new Date(net15(l.reference_month)) <= hoje)
console.log(COMMIT ? "=== APLICANDO ===" : "=== PREVIEW (não grava) ===")
console.log(`lançamentos recorrentes: ${rec.length}`)
console.log(`carência a corrigir:     ${corrigir.length}`)
console.log(`liberam imediatamente:   ${liberaAgora.length}  =  ${brl(liberaAgora.reduce((s,l)=>s+Number(l.amount),0))}`)
if(!COMMIT){ console.log("\nNada gravado. Rode com --commit."); process.exit(0) }

let ok=0
for (const l of corrigir) {
  const r = await fetch(`${U}/rest/v1/commission_ledger?id=eq.${l.id}`, {
    method:"PATCH", headers:{...H, Prefer:"return=minimal"},
    body: JSON.stringify({ available_at: net15(l.reference_month) }),
  })
  if(!r.ok){ console.error("falhou", l.id, await r.text()); process.exit(1) }
  ok++
  if(ok%100===0) console.log(`  ${ok}/${corrigir.length}`)
}
console.log(`\ncorrigidos: ${ok}`)

// Verificação pós-gravação: um PATCH que não bate linha nenhuma também devolve
// 2xx, então relê e exige zero divergência.
const depois = await getAll("commission_ledger?select=id,reference_month,available_at&commission_type=eq.subscription_recurring&order=id.asc")
const restantes = depois.filter(l => String(l.available_at).slice(0,10) !== net15(l.reference_month).slice(0,10))
if (restantes.length > 0) { console.error(`FALHOU: ${restantes.length} ainda divergentes`); process.exit(1) }
console.log("verificado: 0 divergentes após a gravação")
