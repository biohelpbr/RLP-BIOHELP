"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"
import { requestPayoutSchema } from "./schema"
import { getMemberBalance } from "./queries"
import { validateInvoice } from "./nfe-validator"

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

  const { amount, payout_method, invoice_filename, invoice_data_url } = parsed.data

  if (payout_method === "pix" && !invoice_filename) {
    return {
      ok: false,
      error: "Anexe a nota fiscal pra resgatar via PIX.",
      field: "invoice_filename",
    }
  }

  // F-V07c: validação automática NF (síncrona) antes de gravar payout
  if (payout_method === "pix" && invoice_data_url) {
    const buffer = decodeDataUrl(invoice_data_url)
    if (!buffer) {
      return {
        ok: false,
        error: "Arquivo de NF inválido (formato não reconhecido).",
        field: "invoice_filename",
      }
    }
    const validation = validateInvoice(buffer, invoice_filename || "invoice.pdf")
    if (!validation.valid) {
      return {
        ok: false,
        error: validation.reason || "NF inválida.",
        field: "invoice_filename",
      }
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

  // gross_amount é NOT NULL legacy (v1 calculava taxa); em v2 sem dedução
  // o gross é igual ao amount solicitado.
  // bank_name/agency/account/account_type/cpf_cnpj/holder_name foram
  // relaxados em F-V07b — só PIX exige preenchimento (futura UI S5).
  const { data, error } = await supabase
    .from("payout_requests")
    .insert({
      member_id: member.id,
      amount,
      gross_amount: amount,
      net_amount: amount,
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

// PAYOUT_FEES — referência interna. Em "use server" não pode export const.
// Se precisar consumir em UI, mover pra `lib/payouts/v2/schema.ts`.
const _PAYOUT_FEES = {
  pix: { fixed: PIX_FIXED_FEE, rate: 0 },
  cashback_cashin: { fixed: 0, rate: 0 },
  shopify_credit: { fixed: 0, rate: 0 },
} as const
void _PAYOUT_FEES

/**
 * F-V07c: decodifica data URL (`data:application/pdf;base64,...`) ou base64 puro
 * em `Uint8Array`. Retorna null se inválido.
 */
function decodeDataUrl(input: string): Uint8Array | null {
  if (!input) return null
  try {
    const commaIdx = input.indexOf(",")
    const b64 = commaIdx >= 0 ? input.slice(commaIdx + 1) : input
    return new Uint8Array(Buffer.from(b64, "base64"))
  } catch {
    return null
  }
}
