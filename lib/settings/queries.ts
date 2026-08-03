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

/** Links dos 3 passos da página de obrigado (Creators Hub), editáveis no admin. */
export type CreatorsHubLinks = {
  /** Convite do grupo de WhatsApp (chat.whatsapp.com/...). Vazio = botão desabilitado. */
  whatsapp_group_url: string
  /** Acesso à plataforma/painel. */
  plataforma_url: string
  /** Botão "Verificar e-mail" (webmail). */
  email_url: string
  /**
   * Oferta do checkout Guru — o trecho final da URL
   * `checkout.bio-help.com/subscribe/<oferta>`. Vazio = usa a env/legado.
   */
  checkout_offer: string
  /**
   * Quais códigos de convite entram no funil Creators Hub (landing nova +
   * oferta nova + página de obrigado). Quem NÃO estiver aqui segue no fluxo
   * normal do Nutrition Club — decisão do cliente (28/07).
   */
  ref_codes: string[]
}

export const DEFAULT_CREATORS_HUB_LINKS: CreatorsHubLinks = {
  // Grupo ainda não criado pelo cliente (27/07) — vazio deixa o botão inativo.
  whatsapp_group_url: "",
  // As aulas ficam na MemberKit (cliente, 27/07), não no painel.
  plataforma_url: "https://sellers-club-2026.memberkit.com.br/",
  email_url: "https://mail.google.com/",
  // Oferta do Creators Hub (cliente, 27/07).
  checkout_offer: "membership-creators-hub",
  // Só o link do admin por enquanto (cliente, 28/07).
  ref_codes: ["ADMIN002"],
}

/** O convite deste código usa o funil Creators Hub? (case-insensitive) */
export async function isCreatorsHubRefCode(refCode: string): Promise<boolean> {
  const { ref_codes } = await getCreatorsHubLinks()
  const alvo = (refCode || "").trim().toUpperCase()
  return ref_codes.some((c) => c.trim().toUpperCase() === alvo)
}

/**
 * IDs dos padrinhos cujos convites usam o funil Creators Hub.
 * Quem tem `sponsor_id` nesta lista entrou pelo funil novo — e, por decisão do
 * cliente (02/08), NÃO recebe nenhuma comunicação de boas-vindas (nem e-mail
 * nem WhatsApp): quem comunica é a MemberKit.
 * Uma consulta só — pensado pro cron, que percorre muitos membros.
 */
export async function getCreatorsHubSponsorIds(): Promise<Set<string>> {
  const { ref_codes } = await getCreatorsHubLinks()
  if (ref_codes.length === 0) return new Set()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .in("ref_code", ref_codes)
  if (error) {
    console.error("[getCreatorsHubSponsorIds]", error)
    return new Set()
  }
  return new Set((data || []).map((r) => (r as { id: string }).id))
}

export async function getCreatorsHubLinks(): Promise<CreatorsHubLinks> {
  const value = await getAppSetting<Partial<CreatorsHubLinks>>("creators_hub_links")
  if (!value) return DEFAULT_CREATORS_HUB_LINKS
  return {
    whatsapp_group_url: value.whatsapp_group_url?.trim() || "",
    plataforma_url:
      value.plataforma_url?.trim() || DEFAULT_CREATORS_HUB_LINKS.plataforma_url,
    email_url: value.email_url?.trim() || DEFAULT_CREATORS_HUB_LINKS.email_url,
    checkout_offer:
      value.checkout_offer?.trim() || DEFAULT_CREATORS_HUB_LINKS.checkout_offer,
    ref_codes:
      Array.isArray(value.ref_codes) && value.ref_codes.length > 0
        ? value.ref_codes.map((c) => String(c).trim()).filter(Boolean)
        : DEFAULT_CREATORS_HUB_LINKS.ref_codes,
  }
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
