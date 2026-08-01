/**
 * Página de obrigado (pós-checkout) — Creators Hub.
 * Os 3 links NÃO ficam aqui: são editáveis pelo admin em /admin/settings
 * (chave `creators_hub_links` em app_settings). Ver lib/settings/queries.ts.
 */
export const OBRIGADO_COPY = {
  headline: "Parabéns pela compra!",
  subheadline: "Você está um passo mais próximo de\nmudar sua realidade financeira.",
  stepsLabel: "AGORA SIGA OS PASSOS ABAIXO",
  steps: [
    {
      id: "email" as const,
      title: "PASSO 1: VERIFIQUE SEU E-MAIL",
      body: "Enviamos um e-mail importante com seu acesso à plataforma de aulas. Confira sua caixa de entrada e também a pasta de spam.",
      cta: "Verificar e-mail",
      tone: "orange" as const,
    },
    {
      id: "whatsapp" as const,
      title: "PASSO 2: ENTRE NO GRUPO DE WHATSAPP",
      body: "É por lá que você vai receber avisos, orientações e atualizações importantes para começar com o pé direito.",
      cta: "Entrar no grupo",
      tone: "purple" as const,
    },
    {
      id: "plataforma" as const,
      title: "PASSO 3: COMECE SUA JORNADA",
      body: "Acesse a plataforma, acompanhe as aulas e siga o passo a passo para colocar tudo em prática o quanto antes.",
      cta: "Acessar plataforma",
      tone: "purple" as const,
    },
  ],
  footerNote:
    "Se não encontrar o e-mail em alguns minutos, verifique a caixa de spam ou promoções.",
} as const
