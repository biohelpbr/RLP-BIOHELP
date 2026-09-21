/**
 * ROLLBACK da correção de carência de 21/09.
 *
 * Restaura o available_at de TODOS os lançamentos a partir do snapshot tirado
 * antes da correção (backups/2026-09-21-carencia/ledger-antes.json). Só toca
 * em linhas cujo available_at atual difere do snapshot — idempotente.
 *
 *   node scripts/rollback-carencia-backfill.mjs           # preview
 *   node scripts/rollback-carencia-backfill.mjs --commit  # restaura
 */
import { readFileSync } from "node:fs"
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n")
  .filter(l=>l && !l.startsWith("#") && l.includes("="))
  .map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,"")]}))
const H={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"}
const U=env.NEXT_PUBLIC_SUPABASE_URL
const COMMIT=process.argv.includes("--commit")

const antes = JSON.parse(readFileSync("backups/2026-09-21-carencia/ledger-antes.json","utf8"))
const alvo = new Map(antes.map(l => [l.id, l.available_at]))

async function getAll(p){const o=[];for(let f=0;;f+=1000){
  const b=await (await fetch(`${U}/rest/v1/${p}&limit=1000&offset=${f}`,{headers:H})).json()
  o.push(...b); if(b.length<1000) return o}}

const atual = await getAll("commission_ledger?select=id,available_at&order=id.asc")
const restaurar = atual.filter(l => alvo.has(l.id) && String(l.available_at) !== String(alvo.get(l.id)))

console.log(COMMIT ? "=== RESTAURANDO ===" : "=== PREVIEW (não grava) ===")
console.log(`no snapshot: ${antes.length} | no banco agora: ${atual.length} | a restaurar: ${restaurar.length}`)
if(!COMMIT){ console.log("\nNada gravado. Rode com --commit."); process.exit(0) }

let ok=0
for (const l of restaurar) {
  const r = await fetch(`${U}/rest/v1/commission_ledger?id=eq.${l.id}`, {
    method:"PATCH", headers:{...H, Prefer:"return=minimal"},
    body: JSON.stringify({ available_at: alvo.get(l.id) }),
  })
  if(!r.ok){ console.error("falhou", l.id, await r.text()); process.exit(1) }
  ok++
}
const depois = await getAll("commission_ledger?select=id,available_at&order=id.asc")
const sobra = depois.filter(l => alvo.has(l.id) && String(l.available_at) !== String(alvo.get(l.id)))
if (sobra.length) { console.error(`FALHOU: ${sobra.length} ainda diferentes do snapshot`); process.exit(1) }
console.log(`restaurados: ${ok} | verificado: banco idêntico ao snapshot`)
