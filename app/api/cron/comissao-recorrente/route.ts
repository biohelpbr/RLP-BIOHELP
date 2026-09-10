/**
 * Cron diário da comissão recorrente de indicação.
 *
 * Vercel Cron chama GET /api/cron/comissao-recorrente
 * (vercel.json: 0 7 * * * = 04:00 BRT).
 *
 * Diário, não mensal: cada assinatura vence no seu próprio dia do mês (quem
 * ativou dia 19 vence dia 19). Um cron mensal atrasaria todo mundo até o dia 1º.
 * A rotina é idempotente por (padrinho, indicado, mês), então rodar todo dia só
 * lança os aniversários que venceram naquele dia.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>` — padrão dos outros crons.
 *
 * Gates: `CRON_DISABLED_V2=true` OU `LRP_V2 !== 'true'` → 200 com skipped=true,
 * sem tocar no banco.
 *
 * `?dry=1` roda sem gravar (útil pra conferir na mão o que entraria).
 */

import { NextRequest, NextResponse } from "next/server"

import { runRecurringCommissions } from "@/lib/commissions-v2/recurring"
import { isV2Enabled } from "@/lib/utils/featureFlags"

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

  if (process.env.CRON_DISABLED_V2 === "true" || !isV2Enabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "cron desabilitado ou LRP_V2 off" })
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1"
  const r = await runRecurringCommissions({ commit: !dry })

  if (!r.ok) {
    console.error("[cron/comissao-recorrente]", r.error)
    return NextResponse.json(r, { status: 500 })
  }

  console.info(
    `[cron/comissao-recorrente] ${r.committed ? "lançou" : "dry-run"}: ${r.rows} linha(s), R$${r.total} em ${r.sponsors} padrinho(s)`,
  )
  return NextResponse.json(r)
}
