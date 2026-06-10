// F-V27 — regras puras de gating da Academy (sem dependência de server/DB),
// pra poder rodar tanto nas queries (server) quanto nos componentes client.
import type { ContentModule } from "./queries"

/**
 * Uma aula está "em breve" (teaser, não abre) quando o admin marcou manualmente
 * OU quando tem data de liberação ainda no futuro. Regra única reusada em todo lugar.
 */
export function isModuleComingSoon(
  m: Pick<ContentModule, "is_coming_soon" | "available_at">,
  now: Date = new Date(),
): boolean {
  if (m.is_coming_soon) return true
  if (m.available_at && new Date(m.available_at) > now) return true
  return false
}
