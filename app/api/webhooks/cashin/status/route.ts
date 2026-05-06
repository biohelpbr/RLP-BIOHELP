import { NextRequest, NextResponse } from "next/server"
import { applyCashinStatusUpdate } from "@/lib/payouts/v2/transfer"

export const dynamic = "force-dynamic"

/**
 * F-V07b: webhook receptor de status Cashin.
 *
 * Sandbox: aceita header `X-Cashin-Token` igual a env `CASHIN_WEBHOOK_TOKEN`.
 * Em prod, doc Cashin pode pedir HMAC — refator quando creds chegarem.
 *
 * Body esperado: `{ transaction_id, status }` onde status ∈ {paid, failed, processing}.
 */
export async function POST(request: NextRequest) {
  if (process.env.LRP_V2_CASHIN_LIVE !== "true") {
    return NextResponse.json(
      { ok: false, error: "Cashin live disabled" },
      { status: 503 }
    )
  }

  // Auth simples (sandbox): token compartilhado em header
  const expected = process.env.CASHIN_WEBHOOK_TOKEN
  const provided = request.headers.get("x-cashin-token")
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    )
  }

  const transactionId =
    typeof body.transaction_id === "string"
      ? body.transaction_id
      : typeof body.id === "string"
      ? body.id
      : null
  const rawStatus = typeof body.status === "string" ? body.status : null

  if (!transactionId || !rawStatus) {
    return NextResponse.json(
      { ok: false, error: "transaction_id and status required" },
      { status: 400 }
    )
  }

  const normalized: "paid" | "failed" | "processing" =
    rawStatus === "paid" || rawStatus === "completed"
      ? "paid"
      : rawStatus === "failed" || rawStatus === "rejected"
      ? "failed"
      : "processing"

  const result = await applyCashinStatusUpdate({
    transactionId,
    status: normalized,
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
