import { createServiceClient } from "@/lib/supabase/server"
import type { AnnouncementVariant } from "./schema"

export interface AnnouncementRow {
  id: string
  message: string
  image_url: string | null
  link_url: string | null
  cta_label: string | null
  variant: AnnouncementVariant
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Aviso "no ar" pra barra do dashboard do membro.
 * Critério: active = true E dentro da janela (starts_at/ends_at NULL = sem limite).
 * Retorna o mais recente. null se não houver nenhum.
 */
export async function getActiveAnnouncement(): Promise<AnnouncementRow | null> {
  const supabase = createServiceClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getActiveAnnouncement]", error)
    return null
  }
  return (data as AnnouncementRow) || null
}

/** Lista todos os avisos pro admin (mais recentes primeiro). */
export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[listAnnouncements]", error)
    return []
  }
  return (data || []) as AnnouncementRow[]
}

export async function getAnnouncementById(id: string): Promise<AnnouncementRow | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("announcements").select("*").eq("id", id).maybeSingle()
  return (data as AnnouncementRow) || null
}
