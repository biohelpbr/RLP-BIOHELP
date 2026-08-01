/**
 * F-V19: Texto institucional da landing `/convite/[ref_code]`.
 * Design v4 — Creators Hub (27/07/2026): marca própria do funil de convite,
 * headline de renda e acento roxo. O clube segue sendo o Biohelp (termos).
 */
export const CONVITE_COPY = {
  brandName: "Creators\nHub",
  topBar: "COMUNIDADE • PROSPERIDADE • WELLNESS",
  headlineLine1: "Construa uma renda de",
  headlineAccent: "R$ 3k a R$ 15k por mês",
  headlineLine3: "sem sair de casa!",
  sponsorPrefix: "Seu acesso foi liberado por",
  formTitle: "Preencha seus dados para continuar",
  formSubtitle:
    "Em seguida você é levado(a) pra um checkout seguro pra concluir a assinatura.",
  termsLabel:
    "Li e aceito os termos de uso e a política de privacidade do Clube Biohelp.",
  submitLabel: "Continuar para pagamento",
  submittingLabel: "Redirecionando…",
  securityTitle: "AMBIENTE SEGURO E PROTEGIDO",
  bottomHeadline: "Algumas pessoas entram para consumir melhor.",
  bottomHighlight: "Outras transformam isso em renda.",
  benefits: [
    { img: "/icone-produtos-premium.png", title: "Produtos\nPremium", sub: "A PREÇO\nDE CUSTO" },
    { img: "/icone-comunidade.png", title: "Comunidade", sub: "PESSOAS\nCAMINHANDO JUNTAS" },
    { img: "/icone-experiencias.png", title: "Experiências", sub: "CONEXÕES\nQUE TRANSFORMAM\nROTINAS" },
    { img: "/icone-oportunidade.png", title: "Oportunidade", sub: "COMPARTILHE,\nINDIQUE,\nGERE RENDA" },
  ],
  footerTaglinePre: "COMUNIDADE • PROSPERIDADE • ",
  footerTaglineAccent: "WELLNESS",
  // Legacy (compat)
  badge: "Você foi convidado(a)",
  headlineTemplate: "Você foi convidado(a) por {sponsorName}",
  subheadline: "Junte-se ao Clube Biohelp...",
  submitLabelLegacy: "Continuar para pagamento",
  footerNote: "Pagamento processado em ambiente seguro.",
} as const

export function renderConviteHeadline(sponsorName: string | null | undefined): string {
  const name = (sponsorName ?? "").trim() || "alguém especial"
  return CONVITE_COPY.headlineTemplate.replace("{sponsorName}", name)
}

export function renderSponsorBadge(sponsorName: string | null | undefined): string {
  const name = (sponsorName ?? "").trim() || "alguém especial"
  return `${CONVITE_COPY.sponsorPrefix} ${name}`
}
