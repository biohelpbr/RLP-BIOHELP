import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"

/**
 * Callback de auth do Supabase.
 *
 * Aceita 2 shapes que o Supabase pode mandar dependendo do estado do usuário:
 *   1. PKCE (`?code=...`) — flow padrão de OTP code typed in V2Login.
 *   2. Token (`?token_hash=...&type=signup|magiclink|recovery`) — flow de signup
 *      confirm pra users NOVOS (sem auth.users antes), e de magic link clicado
 *      (alternativa ao OTP code).
 *
 * Após exchange/verify ok:
 *   - Auto-linka `members.auth_user_id` se member com mesmo email tiver NULL.
 *     Evita órfãos quando o flow é signup direto (sem prévia integração Guru).
 *   - Redireciona pro `next` (ou /admin em admin domain, ou /dashboard).
 *
 * F-V19 hotfixes:
 *   01/06 — add token_hash handling pra desbloquear signups novos (Léo).
 *   01/06 — admin domain default /admin quando sem next explícito.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const tokenType = searchParams.get("type") as EmailOtpType | null
  const explicitNext = searchParams.get("next")

  const host = req.headers.get("host") ?? ""
  const isAdminHost = host.startsWith("admin.")
  const next = explicitNext ?? (isAdminHost ? "/admin" : "/dashboard")

  const supabase = await createServerSupabaseClient()
  let userEmail: string | null = null
  let userId: string | null = null
  let authOk = false

  // 1. Flow PKCE — código de troca por sessão.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      authOk = true
      userEmail = data.user?.email ?? null
      userId = data.user?.id ?? null
    } else {
      console.error("[auth/callback] exchangeCodeForSession error", error.message)
    }
  }

  // 2. Flow token_hash — signup confirm ou magic link clicado.
  if (!authOk && tokenHash && tokenType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType,
    })
    if (!error) {
      authOk = true
      userEmail = data.user?.email ?? null
      userId = data.user?.id ?? null
    } else {
      console.error("[auth/callback] verifyOtp(token_hash) error", error.message)
    }
  }

  if (!authOk) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url))
  }

  // 3. Auto-linka member.auth_user_id quando NULL (caso clássico: Léo cadastrou
  //    via Guru com email X, member row criado com auth_user_id=NULL; user
  //    completa signup pela primeira vez e auth.users é criado pelo Supabase
  //    sem vínculo manual).
  if (userEmail && userId) {
    try {
      const admin = createServiceClient()
      const { data: member } = await admin
        .from("members")
        .select("id, auth_user_id")
        .eq("email", userEmail)
        .maybeSingle()
      if (member && !member.auth_user_id) {
        await admin
          .from("members")
          .update({ auth_user_id: userId })
          .eq("id", member.id)
        console.info("[auth/callback] linked member.auth_user_id", {
          email: userEmail,
          memberId: member.id,
        })
      }
    } catch (err) {
      console.error("[auth/callback] auto-link error (non-fatal)", err)
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
