import { createServiceClient } from "@/lib/supabase/server"

export type EventBucket = "current" | "past" | "future"

export interface EventRow {
  id: string
  name: string
  description: string | null
  slug: string
  start_at: string
  end_at: string
  mode: "online" | "presencial" | "hibrido"
  location: string | null
  redirect_url: string | null
  cost: number
  status: "draft" | "published" | "archived"
  created_at: string
}

export interface EventWithStats extends EventRow {
  visits_count: number
  attendances_count: number
  conversions_count: number
  eligible_product_ids: string[]
}

export interface EventFunnel {
  event: EventRow
  visits: number
  unique_visitors: number
  attendances: number
  conversions: number
  eligible_product_ids: string[]
}

function bucketize(ev: EventRow): EventBucket {
  const now = Date.now()
  const start = new Date(ev.start_at).getTime()
  const end = new Date(ev.end_at).getTime()
  if (end < now) return "past"
  if (start > now) return "future"
  return "current"
}

export async function listEvents(): Promise<{
  current: EventWithStats[]
  past: EventWithStats[]
  future: EventWithStats[]
}> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: false })

  if (error) {
    console.error("[listEvents]", error)
    return { current: [], past: [], future: [] }
  }

  const events = (data || []) as EventRow[]
  if (events.length === 0) return { current: [], past: [], future: [] }

  const ids = events.map((e) => e.id)

  const [{ data: visits }, { data: atts }, { data: products }, { data: conversions }] =
    await Promise.all([
      supabase.from("event_visits").select("event_id").in("event_id", ids),
      supabase
        .from("event_attendances")
        .select("event_id, attended")
        .in("event_id", ids)
        .eq("attended", true),
      supabase.from("event_eligible_products").select("event_id, shopify_product_id").in("event_id", ids),
      supabase
        .from("members")
        .select("id, tags")
        .filter("tags", "cs", JSON.stringify([])), // placeholder; refinamos abaixo por evento
    ])

  // count visits / attendances by event
  const visitMap = new Map<string, number>()
  ;(visits || []).forEach((v: { event_id: string }) => {
    visitMap.set(v.event_id, (visitMap.get(v.event_id) || 0) + 1)
  })

  const attMap = new Map<string, number>()
  ;(atts || []).forEach((a: { event_id: string }) => {
    attMap.set(a.event_id, (attMap.get(a.event_id) || 0) + 1)
  })

  const productMap = new Map<string, string[]>()
  ;(products || []).forEach((p: { event_id: string; shopify_product_id: string }) => {
    const arr = productMap.get(p.event_id) || []
    arr.push(p.shopify_product_id)
    productMap.set(p.event_id, arr)
  })

  // Conversions: members.tags contains "evento:<slug>"
  const conversionMap = new Map<string, number>()
  for (const ev of events) {
    const tag = `evento:${ev.slug}`
    const { count } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .filter("tags", "cs", JSON.stringify([tag]))
    conversionMap.set(ev.id, count || 0)
  }

  const enriched: EventWithStats[] = events.map((ev) => ({
    ...ev,
    visits_count: visitMap.get(ev.id) || 0,
    attendances_count: attMap.get(ev.id) || 0,
    conversions_count: conversionMap.get(ev.id) || 0,
    eligible_product_ids: productMap.get(ev.id) || [],
  }))

  const out: { current: EventWithStats[]; past: EventWithStats[]; future: EventWithStats[] } = {
    current: [],
    past: [],
    future: [],
  }
  for (const ev of enriched) out[bucketize(ev)].push(ev)
  return out
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle()
  return (data as EventRow) || null
}

export async function getEventById(id: string): Promise<EventFunnel | null> {
  const supabase = createServiceClient()
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle()
  if (!event) return null
  const ev = event as EventRow

  const [{ count: visits }, { data: visitMembers }, { count: attendances }, { data: products }] =
    await Promise.all([
      supabase.from("event_visits").select("id", { count: "exact", head: true }).eq("event_id", id),
      supabase.from("event_visits").select("member_id").eq("event_id", id).not("member_id", "is", null),
      supabase
        .from("event_attendances")
        .select("event_id", { count: "exact", head: true })
        .eq("event_id", id)
        .eq("attended", true),
      supabase.from("event_eligible_products").select("shopify_product_id").eq("event_id", id),
    ])

  const tag = `evento:${ev.slug}`
  const { count: conversions } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .filter("tags", "cs", JSON.stringify([tag]))

  const uniqueVisitors = new Set((visitMembers || []).map((v: { member_id: string | null }) => v.member_id).filter(Boolean)).size

  return {
    event: ev,
    visits: visits || 0,
    unique_visitors: uniqueVisitors,
    attendances: attendances || 0,
    conversions: conversions || 0,
    eligible_product_ids: (products || []).map((p: { shopify_product_id: string }) => p.shopify_product_id),
  }
}

/**
 * Atribuição reversa pra hook de webhook.
 * Dado um email do comprador + product_ids da ordem, retorna o evento ativo
 * mais recente que casa com:
 *  - period: now BETWEEN start_at AND end_at
 *  - product elegível
 *  - membro tem visita nos últimos 7 dias
 *
 * Cookie cross-site é frágil em webhook (Shopify → server), então usamos
 * event_visits.member_id como fonte de verdade.
 */
/**
 * Pega o próximo evento publicado (em andamento ou futuro mais próximo).
 * Usado no `/dashboard` do membro pra preencher o card "Próximo evento".
 * Retorna null se não houver nenhum publicado em andamento ou futuro.
 */
export async function getNextPublishedEvent(): Promise<EventRow | null> {
  const supabase = createServiceClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("end_at", nowIso) // exclui eventos já encerrados
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[getNextPublishedEvent]", error)
    return null
  }
  return (data as EventRow) || null
}

export async function findAttributableEventForOrder(params: {
  memberId: string
  productIds: string[]
}): Promise<EventRow | null> {
  if (params.productIds.length === 0) return null
  const supabase = createServiceClient()

  // 1. Eventos ativos com produto elegível.
  // Em vez de embed (que o supabase-js retorna como array), fazemos 2-step.
  const { data: eligibleRows } = await supabase
    .from("event_eligible_products")
    .select("event_id")
    .in("shopify_product_id", params.productIds)

  if (!eligibleRows || eligibleRows.length === 0) return null

  const eligibleIds = Array.from(
    new Set((eligibleRows as Array<{ event_id: string }>).map((r) => r.event_id)),
  )

  const { data: eventsRaw } = await supabase
    .from("events")
    .select("*")
    .in("id", eligibleIds)
    .eq("status", "published")

  if (!eventsRaw || eventsRaw.length === 0) return null

  const now = new Date()
  const candidateEvents = (eventsRaw as EventRow[]).filter(
    (e) => new Date(e.start_at) <= now && now <= new Date(e.end_at),
  )

  if (candidateEvents.length === 0) return null

  const candidateIds = candidateEvents.map((e) => e.id)

  // 2. Visita do membro nos últimos 7 dias em algum desses eventos.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: recentVisit } = await supabase
    .from("event_visits")
    .select("event_id, visited_at")
    .eq("member_id", params.memberId)
    .in("event_id", candidateIds)
    .gte("visited_at", sevenDaysAgo)
    .order("visited_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentVisit) {
    return candidateEvents.find((e) => e.id === recentVisit.event_id) || null
  }

  // 3. Sem visita rastreada — fallback: pega o evento ativo mais recente.
  return candidateEvents.sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
  )[0]
}
