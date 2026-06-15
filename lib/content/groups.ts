import { createServiceClient } from "@/lib/supabase/server"
import type { ContentTrail } from "./queries"

/**
 * F-V31 — Grande Grupo (camada) da Academy: entidade criável pelo admin.
 * A home do membro lista os grupos; clicar abre os módulos (content_trails) dele.
 * A trava (fricção positiva) mora aqui, não mais na trilha.
 */
export interface AcademyGroup {
  id: string
  title: string
  description: string | null
  // F-V33: imagem de banner no topo do grupo (ex.: calendário de encontros ao vivo).
  banner_url: string | null
  access_mode: "open" | "locked"
  lock_cta_label: string | null
  lock_modal_title: string | null
  lock_modal_body: string | null
  display_order: number
  created_at: string
}

export interface AcademyGroupWithCount extends AcademyGroup {
  trails_count: number
}

export interface AcademyGroupMaterial {
  id: string
  group_id: string
  title: string
  file_url: string
  display_order: number
  created_at: string
}

// ── Home do membro ──────────────────────────────────────────────────────────

/**
 * Grupos que aparecem pra parceira: só os que têm ≥1 trilha publicada (T1 —
 * grupo vazio não aparece). Ordenados por display_order.
 */
export async function listPublishedGroups(): Promise<AcademyGroup[]> {
  const supabase = createServiceClient()
  const { data: trails } = await supabase
    .from("content_trails")
    .select("group_id")
    .eq("status", "published")
    .not("group_id", "is", null)

  const ids = Array.from(
    new Set(((trails || []) as Array<{ group_id: string | null }>).map((t) => t.group_id).filter(Boolean)),
  ) as string[]
  if (ids.length === 0) return []

  const { data: groups } = await supabase
    .from("academy_groups")
    .select("*")
    .in("id", ids)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  return (groups || []) as AcademyGroup[]
}

/** F-V31 — grupos travados que ESTA parceira já ativou. */
export async function listMemberActivatedGroupIds(memberId: string): Promise<Set<string>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_group_activations")
    .select("group_id")
    .eq("member_id", memberId)
  return new Set(((data || []) as Array<{ group_id: string }>).map((r) => r.group_id))
}

/** F-V31 — true se a parceira pode ver o conteúdo do grupo (aberto ou já ativado). */
export async function isGroupUnlockedForMember(
  group: Pick<AcademyGroup, "id" | "access_mode">,
  memberId: string,
): Promise<boolean> {
  if (group.access_mode !== "locked") return true
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_group_activations")
    .select("id")
    .eq("group_id", group.id)
    .eq("member_id", memberId)
    .maybeSingle()
  return !!data
}

// ── Tela do grupo (módulos) ─────────────────────────────────────────────────

/**
 * Grupo + suas trilhas (módulos). adminView traz todas; senão só publicadas.
 */
export async function getGroupWithTrails(
  groupId: string,
  opts: { adminView?: boolean } = {},
): Promise<{ group: AcademyGroup; trails: ContentTrail[] } | null> {
  const supabase = createServiceClient()
  const { data: group } = await supabase
    .from("academy_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle()
  if (!group) return null

  let q = supabase
    .from("content_trails")
    .select("*")
    .eq("group_id", groupId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (!opts.adminView) q = q.eq("status", "published")
  const { data: trails } = await q

  return { group: group as AcademyGroup, trails: (trails || []) as ContentTrail[] }
}

/** F-V31 — materiais complementares (PDFs) do grupo. */
export async function getGroupMaterials(groupId: string): Promise<AcademyGroupMaterial[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("academy_group_materials")
    .select("*")
    .eq("group_id", groupId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
  return (data || []) as AcademyGroupMaterial[]
}

// ── Admin ───────────────────────────────────────────────────────────────────

/** Todos os grupos + nº de trilhas (pra gestão no CMS). */
export async function listAdminGroups(): Promise<AcademyGroupWithCount[]> {
  const supabase = createServiceClient()
  const { data: groups } = await supabase
    .from("academy_groups")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (!groups || groups.length === 0) return []

  const ids = (groups as AcademyGroup[]).map((g) => g.id)
  const { data: trails } = await supabase
    .from("content_trails")
    .select("group_id")
    .in("group_id", ids)

  const count = new Map<string, number>()
  ;((trails || []) as Array<{ group_id: string | null }>).forEach((t) => {
    if (t.group_id) count.set(t.group_id, (count.get(t.group_id) || 0) + 1)
  })

  return (groups as AcademyGroup[]).map((g) => ({ ...g, trails_count: count.get(g.id) || 0 }))
}

/** Um grupo específico (CMS). */
export async function getAdminGroup(id: string): Promise<AcademyGroup | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("academy_groups").select("*").eq("id", id).maybeSingle()
  return (data as AcademyGroup | null) ?? null
}

/** Lista de grupos pro select do TrailForm (id + título). */
export async function listGroupOptions(): Promise<Array<{ id: string; title: string }>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("academy_groups")
    .select("id, title")
    .order("display_order", { ascending: true })
    .order("title", { ascending: true })
  return (data || []) as Array<{ id: string; title: string }>
}
