/**
 * F-V32 — Cron diário do fluxo de e-mails (drip "novo assinante").
 *
 * Vercel Cron chama GET /api/cron/email-flow. NÃO está registrado no vercel.json
 * ainda — só vamos registrar quando o fluxo estiver pronto pra ligar.
 *
 * Para cada assinante pago não-descadastrado e cada passo habilitado cujo delay
 * já venceu, envia 1x (idempotente via email_flow_sends). Respeita EMAIL_FLOW_MODE
 * (off/dryrun/live), então mesmo se registrado por engano fica inerte com off.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>` (padrão dos crons).
 * Gates: CRON_DISABLED_V2=true OU LRP_V2!=true → 200 skipped, sem tocar no DB.
 */

import { NextRequest, NextResponse } from "next/server"

import { runNewSubscriberFlow, getFlowMode } from "@/lib/email/flow"

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
  if (auth !== `Bearer ${expected}` && request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  if (process.env.CRON_DISABLED_V2 === "true" || process.env.LRP_V2 !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: process.env.CRON_DISABLED_V2 === "true" ? "CRON_DISABLED_V2=true" : "LRP_V2!=true",
    })
  }

  // Gate extra do próprio fluxo: mode 'off' = inerte (não percorre nada).
  if (getFlowMode() === "off") {
    return NextResponse.json({ ok: true, skipped: true, reason: "EMAIL_FLOW_MODE=off" })
  }

  const summary = await runNewSubscriberFlow()
  return NextResponse.json({ ok: true, ...summary })
}
