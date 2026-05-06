/**
 * F-V07b — Smoke do MockCashinClient (replica inline).
 *
 * Uso: `node test-f-v07b-cashin-mock.mjs`
 */

class MockCashinClient {
  async transfer(input) {
    if (input.amount <= 0) {
      return { ok: false, error: "amount must be > 0", code: "INVALID_AMOUNT" }
    }
    return { ok: true, transactionId: `mock_${input.payoutId}_${Date.now()}`, status: "processing" }
  }
  async getStatus(transactionId) {
    return { ok: true, transactionId, status: "paid" }
  }
}

let pass = 0, fail = 0
function check(name, condition) {
  if (condition) { pass++; console.log(`  PASS ${name}`) }
  else { fail++; console.log(`  FAIL ${name}`) }
}

console.log("F-V07b MockCashinClient:")
const c = new MockCashinClient()

{
  const r = await c.transfer({ amount: 100, pixKey: "x@y.com", payoutId: "p1" })
  check("valid transfer → ok", r.ok === true && !!r.transactionId)
  check("starts with mock_", r.transactionId.startsWith("mock_"))
  check("status=processing", r.status === "processing")
}
{
  const r = await c.transfer({ amount: 0, pixKey: "x", payoutId: "p2" })
  check("amount=0 → ok:false", r.ok === false)
}
{
  const r = await c.getStatus("mock_abc")
  check("getStatus → paid", r.ok === true && r.status === "paid")
}

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
