"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * W4 (call 05/06) — admin edita o contato de suporte exibido na home do
 * membro (card "Comunidade & Atendimento"), sem deploy.
 */
export async function updateSupportContact(input: {
  phone: string
  whatsapp_digits: string
  hours: string
}): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Apenas administradores podem alterar configurações." }
  }

  const phone = input.phone.trim()
  const digits = input.whatsapp_digits.replace(/\D/g, "")
  const hours = input.hours.trim()

  if (!phone) return { ok: false, error: "Informe o telefone de exibição." }
  if (digits.length < 12 || digits.length > 13) {
    return {
      ok: false,
      error: "WhatsApp inválido — use DDI+DDD+número, ex.: 5551981019332.",
    }
  }
  if (!hours) return { ok: false, error: "Informe o horário de atendimento." }

  const supabase = createServiceClient()
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "support_contact",
      value: { phone, whatsapp_digits: digits, hours },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )
  if (error) {
    console.error("[settings.updateSupportContact]", error)
    return { ok: false, error: "Erro ao salvar a configuração." }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/dashboard")
  return { ok: true }
}
