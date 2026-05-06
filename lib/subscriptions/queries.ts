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
