import { createServiceClient } from "@/lib/supabase/server"
import { affiliateTierPct } from "@/lib/commissions-v2/simulate"
import { currentReferenceMonth, EXPERIENCE_THRESHOLD } from "./gmv"

/**
 * F-V35 fase 5 — visão do próprio afiliado (lado do membro).
 *
 * Mostra o FATURAMENTO do mês (= GMV, exclui autocompra), a faixa e uma
 * comissão ESTIMADA (faixa × faturamento). A comissão só vira valor a receber
 * no fechamento do mês (lançada no commission_ledger pelo admin) — por isso é
 * "estimada / a apurar". Faturamento ≠ o que a afiliada recebe.
 *
 * Só leitura/agregação — não grava nem paga nada.
 */

export interface AffiliateSelfSale {
  shopify_order_id: string
  customer_email: string
  coupon_code: string
  gross_amount: number
  is_self_purchase: boolean
  created_at: string
}

export interface AffiliateSelfSummary {
  isAffiliate: boolean
  refCode: string | null
  referenceMonth: string
  /** GMV do mês, exceto autocompra — mostrado como "Faturamento". */
  faturamento: number
  salesCount: number
  tierPct: number
  /** faixa × faturamento — estimativa, a apurar no fechamento. */
  estimatedCommission: number
  experience: boolean
  sales: AffiliateSelfSale[]
}

export async function getAffiliateSelfSummary(
  memberId: string,
  refCode: string | null,
  month = currentReferenceMonth(),
): Promise<AffiliateSelfSummary> {
  const base: AffiliateSelfSummary = {
    isAffiliate: false,
    refCode,
    referenceMonth: month,
    faturamento: 0,
    salesCount: 0,
    tierPct: 0,
    estimatedCommission: 0,
    experience: false,
    sales: [],
  }
  if (!refCode?.startsWith("BH")) return base

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("affiliate_sales")
    .select("shopify_order_id, customer_email, coupon_code, gross_amount, is_self_purchase, created_at")
    .eq("affiliate_member_id", memberId)
    .eq("reference_month", month)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[aff-self] getAffiliateSelfSummary", error)
    return { ...base, isAffiliate: true }
  }

  const sales: AffiliateSelfSale[] = (data || []).map((r) => ({
    shopify_order_id: String(r.shopify_order_id),
    customer_email: String(r.customer_email ?? ""),
    coupon_code: String(r.coupon_code ?? ""),
    gross_amount: Number(r.gross_amount ?? 0),
    is_self_purchase: Boolean(r.is_self_purchase),
    created_at: String(r.created_at),
  }))

  const counted = sales.filter((s) => !s.is_self_purchase)
  const faturamento = Math.round(counted.reduce((s, r) => s + r.gross_amount, 0) * 100) / 100
  const tierPct = affiliateTierPct(faturamento)
  const estimatedCommission = Math.round(faturamento * tierPct) / 100

  return {
    isAffiliate: true,
    refCode,
    referenceMonth: month,
    faturamento,
    salesCount: counted.length,
    tierPct,
    estimatedCommission,
    experience: faturamento > EXPERIENCE_THRESHOLD,
    sales,
  }
}
