import { createServiceClient } from "@/lib/supabase/server"

/**
 * F-V18 v2 — Reescrito após decisão cliente 20/05/2026.
 *
 * **Mudança de spec:**
 *   - Removida a tag `auto:lider`. Quem atinge ≥5 ativos no clube vira FOUNDER
 *     (lógica em F-V06), não Líder.
 *   - Removida a auto-classificação de Influenciador. Influenciador agora é
 *     uma tag **manual** (`manual:influenciador`), aplicada pelo admin via
 *     `/admin/community/[id]`. Sem threshold automático.
 *
 * **Comportamento atual:**
 *   - `computeAutoTags()` sempre retorna `[]`. Mantido por contrato pra preservar
 *     idempotência do cron `auto-tags` (limpa qualquer `auto:*` antigo) e
 *     compatibilidade com `recompute(memberId)`.
 *   - `mergeTags()` continua preservando tags `manual:*` e `FOUNDER`. Soft cleanup
 *     de `auto:lider` / `auto:influenciador` em recompute (chamadas existentes
 *     limpam o que sobrou).
 *
 * @see docs/sdd/features/F-V18-tags-automaticas/SPEC.md (v2 — atualizada 20/05)
 * @see docs/sdd/features/F-V06-promocao-founder/SPEC.md (Founder ≥5 ativos)
 */

export type AutoTag = "auto:lider" | "auto:influenciador"
export const AUTO_TAGS: readonly AutoTag[] = ["auto:lider", "auto:influenciador"] as const

type RecomputeResult = {
  scanned: number
  updated: number
  unchanged: number
}

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

  for (const id of ids) {
    const desired = computeAutoTags()
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

/**
 * F-V18 v2: auto-tagging foi descontinuada.
 * Founder é tratado em F-V06 (status, não tag automática).
 * Influenciador virou tag manual (`manual:influenciador`).
 */
export function computeAutoTags(_activeCount?: number): AutoTag[] {
  return []
}

/**
 * Substitui apenas as tags `auto:*` em `current` pelo conjunto `desired`.
 * Demais tags (manual:*, FOUNDER, etc.) preservadas.
 * Com `desired = []` (default v2), funciona como cleanup soft das auto-tags antigas.
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
