/**
 * Handler de adesão (F-V15 evento + F-V19 referral member).
 *
 * GET /r/<slug>:
 *   1. F-V15 — procura evento ativo + published. Se achou e está no período:
 *      registra event_visits (com member_id se autenticado), seta cookie
 *      `evt=<slug>` e redireciona pra redirect_url. ESTE PATH NÃO MUDOU.
 *   2. F-V19 (atrás de LRP_V2_GURU_FLOW) — se não achou evento, tenta lookup
 *      `members.ref_code = <slug>`. Se sponsor existe e não está cancelado:
 *      seta cookie `ref=<ref_code>` e redireciona pra /convite/<ref_code>.
 *   3. Senão → 404.
 *
 * Gate F-V15: roda independente de LRP_V2 (admin v2 cria evento; flag OFF
 *   no admin impede criação, então o handler simplesmente não acha row).
 * Gate F-V19: process.env.LRP_V2_GURU_FLOW === "true" — default OFF em prod.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server"
import { getEventBySlug } from "@/lib/events/queries"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const event = await getEventBySlug(slug)
  const now = new Date()
  const eventValid =
    event !== null &&
    event.status === "published" &&
    new Date(event.start_at) <= now &&
    new Date(event.end_at) >= now

  if (eventValid && event) {
    // ─── F-V15 path: INALTERADO ───────────────────────────────────────────
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

    const redirectTo =
      event.redirect_url && event.redirect_url.trim().length > 0 ? event.redirect_url : "/"
    const res = NextResponse.redirect(new URL(redirectTo, req.url), 302)
    res.cookies.set("evt", event.slug, {
      path: "/",
      maxAge: 7 * 24 * 3600,
      sameSite: "lax",
      httpOnly: false,
    })
    return res
  }

  // ─── F-V19 fallback: lookup sponsor por ref_code ─────────────────────────
  if (process.env.LRP_V2_GURU_FLOW === "true") {
    try {
      const service = createServiceClient()
      const { data: sponsor } = await service
        .from("members")
        .select("ref_code, subscription_status")
        .eq("ref_code", slug)
        .maybeSingle()

      if (sponsor && sponsor.subscription_status !== "cancelled") {
        const res = NextResponse.redirect(
          new URL(`/convite/${sponsor.ref_code}`, req.url),
          302
        )
        res.cookies.set("ref", sponsor.ref_code as string, {
          path: "/",
          maxAge: 7 * 24 * 3600,
          sameSite: "lax",
          httpOnly: false,
        })
        return res
      }
    } catch (err) {
      console.warn("[/r/<slug>] sponsor lookup failed", err)
    }
  }

  return NextResponse.json({ error: "Não encontrado." }, { status: 404 })
}
