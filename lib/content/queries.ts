import { createServiceClient } from "@/lib/supabase/server"
import { youtubeThumbUrl } from "./youtube"

export interface ContentTrail {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  // Academy UX 05/06: grande grupo temático (ex.: "Consumo e Rotina"). Null = sem grupo.
  // F-V31: DEPRECATED — substituído por group_id (entidade academy_groups). Mantido p/ rollback.
  group_label: string | null
  // F-V31: módulo pertence a um Grande Grupo (academy_groups). Null = legado/sem grupo.
  group_id: string | null
  status: "draft" | "published" | "archived"
  // F-V27: open = entra direto (hoje); locked = fricção positiva (ativação por membro).
  access_mode: "open" | "locked"
  // F-V27: textos editáveis da trava (usados só quando access_mode='locked'). Null = fallback.
  lock_cta_label: string | null
  lock_modal_title: string | null
  lock_modal_body: string | null
  display_order: number
  created_at: string
}

export interface ContentModule {
  id: string
  trail_id: string
  title: string
  kind: "youtube" | "pdf" | "text"
  content_url: string | null
  content_text: string | null
  // Academy UX 05/06: duração manual em minutos (null = não exibe).
  duration_minutes: number | null
  // F-V27: aula "em breve" — libera sozinha quando available_at chega, OU trava manual.
  available_at: string | null
  is_coming_soon: boolean
  display_order: number
  created_at: string
}

// F-V27: regra pura de "em breve" mora em ./gating (reusável no client). Re-export
// por conveniência de quem já importa de queries.
export { isModuleComingSoon } from "./gating"

export interface TrailWithStats extends ContentTrail {
  modules_count: number
  views_count: number
}

export async function listPublishedTrails(): Promise<ContentTrail[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_trails")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[listPublishedTrails]", error)
    return []
  }
  return (data || []) as ContentTrail[]
}

export interface TrailWithMeta extends ContentTrail {
  modules_count: number
  total_minutes: number
  /** Capa derivada da 1ª aula de vídeo quando a trilha não tem cover_url no CMS. */
  fallback_thumb: string | null
}

/**
 * Academy UX 05/06 — home do membro: trilhas publicadas + nº de aulas,
 * duração total (quando preenchida no CMS) e thumbnail de fallback
 * (1ª aula de YouTube) pra dar contexto visual no card.
 */
export async function listPublishedTrailsWithMeta(): Promise<TrailWithMeta[]> {
  const supabase = createServiceClient()
  const trails = await listPublishedTrails()
  if (trails.length === 0) return []

  const { data: modules } = await supabase
    .from("content_modules")
    .select("trail_id, duration_minutes, kind, content_url, display_order, created_at")
    .in("trail_id", trails.map((t) => t.id))
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  const count = new Map<string, number>()
  const minutes = new Map<string, number>()
  const thumb = new Map<string, string>()
  type ModuleMetaRow = {
    trail_id: string
    duration_minutes: number | null
    kind: string
    content_url: string | null
  }
  ;((modules || []) as ModuleMetaRow[]).forEach((m) => {
    count.set(m.trail_id, (count.get(m.trail_id) || 0) + 1)
    minutes.set(m.trail_id, (minutes.get(m.trail_id) || 0) + (m.duration_minutes || 0))
    if (!thumb.has(m.trail_id) && m.kind === "youtube") {
      const t = youtubeThumbUrl(m.content_url)
      if (t) thumb.set(m.trail_id, t)
    }
  })

  return trails.map((t) => ({
    ...t,
    modules_count: count.get(t.id) || 0,
    total_minutes: minutes.get(t.id) || 0,
    fallback_thumb: thumb.get(t.id) ?? null,
  }))
}

/**
 * Academy UX 05/06 — grupos já usados nas trilhas, pra sugerir no form do admin
 * (datalist) e o Leo reaproveitar os nomes sem digitar de novo.
 */
