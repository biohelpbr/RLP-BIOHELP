import { createServiceClient } from "@/lib/supabase/server"
import { getShopifyAccessToken } from "./token"

/**
 * F-V35 — criação em massa dos cupons de afiliado no Shopify.
 *
 * Cada afiliado tem UM cupom cujo código É o `ref_code` dele (BH00…). Todos os
 * códigos ficam sob UMA price rule "Afiliados — 10%" (−10%, sem limite, sem validade),
 * criados em lote (endpoint batch do Shopify).
 *
 * Atenção: só roda com credenciais de PRODUÇÃO (Vercel). As locais estão inválidas.
 * `execute=false` é dry-run (não toca no Shopify — só conta/lista).
 */
const API_VERSION = "2024-10"
const PRICE_RULE_TITLE = "Afiliados — 10%"

type Rest<T> = { status: number; data: T | null; error: string | null }

async function rest<T>(endpoint: string, method: "GET" | "POST", body?: unknown): Promise<Rest<T>> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = await getShopifyAccessToken()
  if (!domain || !token) return { status: 0, data: null, error: "Sem credenciais Shopify" }
  try {
    const res = await fetch(`https://${domain}/admin/api/${API_VERSION}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    if (!res.ok) return { status: res.status, data: null, error: text.slice(0, 300) }
    return { status: res.status, data: (text ? JSON.parse(text) : null) as T, error: null }
  } catch (e) {
    return { status: 0, data: null, error: e instanceof Error ? e.message : "erro" }
  }
}

export interface BulkCouponResult {
  scope: "all" | "active"
  executed: boolean
  totalAffiliates: number
  priceRuleId: string | null
  batchesSent: number
  codesQueued: number
  sample: string[]
  alreadyExists: boolean
  error?: string
}

/** Busca os ref_codes dos afiliados (todos ou só pagantes). */
async function fetchAffiliateCodes(scope: "all" | "active", limit?: number): Promise<string[]> {
  const supabase = createServiceClient()
  let q = supabase.from("members").select("ref_code").like("ref_code", "BH%").order("ref_code")
  if (scope === "active") q = q.eq("subscription_status", "paid")
  if (limit && limit > 0) q = q.limit(limit)
  const { data, error } = await q
  if (error) {
    console.error("[aff-coupons] fetch codes", error)
    return []
  }
  return (data || []).map((r) => (r as { ref_code: string }).ref_code).filter(Boolean)
}

export async function bulkCreateAffiliateCoupons(opts: {
  scope: "all" | "active"
  execute: boolean
  limit?: number
}): Promise<BulkCouponResult> {
  const codes = await fetchAffiliateCodes(opts.scope, opts.limit)
  const base: BulkCouponResult = {
    scope: opts.scope,
    executed: false,
    totalAffiliates: codes.length,
    priceRuleId: null,
    batchesSent: 0,
    codesQueued: 0,
    sample: codes.slice(0, 10),
    alreadyExists: false,
  }
  if (!opts.execute || codes.length === 0) return base

  // Guarda anti-duplicata: se o 1º código já existe no Shopify, não recria tudo.
  const lookup = await rest<{ discount_code?: unknown }>(
    `/discount_codes/lookup.json?code=${encodeURIComponent(codes[0])}`,
    "GET",
  )
  if (lookup.status === 200 && lookup.data?.discount_code) {
    return { ...base, alreadyExists: true, error: `cupom ${codes[0]} já existe — parece já ter rodado` }
  }

  // 1) Price rule "Afiliados — 10%".
  const pr = await rest<{ price_rule: { id: number } }>("/price_rules.json", "POST", {
    price_rule: {
      title: PRICE_RULE_TITLE,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "percentage",
      value: "-10.0",
      customer_selection: "all",
      starts_at: new Date().toISOString(),
    },
  })
  if (!pr.data?.price_rule?.id) return { ...base, error: `falha na price rule: ${pr.error}` }
  const priceRuleId = pr.data.price_rule.id
  base.priceRuleId = String(priceRuleId)

  // 2) Códigos em lote (até 100 por batch).
  for (let i = 0; i < codes.length; i += 100) {
    const chunk = codes.slice(i, i + 100).map((code) => ({ code }))
    const b = await rest(`/price_rules/${priceRuleId}/batch.json`, "POST", { discount_codes: chunk })
    if (b.error) {
      return { ...base, executed: true, error: `batch ${i / 100 + 1} falhou: ${b.error}` }
    }
    base.batchesSent += 1
    base.codesQueued += chunk.length
  }

  base.executed = true
  return base
}
