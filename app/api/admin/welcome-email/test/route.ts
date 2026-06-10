import { NextRequest, NextResponse } from "next/server"
import { isCurrentUserAdmin } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email/welcome"

/**
 * F-V30 — rota de TESTE do e-mail de boas-vindas. Admin-only. Envia o e-mail
 * real (via Resend) para o endereço passado em `?to=`, com um `?name=` opcional.
 * NÃO marca ninguém como pago, NÃO toca no banco, NÃO passa pelo webhook —
 * serve só pra validar conteúdo/entrega sem afetar assinantes reais.
 *
 * Uso (logado como admin): GET /api/admin/welcome-email/test?to=voce@email.com&name=Lucas
 */
export async function GET(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Apenas admin." }, { status: 403 })
  }

  const to = req.nextUrl.searchParams.get("to")?.trim()
  const name = req.nextUrl.searchParams.get("name")?.trim() || null
  if (!to) {
    return NextResponse.json({ error: "Informe ?to=email" }, { status: 400 })
  }

  const res = await sendWelcomeEmail({ to, name })
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, sentTo: to, id: res.id })
}
