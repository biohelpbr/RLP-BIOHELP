"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Edição de profile pelo próprio membro.
 *
 * Campos editáveis em S5+:
 *   - name (string, mín 2)
 *   - phone (string opcional, livre — sem máscara)
 *
 * E-mail NÃO é editável aqui — exige sync com Supabase Auth (admin scope).
 * Pra trocar e-mail, membro fala com a admin (que usa Supabase Admin API).
 *
 * Anti-SPEC §1: não toca em sponsor_id, ref_code, status, subscription_status.
 * RLS em members garante que só dono pode UPDATE — mas usamos service_role
 * + filtro explícito por member.id pra defesa em profundidade.
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
