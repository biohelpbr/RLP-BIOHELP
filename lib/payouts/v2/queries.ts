import { createServiceClient } from "@/lib/supabase/server"
import type { PayoutMethod } from "./schema"

export type PayoutRequestRow = {
  id: string
  member_id: string
  amount: number
  status: string
  payout_method: PayoutMethod | null
  created_at: string
  updated_at: string | null
}

export type MemberBalance = {
  total_earned: number
  total_withdrawn: number
  pending_balance: number
  available_balance: number
  available_for_withdrawal: number
}

const ZERO_BALANCE: MemberBalance = {
  total_earned: 0,
  total_withdrawn: 0,
  pending_balance: 0,
  available_balance: 0,
  available_for_withdrawal: 0,
}

export async function getMemberBalance(memberId: string): Promise<MemberBalance> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .rpc("get_available_balance", { p_member_id: memberId })

  if (error) {
    console.error("[getMemberBalance]", error)
    return ZERO_BALANCE
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return ZERO_BALANCE

  return {
    total_earned: Number(row.total_earned ?? 0),
    total_withdrawn: Number(row.total_withdrawn ?? 0),
    pending_balance: Number(row.pending_balance ?? 0),
    available_balance: Number(row.available_balance ?? 0),
    available_for_withdrawal: Number(row.available_for_withdrawal ?? 0),
  }
}

export async function listMemberPayouts(memberId: string): Promise<PayoutRequestRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("payout_requests")
    .select("id, member_id, amount, status, payout_method, created_at, updated_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[listMemberPayouts]", error)
    return []
  }
  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount ?? 0),
  })) as PayoutRequestRow[]
}
