/**
 * Load test — simula N webhooks simultâneos contra /api/webhooks/guru.
 *
 * Uso: node scripts/load-test-webhook.mjs [N] [URL]
 *   N   = número de requisições simultâneas (default: 100)
 *   URL = endpoint (default: https://painel.bio-help.com/api/webhooks/guru)
 *
 * Cada request cria um member_not_found (email único fake) pra não
 * poluir dados reais. Mede: tempo total, p50, p95, p99, erros.
 */

const N = parseInt(process.argv[2] || "100", 10)
const BASE_URL = process.argv[3] || "https://painel.bio-help.com/api/webhooks/guru"
const API_TOKEN = "8uReaH4N3dwtLm31zcnVaGoaAlFLz5KQmqx6lDpf"

console.log(`\n=== Load Test: ${N} webhooks simultâneos → ${BASE_URL} ===\n`)

async function sendOne(i) {
  const start = Date.now()
  const payload = JSON.stringify({
    api_token: API_TOKEN,
    webhook_type: "subscription",
    id: `load_test_sub_${i}_${Date.now()}`,
    last_status: "started",
    subscriber: {
      id: `load_sber_${i}`,
      email: `load-test-${i}-${Date.now()}@fake.dev`,
    },
    product: { id: "prod_load" },
    charged_times: 1,
    source: {},
  })

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": `load-test-${i}-${Date.now()}`,
      },
      body: payload,
    })
    const elapsed = Date.now() - start
    const body = await res.json().catch(() => ({}))
    return { i, status: res.status, elapsed, reason: body.reason || body.kind || "ok" }
  } catch (err) {
    return { i, status: 0, elapsed: Date.now() - start, reason: `error: ${err.message}` }
  }
}

const totalStart = Date.now()
const results = await Promise.all(Array.from({ length: N }, (_, i) => sendOne(i)))
const totalElapsed = Date.now() - totalStart

const times = results.map((r) => r.elapsed).sort((a, b) => a - b)
const statuses = {}
results.forEach((r) => {
  const key = `${r.status} ${r.reason}`
  statuses[key] = (statuses[key] || 0) + 1
})

console.log(`Total: ${totalElapsed}ms para ${N} requests`)
console.log(`p50: ${times[Math.floor(N * 0.5)]}ms`)
console.log(`p95: ${times[Math.floor(N * 0.95)]}ms`)
console.log(`p99: ${times[Math.floor(N * 0.99)]}ms`)
console.log(`min: ${times[0]}ms | max: ${times[N - 1]}ms`)
console.log(`\nStatus breakdown:`)
Object.entries(statuses)
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => console.log(`  ${key}: ${count}`))

const errors = results.filter((r) => r.status !== 200)
if (errors.length > 0) {
  console.log(`\n⚠️  ${errors.length} errors (${((errors.length / N) * 100).toFixed(1)}%)`)
} else {
  console.log(`\n✅ 0 errors — all ${N} requests returned 200`)
}
