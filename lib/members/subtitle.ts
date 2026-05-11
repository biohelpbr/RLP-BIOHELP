/**
 * Calcula subtítulo dinâmico do membro pra sidebar/perfil.
 *
 * Prioridade (mais "alto" primeiro):
 *  1. FOUNDER (tag manual ou via F-V06) → "Founder Biohelp"
 *  2. auto:influenciador (≥ 40 ativos — F-V18) → "Influenciador Biohelp"
 *  3. auto:lider (≥ 5 ativos — F-V18) → "Líder Biohelp"
 *  4. subscription_status = paid → "Membro ativo do clube"
 *  5. Default → "Membro do clube"
 *
 * Hoje 13/05/2026 a maioria cai no default porque F-V03 ainda não popular
 * subscription_status em massa. Conforme assinaturas via Guru entram, o
 * subtítulo evolui automaticamente.
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
  if (tags.includes("auto:influenciador")) {
    return "Influenciador Biohelp"
  }
  if (tags.includes("auto:lider")) {
    return "Líder Biohelp"
  }
  if (input.subscription_status === "paid") {
    return "Membro ativo do clube"
  }
  return "Membro do clube"
}
