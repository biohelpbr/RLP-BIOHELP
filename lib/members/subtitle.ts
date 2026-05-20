/**
 * Calcula subtítulo dinâmico do membro pra sidebar/perfil.
 *
 * Prioridade (mais "alto" primeiro) — v2 pós decisão cliente 20/05/2026:
 *  1. FOUNDER (tag manual ou via F-V06 ≥5 ativos) → "Founder Biohelp"
 *  2. manual:influenciador (tag manual aplicada pelo admin) → "Influenciador Biohelp"
 *  3. subscription_status = paid → "Membro ativo do clube"
 *  4. Default → "Membro do clube"
 *
 * Notas v2:
 *  - Tag `auto:lider` foi removida (cliente: ≥5 vira Founder, não Líder).
 *  - Tag `auto:influenciador` foi removida (Influenciador agora é tag manual).
 *  - Legado: caso ainda exista `auto:lider`/`auto:influenciador` em algum membro
 *    (cleanup soft pendente via cron `auto-tags`), retornam ao default.
 */

export interface MemberSubtitleInput {
  tags?: unknown
  subscription_status?: string | null
}

export function getMemberSubtitle(input: MemberSubtitleInput): string {
  const tags = Array.isArray(input.tags) ? (input.tags as string[]) : []

  if (tags.includes("FOUNDER") || tags.includes("manual:founder")) {
    return "Founder Biohelp"
  }
  if (tags.includes("manual:influenciador")) {
    return "Influenciador Biohelp"
  }
  if (input.subscription_status === "paid") {
    return "Membro ativo do clube"
  }
  return "Membro do clube"
}
