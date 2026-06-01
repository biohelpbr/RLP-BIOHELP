/**
 * POST /api/auth/check-email
 *
 * Gate de pré-validação para o login OTP do V2Login. Permite acesso a:
 *   1. Members com `subscription_status='paid'` (parceiras ativas).
 *   2. Members com role=admin (admins não precisam de assinatura
 *      do Nutrition Club pra acessar o painel).
 *
 * Bloqueia:
 *   - E-mails que nunca passaram pelo /join (não existem em `members`).
 *   - Members em `pending` (preencheram o pré-cadastro mas o pagamento
 *     no Guru não confirmou — o webhook subscription_activated ainda não
 *     subiu para `paid`).
 *   - Members em `cancelled` (assinatura encerrada) sem role admin.
 *
 * Resposta para front:
 *   - 200 `{ ok: true }` → libera signInWithOtp.
 *   - 403 `{ ok: false, code: 'NOT_PAID', subscribe_url }` → mostrar
 *     mensagem + CTA para checkout do Guru.
 *
 * Anti-SPEC v2 §4: não toca em members/auth, é só read-only.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"

const Schema = z.object({
  email: z.string().email("E-mail inválido"),
})

const SUBSCRIBE_URL =
  process.env.GURU_SUBSCRIBE_URL ??
  "https://checkout.bio-help.com/subscribe/membership-biohelp-nutrition-club"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_EMAIL",
          message: "E-mail inválido.",
        },
        { status: 400 },
      )
    }

    const email = parsed.data.email.toLowerCase().trim()

    const supabase = createServiceClient()
    const { data: member, error } = await supabase
      .from("members")
      .select("id, subscription_status")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      console.error("[check-email] lookup error", error)
      return NextResponse.json(
        {
          ok: false,
          code: "INTERNAL_ERROR",
          message: "Erro ao validar e-mail. Tente novamente.",
        },
        { status: 500 },
      )
    }

    if (!member) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_PAID",
          subscribe_url: SUBSCRIBE_URL,
          message:
            "E-mail não autorizado. Você precisa fazer o cadastro e assinar o Nutrition Club para acessar o painel.",
        },
        { status: 403 },
      )
    }

    // Admins entram sem exigência de assinatura ativa — checam role antes
    // de barrar por subscription_status.
    if (member.subscription_status !== "paid") {
      const { data: role } = await supabase
        .from("roles")
        .select("role")
        .eq("member_id", member.id)
        .maybeSingle()

      if (role?.role !== "admin") {
        return NextResponse.json(
          {
            ok: false,
            code: "NOT_PAID",
            subscribe_url: SUBSCRIBE_URL,
            message:
              "E-mail não autorizado. Você precisa fazer o cadastro e assinar o Nutrition Club para acessar o painel.",
          },
          { status: 403 },
        )
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("[check-email] unexpected", err)
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Erro interno. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
