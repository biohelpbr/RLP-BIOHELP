/**
 * F-V19: Texto institucional da landing `/convite/[ref_code]`.
 * Design v2 baseado na referência Biohelp Nutrition Club (27/05/2026).
 */
export const CONVITE_COPY = {
  topBar: "COMUNIDADE  •  PROSPERIDADE  •  WELLNESS",
  brandName: "BIOHELP",
  brandSub: "NUTRITION CLUB",
  headline: "O primeiro clube onde\nconsumo inteligente\nse transforma em\ncomunidade e crescimento.",
  sponsorBadgeTemplate: "Seu acesso foi liberado por  {sponsorName}",
  formIntro: "Complete seus dados para ativar seu acesso ao Nutrition Club.",
  termsLabel:
    "Li e aceito os termos de uso e a política de privacidade do Club Biohelp.",
  submitLabel: "ATIVAR MEU ACESSO",
  submittingLabel: "Ativando…",
  securityBadge: "Ambiente seguro e protegido.",
  securitySub: "Sua membership pode ser cancelada\na qualquer momento pelo painel do membro.",
  bottomHeadline: "Algumas pessoas entram\npara consumir melhor.",
  bottomHighlight: "Outras transformam isso em renda.",
  benefits: [
    { icon: "gift", label: "PRODUTOS\nPREMIUM" },
    { icon: "users", label: "COMUNIDADE" },
    { icon: "star", label: "EXPERIÊNCIAS" },
    { icon: "trending-up", label: "RENDA" },
  ],
  footerTagline: "MAIS ACESSO.  MAIS CONEXÃO.  MAIS POSSIBILIDADES.",
  // Legacy (used by old code that might reference these)
  badge: "Você foi convidado(a)",
  headlineTemplate: "Você foi convidado(a) por {sponsorName}",
  subheadline: "Junte-se ao Clube Biohelp e tenha acesso a uma curadoria de suplementos, conteúdos exclusivos e acompanhamento pra evoluir sua nutrição com leveza.",
  formTitle: "Preencha seus dados para continuar",
  formSubtitle: "Em seguida você é levado(a) pra um checkout seguro pra concluir a assinatura.",
  footerNote: "Pagamento processado em ambiente seguro. Você pode cancelar a renovação a qualquer momento pelo seu painel.",
} as const

export function renderConviteHeadline(sponsorName: string | null | undefined): string {
  const name = (sponsorName ?? "").trim() || "alguém especial"
  return CONVITE_COPY.headlineTemplate.replace("{sponsorName}", name)
}

export function renderSponsorBadge(sponsorName: string | null | undefined): string {
  const name = (sponsorName ?? "").trim() || "alguém especial"
  return CONVITE_COPY.sponsorBadgeTemplate.replace("{sponsorName}", name)
}
