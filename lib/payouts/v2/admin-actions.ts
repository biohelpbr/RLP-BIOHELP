"use server"

import { revalidatePath } from "next/cache"
import {
  createServiceClient,
  getCurrentMember,
  isCurrentUserAdmin,
} from "@/lib/supabase/server"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

/**
 * F-V07 admin — moderação de payouts (S5 polish).
 *
 * Fluxo admin:
 *   1. Parceira cria pedido → status='pending'
 *   2. Admin abre /admin/payouts → vê pendentes nas 3 abas (PIX/Cashback/Crédito)
 *   3. Admin clica Aprovar (status='approved') OU Rejeitar (status='rejected')
 *   4. Após pagar PIX/Cashin/aplicar crédito → admin Marcar como pago (status='completed')
 *
 * Em S5+ com Cashin live: passos 3 e 4 podem ser unificados via integração
 * (lib/payouts/v2/transfer.ts) — Aprovar chama API e status pula pra
 * processing → completed via webhook.
 *
 * Atualização mínima: só `status` (campo presente desde Sprint 5). Motivo da
 * rejeição, timestamps de aprovação e notas do admin ficam pra migration
 * futura (não-bloqueante pro fluxo da demo).
 */

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login." }
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Apenas admin pode aprovar ou rejeitar resgates." }
  }
  return { ok: true }
}

function revalidatePayoutPages() {
  revalidatePath("/admin/payouts")
  revalidatePath("/admin/finance")
  revalidatePath("/dashboard/finance")
}

export async function approvePayout(payoutId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  if (!payoutId || typeof payoutId !== "string") {
    return { ok: false, error: "ID inválido." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("payout_requests")
    .update({ status: "approved" })
    .eq("id", payoutId)
    .in("status", ["pending", "under_review", "awaiting_document"])

  if (error) {
    console.error("[approvePayout]", error)
    return { ok: false, error: "Não foi possível aprovar." }
  }

  revalidatePayoutPages()
  return { ok: true }
}

export async function rejectPayout(payoutId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  if (!payoutId || typeof payoutId !== "string") {
    return { ok: false, error: "ID inválido." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("payout_requests")
    .update({ status: "rejected" })
    .eq("id", payoutId)
    .in("status", ["pending", "under_review", "awaiting_document", "approved"])

  if (error) {
    console.error("[rejectPayout]", error)
    return { ok: false, error: "Não foi possível rejeitar." }
  }

  revalidatePayoutPages()
  return { ok: true }
}

export async function markPayoutPaid(payoutId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  if (!payoutId || typeof payoutId !== "string") {
    return { ok: false, error: "ID inválido." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("payout_requests")
    .update({ status: "completed" })
    .eq("id", payoutId)
    .in("status", ["approved", "processing"])

  if (error) {
    console.error("[markPayoutPaid]", error)
    return { ok: false, error: "Não foi possível marcar como pago." }
  }

  revalidatePayoutPages()
  return { ok: true }
}
