"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { onMemberStatusChange } from "@/lib/tags/hook-on-status-change"

type Result =
  | { ok: true; changed: boolean }
  | { ok: false; error: string }

/**
 * F-V03: marca a assinatura do membro como paga.
 * - Idempotente: se já está `paid`, retorna `{ok:true, changed:false}` sem reescrever timestamp.
 * - Após mudança bem-sucedida, dispara `onMemberStatusChange` pra recalcular tags F-V18 do sponsor.
 */
export async function markSubscriptionPaid(memberId: string): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }

  const supabase = createServiceClient()

  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("id, sponsor_id, subscription_status")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }

  if (current.subscription_status === "paid") {
    return { ok: true, changed: false }
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("members")
    .update({
      subscription_status: "paid",
      subscription_paid_at: now,
    })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[markSubscriptionPaid]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  // Hook F-V18: recompute tags do sponsor (não do membro alterado).
  // Falha do hook não derruba a mutação principal.
  await onMemberStatusChange({
    memberId,
    sponsorId: (current.sponsor_id as string | null) ?? null,
    newStatus: "paid",
  })

  return { ok: true, changed: true }
}

/**
 * F-V03: cancela a assinatura. Sponsor perde 1 ativo na contagem.
 */
export async function cancelSubscription(memberId: string): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }

  const supabase = createServiceClient()
  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("id, sponsor_id, subscription_status")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }

  if (current.subscription_status === "cancelled") {
    return { ok: true, changed: false }
  }

  const { error: updateErr } = await supabase
    .from("members")
    .update({ subscription_status: "cancelled" })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[cancelSubscription]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  await onMemberStatusChange({
    memberId,
    sponsorId: (current.sponsor_id as string | null) ?? null,
    newStatus: "cancelled",
  })

  return { ok: true, changed: true }
}
