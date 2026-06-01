"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"
import {
  requestPayoutSchema,
  computePayoutBreakdown,
  PAYOUT_MIN_AMOUNT_BRL,
  BANK_DATA_LOCK_DAYS,
  type PayoutMethod,
} from "./schema"
import { getMemberBalance } from "./queries"
import { validateInvoice } from "./nfe-validator"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * F-V20 — Solicita resgate alinhado à Política Financeira Nutrition Club.
 *
 * Regras:
 *  - Crédito na loja:    sem mínimo, sem dados bancários, sem NF.
 *  - PF (RPA, cashback_cashin):  mín R$ 500, exige dados bancários no perfil,
 *                                exige person_type='pf', INSS+IRRF+fee descontados.
 *  - PJ (NF, pix):       mín R$ 500, exige NF anexada + dados bancários + CNPJ,
 *                                exige person_type='pj', só fee descontado.
 *
 * Bloqueios:
 *  - Saldo insuficiente.
 *  - Modalidade incompatível com person_type cadastrado.
 *  - Janela de segurança 7 dias após alterar dados bancários (Política §5).
 *  - Titularidade: document_number do cadastro não pode ser nulo.
 */
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
  const method = payout_method as PayoutMethod

  // ── 1. Valor mínimo (R$ 500 PF/PJ; sem mínimo no crédito).
  if (method !== "shopify_credit" && amount < PAYOUT_MIN_AMOUNT_BRL) {
    return {
      ok: false,
      error: `Valor mínimo para esta modalidade é R$ ${PAYOUT_MIN_AMOUNT_BRL.toFixed(2).replace(".", ",")}.`,
      field: "amount",
    }
  }

  // ── 2. Saldo.
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

  // ── 3. PF e PJ exigem dados bancários cadastrados no perfil (F-V20).
  if (method !== "shopify_credit") {
    const missing = [
      member.bank_name,
      member.bank_agency,
      member.bank_account,
      member.bank_pix_key,
      member.bank_holder_name,
      member.document_number,
    ].some((v) => !v || String(v).trim().length === 0)
    if (missing) {
      return {
        ok: false,
        error:
          "Cadastre seus dados bancários completos no Meu Perfil antes de solicitar este tipo de resgate.",
        field: "bank_data",
      }
    }

    // ── 3a. person_type bate com modalidade.
    if (method === "cashback_cashin" && member.person_type !== "pf") {
      return {
        ok: false,
        error: "Modalidade PF (RPA) exige seu cadastro como Pessoa Física.",
        field: "person_type",
      }
    }
    if (method === "pix" && member.person_type !== "pj") {
      return {
        ok: false,
        error: "Modalidade PJ (NF) exige seu cadastro como Pessoa Jurídica.",
        field: "person_type",
      }
    }

    // ── 3b. Janela de segurança 7 dias após alterar dados bancários (Política §5).
    if (member.bank_data_updated_at) {
      const updatedAt = new Date(member.bank_data_updated_at)
      const lockUntil = new Date(updatedAt)
      lockUntil.setDate(lockUntil.getDate() + BANK_DATA_LOCK_DAYS)
      if (lockUntil > new Date()) {
        const lockedUntilLabel = lockUntil.toLocaleDateString("pt-BR")
        return {
          ok: false,
          error: `Dados bancários alterados há menos de ${BANK_DATA_LOCK_DAYS} dias. Novos saques liberados a partir de ${lockedUntilLabel}.`,
          field: "bank_data",
        }
      }
    }
  }

  // ── 4. PJ (NF) exige NF anexada + validação automática.
  if (method === "pix") {
    if (!invoice_filename) {
      return {
        ok: false,
        error: "Anexe a Nota Fiscal pra resgatar via Pessoa Jurídica.",
        field: "invoice_filename",
      }
    }
    if (invoice_data_url) {
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
  }

  // ── 5. Cálculo de taxa/imposto conforme modalidade.
  const breakdown = computePayoutBreakdown(method, amount)
  const taxAmount = Number((breakdown.inss + breakdown.irrf).toFixed(2))

  // ── 6. Snapshot dos dados bancários no payout_requests (auditoria —
  //       garante que mudança futura no perfil não altera o pedido emitido).
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const insertPayload: Record<string, unknown> = {
    member_id: member.id,
    amount,
    gross_amount: amount,
    tax_amount: taxAmount,
    net_amount: breakdown.net,
    payout_method: method,
    status: "pending",
    person_type:
      method === "shopify_credit"
        ? (member.person_type ?? "pf")
        : method === "cashback_cashin"
        ? "pf"
        : "pj",
    created_at: now,
  }

  if (method !== "shopify_credit") {
    insertPayload.bank_name = member.bank_name
    insertPayload.bank_agency = member.bank_agency
    insertPayload.bank_account = member.bank_account
    insertPayload.bank_account_type = member.bank_account_type ?? null
    insertPayload.pix_key = member.bank_pix_key
    insertPayload.cpf_cnpj = member.document_number
    insertPayload.holder_name = member.bank_holder_name
  }

  const { data, error } = await supabase
    .from("payout_requests")
    .insert(insertPayload)
    .select("id")
    .single()

  if (error) {
    console.error("[requestPayout]", error)
    return { ok: false, error: "Não foi possível registrar o resgate." }
  }

  revalidatePath("/dashboard/finance")
  return { ok: true, data: { id: data.id as string } }
}

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
