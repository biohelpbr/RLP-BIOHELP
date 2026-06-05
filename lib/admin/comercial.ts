import { createServiceClient } from "@/lib/supabase/server"
import { isTestIdentity } from "@/lib/admin/test-data"

/**
 * W5 (call 05/06, pedido Leo) — visão do time comercial.
 * Por vendedor (qualquer member com indicados N1 — começando pela turma de
 * vendas BH00028–BH00031), separa os indicados em Pendentes
 * (subscription_status='pending') vs Vendas efetivadas ('paid'), com totais.
 *
 * Mesma população da view member_active_affiliate_count (sponsor_id = vendedor),
 * mas trazendo a lista nominal. Members de teste (QA/E2E/equipe) ficam fora.
 */

export type ComercialReferral = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type ComercialSeller = {
  id: string
  refCode: string
  name: string
  email: string
  pending: ComercialReferral[]
  paid: ComercialReferral[]
  cancelled: number
}

export type ComercialData = {
  sellers: ComercialSeller[]
  totals: { pending: number; paid: number }
}

/** Turma de vendas distribuída (call 05/06) — aparecem mesmo com 0 indicados. */
const SALES_TEAM_REF_CODES = new Set(["BH00028", "BH00029", "BH00030", "BH00031"])

export async function getComercialData(): Promise<ComercialData> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("members")
    .select("id, name, email, ref_code, sponsor_id, subscription_status, created_at")

  if (error) {
    console.error("[admin.comercial]", error)
    return { sellers: [], totals: { pending: 0, paid: 0 } }
  }

  const all = data ?? []
  const byId = new Map(all.map((m) => [m.id as string, m]))

  type Bucket = { pending: ComercialReferral[]; paid: ComercialReferral[]; cancelled: number }
  const buckets = new Map<string, Bucket>()
  const bucketFor = (sellerId: string): Bucket => {
    let b = buckets.get(sellerId)
    if (!b) {
      b = { pending: [], paid: [], cancelled: 0 }
      buckets.set(sellerId, b)
    }
    return b
  }

  for (const m of all) {
    const sponsorId = m.sponsor_id as string | null
    if (!sponsorId || !byId.has(sponsorId)) continue
    // Indicados de teste não contam como venda/pendência (mesmo critério W1).
    if (isTestIdentity(m.email as string | null, m.name as string | null)) continue
    const ref: ComercialReferral = {
      id: m.id as string,
      name: (m.name as string) ?? "",
      email: (m.email as string) ?? "",
      createdAt: (m.created_at as string) ?? "",
    }
    const b = bucketFor(sponsorId)
    const status = (m.subscription_status as string | null) ?? "pending"
    if (status === "paid") b.paid.push(ref)
    else if (status === "pending") b.pending.push(ref)
    else b.cancelled++
  }

  const sellers: ComercialSeller[] = []
  for (const m of all) {
    const id = m.id as string
    const refCode = (m.ref_code as string) ?? ""
    const b = buckets.get(id)
    const isSalesTeam = SALES_TEAM_REF_CODES.has(refCode)
    if (!b && !isSalesTeam) continue
    sellers.push({
      id,
      refCode,
      name: (m.name as string) ?? "",
      email: (m.email as string) ?? "",
      pending: (b?.pending ?? []).sort(byNewest),
      paid: (b?.paid ?? []).sort(byNewest),
      cancelled: b?.cancelled ?? 0,
    })
  }

  // Turma de vendas primeiro (por ref_code), depois demais por nº de vendas.
  sellers.sort((a, b) => {
    const aTeam = SALES_TEAM_REF_CODES.has(a.refCode)
    const bTeam = SALES_TEAM_REF_CODES.has(b.refCode)
    if (aTeam !== bTeam) return aTeam ? -1 : 1
    if (aTeam && bTeam) return a.refCode.localeCompare(b.refCode)
    return b.paid.length - a.paid.length || b.pending.length - a.pending.length
  })

  const totals = sellers.reduce(
    (acc, s) => {
      acc.pending += s.pending.length
      acc.paid += s.paid.length
      return acc
    },
    { pending: 0, paid: 0 },
  )

  return { sellers, totals }
}

function byNewest(a: ComercialReferral, b: ComercialReferral): number {
  return a.createdAt < b.createdAt ? 1 : -1
}
