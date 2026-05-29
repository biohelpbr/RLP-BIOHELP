/**
 * F-V20 — Smoke test puro (sem rede real) de sendToAbsolut / formatPhoneBR.
 * Lógica replicada inline pra rodar com `node` sem tsx (igual test-f-v03 / f-v07b).
 * Réplica fiel de lib/crm/absolut.ts — manter em sincronia se o módulo mudar.
 *
 * Cobre: (a) skipped com flag off; (b) payload + header corretos com flag on
 * (fetch mockado); (c) formatação de telefone +55.
 *
 * Uso: `node test-crm-absolut.mjs`
 */

// ─── Réplica de lib/crm/absolut.ts ──────────────────────────────────────────

function formatPhoneBR(raw) {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length >= 12 && digits.startsWith("55")) {
    return `+${digits}`
  }
  return `+55${digits}`
}

async function sendToAbsolut(input) {
  try {
    if (process.env.CRM_ABSOLUT_LIVE !== "true") {
      return { ok: true, skipped: true }
    }
    const url = process.env.CRM_ABSOLUT_WEBHOOK_URL
    if (!url) {
      return { ok: false, error: "missing_url" }
    }
    const headers = { "Content-Type": "application/json" }
    const token = process.env.CRM_ABSOLUT_TOKEN
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    const body = {
      evento: input.evento,
      nome: input.nome,
      email: input.email,
      telefone: formatPhoneBR(input.telefone),
      codigo_indicacao: input.codigoIndicacao,
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "exception" }
  }
}

// ─── Harness ────────────────────────────────────────────────────────────────

let pass = 0
let fail = 0

function check(name, condition) {
  if (condition) {
    pass++
    console.log(`  PASS ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}`)
  }
}

function expectEq(name, actual, expected) {
  check(`${name} (got ${JSON.stringify(actual)})`, JSON.stringify(actual) === JSON.stringify(expected))
}

function resetEnv() {
  delete process.env.CRM_ABSOLUT_LIVE
  delete process.env.CRM_ABSOLUT_WEBHOOK_URL
  delete process.env.CRM_ABSOLUT_TOKEN
}

// fetch mock que captura a última chamada
function installFetchMock({ status = 200 } = {}) {
  const calls = []
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts })
    return { ok: status >= 200 && status < 300, status }
  }
  return calls
}

// ─── (c) Formatação de telefone ─────────────────────────────────────────────

console.log("F-V20 formatPhoneBR:")
expectEq("nacional 11 dígitos → +55", formatPhoneBR("11987654321"), "+5511987654321")
expectEq("nacional 10 dígitos (fixo) → +55", formatPhoneBR("1133334444"), "+551133334444")
expectEq("já com DDI 55 (13) → não duplica", formatPhoneBR("5511987654321"), "+5511987654321")
expectEq("com máscara (xx) xxxxx-xxxx → limpa", formatPhoneBR("(11) 98765-4321"), "+5511987654321")
expectEq("já com +55 → limpa e mantém", formatPhoneBR("+55 11 98765-4321"), "+5511987654321")
expectEq("DDD 55 nacional (11 díg) → prefixa 55", formatPhoneBR("55999998888"), "+5555999998888")
expectEq("vazio → string vazia", formatPhoneBR(""), "")

// ─── (a) Skipped com flag off ───────────────────────────────────────────────

console.log("\nF-V20 sendToAbsolut — gate:")
{
  resetEnv()
  // flag ausente
  globalThis.fetch = async () => { throw new Error("fetch NÃO deveria ser chamado") }
  const r = await sendToAbsolut({ evento: "lead_novo", nome: "X", email: "x@y.com", telefone: "11987654321", codigoIndicacao: null })
  expectEq("flag ausente → skipped sem rede", r, { ok: true, skipped: true })
}
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "false"
  globalThis.fetch = async () => { throw new Error("fetch NÃO deveria ser chamado") }
  const r = await sendToAbsolut({ evento: "lead_novo", nome: "X", email: "x@y.com", telefone: "11987654321", codigoIndicacao: "BH00001" })
  expectEq("flag=false → skipped sem rede", r, { ok: true, skipped: true })
}
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "true"
  // sem URL
  globalThis.fetch = async () => { throw new Error("fetch NÃO deveria ser chamado") }
  const r = await sendToAbsolut({ evento: "lead_novo", nome: "X", email: "x@y.com", telefone: "11987654321", codigoIndicacao: null })
  expectEq("flag on + sem URL → missing_url", r, { ok: false, error: "missing_url" })
}

// ─── (b) Payload + header corretos com flag on ──────────────────────────────

console.log("\nF-V20 sendToAbsolut — envio (flag on):")
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "true"
  process.env.CRM_ABSOLUT_WEBHOOK_URL = "https://crm.absolut.example/webhook"
  process.env.CRM_ABSOLUT_TOKEN = "tok_secreto_123"
  const calls = installFetchMock({ status: 200 })
  const r = await sendToAbsolut({
    evento: "virou_cliente",
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    telefone: "(11) 98765-4321",
    codigoIndicacao: "BH00042",
  })
  expectEq("retorno ok", r, { ok: true })
  check("fetch chamado 1x", calls.length === 1)
  check("URL correta", calls[0]?.url === "https://crm.absolut.example/webhook")
  check("método POST", calls[0]?.opts?.method === "POST")
  check("Content-Type json", calls[0]?.opts?.headers["Content-Type"] === "application/json")
  check("Authorization Bearer com token", calls[0]?.opts?.headers["Authorization"] === "Bearer tok_secreto_123")
  const sent = JSON.parse(calls[0]?.opts?.body ?? "{}")
  expectEq("payload completo (+55, codigo_indicacao)", sent, {
    evento: "virou_cliente",
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    telefone: "+5511987654321",
    codigo_indicacao: "BH00042",
  })
}
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "true"
  process.env.CRM_ABSOLUT_WEBHOOK_URL = "https://crm.absolut.example/webhook"
  // SEM token → header Authorization não deve existir
  const calls = installFetchMock({ status: 200 })
  const r = await sendToAbsolut({
    evento: "lead_novo",
    nome: "João",
    email: "joao@exemplo.com",
    telefone: "11999990000",
    codigoIndicacao: null,
  })
  expectEq("retorno ok sem token", r, { ok: true })
  check("sem token → sem header Authorization", calls[0]?.opts?.headers["Authorization"] === undefined)
  const sent = JSON.parse(calls[0]?.opts?.body ?? "{}")
  check("codigo_indicacao null preservado", sent.codigo_indicacao === null)
  check("telefone formatado +55", sent.telefone === "+5511999990000")
}
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "true"
  process.env.CRM_ABSOLUT_WEBHOOK_URL = "https://crm.absolut.example/webhook"
  installFetchMock({ status: 500 })
  const r = await sendToAbsolut({ evento: "lead_novo", nome: "X", email: "x@y.com", telefone: "11987654321", codigoIndicacao: null })
  expectEq("HTTP 500 → ok:false http_500", r, { ok: false, error: "http_500" })
}
{
  resetEnv()
  process.env.CRM_ABSOLUT_LIVE = "true"
  process.env.CRM_ABSOLUT_WEBHOOK_URL = "https://crm.absolut.example/webhook"
  globalThis.fetch = async () => { throw new Error("rede caiu") }
  const r = await sendToAbsolut({ evento: "lead_novo", nome: "X", email: "x@y.com", telefone: "11987654321", codigoIndicacao: null })
  expectEq("fetch lança → ok:false exception (non-fatal)", r, { ok: false, error: "exception" })
}

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
