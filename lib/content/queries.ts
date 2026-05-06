import { createServiceClient } from "@/lib/supabase/server"

export interface ContentTrail {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  status: "draft" | "published" | "archived"
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
  display_order: number
  created_at: string
}

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
