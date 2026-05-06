import { createServiceClient } from "@/lib/supabase/server"

export type AutoTag = "auto:lider" | "auto:influenciador"
export const AUTO_TAGS: readonly AutoTag[] = ["auto:lider", "auto:influenciador"] as const

const LIDER_THRESHOLD = 5
const INFLUENCIADOR_THRESHOLD = 40

type RecomputeResult = {
  scanned: number
  updated: number
  unchanged: number
}

/**
 * F-V18: recalcula tags `auto:*` em `members.tags` baseado no nº de
 * afiliados N1 ativos (view `member_active_affiliate_count`).
 *
 * Regra:
 *   active_count >= 40 → ['auto:lider', 'auto:influenciador']
 *   active_count >= 5  → ['auto:lider']
 *   else               → []
 *
 * Tags com prefixo diferente de 'auto:' (ex.: 'manual:vip', 'FOUNDER')
 * são preservadas. Idempotente — comparar e gravar só se mudou.
 *
 * Hipótese-1 S3: "ativo" = status='active' (proxy via view). Quando
 * F-V03 entrar (S5+), troca em 1 lugar — a view (vide migration).
 *
 * @param memberId Quando undefined, percorre todos. Quando string, só esse membro.
 */
export async function recompute(memberId?: string): Promise<RecomputeResult> {
  const supabase = createServiceClient()

  let countsQuery = supabase
    .from("member_active_affiliate_count")
    .select("member_id, active_count")
  if (memberId) countsQuery = countsQuery.eq("member_id", memberId)

  const { data: counts, error: countsError } = await countsQuery
  if (countsError) {
    console.error("[auto-classifier] view query error", countsError)
    throw countsError
  }

  const ids = (counts ?? []).map((r) => r.member_id as string)
  if (ids.length === 0) return { scanned: 0, updated: 0, unchanged: 0 }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, tags")
    .in("id", ids)
  if (membersError) {
    console.error("[auto-classifier] members query error", membersError)
    throw membersError
  }

  const currentTagsById = new Map<string, string[]>()
  for (const m of members ?? []) {
    const tags = Array.isArray(m.tags) ? (m.tags as string[]) : []
    currentTagsById.set(m.id as string, tags)
  }

  let updated = 0
  let unchanged = 0

  for (const row of counts ?? []) {
    const id = row.member_id as string
    const active = Number(row.active_count ?? 0)
    const desired = computeAutoTags(active)
    const current = currentTagsById.get(id) ?? []

    const next = mergeTags(current, desired)

    if (sameTags(current, next)) {
      unchanged++
      continue
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({ tags: next })
      .eq("id", id)
    if (updateError) {
      console.error("[auto-classifier] update error", id, updateError)
      throw updateError
    }
    updated++
  }

  return { scanned: ids.length, updated, unchanged }
}

export function computeAutoTags(activeCount: number): AutoTag[] {
  if (activeCount >= INFLUENCIADOR_THRESHOLD) {
    return ["auto:lider", "auto:influenciador"]
  }
  if (activeCount >= LIDER_THRESHOLD) {
    return ["auto:lider"]
  }
  return []
}

/**
 * Substitui apenas as tags `auto:*` em `current` pelo conjunto `desired`.
 * Demais tags (manual:*, FOUNDER, etc.) preservadas.
 */
export function mergeTags(current: string[], desired: AutoTag[]): string[] {
  const preserved = current.filter((t) => !t.startsWith("auto:"))
  const merged = new Set<string>([...preserved, ...desired])
  return Array.from(merged).sort()
}

function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false
  return true
}
