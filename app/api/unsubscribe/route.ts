/**
 * F-V32 — Descadastro público da régua de e-mails.
 *
 * GET /api/unsubscribe?token=<assinado>. O token é HMAC (não expõe member_id em
 * claro). Válido → marca members.email_unsubscribed_at e o fluxo para (cron + D+0
 * checam essa coluna). Idempotente: clicar de novo não dá erro.
 *
 * Responde com uma página HTML simples (GET vindo de cliente de e-mail). Não
 * exige sessão — a posse do token assinado é a autorização.
 */

import { NextRequest, NextResponse } from "next/server"

import { createServiceClient } from "@/lib/supabase/server"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"

export const dynamic = "force-dynamic"

function page(title: string, message: string, ok: boolean): NextResponse {
  const color = ok ? "#1a7f37" : "#b42318"
  const html = `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title></head>
  <body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:64px auto;background:#fff;border-radius:14px;padding:32px;text-align:center;color:#1a1a1a;">
      <h1 style="font-size:20px;color:${color};margin:0 0 12px;">${title}</h1>
      <p style="font-size:15px;line-height:1.5;margin:0;color:#444;">${message}</p>
    </div>
  </body></html>`
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  const memberId = verifyUnsubscribeToken(token)
  if (!memberId) {
    return page(
      "Link inválido",
      "Este link de descadastro é inválido ou expirou. Se precisar de ajuda, fale com a equipe Biohelp.",
      false,
    )
  }

  try {
    const supabase = createServiceClient()
    // Só marca se ainda não estava descadastrado (preserva a 1ª data).
    const { error } = await supabase
      .from("members")
      .update({ email_unsubscribed_at: new Date().toISOString() })
      .eq("id", memberId)
      .is("email_unsubscribed_at", null)
    if (error) {
      console.error("[unsubscribe]", error)
      return page(
        "Algo deu errado",
        "Não conseguimos processar seu descadastro agora. Tente novamente em instantes.",
        false,
      )
    }
  } catch (err) {
    console.error("[unsubscribe] exception", err)
    return page(
      "Algo deu errado",
      "Não conseguimos processar seu descadastro agora. Tente novamente em instantes.",
      false,
    )
  }

  return page(
    "Pronto, você foi descadastrado(a)",
    "Você não vai mais receber os e-mails automáticos do clube. Você continua membro normalmente.",
    true,
  )
}
