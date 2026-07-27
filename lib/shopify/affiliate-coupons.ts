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

/**
 * Coleção "Loja Biohelp" (varejo) — o 10% do afiliado só vale nela, deixando os
 * produtos do club de fora (lá o preço já é final). Sem isso, o desconto entra
 * como "Desconto no pedido" e pega tudo, inclusive o club (Gabriel, 09/07).
 * Override por env se a coleção mudar.
 */
const STORE_COLLECTION_ID = Number(process.env.SHOPIFY_STORE_COLLECTION_ID || "282660405338")

type Rest<T> = { status: number; data: T | null; error: string | null }

async function rest<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<Rest<T>> {
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
  /** Quantos afiliados já têm cupom no Shopify. */
  existingCount: number
  /** Quantos ainda faltam criar (é o que "Criar" cria). */
  missingCount: number
  priceRuleId: string | null
  batchesSent: number
  codesQueued: number
  /** Amostra dos que FALTAM criar. */
  sample: string[]
  alreadyExists: boolean
  error?: string
}

/** Acha o id da price rule "Afiliados — 10%" já existente (por título). */
async function findAffiliatePriceRuleId(): Promise<number | null> {
  const r = await rest<{ price_rules?: Array<{ id: number; title: string }> }>(
    "/price_rules.json?limit=250",
    "GET",
  )
  const found = (r.data?.price_rules || []).find((p) => p.title === PRICE_RULE_TITLE)
  return found?.id ?? null
}

/** Lista TODOS os códigos de cupom já existentes sob a price rule (paginado). */
async function listExistingCouponCodes(priceRuleId: number): Promise<Set<string>> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = await getShopifyAccessToken()
  const out = new Set<string>()
  if (!domain || !token) return out
  let nextUrl: string | null =
    `https://${domain}/admin/api/${API_VERSION}/price_rules/${priceRuleId}/discount_codes.json?limit=250`
  for (let guard = 0; nextUrl && guard < 30; guard++) {
    const res: Response = await fetch(nextUrl, { headers: { "X-Shopify-Access-Token": token } })
    if (!res.ok) break
    const json = (await res.json()) as { discount_codes?: Array<{ code: string }> }
    for (const dc of json.discount_codes || []) out.add(dc.code)
    const link: string | null = res.headers.get("link") ?? res.headers.get("Link")
    const match: RegExpExecArray | null = link ? /<([^>]+)>;\s*rel="next"/.exec(link) : null
    nextUrl = match ? match[1] : null
  }
  return out
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
    existingCount: 0,
    missingCount: 0,
    priceRuleId: null,
    batchesSent: 0,
    codesQueued: 0,
    sample: [],
    alreadyExists: false,
  }
  if (codes.length === 0) return base

  // Diagnóstico (read-only): acha a price rule existente e os cupons já criados,
  // pra calcular quem FALTA. Vale pro dry-run e pro execute — nunca recria o que existe.
  let priceRuleId = await findAffiliatePriceRuleId()
  const existing = priceRuleId ? await listExistingCouponCodes(priceRuleId) : new Set<string>()
  const missing = codes.filter((c) => !existing.has(c))
  base.priceRuleId = priceRuleId ? String(priceRuleId) : null
  base.existingCount = codes.length - missing.length
  base.missingCount = missing.length
  base.sample = missing.slice(0, 10)

  // dry-run: só o diagnóstico (quantos faltam), sem escrever.
  if (!opts.execute) return base

  if (missing.length === 0) {
    return { ...base, executed: true, alreadyExists: true, error: "todos os afiliados já têm cupom" }
  }

  // Cria a price rule só se ainda não existe (1ª vez).
  if (!priceRuleId) {
    const pr = await rest<{ price_rule: { id: number } }>("/price_rules.json", "POST", {
      price_rule: {
        title: PRICE_RULE_TITLE,
        target_type: "line_item",
        // "Desconto de produto" restrito à coleção Loja Biohelp (não pega o club).
        target_selection: "entitled",
        allocation_method: "each",
        entitled_collection_ids: [STORE_COLLECTION_ID],
        value_type: "percentage",
        value: "-10.0",
        customer_selection: "all",
        starts_at: new Date().toISOString(),
      },
    })
    if (!pr.data?.price_rule?.id) return { ...base, error: `falha na price rule: ${pr.error}` }
    priceRuleId = pr.data.price_rule.id
    base.priceRuleId = String(priceRuleId)
  }

  // Cria em lote SÓ os que faltam (até 100 por batch).
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100).map((code) => ({ code }))
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

