import { createServiceClient } from "@/lib/supabase/server"
import type { EmailSegment } from "./schema"

export interface CampaignRow {
  id: string
  subject: string
  body: string
  from_label: string | null
  segment: EmailSegment
  status: "draft" | "sending" | "sent" | "failed"
  total: number
  sent_count: number
  delivered_count: number
  error_count: number
  created_at: string
  sent_at: string | null
}

export interface RecipientRow {
  id: string
  campaign_id: string
  member_id: string | null
  email: string
  status: "queued" | "sent" | "delivered" | "bounced" | "complained" | "failed"
  resend_id: string | null
  error: string | null
  updated_at: string
}

export interface SegmentMember {
  id: string
  email: string
  name: string | null
}

// O enum `subscription_status_v2` só tem: pending | paid | cancelled.
// Passar valores fora do enum (ex.: "canceled" com 1 L, "expired") faz o Postgres
// REJEITAR a query inteira (invalid input value for enum) → o segmento "Cancelados"
// retornava 0 mesmo havendo cancelados. Usar só o label válido.
const CANCELED_STATUSES = ["cancelled"]

function applySegment<T>(
  query: T & { eq: (c: string, v: string) => T; in: (c: string, v: string[]) => T },
  segment: EmailSegment,
): T {
  if (segment === "active") return query.eq("subscription_status", "paid")
  if (segment === "pending") return query.eq("subscription_status", "pending")
  if (segment === "canceled") return query.in("subscription_status", CANCELED_STATUSES)
  return query // 'all'
}

/** Membros do segmento, com e-mail preenchido. */
export async function resolveSegmentMembers(segment: EmailSegment): Promise<SegmentMember[]> {
  const supabase = createServiceClient()
  let q = supabase
    .from("members")
    .select("id, email, name")
    .not("email", "is", null)
    .neq("email", "")
  q = applySegment(q as never, segment) as never
  const { data, error } = await q
  if (error) {
    console.error("[resolveSegmentMembers]", error)
    return []
  }
  // dedup por e-mail (case-insensitive)
  const seen = new Set<string>()
  const out: SegmentMember[] = []
  for (const m of (data || []) as SegmentMember[]) {
    const key = m.email.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ id: m.id, email: m.email.trim(), name: m.name })
  }
  return out
}

/** Contagem de destinatários do segmento (pra mostrar antes do envio). */
export async function countSegment(segment: EmailSegment): Promise<number> {
  const members = await resolveSegmentMembers(segment)
  return members.length
}

export async function listCampaigns(): Promise<CampaignRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) {
    console.error("[listCampaigns]", error)
    return []
  }
  return (data || []) as CampaignRow[]
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle()
  return (data as CampaignRow) || null
}

export async function getCampaignRecipients(id: string): Promise<RecipientRow[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("email_campaign_recipients")
    .select("*")
    .eq("campaign_id", id)
    .order("updated_at", { ascending: false })
    .limit(1000)
  return (data || []) as RecipientRow[]
}
