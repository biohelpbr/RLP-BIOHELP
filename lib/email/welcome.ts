import { getResend, getFrom } from "./resend"

/**
 * F-V30 — E-mail de boas-vindas automático ao novo assinante do Nutrition Club.
 * Conteúdo definido pela BioHelp (10/06). Reusa o remetente do F-V23
 * (comunidade@mail.bio-help.com via getFrom()).
 */

export const WELCOME_SUBJECT = "Bem-vindo(a) ao Nutrition Club! 💚"

// Link do canal oficial de avisos no WhatsApp (fornecido pela BioHelp).
const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/JBXR9M2QEv1HXYwuDqgT0V"

/** HTML do e-mail. `name` opcional personaliza a saudação. */
export function buildWelcomeHtml(name?: string | null): string {
  const hello = name?.trim() ? `Olá, ${name.trim()}! 💚` : "Olá! 💚"
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:24px;">
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px;color:#1a1a1a;line-height:1.6;font-size:15px;">
    <p style="font-size:18px;font-weight:600;margin:0 0 16px;">${hello}</p>
    <p style="margin:0 0 14px;">Seja muito bem-vindo(a) ao <strong>Nutrition Club da Biohelp</strong>!</p>
    <p style="margin:0 0 14px;">Parabéns por fazer parte de uma comunidade que acredita no crescimento, compartilha conhecimento e prospera junto a cada conquista! 💚</p>
    <p style="margin:0 0 14px;">Temos um canal oficial de avisos no WhatsApp e é muito importante que você faça parte dele. É por lá que compartilhamos novidades, comunicados, campanhas e informações importantes em tempo real.</p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${WHATSAPP_COMMUNITY_URL}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:10px;">👉 Entrar na comunidade no WhatsApp</a>
    </div>
    <p style="margin:0 0 14px;">Ative as notificações e acompanhe tudo o que preparamos para você.</p>
    <p style="margin:18px 0 0;">Com carinho,<br>Equipe Biohelp 💚</p>
    <hr style="border:none;border-top:1px solid #ececec;margin:28px 0 14px;">
    <p style="font-size:12px;color:#9a9a9a;margin:0;">Biohelp Nutrition Club · você recebe este e-mail por ter se tornado assinante do clube.</p>
  </div>
</body></html>`
}

export type SendWelcomeResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

/**
 * Envia o e-mail de boas-vindas. NÃO lança — devolve {ok:false} em qualquer erro,
 * pra ser chamada dentro de hooks isolados sem risco de derrubar o fluxo.
 */
export async function sendWelcomeEmail(args: {
  to: string
  name?: string | null
}): Promise<SendWelcomeResult> {
  try {
    const to = args.to.trim().toLowerCase()
    if (!to || !to.includes("@")) return { ok: false, error: "destinatário inválido" }

    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject: WELCOME_SUBJECT,
      html: buildWelcomeHtml(args.name),
    })
    if (error) {
      console.error("[sendWelcomeEmail] resend error", error)
      return { ok: false, error: error.message || "falha no envio" }
    }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    console.error("[sendWelcomeEmail] exception", err)
    return { ok: false, error: "exceção no envio" }
  }
}
