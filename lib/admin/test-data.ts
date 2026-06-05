/**
 * Identificação de members/subscribers de TESTE para os números do admin.
 *
 * W1 (call 05/06): cards e contagens do painel devem refletir só dados reais.
 * Espelho TS da função SQL `public.is_test_subscriber(email, name)`
 * (migration 20260605_w1-admin-exclude-test-data.sql) — manter os dois em
 * sincronia ao adicionar padrão novo.
 *
 * Usado nas contagens agregadas (overview, assinaturas). NÃO usar em
 * /admin/community: lá o admin precisa enxergar e gerenciar todo member.
 */

/** Compras de teste da equipe (pré-go-live 25/05–01/06). */
const TEAM_TEST_EMAILS = new Set([
  "eduspires123@gmail.com",
  "eduardo.sousa@ldccapital.com",
  "gjsturm7@gmail.com",
  "sturmfeevale@gmail.com",
  "leonardo@bio-help.com",
  "leonardowagner1996@gmail.com",
])

export function isTestIdentity(
  email: string | null | undefined,
  name?: string | null
): boolean {
  const e = (email ?? "").toLowerCase()
  const n = (name ?? "").toLowerCase()
  return (
    e.startsWith("load-test-") ||
    e.endsWith("@fake.dev") ||
    e.endsWith("@flowcode.cc") ||
    e.includes("+test") ||
    e.startsWith("pending+") ||
    e.startsWith("e2e-") ||
    n.startsWith("teste") ||
    n.startsWith("e2e ") ||
    TEAM_TEST_EMAILS.has(e)
  )
}
