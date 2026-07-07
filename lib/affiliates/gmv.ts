import { createServiceClient } from "@/lib/supabase/server"
import {
  affiliateTierPct,
  AFF_PERPETUAL_UNLOCK,
  AFF_TIER_2_MIN,
} from "@/lib/commissions-v2/simulate"

/**
 * F-V35 fase 2 — GMV mensal por afiliado + faixa + status Experience.
 *
 * GMV do mês = soma do valor das vendas atribuídas ao afiliado naquele mês,
 * EXCLUINDO autocompra (não conta pra faixa nem comissão). Fonte: affiliate_sales.
 *
 * Só leitura/agregação — não grava nem paga nada.
 */

export const EXPERIENCE_THRESHOLD = AFF_PERPETUAL_UNLOCK // R$50k GMV no mês

export interface AffiliateGmvRow {
  affiliate_member_id: string
  name: string | null
  ref_code: string | null
  gmv: number
  sales_count: number
  tier_pct: number
  experience: boolean
}

/** 'YYYY-MM-01' do mês atual (ou de `d`). */
export function currentReferenceMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

/** GMV de UM afiliado num mês (exclui autocompra). */
export async function getAffiliateMonthlyGmv(
  affiliateMemberId: string,
  referenceMonth: string,
): Promise<{ gmv: number; salesCount: number }> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("affiliate_sales")
    .select("gross_amount")
    .eq("affiliate_member_id", affiliateMemberId)
    .eq("reference_month", referenceMonth)
    .eq("is_self_purchase", false)
  if (error) {
    console.error("[gmv] getAffiliateMonthlyGmv", error)
    return { gmv: 0, salesCount: 0 }
  }
  const rows = (data || []) as Array<{ gross_amount: number | null }>
  const gmv = rows.reduce((s, r) => s + Number(r.gross_amount ?? 0), 0)
  return { gmv: Math.round(gmv * 100) / 100, salesCount: rows.length }
}

/**
 * GMV de TODOS os afiliados com venda num mês (pro painel admin).
 * Agrega em memória — o volume por mês é pequeno o suficiente.
 */
export async function listAffiliatesGmvForMonth(referenceMonth: string): Promise<AffiliateGmvRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("affiliate_sales")
    .select("affiliate_member_id, gross_amount, members!affiliate_member_id(name, ref_code)")
    .eq("reference_month", referenceMonth)
    .eq("is_self_purchase", false)
  if (error) {
    console.error("[gmv] listAffiliatesGmvForMonth", error)
    return []
  }

  type Row = {
    affiliate_member_id: string
    gross_amount: number | null
    members: { name: string | null; ref_code: string | null } | { name: string | null; ref_code: string | null }[] | null
  }
  const byAffiliate = new Map<string, AffiliateGmvRow>()
  for (const r of (data || []) as Row[]) {
    const m = Array.isArray(r.members) ? r.members[0] : r.members
    const cur = byAffiliate.get(r.affiliate_member_id) ?? {
      affiliate_member_id: r.affiliate_member_id,
      name: m?.name ?? null,
      ref_code: m?.ref_code ?? null,
      gmv: 0,
      sales_count: 0,
      tier_pct: 0,
      experience: false,
    }
    cur.gmv = Math.round((cur.gmv + Number(r.gross_amount ?? 0)) * 100) / 100
    cur.sales_count += 1
    byAffiliate.set(r.affiliate_member_id, cur)
  }

  const rows = Array.from(byAffiliate.values())
  for (const row of rows) {
    row.tier_pct = affiliateTierPct(row.gmv)
    row.experience = row.gmv > EXPERIENCE_THRESHOLD
  }
  return rows.sort((a, b) => b.gmv - a.gmv)
}

/**
 * Originador já destravou a perpétua? (bateu >= 50k de GMV em ALGUM mês).
 * A regra de decaimento (3 meses sem venda) entra na fase 3 (pagamento).
 */
export async function hasUnlockedPerpetual(affiliateMemberId: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("affiliate_sales")
    .select("reference_month, gross_amount")
    .eq("affiliate_member_id", affiliateMemberId)
    .eq("is_self_purchase", false)
  if (error || !data) return false
  const byMonth = new Map<string, number>()
  for (const r of data as Array<{ reference_month: string; gross_amount: number | null }>) {
    byMonth.set(r.reference_month, (byMonth.get(r.reference_month) ?? 0) + Number(r.gross_amount ?? 0))
  }
  return Array.from(byMonth.values()).some((total) => total >= AFF_PERPETUAL_UNLOCK)
}

export { AFF_TIER_2_MIN }
