import { createServiceClient } from "@/lib/supabase/server"

/**
 * F-V36 — painel de entregas do fluxo (e-mail + WhatsApp).
 * Lê email_flow_sends (canal, status, passo, membro, erro, data). Só leitura.
 */

export type Channel = "email" | "whatsapp"
export type SendStatus = "sent" | "failed" | "skipped" | "dryrun"

export interface DeliveryRow {
  id: string
  channel: string
  step_order: number
  status: string
  email: string | null
  error: string | null
  sent_at: string
  member_name: string | null
}

export interface ChannelCounts {
  sent: number
  failed: number
  skipped: number
  dryrun: number
  total: number
}

export interface DeliveriesData {
  email: ChannelCounts
  whatsapp: ChannelCounts
  recent: DeliveryRow[]
}

const emptyCounts = (): ChannelCounts => ({ sent: 0, failed: 0, skipped: 0, dryrun: 0, total: 0 })

export async function getFlowDeliveries(limit = 100): Promise<DeliveriesData> {
  const supabase = createServiceClient()

  // Agregados por canal/status (colunas leves — agregação em memória).
  const { data: agg } = await supabase.from("email_flow_sends").select("channel, status")
  const email = emptyCounts()
  const whatsapp = emptyCounts()
  for (const r of (agg || []) as Array<{ channel: string; status: string }>) {
    const bucket = r.channel === "whatsapp" ? whatsapp : email
    if (r.status === "sent" || r.status === "failed" || r.status === "skipped" || r.status === "dryrun") {
      bucket[r.status] += 1
    }
    bucket.total += 1
  }

  // Recentes com nome do membro (member_id → members, FK única).
  const { data: recentData } = await supabase
    .from("email_flow_sends")
    .select("id, channel, step_order, status, email, error, sent_at, members(name)")
    .order("sent_at", { ascending: false })
    .limit(limit)

  const recent: DeliveryRow[] = ((recentData || []) as Array<Record<string, unknown>>).map((r) => {
    const m = r.members as { name: string | null } | { name: string | null }[] | null
    const member = Array.isArray(m) ? m[0] : m
    return {
      id: String(r.id),
      channel: String(r.channel ?? "email"),
      step_order: Number(r.step_order ?? 0),
      status: String(r.status ?? ""),
      email: (r.email as string | null) ?? null,
      error: (r.error as string | null) ?? null,
      sent_at: String(r.sent_at ?? ""),
      member_name: member?.name ?? null,
    }
  })

  return { email, whatsapp, recent }
}
