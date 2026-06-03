"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import { cancelAutoRenew, cancelSubscription } from "@/lib/subscriptions/actions"
import { syncCustomerToShopify } from "@/lib/shopify/customer"

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Apenas administradores podem executar esta ação." }
  }
  return { ok: true }
}

/**
 * F-V24 — Cancelamento manual da RENOVAÇÃO (admin).
 * Regra de negócio (call 02/06): só desliga o auto-renovar; o membro mantém o
 * acesso até o fim do ciclo. O cron diário move pra `cancelled` quando expira.
 */
export async function adminCancelRenewal(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const res = await cancelAutoRenew(memberId)
  if (!res.ok) return { ok: false, error: res.error }

  revalidatePath(`/admin/community/${memberId}`)
  revalidatePath("/admin/community")
  return { ok: true }
}

/**
 * F-V24 — Cancelamento IMEDIATO (com estorno) (admin).
 * Regra de negócio (call 02/06): corta o acesso na hora — `subscription_status`
 * vira `cancelled` + remove a tag `subscriber` na Shopify (preço de clube some).
 * Usado quando o Gabriel já estornou no Guru e precisa cortar o acesso já.
 */
export async function adminCancelImmediate(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const res = await cancelSubscription(memberId)
  if (!res.ok) return { ok: false, error: res.error }

  const supabase = createServiceClient()
  // Coerência: imediato também desliga o auto-renovar.
  await supabase
    .from("members")
    .update({ subscription_auto_renew: false })
    .eq("id", memberId)

  // Revoga acesso na Shopify (remove tag subscriber). Best-effort — não derruba a ação.
  try {
    const { data: m } = await supabase
      .from("members")
      .select("email, name, ref_code, sponsor_id")
      .eq("id", memberId)
      .single()
    if (m?.email) {
      let sponsorRefCode: string | null = null
      if (m.sponsor_id) {
        const { data: s } = await supabase
          .from("members")
          .select("ref_code")
          .eq("id", m.sponsor_id as string)
          .single()
        sponsorRefCode = (s?.ref_code as string | null) ?? null
      }
      const nameParts = ((m.name as string | null) ?? "").split(" ")
      await syncCustomerToShopify({
        email: m.email as string,
        firstName: nameParts[0] || "Parceira",
        lastName: nameParts.slice(1).join(" ") || "",
        refCode: (m.ref_code as string) ?? "",
        sponsorRefCode,
        status: "inactive",
      })
    }
  } catch (e) {
    console.error("[adminCancelImmediate] shopify revoke (non-fatal)", e)
  }

  revalidatePath(`/admin/community/${memberId}`)
  revalidatePath("/admin/community")
  return { ok: true }
}
