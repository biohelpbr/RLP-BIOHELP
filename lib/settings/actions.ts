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

/** Aceita vazio (desliga o botão) ou uma URL http(s) válida. */
function validUrlOrEmpty(raw: string, label: string): { ok: true; url: string } | { ok: false; error: string } {
  const url = raw.trim()
  if (!url) return { ok: true, url: "" }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: `${label}: use um link começando com https://` }
    }
    return { ok: true, url }
  } catch {
    return { ok: false, error: `${label}: link inválido (ex.: https://chat.whatsapp.com/...)` }
  }
}

/**
 * Links dos 3 passos da página de obrigado (/obrigado) do Creators Hub.
 * Editável pelo admin — sem deploy, sem mexer em variável de ambiente.
 */
export async function updateCreatorsHubLinks(input: {
  whatsapp_group_url: string
  plataforma_url: string
  email_url: string
  checkout_offer: string
}): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Apenas administradores podem alterar configurações." }
  }

  const wa = validUrlOrEmpty(input.whatsapp_group_url, "Grupo de WhatsApp")
  if (!wa.ok) return wa
  const plat = validUrlOrEmpty(input.plataforma_url, "Plataforma")
  if (!plat.ok) return plat
  const mail = validUrlOrEmpty(input.email_url, "Verificar e-mail")
  if (!mail.ok) return mail

  // Oferta = só o slug final da URL do checkout (sem barras, sem domínio).
  const offer = input.checkout_offer.trim().replace(/^\/+|\/+$/g, "")
  if (offer && !/^[a-zA-Z0-9._-]+$/.test(offer)) {
    return {
      ok: false,
      error: "Oferta do checkout: use só o final da URL (ex.: membership-creators-hub).",
    }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "creators_hub_links",
      value: {
        whatsapp_group_url: wa.url,
        plataforma_url: plat.url,
        email_url: mail.url,
        checkout_offer: offer,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  )
  if (error) {
    console.error("[settings.updateCreatorsHubLinks]", error)
    return { ok: false, error: "Erro ao salvar os links." }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/obrigado")
  return { ok: true }
}