export interface FixPriceRuleResult {
  ok: boolean
  priceRuleId: string | null
  targetSelection?: string
  entitledCollectionIds?: number[]
  error?: string
}

/**
 * F-V35 — corrige a price rule "Afiliados — 10%" JÁ existente: de "Desconto no
 * pedido" (target_selection=all, pegava o club) para "Desconto de produto"
 * (entitled) restrito à coleção Loja Biohelp. Um PUT conserta todos os cupons de
 * uma vez (todos herdam a mesma price rule). Só roda com credenciais de PROD.
 */
export async function applyAffiliateCollectionToPriceRule(): Promise<FixPriceRuleResult> {
  // Acha a price rule via um cupom de afiliado conhecido (todos apontam pra ela).
  const codes = await fetchAffiliateCodes("all", 1)
  if (!codes.length) return { ok: false, priceRuleId: null, error: "nenhum cupom de afiliado encontrado" }

  const lookup = await rest<{ discount_code?: { price_rule_id: number } }>(
    `/discount_codes/lookup.json?code=${encodeURIComponent(codes[0])}`,
    "GET",
  )
  const priceRuleId = lookup.data?.discount_code?.price_rule_id
  if (!priceRuleId) {
    return { ok: false, priceRuleId: null, error: `price rule não encontrada (cupom ${codes[0]}): ${lookup.error ?? ""}` }
  }

  const put = await rest<{ price_rule: { id: number; target_selection: string; entitled_collection_ids: number[] } }>(
    `/price_rules/${priceRuleId}.json`,
    "PUT",
    {
      price_rule: {
        id: priceRuleId,
        target_selection: "entitled",
        allocation_method: "each",
        entitled_collection_ids: [STORE_COLLECTION_ID],
      },
    },
  )
  if (put.error || !put.data?.price_rule) {
    return { ok: false, priceRuleId: String(priceRuleId), error: put.error ?? "resposta vazia do Shopify" }
  }
  return {
    ok: true,
    priceRuleId: String(priceRuleId),
    targetSelection: put.data.price_rule.target_selection,
    entitledCollectionIds: put.data.price_rule.entitled_collection_ids,
  }
}

export interface DeactivateCouponResult {
  code: string
  found: boolean
  deleted: boolean
  error?: string
}

/**
 * F-V35 — desativa (remove) o cupom de um afiliado no Shopify.
 *
 * Usado quando a assinatura do afiliado ENCERRA (subscription_expired): o cupom
 * dele deixa de funcionar. Idempotente: se o cupom não existe, retorna
 * found=false sem erro. Só roda com credenciais de PROD (Vercel).
 */
export async function deactivateAffiliateCoupon(refCode: string): Promise<DeactivateCouponResult> {
  const code = (refCode || "").trim()
  const out: DeactivateCouponResult = { code, found: false, deleted: false }
  if (!code) return out

  const lookup = await rest<{ discount_code?: { id: number; price_rule_id: number } }>(
    `/discount_codes/lookup.json?code=${encodeURIComponent(code)}`,
    "GET",
  )
  // 404 (ou sem discount_code) = cupom não existe → nada a fazer.
  if (lookup.status === 404 || !lookup.data?.discount_code) return out
  if (lookup.error) return { ...out, error: `lookup falhou: ${lookup.error}` }

  const { id, price_rule_id } = lookup.data.discount_code
  out.found = true
  const del = await rest(`/price_rules/${price_rule_id}/discount_codes/${id}.json`, "DELETE")
  if (del.error) return { ...out, error: `delete falhou: ${del.error}` }
  out.deleted = true
  return out
}
