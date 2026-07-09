"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import { computeAffiliateCommissions, type AffiliateCommissionSummary } from "./commission"
import {
  bulkCreateAffiliateCoupons,
  applyAffiliateCollectionToPriceRule,
  type BulkCouponResult,
  type FixPriceRuleResult,
} from "@/lib/shopify/affiliate-coupons"

/**
 * F-V35 — cria/simula os cupons de afiliado no Shopify em massa.
 * `execute=false` = dry-run (não toca no Shopify). Só admin.
 */
export async function bulkAffiliateCouponsAction(input: {
  scope: "all" | "active"
  execute: boolean
  limit?: number
}): Promise<{ ok: true; data: BulkCouponResult } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await bulkCreateAffiliateCoupons(input)
  if (data.error && !data.alreadyExists && !data.executed) return { ok: false, error: data.error }
  return { ok: true, data }
}

/**
 * F-V35 — corrige a price rule existente pra "Desconto de produto" na coleção
 * Loja Biohelp (conserta todos os cupons de uma vez). Só admin.
 */
export async function applyAffiliateCollectionAction(): Promise<
  { ok: true; data: FixPriceRuleResult } | { ok: false; error: string }
> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await applyAffiliateCollectionToPriceRule()
  if (!data.ok) return { ok: false, error: data.error ?? "falha ao atualizar a price rule" }
  return { ok: true, data }
}

type MemberRef = { ref_code: string | null; name: string | null }

export interface CustomerLookupResult {
  email: string
  originador: MemberRef | null
  sales: Array<{
    shopify_order_id: string
    reference_month: string
    gross_amount: number
    is_self_purchase: boolean
    coupon_code: string
    affiliate: MemberRef | null
  }>
}

/**
 * F-V35 fase 4 — consulta Originador + histórico de vendas (Atual) de um cliente.
 */
export async function lookupCustomerAffiliates(
  emailRaw: string,
): Promise<{ ok: true; data: CustomerLookupResult } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const email = (emailRaw || "").toLowerCase().trim()
  if (!email.includes("@")) return { ok: false, error: "Informe um e-mail válido." }

  const supabase = createServiceClient()
  const { data: origin } = await supabase
    .from("affiliate_customer_origin")
    .select("originador:members!originador_member_id(ref_code, name)")
    .eq("customer_email", email)
    .maybeSingle()

  const { data: salesData } = await supabase
    .from("affiliate_sales")
    .select("shopify_order_id, reference_month, gross_amount, is_self_purchase, coupon_code, affiliate:members!affiliate_member_id(ref_code, name)")
    .eq("customer_email", email)
    .order("reference_month", { ascending: false })
    .limit(100)

  const one = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

  const sales = ((salesData || []) as Array<Record<string, unknown>>).map((r) => ({
    shopify_order_id: String(r.shopify_order_id),
    reference_month: String(r.reference_month),
    gross_amount: Number(r.gross_amount ?? 0),
    is_self_purchase: Boolean(r.is_self_purchase),
    coupon_code: String(r.coupon_code ?? ""),
    affiliate: one(r.affiliate as MemberRef | MemberRef[] | null),
  }))

  return {
    ok: true,
    data: {
      email,
      originador: one((origin as { originador?: MemberRef | MemberRef[] } | null)?.originador),
      sales,
    },
  }
}

type Res =
  | { ok: true; data: AffiliateCommissionSummary }
  | { ok: false; error: string }

/**
 * F-V35 fase 3 — ações admin de fechamento de comissão de afiliado.
 * `preview` = dry-run (não grava). `close` = lança no commission_ledger (idempotente/mês).
 */
export async function previewAffiliateCommissions(referenceMonth: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await computeAffiliateCommissions(referenceMonth, { commit: false })
  if (data.error) return { ok: false, error: data.error }
  return { ok: true, data }
}

export async function closeAffiliateCommissions(referenceMonth: string): Promise<Res> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Apenas administradores." }
  const data = await computeAffiliateCommissions(referenceMonth, { commit: true })
  if (data.error) return { ok: false, error: data.error }
  revalidatePath("/admin/afiliados")
  return { ok: true, data }
}
