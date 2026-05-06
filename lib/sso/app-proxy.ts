import { createHmac, timingSafeEqual } from "crypto"

/**
 * F-V17: validação de assinatura de Shopify App Proxy.
 *
 * Doc: https://shopify.dev/docs/apps/build/online-store/display-dynamic-data
 *
 * Algoritmo:
 *   1. Pega todos os query params, exceto `signature`.
 *   2. Ordena alfabeticamente por chave.
 *   3. Concatena `${key}=${value}` (sem `&`, sem URL encoding adicional).
 *   4. HMAC-SHA256 com SHOPIFY_API_SECRET.
 *   5. Hex-digest deve bater com o param `signature`.
 *
 * Retorna `{valid:bool, reason?:string}` — nunca lança.
 */
export type AppProxyVerification = {
  valid: boolean
  reason?: string
}

export function verifyShopifyAppProxySignature(
  query: URLSearchParams | Record<string, string | string[]>,
  secret: string
): AppProxyVerification {
  if (!secret) return { valid: false, reason: "missing_secret" }

  const entries: Array<[string, string]> = []
  let providedSignature: string | undefined

  if (query instanceof URLSearchParams) {
    // URLSearchParams: pode ter chaves repetidas
    const keys = new Set<string>()
    query.forEach((_v, k) => keys.add(k))
    for (const key of Array.from(keys)) {
      if (key === "signature") {
        providedSignature = query.get(key) ?? undefined
        continue
      }
      const all = query.getAll(key)
      // Shopify concatena values de chaves repetidas com `,`
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

  const computed = createHmac("sha256", secret).update(message).digest("hex")

  // timing-safe compare
  if (computed.length !== providedSignature.length) {
    return { valid: false, reason: "length_mismatch" }
  }
  try {
    const ok = timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(providedSignature, "hex")
    )
    return ok ? { valid: true } : { valid: false, reason: "signature_mismatch" }
  } catch {
    return { valid: false, reason: "compare_error" }
  }
}
