/**
 * Busca um customer por email na Shopify (client credentials grant) e imprime
 * tags + email_marketing_consent. READ-ONLY. Verificação final do sync F-V19.
 *
 * Uso:
 *   SHOPIFY_STORE_DOMAIN=biohelpclub.myshopify.com \
 *   SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... \
 *   EMAIL='eduardo.sousa+test3@flowcode.cc' node test-shopify-find-customer.mjs
 */
const shop = process.env.SHOPIFY_STORE_DOMAIN
const id = process.env.SHOPIFY_CLIENT_ID
const secret = process.env.SHOPIFY_CLIENT_SECRET
const email = process.env.EMAIL
const API = process.env.SHOPIFY_API_VERSION || "2024-10"

if (!shop || !id || !secret || !email) {
  console.error("Faltam envs: SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, EMAIL")
  process.exit(1)
}

const tok = await (await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
})).json()

if (!tok.access_token) {
  console.error("❌ Sem access_token:", JSON.stringify(tok).slice(0, 300))
  process.exit(1)
}
console.log(`scope: ${tok.scope}`)

// O '+' do email precisa ir como %2B na query; encodeURIComponent resolve.
const q = encodeURIComponent(`email:${email}`)
const res = await fetch(`https://${shop}/admin/api/${API}/customers/search.json?query=${q}`, {
  headers: { "X-Shopify-Access-Token": tok.access_token },
})
const json = await res.json().catch(() => ({}))
const customers = json.customers || []
console.log(`\nbusca email=${email} → HTTP ${res.status} | ${customers.length} customer(s)\n`)

for (const c of customers) {
  console.log(JSON.stringify({
    id: c.id,
    email: c.email,
    first_name: c.first_name,
    last_name: c.last_name,
    tags: c.tags,
    email_marketing_consent: c.email_marketing_consent,
  }, null, 2))
}

if (customers.length === 0) {
  console.log("⚠️ Nenhum customer encontrado com esse email na loja.")
}
