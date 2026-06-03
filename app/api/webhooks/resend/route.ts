/**
 * API: POST /api/webhooks/resend
 * F-V23 — Recebe eventos do Resend (delivered/bounced/complained) e atualiza
 * o status do destinatário em `email_campaign_recipients` (match por resend_id).
 *
 * Assinatura Svix verificada se RESEND_WEBHOOK_SECRET estiver setada.
 * Falha de verificação → 401. Eventos desconhecidos → 200 (ignora, evita retry).
 */
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const EVENT_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
}

function verifySvix(raw: string, req: NextRequest, secret: string): boolean {
  const id = req.headers.get("svix-id")
  const ts = req.headers.get("svix-timestamp")
  const sigHeader = req.headers.get("svix-signature")
  if (!id || !ts || !sigHeader) return false
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
    const expected = crypto
      .createHmac("sha256", key)
      .update(`${id}.${ts}.${raw}`)
      .digest("base64")
    const provided = sigHeader.split(" ").map((s) => s.split(",")[1])
    return provided.some(
      (p) => p && crypto.timingSafeEqual(Buffer.from(p), Buffer.from(expected)),
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (secret && !verifySvix(raw, req, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  let evt: { type?: string; data?: { email_id?: string } }
  try {
    evt = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const status = evt.type ? EVENT_STATUS[evt.type] : undefined
  const emailId = evt.data?.email_id
  if (!status || !emailId) return NextResponse.json({ ok: true }, { status: 200 })

  try {
    const supabase = createServiceClient()
    const { data: rec } = await supabase
      .from("email_campaign_recipients")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("resend_id", emailId)
      .select("campaign_id")
      .maybeSingle()

    // Recalcula os agregados da campanha (delivered = entregues; error = bounce+complain+failed).
    if (rec?.campaign_id) {
      const cid = rec.campaign_id as string
      const [{ count: delivered }, { count: errors }] = await Promise.all([
        supabase
          .from("email_campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("status", "delivered"),
        supabase
          .from("email_campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .in("status", ["bounced", "complained", "failed"]),
      ])
      await supabase
        .from("email_campaigns")
        .update({
          delivered_count: delivered ?? 0,
          error_count: errors ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cid)
    }
  } catch (e) {
    console.error("[webhooks/resend]", e)
    // não derruba o webhook — 200 mesmo em erro interno (evita retry storm)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
