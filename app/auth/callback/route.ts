import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const explicitNext = searchParams.get("next")
  // F-V19 hotfix 01/06: se o callback chega em admin.bio-help.com sem next
  // explícito (link mágico antigo, antes do fix no V2Login), default pra /admin
  // em vez de /dashboard. Sem isso, callback redireciona pra /dashboard, que
  // o middleware bounce pra painel.bio-help.com/dashboard (UI de parceira).
  const host = req.headers.get("host") ?? ""
  const isAdminHost = host.startsWith("admin.")
  const next = explicitNext ?? (isAdminHost ? "/admin" : "/dashboard")

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, req.url))
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", req.url))
}
