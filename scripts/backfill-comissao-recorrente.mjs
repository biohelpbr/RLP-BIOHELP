/**
 * Backfill da comissão recorrente de indicação.
 *
 * Regra (definida pelo cliente em 09/09/26, retroativa): o padrinho recebe
 * R$80 por mês enquanto a pessoa indicada mantém a assinatura — R$80 para os
 * 20 primeiros indicados (por ordem de ativação) e R$40 do 21º em diante,
 * mesma faixa da regra original de 26/05.
 *
 * O que conta: a ativação + cada aniversário mensal já vencido até hoje.
 * Ex.: indicada que ativou em 19/06, hoje 10/09 → 19/06 (ativação), 19/07 e
 * 19/08 vencidos = 3 meses devidos. 19/09 ainda não venceu.
 *
 * O que grava: só a DIFERENÇA. As ativações já lançadas
 * (subscription_activation) são abatidas; o restante entra como
 * 'subscription_recurring', uma linha por mês, com reference_month do mês
 * correspondente — extrato auditável e reversível por tipo.
 *
 * Idempotente: relê o que já existe a cada execução e lança só o que falta.
 *
 * Uso:
 *   node scripts/backfill-comissao-recorrente.mjs           # preview, não grava
 *   node scripts/backfill-comissao-recorrente.mjs --commit  # grava
 */

import { readFileSync } from "node:fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]
    }),
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const COMMIT = process.argv.includes("--commit")
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }

const TETO_FAIXA_1 = 20
const VALOR_FAIXA_1 = 80
const VALOR_FAIXA_2 = 40

async function getAll(path) {
  const out = []
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL}/rest/v1/${path}&limit=1000&offset=${off}`, { headers: H })
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`)
    const b = await r.json()
    out.push(...b)
    if (b.length < 1000) return out
  }
}

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const mesRef = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`

/**
 * Meses devidos por uma assinatura: a ativação e cada aniversário mensal já
 * vencido. Usa o dia da ativação; quando o mês não tem esse dia (31 → fev), o
 * próprio Date normaliza pro início do mês seguinte, o que é aceitável aqui
 * porque só contamos vencimentos passados.
 */
function mesesDevidos(inicio, hoje) {
  const meses = []
  const d = new Date(inicio)
  while (d <= hoje) {
    meses.push(new Date(d))
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return meses
}

const hoje = new Date()

const membros = await getAll("members?select=id,name,ref_code,sponsor_id,subscription_status,subscription_paid_at&order=id.asc")
const ledger = await getAll("commission_ledger?select=member_id,source_member_id,commission_type,amount,reference_month&commission_type=in.(subscription_activation,subscription_recurring)&order=id.asc")

const porId = new Map(membros.map((m) => [m.id, m]))

// Já lançado por (padrinho, indicado, mês) — a chave da idempotência.
const jaLancado = new Set()
for (const l of ledger) {
  if (l.source_member_id) jaLancado.add(`${l.member_id}|${l.source_member_id}|${String(l.reference_month).slice(0, 7)}`)
}

// Indicados pagos, agrupados por padrinho e ordenados por data de ativação
// (a ordem define quem está dentro dos 20 primeiros).
const porPadrinho = new Map()
for (const m of membros) {
  if (m.subscription_status !== "paid" || !m.sponsor_id || !m.subscription_paid_at) continue
  if (!porPadrinho.has(m.sponsor_id)) porPadrinho.set(m.sponsor_id, [])
  porPadrinho.get(m.sponsor_id).push(m)
}
for (const lista of porPadrinho.values()) {
  lista.sort((a, b) => new Date(a.subscription_paid_at) - new Date(b.subscription_paid_at))
}

const novasLinhas = []
const resumo = []

for (const [sponsorId, indicados] of porPadrinho) {
  const padrinho = porId.get(sponsorId)
  let devidoTotal = 0
  let faltaValor = 0
  let faltaLinhas = 0

  indicados.forEach((ind, i) => {
    const valor = i < TETO_FAIXA_1 ? VALOR_FAIXA_1 : VALOR_FAIXA_2
    for (const mes of mesesDevidos(new Date(ind.subscription_paid_at), hoje)) {
      devidoTotal += valor
      const ref = mesRef(mes)
      if (jaLancado.has(`${sponsorId}|${ind.id}|${ref.slice(0, 7)}`)) continue
      faltaValor += valor
      faltaLinhas++
      novasLinhas.push({
        member_id: sponsorId,
        source_member_id: ind.id,
        source_order_id: null,
        commission_type: "subscription_recurring",
        amount: valor,
        cv_base: 0,
        percentage: 0,
        network_level: 1,
        reference_month: ref,
        description: `Mensalidade indicação — ${ind.name ?? ind.id} — ${ref.slice(0, 7)}`,
      })
    }
  })

  if (faltaValor > 0) {
    resumo.push({
      nome: padrinho?.name ?? "(sem cadastro)",
      cod: padrinho?.ref_code ?? "",
      indicados: indicados.length,
      devidoTotal,
      faltaValor,
      faltaLinhas,
    })
  }
}

resumo.sort((a, b) => b.faltaValor - a.faltaValor)

console.log(COMMIT ? "=== GRAVANDO ===" : "=== PREVIEW (não grava) ===")
console.log(
  `${"parceira".padEnd(30)} ${"cod".padEnd(9)} ${"ind".padStart(4)} ${"devido".padStart(11)} ${"a lançar".padStart(11)} ${"linhas".padStart(7)}`,
)
console.log("-".repeat(78))
for (const r of resumo.slice(0, 30)) {
  console.log(
    `${r.nome.slice(0, 29).padEnd(30)} ${r.cod.padEnd(9)} ${String(r.indicados).padStart(4)} ${brl(r.devidoTotal).padStart(11)} ${brl(r.faltaValor).padStart(11)} ${String(r.faltaLinhas).padStart(7)}`,
  )
}
if (resumo.length > 30) console.log(`... e mais ${resumo.length - 30} parceiras`)
console.log("-".repeat(78))
const totalFalta = resumo.reduce((s, r) => s + r.faltaValor, 0)
console.log(`${resumo.length} parceiras | ${novasLinhas.length} lançamentos | TOTAL A LANÇAR: ${brl(totalFalta)}`)

if (!COMMIT) {
  console.log("\nNada foi gravado. Rode com --commit para lançar.")
  process.exit(0)
}

// Grava em blocos; PostgREST aceita array no insert.
let ok = 0
for (let i = 0; i < novasLinhas.length; i += 500) {
  const bloco = novasLinhas.slice(i, i + 500)
  const r = await fetch(`${URL}/rest/v1/commission_ledger`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(bloco),
  })
  if (!r.ok) {
    console.error(`FALHA no bloco ${i}: ${r.status} ${await r.text()}`)
    console.error(`Gravados até aqui: ${ok}. Reexecute — o script relê o que já existe e continua de onde parou.`)
    process.exit(1)
  }
  ok += bloco.length
  console.log(`  bloco ${i / 500 + 1}: +${bloco.length} (total ${ok})`)
}
console.log(`\nOK — ${ok} lançamentos gravados.`)
