import { createServiceClient } from "@/lib/supabase/server"

export type AuthAuditInput = {
  source: "shopify_app_proxy" | "shopify_multipass" | "magic_link"
  outcome:
    | "success"
    | "invalid_signature"
    | "member_not_found"
    | "no_logged_in_customer"
    | "disabled"
    | "error"
  email?: string | null
  memberId?: string | null
  shopDomain?: string | null
  ip?: string | null
  userAgent?: string | null
  details?: Record<string, unknown>
}

/**
 * F-V17: registra tentativa de SSO em auth_audit. Falha de log não derruba
 * o fluxo principal (apenas console.error).
 */
export async function recordAuthAudit(input: AuthAuditInput): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from("auth_audit").insert({
      source: input.source,
      outcome: input.outcome,
      email: input.email ?? null,
      member_id: input.memberId ?? null,
      shop_domain: input.shopDomain ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      details: input.details ?? {},
    })
  } catch (err) {
    console.error("[auth_audit] insert failed", err)
  }
}
