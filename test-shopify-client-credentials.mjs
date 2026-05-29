/**
 * Valida o client credentials grant (modelo Dev Dashboard) contra uma loja Shopify.
 * Lê credenciais do ENV (não hardcoda segredo). READ-ONLY: pega token + lê shop + count de clientes.
 *
 * Uso:
 *   SHOPIFY_STORE_DOMAIN=loja.myshopify.com SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... node test-shopify-client-credentials.mjs
 */
const shop = process.env.SHOPIFY_STORE_DOMAIN
const id = process.env.SHOPIFY_CLIENT_ID
const secret = process.env.SHOPIFY_CLIENT_SECRET
const API = process.env.SHOPIFY_API_VERSION || "2024-10"

if (!shop || !id || !secret) {
  console.error("Faltam envs: SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET")
  process.exit(1)
}

const mask = (s) => (s ? s.slice(0, 6) + "…(" + s.length + ")" : "(vazio)")
console.log(`Loja: ${shop} | client_id: ${mask(id)} | secret: ${mask(secret)}`)

// 1) client credentials grant
const tokRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
})
const tokText = await tokRes.text()
console.log(`\n[1] token endpoint → HTTP ${tokRes.status}`)
let tok
try { tok = JSON.parse(tokText) } catch { console.error("Resposta não-JSON:", tokText.slice(0, 300)); process.exit(1) }
if (!tok.access_token) { console.error("❌ Sem access_token:", tokText.slice(0, 300)); process.exit(1) }
console.log(`    scope: ${tok.scope}`)
console.log(`    expires_in: ${tok.expires_in}s (~${Math.round((tok.expires_in || 0) / 3600)}h)`)

const at = tok.access_token

// 2) shop.json (read-only)
const shopRes = await fetch(`https://${shop}/admin/api/${API}/shop.json`, { headers: { "X-Shopify-Access-Token": at } })
const shopJson = await shopRes.json().catch(() => ({}))
console.log(`\n[2] shop.json → HTTP ${shopRes.status} | name: ${shopJson?.shop?.name} | myshopify: ${shopJson?.shop?.myshopify_domain}`)

// 3) customers/count (valida read_customers)
const cRes = await fetch(`https://${shop}/admin/api/${API}/customers/count.json`, { headers: { "X-Shopify-Access-Token": at } })
console.log(`\n[3] customers/count → HTTP ${cRes.status} | body: ${await cRes.text()}`)

const okScopes = (tok.scope || "").includes("read_customers") && (tok.scope || "").includes("write_customers")
console.log(`\nResumo: token=${tokRes.status === 200 ? "OK" : "FALHOU"} | read+write_customers no scope=${okScopes ? "SIM ✅" : "NÃO ⚠️"}`)
