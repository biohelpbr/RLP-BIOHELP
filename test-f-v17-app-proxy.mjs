/**
 * F-V17 — Smoke test verifyShopifyAppProxySignature (replica inline).
 *
 * Uso: `node test-f-v17-app-proxy.mjs`
 */
import crypto from "node:crypto"

function verifyShopifyAppProxySignature(query, secret) {
  if (!secret) return { valid: false, reason: "missing_secret" }
  const entries = []
  let providedSignature
  if (query instanceof URLSearchParams) {
    const keys = new Set()
    query.forEach((_v, k) => keys.add(k))
    for (const key of keys) {
      if (key === "signature") {
        providedSignature = query.get(key) ?? undefined
        continue
      }
      const all = query.getAll(key)
      entries.push([key, all.join(",")])
    }
  } else {
    for (const [key, val] of Object.entries(query)) {
      if (key === "signature") {
        providedSignature = Array.isArray(val) ? val[0] : val
        continue
      }
      entries.push([key, Array.isArray(val) ? val.join(",") : (val ?? "")])
    }
  }
  if (!providedSignature) return { valid: false, reason: "missing_signature" }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const message = entries.map(([k, v]) => `${k}=${v}`).join("")
  const computed = crypto.createHmac("sha256", secret).update(message).digest("hex")
  if (computed.length !== providedSignature.length) {
    return { valid: false, reason: "length_mismatch" }
  }
  try {
    const ok = crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(providedSignature, "hex")
    )
    return ok ? { valid: true } : { valid: false, reason: "signature_mismatch" }
  } catch {
    return { valid: false, reason: "compare_error" }
  }
}

const SECRET = "test_secret_123"
function sign(params) {
  const entries = Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const message = entries.map(([k, v]) => `${k}=${v}`).join("")
  return crypto.createHmac("sha256", SECRET).update(message).digest("hex")
}

let pass = 0, fail = 0
function check(name, condition) {
  if (condition) { pass++; console.log(`  PASS ${name}`) }
  else { fail++; console.log(`  FAIL ${name}`) }
}

console.log("F-V17 verifyShopifyAppProxySignature:")

{
  const params = { shop: "biohelp-dev.myshopify.com", logged_in_customer_id: "12345", path_prefix: "/apps/clube", timestamp: "1700000000" }
  const search = new URLSearchParams({ ...params, signature: sign(params) })
  check("valid sig → valid", verifyShopifyAppProxySignature(search, SECRET).valid === true)
}
{
  const params = { shop: "biohelp.myshopify.com", logged_in_customer_id: "12345" }
  const search = new URLSearchParams({ ...params, logged_in_customer_id: "99999", signature: sign(params) })
  check("tampered → invalid", verifyShopifyAppProxySignature(search, SECRET).valid === false)
}
{
  const params = { shop: "biohelp.myshopify.com", x: "1" }
  const search = new URLSearchParams({ ...params, signature: sign(params) })
  check("wrong secret → invalid", verifyShopifyAppProxySignature(search, "wrong").valid === false)
}
{
  const search = new URLSearchParams({ shop: "biohelp.myshopify.com" })
  const r = verifyShopifyAppProxySignature(search, SECRET)
  check("missing sig → invalid+missing_signature", r.valid === false && r.reason === "missing_signature")
}
{
  const search = new URLSearchParams({ signature: "abc" })
  const r = verifyShopifyAppProxySignature(search, "")
  check("missing secret → invalid+missing_secret", r.valid === false && r.reason === "missing_secret")
}
{
  const params = { shop: "biohelp.myshopify.com", x: "1" }
  check("plain object input", verifyShopifyAppProxySignature({ ...params, signature: sign(params) }, SECRET).valid === true)
}

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
