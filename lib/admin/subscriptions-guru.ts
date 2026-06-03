import { createServiceClient } from "@/lib/supabase/server"

/**
 * Dados de assinaturas (canal Guru) para o painel admin.
 *
 * Pedido call BioHelp&FlowCode 03/06:
 *   (1) ver assinaturas/cancelamentos POR DIA;
 *   (3) repropor /admin/orders lendo o Guru (canal de pagamento real) em vez da
 *       Shopify — orders/paid nunca popula neste modelo de negócio.
 *
 * Fonte: view `admin_subscription_events` (guru_webhook_events achatado, já SEM
 * o lixo do teste de carga). Volume real é pequeno (~centenas), então agregamos
 * em JS — mesmo padrão de lib/admin/growth.ts.
 */

export type SubsDailyRow = {
  day: string // 'YYYY-MM-DD'
  activations: number
  cancellations: number
}

export type SubsRecentEvent = {
  id: string
  receivedAt: string
  kind: string // business_kind: ativacao | cancelamento | expiracao | iniciada | ...
  email: string | null
  name: string | null
  ok: boolean
  error: string | null
}

export type SubscriptionsGuruData = {
  /** Snapshot atual (fonte: members.subscription_status). */
  now: { active: number; pending: number; cancelled: number }
  /** Janela móvel de 30 dias (fonte: eventos Guru). */
  last30: { activations: number; cancellations: number }
  /** Série diária dos últimos 30 dias, mais recente primeiro. */
  daily: SubsDailyRow[]
  /** Últimos eventos relevantes (ativação/cancelamento/expiração). */
  recent: SubsRecentEvent[]
}

const DAYS_WINDOW = 30
const RECENT_LIMIT = 30

const ZERO: SubscriptionsGuruData = {
  now: { active: 0, pending: 0, cancelled: 0 },
  last30: { activations: 0, cancellations: 0 },
  daily: [],
  recent: [],
}

export async function getSubscriptionsGuruData(): Promise<SubscriptionsGuruData> {
  const supabase = createServiceClient()
  const windowStart = daysAgoISO(DAYS_WINDOW)

  const [membersRes, eventsRes] = await Promise.all([
    supabase.from("members").select("subscription_status"),
    supabase
      .from("admin_subscription_events")
      .select("id, received_at, business_kind, email, subscriber_name, error")
      .gte("received_at", windowStart)
      .order("received_at", { ascending: false }),
  ])

  if (membersRes.error || eventsRes.error) {
    console.error("[subscriptions-guru]", {
      members: membersRes.error,
      events: eventsRes.error,
    })
    return ZERO
  }

  // Snapshot atual a partir de members (fonte de verdade de status — F-V03).
  const now = { active: 0, pending: 0, cancelled: 0 }
  for (const m of membersRes.data ?? []) {
    const s = (m.subscription_status as string | null) ?? "pending"
    if (s === "paid") now.active++
    else if (s === "pending") now.pending++
    else if (s === "cancelled") now.cancelled++
  }

  // Série diária + recentes a partir dos eventos Guru.
  const days = lastNDays(DAYS_WINDOW)
  const byDay = new Map<string, SubsDailyRow>()
  for (const d of days) byDay.set(d, { day: d, activations: 0, cancellations: 0 })

  let activations30 = 0
  let cancellations30 = 0

  const events = eventsRes.data ?? []
  for (const e of events) {
    const day = (e.received_at as string).slice(0, 10)
    const row = byDay.get(day)
    const kind = e.business_kind as string
    const ok = e.error == null
    // Ativação só conta se processou sem erro (ativação real, não tentativa).
    if (kind === "ativacao" && ok) {
      if (row) row.activations++
      activations30++
    } else if (kind === "cancelamento") {
      if (row) row.cancellations++
      cancellations30++
    }
  }

  const daily = days
    .map((d) => byDay.get(d)!)
    .sort((a, b) => (a.day < b.day ? 1 : -1))

  const recent: SubsRecentEvent[] = events
    .filter((e) =>
      ["ativacao", "cancelamento", "expiracao"].includes(e.business_kind as string)
    )
    .slice(0, RECENT_LIMIT)
    .map((e) => ({
      id: e.id as string,
      receivedAt: e.received_at as string,
      kind: e.business_kind as string,
      email: (e.email as string | null) ?? null,
      name: (e.subscriber_name as string | null) ?? null,
      ok: e.error == null,
      error: (e.error as string | null) ?? null,
    }))

  return {
    now,
    last30: { activations: activations30, cancellations: cancellations30 },
    daily,
    recent,
  }
}

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function lastNDays(n: number): string[] {
  // Dias em UTC para casar com received_at.slice(0,10) (timestamptz → UTC).
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
