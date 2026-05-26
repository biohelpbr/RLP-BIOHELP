"use server"

import { createServiceClient } from "@/lib/supabase/server"

const COMMISSION_FIRST_20 = 80
const COMMISSION_AFTER_20 = 40
const THRESHOLD = 20

type Result =
  | { ok: true; amount: number; tier: "first_20" | "after_20" }
  | { ok: false; error: string }

export async function calculateActivationCommission(
  sponsorId: string,
  newMemberId: string,
  subscriptionId: string,
): Promise<Result> {
  const supabase = createServiceClient()

  const { data: sponsor } = await supabase
    .from("members")
    .select("id, name")
    .eq("id", sponsorId)
    .single()

  if (!sponsor) return { ok: false, error: "sponsor_not_found" }

  const { data: countRow } = await supabase
    .from("member_active_affiliate_count")
    .select("active_count")
    .eq("member_id", sponsorId)
    .single()

  const activeCount = (countRow?.active_count as number) ?? 0
  const tier = activeCount <= THRESHOLD ? "first_20" : "after_20"
  const amount = tier === "first_20" ? COMMISSION_FIRST_20 : COMMISSION_AFTER_20

  const now = new Date()
  const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  const { error: insertErr } = await supabase.from("commission_ledger").insert({
    member_id: sponsorId,
    source_member_id: newMemberId,
    source_order_id: null,
    commission_type: "subscription_activation",
    amount,
    cv_base: 0,
    percentage: 0,
    network_level: 1,
    reference_month: referenceMonth,
    description: `Ativação assinatura ${tier === "first_20" ? `(≤${THRESHOLD})` : `(>${THRESHOLD})`} — R$${amount}`,
  })

  if (insertErr) {
    console.error("[commission] insert failed", insertErr)
    return { ok: false, error: insertErr.message }
  }

  console.info(`[commission] R$${amount} (${tier}) → sponsor ${sponsor.name ?? sponsorId} from member ${newMemberId}`)
  return { ok: true, amount, tier }
}
