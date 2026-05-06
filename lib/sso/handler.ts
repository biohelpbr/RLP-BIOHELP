import { createServiceClient, createAdminClient } from "@/lib/supabase/server"
import { recordAuthAudit } from "./audit"

/**
 * F-V17: orquestra resolução do member a partir do `logged_in_customer_id`
 * do Shopify e gera magic link via Supabase Admin API.
 *
 * Pré-condição: assinatura do App Proxy já foi validada antes de chamar.
 *
 * Fluxo:
 *   1. Busca shopify_customers por shopify_customer_id.
 *   2. Lê email + busca members por auth_user_id ou email.
 *   3. Se member existe → cria magic link → retorna URL.
 *   4. Se member ausente → retorna `{ ok:false, reason:'member_not_found' }`.
 */
export type SsoResolveInput = {
  shopifyCustomerId: string
  shopDomain: string
  ip?: string | null
  userAgent?: string | null
}

export type SsoResolveResult =
  | { ok: true; redirectUrl: string; memberId: string; email: string }
  | { ok: false; reason: "member_not_found" | "magic_link_failed" | "internal_error"; email?: string | null }

const REDIRECT_TO = "/dashboard"

export async function resolveSsoMember(
  input: SsoResolveInput
): Promise<SsoResolveResult> {
  const supabase = createServiceClient()

  // 1. Lookup member_id pelo shopify_customer_id (shopify_customers só tem id+member_id)
  const { data: shopRow, error: shopErr } = await supabase
    .from("shopify_customers")
    .select("member_id")
    .eq("shopify_customer_id", input.shopifyCustomerId)
    .single()

  if (shopErr || !shopRow?.member_id) {
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "member_not_found",
      shopDomain: input.shopDomain,
      ip: input.ip,
      userAgent: input.userAgent,
      details: { reason: "shopify_customer_not_found", shopify_customer_id: input.shopifyCustomerId },
    })
    return { ok: false, reason: "member_not_found" }
  }

  const memberId = String(shopRow.member_id)

  // 2. Lê email do member
  const { data: memberRow } = await supabase
    .from("members")
    .select("id, email")
    .eq("id", memberId)
    .single()

  if (!memberRow?.email) {
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "member_not_found",
      memberId,
      shopDomain: input.shopDomain,
      ip: input.ip,
      userAgent: input.userAgent,
      details: { reason: "member_email_missing" },
    })
    return { ok: false, reason: "member_not_found" }
  }

  const email = String(memberRow.email).toLowerCase()

  // 3. Magic link via Supabase Admin
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectAbsoluteUrl(REDIRECT_TO),
      },
    })

    if (error || !data?.properties?.action_link) {
      await recordAuthAudit({
        source: "shopify_app_proxy",
        outcome: "error",
        email,
        memberId,
        shopDomain: input.shopDomain,
        ip: input.ip,
        userAgent: input.userAgent,
        details: { reason: "generate_link_failed", message: error?.message },
      })
      return { ok: false, reason: "magic_link_failed", email }
    }

    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "success",
      email,
      memberId,
      shopDomain: input.shopDomain,
      ip: input.ip,
      userAgent: input.userAgent,
    })

    return {
      ok: true,
      redirectUrl: data.properties.action_link,
      memberId,
      email,
    }
  } catch (err) {
    console.error("[sso/handler] generateLink error", err)
    await recordAuthAudit({
      source: "shopify_app_proxy",
      outcome: "error",
      email,
      memberId,
      shopDomain: input.shopDomain,
      ip: input.ip,
      userAgent: input.userAgent,
      details: { reason: "exception", message: (err as Error)?.message },
    })
    return { ok: false, reason: "internal_error", email }
  }
}

function redirectAbsoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SHOPIFY_APP_URL ||
    "http://localhost:3000"
  const trimmedBase = base.replace(/\/+$/, "")
  const trimmedPath = path.startsWith("/") ? path : `/${path}`
  return `${trimmedBase}${trimmedPath}`
}
