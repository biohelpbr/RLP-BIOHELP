/**
 * Regressão F-V19 — corrida /welcome × webhook (Bug 4).
 *
 * Garante que extensão (+1 ano) e comissão de ativação acontecem EXATAMENTE 1x
 * por ativação, em todos os caminhos de chegada — e que o /welcome (que só marca
 * paid) nunca causa dobro de extensão nem perda de comissão.
 *
 * ⚠️ NÃO roda em CI. Harness MANUAL contra um servidor de DEV/preview (NÃO prod),
 *    pois cria/apaga members reais no Supabase do projeto. Limpa tudo no fim.
 *
 * Pré-requisitos:
 *   1. `npm run dev` rodando (ou um preview) com DEV_SIMULATE_GURU habilitado e
 *      GURU_WEBHOOK_API_TOKEN setado.
 *   2. Envs locais:
 *        NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *        BASE_URL (default http://localhost:3000)
 *
 * Uso:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   BASE_URL=http://localhost:3000 node test-welcome-webhook-race.mjs
 *
 * Cenários cobertos:
 *   A. welcome-primeiro → webhook-depois  (caminho NORMAL — era o bug)
 *   B. webhook-primeiro → welcome-depois
 *   C. webhook-só
 *   D. welcome-só (estado degradado: paid sem extensão/comissão)
 *   E. webhook duplicado (started+active, mesmo subscription_id) → comissão 1x
 */
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const rnd = () => Math.random().toString(36).slice(2, 8)
const created = [] // member ids p/ cleanup

let pass = 0
let fail = 0
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; console.log(`  ❌ ${name} — ${detail ?? ""}`) }
}

async function makeSponsor() {
  const ref = `TSPON_${rnd()}`
  const { data, error } = await db.from("members").insert({
    email: `sponsor_${rnd()}@racetest.dev`,
    name: "Sponsor Teste",
    ref_code: ref,
    subscription_status: "paid",
  }).select("id").single()
  if (error) throw new Error(`makeSponsor: ${error.message}`)
  created.push(data.id)
  return data.id
}

async function makePending(sponsorId) {
  const token = crypto.randomUUID() // simula o pre_registration_token
  const { data, error } = await db.from("members").insert({
    email: `lead_${rnd()}@racetest.dev`,
    name: "Lead Teste",
    ref_code: `TLEAD_${rnd()}`,
    subscription_status: "pending",
    sponsor_id: sponsorId,
    guru_subscriber_id: token, // pré-cadastro grava o token; webhook sobrescreve
  }).select("id, email, guru_subscriber_id").single()
  if (error) throw new Error(`makePending: ${error.message}`)
  created.push(data.id)
  return data
}

// Simula o efeito do /welcome com a lógica NOVA: marca paid, NÃO estende.
async function simulateWelcome(memberId) {
  const { error } = await db.from("members")
    .update({ subscription_status: "paid" })
    .eq("id", memberId)
  if (error) throw new Error(`simulateWelcome: ${error.message}`)
}

// Dispara o webhook REAL via /api/dev/simulate-guru (chama o handler de verdade).
async function simulateWebhook(email, subscriptionId) {
  const res = await fetch(`${BASE_URL}/api/dev/simulate-guru`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "activated", email, subscription_id: subscriptionId, charged_times: 1 }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`simulateWebhook HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`)
  return json
}

async function getMember(id) {
  const { data } = await db.from("members")
    .select("subscription_status, subscription_expires_at, guru_subscriber_id")
    .eq("id", id).single()
  return data
}

async function commissionCount(sourceMemberId) {
  const { count } = await db.from("commission_ledger")
    .select("id", { count: "exact", head: true })
    .eq("source_member_id", sourceMemberId)
  return count ?? 0
}

