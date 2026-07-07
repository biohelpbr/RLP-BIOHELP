"use server"

import { revalidatePath } from "next/cache"
import { isCurrentUserAdmin } from "@/lib/supabase/server"
import { computeAffiliateCommissions, type AffiliateCommissionSummary } from "./commission"

type Res =
  | { ok: true; data: AffiliateCommissionSummary }
  | { ok: false; error: string }

/**
 * F-V35 fase 3 — ações admin de fechamento de comissão de afiliado.
 * `preview` = dry-run (não grava). `close` = lança no commission_ledger (idempotente/mês).
 */
export async function previewAffiliateCommissions(referenceMonth: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await computeAffiliateCommissions(referenceMonth, { commit: false })
  if (data.error) return { ok: false, error: data.error }
  return { ok: true, data }
}

export async function closeAffiliateCommissions(referenceMonth: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await computeAffiliateCommissions(referenceMonth, { commit: true })
  if (data.error) return { ok: false, error: data.error }
  revalidatePath("/admin/afiliados")
  return { ok: true, data }
}
