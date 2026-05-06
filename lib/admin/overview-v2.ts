import { createServiceClient } from "@/lib/supabase/server"

export type AdminOverviewV2 = {
  members: {
    total: number
    active: number
    pending: number
    inactive: number
    newThisMonth: number
    breakdownByStatus: { status: string; count: number }[]
  }
  payouts: {
    pendingCount: number
    pendingAmount: number
    completedAmount: number
  }
  sales: {
    salesThisMonth: number
    revenueThisMonth: number
  }
  tags: {
    autoLider: number
    autoInfluenciador: number
    founder: number
  }
}

const ZERO: AdminOverviewV2 = {
  members: {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
    newThisMonth: 0,
    breakdownByStatus: [],
  },
  payouts: { pendingCount: 0, pendingAmount: 0, completedAmount: 0 },
  sales: { salesThisMonth: 0, revenueThisMonth: 0 },
  tags: { autoLider: 0, autoInfluenciador: 0, founder: 0 },
}

export async function getAdminOverviewV2(): Promise<AdminOverviewV2> {
  const supabase = createServiceClient()

  const [membersRes, payoutsRes, salesRes, tagsRes] = await Promise.all([
    supabase.from("members").select("status, created_at"),
    supabase
      .from("payout_requests")
      .select("status, amount"),
    supabase
      .from("member_sales")
      .select("paid_amount, sold_at")
      .gte("sold_at", monthStartDate()),
    supabase.from("members").select("tags"),
  ])

  if (membersRes.error || payoutsRes.error || salesRes.error || tagsRes.error) {
    console.error("[overview-v2]", {
      members: membersRes.error,
      payouts: payoutsRes.error,
      sales: salesRes.error,
      tags: tagsRes.error,
    })
    return ZERO
  }

  const members = membersRes.data ?? []
  const monthStart = monthStartDate()

  const breakdown = new Map<string, number>()
  let active = 0
  let pending = 0
  let inactive = 0
  let newThisMonth = 0
  for (const m of members) {
    const s = (m.status as string | null) ?? "unknown"
    breakdown.set(s, (breakdown.get(s) ?? 0) + 1)
    if (s === "active") active++
    else if (s === "pending") pending++
    else if (s === "inactive") inactive++
    if ((m.created_at as string) >= monthStart) newThisMonth++
  }

  const payouts = payoutsRes.data ?? []
  let pendingCount = 0
  let pendingAmount = 0
  let completedAmount = 0
  for (const p of payouts) {
    const amt = Number(p.amount ?? 0)
    if (
      p.status === "pending" ||
      p.status === "awaiting_document" ||
      p.status === "under_review"
    ) {
      pendingCount++
      pendingAmount += amt
    } else if (p.status === "completed" || p.status === "approved") {
      completedAmount += amt
    }
  }

  const sales = salesRes.data ?? []
  const salesThisMonth = sales.length
  const revenueThisMonth = sales.reduce(
    (acc, s) => acc + Number(s.paid_amount ?? 0),
    0
  )

  const tagRows = tagsRes.data ?? []
  let autoLider = 0
  let autoInfluenciador = 0
  let founder = 0
  for (const r of tagRows) {
    const tags = Array.isArray(r.tags) ? (r.tags as string[]) : []
    if (tags.includes("auto:lider")) autoLider++
    if (tags.includes("auto:influenciador")) autoInfluenciador++
    if (tags.includes("FOUNDER") || tags.includes("manual:founder")) founder++
  }

  return {
    members: {
      total: members.length,
      active,
      pending,
      inactive,
      newThisMonth,
      breakdownByStatus: Array.from(breakdown.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    },
    payouts: { pendingCount, pendingAmount, completedAmount },
    sales: { salesThisMonth, revenueThisMonth },
    tags: { autoLider, autoInfluenciador, founder },
  }
}

function monthStartDate(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
