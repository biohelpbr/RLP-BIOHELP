"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"
import { memberBankDataSchema } from "@/lib/payouts/v2/schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Edição de profile pelo próprio membro.
 *
 * Campos editáveis:
 *   - name (string, mín 2)
 *   - phone (string opcional, livre — sem máscara)
 *   - F-V20: dados bancários (action separada updateMemberBankData).
 *
 * E-mail NÃO é editável aqui — exige sync com Supabase Auth (admin scope).
 * Anti-SPEC §1: não toca em sponsor_id, ref_code, status, subscription_status.
 */

const profileInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome precisa de ao menos 2 caracteres")
    .max(120, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .max(40, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
})

export async function updateMemberProfile(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const member = await getCurrentMember()
  if (!member) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = profileInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("members")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    })
    .eq("id", member.id)

  if (error) {
    console.error("[updateMemberProfile]", error)
    return { ok: false, error: "Não foi possível salvar." }
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")
  return { ok: true, data: { id: member.id } }
}

/**
 * F-V20: salva ou atualiza os dados bancários do membro.
 *
 * Política Financeira §5: qualquer alteração nesses campos atualiza
 * `bank_data_updated_at`, ativando a janela de segurança de 7 dias antes
 * de liberar novos saques.
 *
 * Anti-SPEC: não toca sponsor_id/ref_code/status. Só colunas adicionadas
 * pela migration F-V20.
 */
export async function updateMemberBankData(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const member = await getCurrentMember()
  if (!member) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = memberBankDataSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  // Validação extra: PJ precisa CNPJ (14 dígitos), PF precisa CPF (11 dígitos).
  const docDigits = parsed.data.document_number.replace(/\D/g, "")
  if (parsed.data.person_type === "pf" && docDigits.length !== 11) {
    return {
      ok: false,
      error: "CPF deve ter 11 dígitos.",
      field: "document_number",
    }
  }
  if (parsed.data.person_type === "pj" && docDigits.length !== 14) {
    return {
      ok: false,
      error: "CNPJ deve ter 14 dígitos.",
      field: "document_number",
    }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("members")
    .update({
      person_type: parsed.data.person_type,
      bank_holder_name: parsed.data.holder_name,
      document_number: docDigits,
      bank_name: parsed.data.bank_name,
      bank_agency: parsed.data.bank_agency,
      bank_account: parsed.data.bank_account,
      bank_pix_key: parsed.data.pix_key,
      bank_contact_phone: parsed.data.contact_phone,
      bank_data_updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)

  if (error) {
    console.error("[updateMemberBankData]", error)
    return { ok: false, error: "Não foi possível salvar os dados bancários." }
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard/finance")
  return { ok: true, data: { id: member.id } }
}
