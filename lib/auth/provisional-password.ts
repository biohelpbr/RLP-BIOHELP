/**
 * F-V28 — Senha provisória de emergência.
 * Gera uma senha aleatória forte (sem caracteres ambíguos) e envia por e-mail.
 * Usada quando a parceira não consegue receber o código OTP.
 */
import { randomInt } from "crypto"
import { buildHtml, getFrom, getResend } from "@/lib/email/resend"

// Alfabeto sem caracteres ambíguos (0/O, 1/l/I) pra ditar por WhatsApp/telefone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

/**
 * Senha provisória forte e legível no formato `Bio-XXXX-XXXX` (10 chars + prefixo).
 * Combina letras maiúsculas/minúsculas e dígitos do alfabeto seguro.
 */
export function generateProvisionalPassword(): string {
  const pick = () => ALPHABET[randomInt(0, ALPHABET.length)]
  const group = (n: number) =>
    Array.from({ length: n }, pick).join("")
  return `Bio-${group(4)}-${group(4)}`
}

/**
 * Envia a senha provisória por e-mail (Resend). Best-effort — o chamador decide
 * o que fazer se falhar (a senha também é mostrada no admin pra repasse manual).
 */
export async function sendProvisionalPasswordEmail(
  email: string,
  name: string | null,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const firstName = (name ?? "").split(" ")[0] || "Olá"
  const body = `
    <p>Oi, ${firstName}!</p>
    <p>Geramos uma <strong>senha provisória</strong> pra você entrar no Portal de Parceiras
    caso não esteja recebendo o código de acesso por e-mail.</p>
    <p style="font-size:20px;letter-spacing:1px;background:#f3f0ff;border-radius:10px;padding:14px 18px;text-align:center;font-weight:700;">
      ${password}
    </p>
    <p>Acesse <a href="https://painel.bio-help.com/login">painel.bio-help.com/login</a>,
    escolha <strong>"Entrar com senha"</strong> e use o e-mail deste contato + a senha acima.</p>
    <p><strong>Por segurança, no primeiro acesso você vai precisar criar uma nova senha.</strong></p>
    <p>Se você não pediu isso, ignore este e-mail — a senha antiga continua valendo até alguém usar esta.</p>
  `
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: email,
      subject: "Sua senha provisória — Biohelp Nutrition Club",
      html: buildHtml(body),
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    console.error("[sendProvisionalPasswordEmail]", e)
    return { ok: false, error: "Falha ao enviar e-mail da senha provisória." }
  }
}
