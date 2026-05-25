/**
 * F-V19: Texto institucional da landing `/convite/[ref_code]`.
 *
 * Mantido como constante TS (e não no DB) pra permitir tweak rápido sem migration
 * e revisão por PR. Quando o cliente quiser editar sozinho, mover para uma
 * tabela `landing_copy` (não escopo do MVP 22/05).
 *
 * `{sponsorName}` é o único token interpolado em runtime.
 */
export const CONVITE_COPY = {
  badge: "Você foi convidado(a)",
  headlineTemplate: "Você foi convidado(a) por {sponsorName}",
  subheadline:
    "Junte-se ao Clube Biohelp e tenha acesso a uma curadoria de suplementos, conteúdos exclusivos e acompanhamento pra evoluir sua nutrição com leveza.",
  benefits: [
    "Acesso ao catálogo com preço de clube",
    "Conteúdos e trilhas de academia liberados",
    "Comunidade ativa de quem cuida da saúde de verdade",
  ],
  formTitle: "Preencha seus dados para continuar",
  formSubtitle:
    "Em seguida você é levado(a) pra um checkout seguro pra concluir a assinatura.",
  termsLabel:
    "Li e aceito os termos de uso e a política de privacidade do Clube Biohelp.",
  submitLabel: "Continuar para pagamento",
  submittingLabel: "Redirecionando para o checkout…",
  footerNote:
    "Pagamento processado em ambiente seguro. Você pode cancelar a renovação a qualquer momento pelo seu painel.",
} as const

export function renderConviteHeadline(sponsorName: string | null | undefined): string {
  const name = (sponsorName ?? "").trim() || "alguém especial"
  return CONVITE_COPY.headlineTemplate.replace("{sponsorName}", name)
}