export async function listTrailGroupLabels(): Promise<string[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_trails")
    .select("group_label")
    .not("group_label", "is", null)

  if (error) {
    console.error("[listTrailGroupLabels]", error)
    return []
  }
  const labels = (data || [])
    .map((r: { group_label: string | null }) => r.group_label?.trim())
    .filter((l): l is string => !!l)
  return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b, "pt-BR"))
}

export async function listAdminTrails(): Promise<TrailWithStats[]> {
  const supabase = createServiceClient()
  const { data: trails, error } = await supabase
    .from("content_trails")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !trails) {
    console.error("[listAdminTrails]", error)
    return []
  }

  if (trails.length === 0) return []
  const ids = trails.map((t: ContentTrail) => t.id)

  const [{ data: modules }, { data: views }] = await Promise.all([
    supabase.from("content_modules").select("trail_id").in("trail_id", ids),
    supabase.from("content_views").select("module_id, content_modules!inner(trail_id)").in(
      "content_modules.trail_id",
      ids,
    ),
  ])

  const modCount = new Map<string, number>()
  ;(modules || []).forEach((m: { trail_id: string }) => {
    modCount.set(m.trail_id, (modCount.get(m.trail_id) || 0) + 1)
  })

  const viewCount = new Map<string, number>()
  type ViewRow = { content_modules: { trail_id: string } | { trail_id: string }[] | null }
  ;(views as ViewRow[] | null || []).forEach((v) => {
    const trailId = Array.isArray(v.content_modules)
      ? v.content_modules[0]?.trail_id
      : v.content_modules?.trail_id
    if (!trailId) return
    viewCount.set(trailId, (viewCount.get(trailId) || 0) + 1)
  })

  return (trails as ContentTrail[]).map((t) => ({
    ...t,
    modules_count: modCount.get(t.id) || 0,
    views_count: viewCount.get(t.id) || 0,
  }))
}

export async function getTrailWithModules(
  trailId: string,
  opts: { adminView?: boolean } = {},
): Promise<{ trail: ContentTrail; modules: ContentModule[] } | null> {
  const supabase = createServiceClient()
  const trailQuery = supabase.from("content_trails").select("*").eq("id", trailId)
  const { data: trail } = await (opts.adminView
    ? trailQuery.maybeSingle()
    : trailQuery.eq("status", "published").maybeSingle())

  if (!trail) return null

  const { data: modules } = await supabase
    .from("content_modules")
    .select("*")
    .eq("trail_id", trailId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  return {
    trail: trail as ContentTrail,
    modules: (modules || []) as ContentModule[],
  }
}

export async function listMemberCompletedModules(memberId: string): Promise<Set<string>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("content_views")
    .select("module_id")
    .eq("member_id", memberId)
    .not("completed_at", "is", null)
  return new Set(((data || []) as Array<{ module_id: string }>).map((v) => v.module_id))
}

/**
 * F-V27 — trilhas travadas que ESTE membro já ativou (member_trail_activations).
 * O gating real da trava roda em código (service_role ignora RLS), então a home e
 * o detalhe consultam isto pra decidir entre card "Bloqueada" e o conteúdo.
 */
export async function listMemberActivatedTrailIds(memberId: string): Promise<Set<string>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_trail_activations")
    .select("trail_id")
    .eq("member_id", memberId)
  return new Set(((data || []) as Array<{ trail_id: string }>).map((r) => r.trail_id))
}

/**
 * F-V27 — true se o membro pode ver o conteúdo da trilha: trilha aberta, OU
 * trilha travada que ele já ativou. Admin sempre passa (checar antes de chamar).
 */
export async function isTrailUnlockedForMember(
  trail: ContentTrail,
  memberId: string,
): Promise<boolean> {
  if (trail.access_mode !== "locked") return true
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_trail_activations")
    .select("id")
    .eq("trail_id", trail.id)
    .eq("member_id", memberId)
    .maybeSingle()
  return !!data
}