function isAboutOneYear(expiresAt) {
  if (!expiresAt) return false
  const exp = new Date(expiresAt).getTime()
  const lo = Date.now() + 330 * 864e5 // ~11 meses
  const hi = Date.now() + 400 * 864e5 // ~13 meses
  return exp >= lo && exp <= hi
}

async function scenarioA() {
  console.log("\n[A] welcome-primeiro → webhook-depois (caminho normal)")
  const sponsor = await makeSponsor()
  const m = await makePending(sponsor)
  const subId = `sub_${rnd()}`
  await simulateWelcome(m.id)
  await simulateWebhook(m.email, subId)
  const after = await getMember(m.id)
  check("status = paid", after.subscription_status === "paid")
  check("comissão criada 1x", (await commissionCount(m.id)) === 1)
  check("expires ~1 ano (sem dobro)", isAboutOneYear(after.subscription_expires_at), after.subscription_expires_at)
  check("guru_subscriber_id = subId real", after.guru_subscriber_id === subId, after.guru_subscriber_id)
}

async function scenarioB() {
  console.log("\n[B] webhook-primeiro → welcome-depois")
  const sponsor = await makeSponsor()
  const m = await makePending(sponsor)
  const subId = `sub_${rnd()}`
  await simulateWebhook(m.email, subId)
  await simulateWelcome(m.id)
  const after = await getMember(m.id)
  check("status = paid", after.subscription_status === "paid")
  check("comissão criada 1x", (await commissionCount(m.id)) === 1)
  check("expires ~1 ano", isAboutOneYear(after.subscription_expires_at), after.subscription_expires_at)
  check("guru_subscriber_id = subId real", after.guru_subscriber_id === subId)
}

async function scenarioC() {
  console.log("\n[C] webhook-só")
  const sponsor = await makeSponsor()
  const m = await makePending(sponsor)
  const subId = `sub_${rnd()}`
  await simulateWebhook(m.email, subId)
  const after = await getMember(m.id)
  check("status = paid", after.subscription_status === "paid")
  check("comissão criada 1x", (await commissionCount(m.id)) === 1)
  check("expires ~1 ano", isAboutOneYear(after.subscription_expires_at), after.subscription_expires_at)
}

async function scenarioD() {
  console.log("\n[D] welcome-só (estado degradado esperado)")
  const sponsor = await makeSponsor()
  const m = await makePending(sponsor)
  await simulateWelcome(m.id)
  const after = await getMember(m.id)
  check("status = paid (UX OK)", after.subscription_status === "paid")
  check("comissão NÃO criada (0)", (await commissionCount(m.id)) === 0)
  check("expires null (sem extensão)", after.subscription_expires_at == null, after.subscription_expires_at)
}

async function scenarioE() {
  console.log("\n[E] webhook duplicado (started+active, mesmo subscription_id)")
  const sponsor = await makeSponsor()
  const m = await makePending(sponsor)
  const subId = `sub_${rnd()}`
  await simulateWebhook(m.email, subId)
  await simulateWebhook(m.email, subId) // 2ª passagem do MESMO subscription
  const after = await getMember(m.id)
  check("comissão ainda 1x (dedup do topo)", (await commissionCount(m.id)) === 1)
  check("expires ~1 ano (sem dobro)", isAboutOneYear(after.subscription_expires_at), after.subscription_expires_at)
}

async function cleanup() {
  console.log("\n[cleanup] removendo members de teste...")
  for (const id of created) {
    await db.from("commission_ledger").delete().eq("source_member_id", id)
    await db.from("commission_ledger").delete().eq("member_id", id)
    await db.from("members").delete().eq("id", id)
  }
}

try {
  await scenarioA()
  await scenarioB()
  await scenarioC()
  await scenarioD()
  await scenarioE()
} catch (err) {
  console.error("\n💥 erro no harness:", err.message)
  fail++
} finally {
  await cleanup()
}

console.log(`\n=== ${pass} passou / ${fail} falhou ===`)
process.exit(fail === 0 ? 0 : 1)
