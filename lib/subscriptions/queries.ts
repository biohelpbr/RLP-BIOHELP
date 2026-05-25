import { createServiceClient } from "@/lib/supabase/server"

export type SubscriptionStatusV2 = "pending" | "paid" | "cancelled"

export type SubscriptionState = {
  status: SubscriptionStatusV2
  paid_at: string | null
}

/**
 * F-V03: lê estado de assinatura do membro.
 * Retorna `pending` como fallback seguro caso row não exista.
 */
export async function getSubscriptionStatus(
  memberId: string
): Promise<SubscriptionState> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("members")
    .select("subscription_status, subscription_paid_at")
    .eq("id", memberId)
    .single()

  if (error || !data) {
    return { status: "pending", paid_at: null }
  }

  return {
    status: (data.subscription_status as SubscriptionStatusV2) ?? "pending",
    paid_at: (data.subscription_paid_at as string | null) ?? null,
  }
}

/**
 * F-V03: contagem de afiliados N1 pagos do sponsor.
 * Lê da view `member_active_affiliate_count` (post-F-V03 já usa subscription_status=paid).
 */
export async function getActiveAffiliateCount(sponsorId: string): Promise<number> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("member_active_affiliate_count")
    .select("active_count")
    .eq("member_id", sponsorId)
    .single()

  if (error || !data) return 0
  return Number(data.active_count ?? 0)
}

export type MemberRow = Record<string, unknown> & {
  id: string
  email: string | null
  name: string | null
  sponsor_id: string | null
  subscription_status: string | null
  subscription_expires_at: string | null
  subscription_auto_renew: boolean | null
  guru_subscriber_id: string | null
  auth_user_id: string | null
  ref_code: string | null
}

/**
 * F-V19: lookup de member pelo token externo do Guru (`members.guru_subscriber_id`).
 * Usado no webhook receiver e em `/welcome` para casar transação Guru → row LRP.
 * Retorna `null` se não existir.
 */
export async function getMemberByExternalId(
  externalId: string
): Promise<MemberRow | null> {
  if (!externalId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("guru_subscriber_id", externalId)
    .maybeSingle()
  return (data as MemberRow | null) ?? null
}

export type ExpiredSubscriptionRow = {
  id: string
  sponsor_id: string | null
  email: string | null
  name: string | null
}

/**
 * F-V19: lista members elegíveis para inativação pelo cron diário.
 * Critério: `subscription_status='paid'` AND `subscription_auto_renew=false`
 *            AND `subscription_expires_at < now`.
 */
export async function getExpiredSubscriptions(
  now: Date = new Date()
): Promise<ExpiredSubscriptionRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("members")
    .select("id, sponsor_id, email, name")
    .eq("subscription_status", "paid")
    .eq("subscription_auto_renew", false)
    .lt("subscription_expires_at", now.toISOString())

  if (error) {
    console.error("[getExpiredSubscriptions]", error)
    return []
  }
  return (data as ExpiredSubscriptionRow[] | null) ?? []
}
