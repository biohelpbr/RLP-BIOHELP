import { createServiceClient } from "@/lib/supabase/server"

export type GrowthMonthRow = {
  month: string // 'YYYY-MM'
  newMembers: number
  revenue: number
  payouts: number
}

export type GrowthData = {
  history: GrowthMonthRow[]
  projection: GrowthMonthRow[]
}

const MONTHS_HISTORY = 6
const MONTHS_PROJECTION = 3

export async function getGrowthData(): Promise<GrowthData> {
  const supabase = createServiceClient()
  const startDate = monthsAgoStart(MONTHS_HISTORY - 1)

  const [membersRes, salesRes, payoutsRes] = await Promise.all([
    supabase
      .from("members")
      .select("created_at")
      .gte("created_at", startDate),
    supabase
      .from("member_sales")
      .select("paid_amount, sold_at")
      .gte("sold_at", startDate),
    supabase
      .from("payout_requests")
      .select("amount, status, created_at")
      .gte("created_at", startDate),
  ])

  const months = lastNMonths(MONTHS_HISTORY)
  const byMonth = new Map<string, GrowthMonthRow>()
  for (const m of months) {
    byMonth.set(m, { month: m, newMembers: 0, revenue: 0, payouts: 0 })
  }

  for (const m of membersRes.data ?? []) {
    const key = (m.created_at as string).slice(0, 7)
    const row = byMonth.get(key)
    if (row) row.newMembers++
  }
  for (const s of salesRes.data ?? []) {
    const key = (s.sold_at as string).slice(0, 7)
    const row = byMonth.get(key)
    if (row) row.revenue += Number(s.paid_amount ?? 0)
  }
  for (const p of payoutsRes.data ?? []) {
    if (
      p.status === "completed" ||
      p.status === "approved" ||
      p.status === "processing"
    ) {
      const key = (p.created_at as string).slice(0, 7)
      const row = byMonth.get(key)
      if (row) row.payouts += Number(p.amount ?? 0)
    }
  }

  const history = months.map((m) => byMonth.get(m)!)

  // Projeção linear simples — média dos últimos 3 meses (mesmo conceito do
  // mock Loveable, mas sem ranks v1).
  const recent = history.slice(-3)
  const avg = (key: keyof Omit<GrowthMonthRow, "month">) =>
    recent.length === 0
      ? 0
      : recent.reduce((acc, r) => acc + (r[key] as number), 0) / recent.length

  const baseAvg = {
    newMembers: avg("newMembers"),
    revenue: avg("revenue"),
    payouts: avg("payouts"),
  }

  const projection = nextNMonths(MONTHS_PROJECTION).map((month) => ({
    month,
    newMembers: Math.round(baseAvg.newMembers),
    revenue: Math.round(baseAvg.revenue * 100) / 100,
    payouts: Math.round(baseAvg.payouts * 100) / 100,
  }))

  return { history, projection }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function lastNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return out
}

function nextNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)))
  }
  return out
}

function monthsAgoStart(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
