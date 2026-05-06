/**
 * F-V03 — Smoke test puro (sem DB) da função detectSubscriptionPurchase.
 * Replicada inline pra rodar com `node` sem tsx.
 *
 * Uso: `node test-f-v03-subscription.mjs`
 */

const SUBSCRIPTION_KEYWORDS = ["assinatura", "clube"]
const TOTAL_THRESHOLD_BRL = 200

function detectSubscriptionPurchase(input) {
  for (const item of input.lineItems) {
    const title = (item.title ?? "").toLowerCase()
    if (SUBSCRIPTION_KEYWORDS.some((kw) => title.includes(kw))) {
      return { match: true, matched: "line_item_title" }
    }
  }
  if (input.productTags) {
    for (const item of input.lineItems) {
      const tags = item.productId ? input.productTags[item.productId] ?? [] : []
      const lowered = tags.map((t) => t.toLowerCase())
      if (lowered.some((tag) => SUBSCRIPTION_KEYWORDS.some((kw) => tag.includes(kw)))) {
        return { match: true, matched: "product_tag" }
      }
    }
  }
  if (input.totalAmount >= TOTAL_THRESHOLD_BRL) {
    return { match: true, matched: "total_threshold" }
  }
  return { match: false }
}

let pass = 0
let fail = 0

function expect(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
    console.log(`  PASS ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}`)
    console.log(`    expected: ${JSON.stringify(expected)}`)
    console.log(`    actual:   ${JSON.stringify(actual)}`)
  }
}

console.log("F-V03 detectSubscriptionPurchase:")
expect("title assinatura", detectSubscriptionPurchase({ totalAmount: 50, lineItems: [{ title: "Assinatura Mensal" }] }), { match: true, matched: "line_item_title" })
expect("title clube case", detectSubscriptionPurchase({ totalAmount: 30, lineItems: [{ title: "Plano CLUBE Bronze" }] }), { match: true, matched: "line_item_title" })
expect("product tag", detectSubscriptionPurchase({ totalAmount: 50, lineItems: [{ title: "Produto X", productId: "p1" }], productTags: { p1: ["assinatura-mensal"] } }), { match: true, matched: "product_tag" })
expect("total > 200", detectSubscriptionPurchase({ totalAmount: 250, lineItems: [{ title: "Whey" }] }), { match: true, matched: "total_threshold" })
expect("no match", detectSubscriptionPurchase({ totalAmount: 99, lineItems: [{ title: "Whey 1kg" }] }), { match: false })
expect("boundary 200", detectSubscriptionPurchase({ totalAmount: 200, lineItems: [{ title: "Item" }] }), { match: true, matched: "total_threshold" })

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
