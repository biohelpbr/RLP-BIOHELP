/**
 * F-V19 — Aquisição de token da Shopify Admin API.
 *
 * A Shopify deprecou custom apps legados (01/01/2026). Apps do Dev Dashboard
 * não expõem mais um token permanente (`shpat_`): expõem Client ID + Client
 * Secret, trocados por um access token de ~24h via client credentials grant.
 *
 * Dois modos:
 *  - PROD (Dev Dashboard): SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET →
 *    POST /admin/oauth/access_token → token de ~24h, cacheado em memória e
 *    renovado antes de expirar.
 *  - DEV / legado: SHOPIFY_ADMIN_API_TOKEN (token estático).
 *
 * Nota de escopos: no modelo da Shopify, `write_customers` já concede leitura.
 */

// Renova com folga antes do expires_in real pra não usar token quase-morto.
const REFRESH_SKEW_MS = 5 * 60 * 1000

let cached: { token: string; expiresAt: number } | null = null

/** Limpa o cache em memória (usar em testes ou após rotação de credenciais). */
export function resetShopifyTokenCache(): void {
  cached = null
}

async function fetchTokenViaClientCredentials(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; expiresInSec: number } | null> {
  try {
    const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    })
    if (!res.ok) {
      console.error(`[shopify-token] client_credentials falhou: HTTP ${res.status}`)
      return null
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!json.access_token) {
      console.error("[shopify-token] resposta sem access_token")
      return null
    }
    return { token: json.access_token, expiresInSec: json.expires_in ?? 86399 }
  } catch (err) {
    console.error("[shopify-token] erro no client_credentials:", err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Retorna um access token válido pro header `X-Shopify-Access-Token`.
 * Prioriza o client credentials grant (prod); cai pro token estático
 * (`SHOPIFY_ADMIN_API_TOKEN`) se as credenciais de app não estiverem setadas
 * ou se o grant falhar. Retorna null se nada estiver configurado.
 *
 * @param forceRefresh ignora o cache (use após um 401 pra forçar renovação).
 */
export async function getShopifyAccessToken(forceRefresh = false): Promise<string | null> {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

  if (shopDomain && clientId && clientSecret) {
    const now = Date.now()
    if (!forceRefresh && cached && cached.expiresAt - REFRESH_SKEW_MS > now) {
      return cached.token
    }
    const fresh = await fetchTokenViaClientCredentials(shopDomain, clientId, clientSecret)
    if (fresh) {
      cached = { token: fresh.token, expiresAt: now + fresh.expiresInSec * 1000 }
      return fresh.token
    }
    // Grant falhou — tenta o estático como último recurso.
    return process.env.SHOPIFY_ADMIN_API_TOKEN ?? null
  }

  // Fallback: token estático (dev / legado).
  return process.env.SHOPIFY_ADMIN_API_TOKEN ?? null
}
