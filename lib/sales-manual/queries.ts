import { createServiceClient } from "@/lib/supabase/server"

export type MemberLead = {
  id: string
  member_id: string
  name: string
  contact: string
  target_product: string | null
  note: string | null
  last_contact_at: string
  created_at: string
}

export type MemberSale = {
  id: string
  member_id: string
  customer_name: string
  product_name: string | null
  qty: number
  paid_amount: number
  payment_method: "pix" | "cartao" | "dinheiro" | "transferencia" | "outro"
  sold_at: string
  note: string | null
  created_at: string
}

export type SalesMonthlyStats = {
  salesThisMonth: number
  revenueThisMonth: number
  averageTicket: number
  uniqueCustomersThisMonth: number
}

export async function listLeads(memberId: string): Promise<MemberLead[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_leads")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(200)

  return (data ?? []) as MemberLead[]
}

export async function listSales(memberId: string): Promise<MemberSale[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("member_sales")
    .select("*")
    .eq("member_id", memberId)
    .order("sold_at", { ascending: false })
    .limit(200)

  return (data ?? []) as MemberSale[]
}

export function computeMonthlyStats(sales: MemberSale[]): SalesMonthlyStats {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const inMonth = sales.filter((s) => new Date(s.sold_at) >= monthStart)

  const salesThisMonth = inMonth.length
  const revenueThisMonth = inMonth.reduce((sum, s) => sum + Number(s.paid_amount ?? 0), 0)
  const averageTicket = salesThisMonth > 0 ? revenueThisMonth / salesThisMonth : 0
  const uniqueCustomersThisMonth = new Set(inMonth.map((s) => s.customer_name.trim().toLowerCase())).size

  return {
    salesThisMonth,
    revenueThisMonth,
    averageTicket,
    uniqueCustomersThisMonth,
  }
}

export function splitOpportunities(leads: MemberLead[]) {
  const cutoff = Date.now() - 30 * 86_400_000
  const opportunities: MemberLead[] = []
  const fresh: MemberLead[] = []
  for (const lead of leads) {
    if (Date.parse(lead.last_contact_at) < cutoff) {
      opportunities.push(lead)
    } else {
      fresh.push(lead)
    }
  }
  return { opportunities, fresh }
}
