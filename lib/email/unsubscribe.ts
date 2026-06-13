import { createHmac, timingSafeEqual } from "crypto"

/**
 * F-V32 — token de descadastro assinado (HMAC). NÃO expõe member_id em claro:
 * o token é `<base64url(memberId)>.<hmac>`, verificável só com o segredo do servidor.
 * Assim o link do rodapé não vira um vetor pra desinscrever terceiros.
 *
 * Segredo: EMAIL_UNSUB_SECRET (dedicado) com fallback pro CRON_SECRET (já existe
 * em prod). Sem nenhum dos dois, sign/verify falham fechado (retornam null).
 */

function secret(): string | null {
  return process.env.EMAIL_UNSUB_SECRET || process.env.CRON_SECRET || null
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function sign(payload: string, key: string): string {
  return b64url(createHmac("sha256", key).update(payload).digest())
}

/** Gera o token de descadastro pra um membro. Retorna null se não houver segredo. */
export function signUnsubscribeToken(memberId: string): string | null {
  const key = secret()
  if (!key) return null
  const payload = b64url(Buffer.from(memberId, "utf8"))
  return `${payload}.${sign(payload, key)}`
}

/** Valida o token e devolve o member_id, ou null se inválido/adulterado. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  const key = secret()
  if (!key || !token) return null
  const dot = token.indexOf(".")
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const expected = sign(payload, key)
  // comparação em tempo constante
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const memberId = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8",
    )
    return memberId || null
  } catch {
    return null
  }
}

/** Base pública do app (mesma convenção do SSO/dashboard). */
export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://clube.bio-help.com"
  ).replace(/\/+$/, "")
}

/** URL completa de descadastro pro membro (ou null se não der pra assinar). */
export function unsubscribeUrl(memberId: string): string | null {
  const token = signUnsubscribeToken(memberId)
  if (!token) return null
  return `${appBaseUrl()}/api/unsubscribe?token=${encodeURIComponent(token)}`
}
