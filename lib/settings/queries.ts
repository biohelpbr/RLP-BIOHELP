import { createServiceClient } from "@/lib/supabase/server"

/**
 * W4 (call 05/06) — leitura do CMS de configurações (`app_settings`).
 * Key/value jsonb editável pelo admin em /admin/settings, sem deploy.
 */

export type SupportContact = {
  /** Telefone formatado pra exibição, ex.: "51 98101-9332". */
  phone: string
  /** Só dígitos com DDI, pro link wa.me, ex.: "5551981019332". */
  whatsapp_digits: string
  /** Horário de atendimento exibido, ex.: "Segunda a sexta, 9h às 18h". */
  hours: string
}

/** Fallback se a linha sumir do banco (Apêndice B da call 05/06). */
export const DEFAULT_SUPPORT_CONTACT: SupportContact = {
  phone: "51 98101-9332",
  whatsapp_digits: "5551981019332",
  hours: "Segunda a sexta, 9h às 18h",
}

export async function getAppSetting<T>(key: string): Promise<T | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle()
  if (error) {
    console.error("[settings.getAppSetting]", key, error)
    return null
  }
  return (data?.value as T) ?? null
}

export async function getSupportContact(): Promise<SupportContact> {
  const value = await getAppSetting<Partial<SupportContact>>("support_contact")
  if (!value) return DEFAULT_SUPPORT_CONTACT
  return {
    phone: value.phone?.trim() || DEFAULT_SUPPORT_CONTACT.phone,
    whatsapp_digits:
      value.whatsapp_digits?.replace(/\D/g, "") || DEFAULT_SUPPORT_CONTACT.whatsapp_digits,
    hours: value.hours?.trim() || DEFAULT_SUPPORT_CONTACT.hours,
  }
}
