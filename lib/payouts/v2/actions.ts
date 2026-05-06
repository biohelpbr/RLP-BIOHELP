"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"
import { requestPayoutSchema } from "./schema"
import { getMemberBalance } from "./queries"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const PIX_FIXED_FEE = 3.67

export async function requestPayout(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const parsed = requestPayoutSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const { amount, payout_method, invoice_filename } = parsed.data

  if (payout_method === "pix" && !invoice_filename) {
    return {
      ok: false,
      error: "Anexe a nota fiscal pra resgatar via PIX.",
      field: "invoice_filename",
    }
  }

  const balance = await getMemberBalance(member.id)
  if (amount > balance.available_for_withdrawal) {
    return {
      ok: false,
      error: `Valor acima do disponível (R$ ${balance.available_for_withdrawal
        .toFixed(2)
        .replace(".", ",")}).`,
      field: "amount",
    }
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("payout_requests")
    .insert({
      member_id: member.id,
      amount,
      payout_method,
      status: "pending",
      person_type: payout_method === "pix" ? "pj" : "pf",
      created_at: now,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[requestPayout]", error)
    return { ok: false, error: "Não foi possível registrar o resgate." }
  }

  revalidatePath("/dashboard/finance")
  return { ok: true, data: { id: data.id as string } }
}

export const PAYOUT_FEES = {
  pix: { fixed: PIX_FIXED_FEE, rate: 0 },
  cashback_cashin: { fixed: 0, rate: 0 },
  shopify_credit: { fixed: 0, rate: 0 },
} as const
