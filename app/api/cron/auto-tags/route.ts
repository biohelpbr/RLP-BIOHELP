import { NextRequest, NextResponse } from "next/server"
import { recompute } from "@/lib/tags/auto-classifier"

export const dynamic = "force-dynamic"

/**
 * F-V18: GET /api/cron/auto-tags
 *
 * Endpoint chamado pelo Vercel Cron (diário 03:00 UTC — vide vercel.json).
 * Recompute global das tags `auto:lider` / `auto:influenciador` em
 * todos os membros, baseado em `member_active_affiliate_count`.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>`. Sem header ou
 * mismatch → 401. Vercel Cron envia esse header automaticamente
 * quando `CRON_SECRET` está configurada.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET não configurada no ambiente." },
      { status: 500 }
    )
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const result = await recompute()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    console.error("[/api/cron/auto-tags]", err)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
