import { NextRequest, NextResponse } from "next/server"
import { isCurrentUserAdmin } from "@/lib/supabase/server"
import { transferPayout } from "@/lib/payouts/v2/transfer"

export const dynamic = "force-dynamic"

/**
 * F-V07b: POST /api/payouts/cashin/transfer/[id]
 *
 * Admin-only. Dispara a transferência Cashin pra um payout pending.
 * Resposta:
 *   200: {ok:true, transactionId, status}
 *   400: erro de validação (status inválido, método inválido, pix_key ausente)
 *   401/403: não autorizado
 *   503: flag LRP_V2_CASHIN_LIVE OFF
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.LRP_V2_CASHIN_LIVE !== "true") {
    return NextResponse.json(
      { ok: false, error: "Cashin live disabled" },
      { status: 503 }
    )
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: "admin only" },
      { status: 403 }
    )
  }

  const { id } = await context.params
  const result = await transferPayout(id)
  if (!result.ok) {
    const status = result.code === "INVALID_STATE" ? 400 : 500
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
