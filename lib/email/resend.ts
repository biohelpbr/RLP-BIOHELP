import { Resend } from "resend"

let client: Resend | null = null

/** Cliente Resend singleton. Lança se a env não estiver configurada. */
export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY não configurada no ambiente.")
  if (!client) client = new Resend(key)
  return client
}

/** Remetente padrão das campanhas (separado do no-reply transacional dos códigos). */
export function getFrom(): string {
  return (
    process.env.RESEND_FROM ||
    "Biohelp Nutrition Club <comunidade@mail.bio-help.com>"
  )
}

/**
 * Monta o HTML final do e-mail a partir do corpo escrito pelo admin.
 * Aceita HTML simples; quebras de linha viram <br>. Embrulha num layout
 * básico com rodapé. Mantemos simples (v1) — sem editor rico.
 */
export function buildHtml(body: string): string {
  const content = body.includes("<") ? body : body.replace(/\n/g, "<br>")
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:24px;">
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;color:#1a1a1a;line-height:1.55;font-size:15px;">
    ${content}
    <hr style="border:none;border-top:1px solid #ececec;margin:28px 0 14px;">
    <p style="font-size:12px;color:#9a9a9a;margin:0;">Biohelp Nutrition Club · você recebe este e-mail por ser membro do clube.</p>
  </div>
</body></html>`
}
