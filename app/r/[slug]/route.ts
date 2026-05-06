/**
 * F-V15 — Handler de adesão a evento.
 *
 * GET /r/<slug> faz:
 *   1. Procura evento ativo + published com esse slug.
 *   2. Registra row em event_visits (com member_id se autenticado).
 *   3. Set-Cookie evt=<slug> Path=/ Max-Age=604800 SameSite=Lax (UX/diagnóstico —
 *      a fonte de verdade do hook de webhook é event_visits.member_id, ver
 *      lib/events/hook-on-order-paid.ts).
 *   4. Redireciona pra redirect_url do evento (default '/').
 *
 * Evento inexistente, fora do período ou não-publicado → 404.
 *
 * Gate: roda independente de LRP_V2 (rota pública pra adesão a evento que
 * só existe quando admin v2 cria — flag OFF no admin impede criação, então
 * o handler não tem o que servir).
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server"
import { getEventBySlug } from "@/lib/events/queries"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const event = await getEventBySlug(slug)
  if (!event || event.status !== "published") {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 })
  }

  const now = new Date()
  if (new Date(event.start_at) > now || new Date(event.end_at) < now) {
    return NextResponse.json({ error: "Evento fora do período." }, { status: 404 })
  }

  // Resolve membro autenticado (opcional — visitas anônimas também valem).
  let memberId: string | null = null
  try {
    const userClient = await createServerSupabaseClient()
    const { data: userResp } = await userClient.auth.getUser()
    if (userResp.user) {
      const service = createServiceClient()
      const { data: m } = await service
        .from("members")
        .select("id")
        .eq("auth_user_id", userResp.user.id)
        .maybeSingle()
      memberId = (m?.id as string) || null
    }
  } catch (err) {
    console.warn("[/r/<slug>] auth lookup failed", err)
  }

  // Registra visita.
  try {
    const service = createServiceClient()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
    const ua = req.headers.get("user-agent") || null
    await service.from("event_visits").insert({
      event_id: event.id,
      member_id: memberId,
      ip,
      user_agent: ua,
    })
  } catch (err) {
    console.error("[/r/<slug>] visit insert failed", err)
  }

  const redirectTo = event.redirect_url && event.redirect_url.trim().length > 0
    ? event.redirect_url
    : "/"

  const res = NextResponse.redirect(new URL(redirectTo, req.url), 302)
  res.cookies.set("evt", event.slug, {
    path: "/",
    maxAge: 7 * 24 * 3600,
    sameSite: "lax",
    httpOnly: false,
  })
  return res
}
