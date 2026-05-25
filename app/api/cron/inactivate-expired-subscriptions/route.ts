/**
 * F-V19 RF-9 — Cron diário pra inativar assinaturas expiradas.
 *
 * Vercel Cron chama GET /api/cron/inactivate-expired-subscriptions
 * (vercel.json: 0 6 * * * = 03:00 BRT).
 *
 * Critério (em getExpiredSubscriptions):
 *   subscription_status='paid' AND subscription_auto_renew=false
 *     AND subscription_expires_at < now()
 *
 * Member que cancelou no Guru fica `paid` até o ciclo terminar — só aí
 * o cron flipa pra `cancelled` e o sponsor perde 1 ativo na contagem F-V18.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>`. Padrão dos crons
 * existentes (auto-tags, network-compression, etc).
 *
 * Gates (CA-13):
 *   • `CRON_DISABLED_V2=true` OR `LRP_V2 !== 'true'` → 200 com skipped=true.
 *   • Sem mexer no DB nesses casos.
 */

import { NextRequest, NextResponse } from "next/server"

import { cancelSubscription } from "@/lib/subscriptions/actions"
import { getExpiredSubscriptions } from "@/lib/subscriptions/queries"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET não configurada no ambiente." },
      { status: 500 },
    )
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // Gate Anti-SPEC (CA-13): respeita CRON_DISABLED_V2 + LRP_V2 OFF.
  if (process.env.CRON_DISABLED_V2 === "true" || process.env.LRP_V2 !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason:
        process.env.CRON_DISABLED_V2 === "true"
          ? "CRON_DISABLED_V2=true"
          : "LRP_V2!=true",
    })
  }

  const expired = await getExpiredSubscriptions()
  const results: Array<{ id: string; email: string | null; ok: boolean; error?: string }> = []

  for (const m of expired) {
    const res = await cancelSubscription(m.id)
    results.push(
      res.ok
        ? { id: m.id, email: m.email, ok: true }
        : { id: m.id, email: m.email, ok: false, error: res.error },
    )
  }

  const succeeded = results.filter((r) => r.ok).length
  const failed = results.length - succeeded

  return NextResponse.json({
    ok: true,
    candidates: expired.length,
    inactivated: succeeded,
    failed,
    results,
  })
}
