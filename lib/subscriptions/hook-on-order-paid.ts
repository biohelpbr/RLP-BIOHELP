import { createServiceClient } from "@/lib/supabase/server"
import { markSubscriptionPaid } from "./actions"

/**
 * F-V03: heurística pra detectar se uma compra Shopify representa
 * pagamento de assinatura/clube e, se sim, marca o member como paid.
 *
 * Heurísticas (até F-V02 puxar Guru direto):
 *   1. Algum line_item.title contém "assinatura" ou "clube" (case-insensitive).
 *   2. Algum produto tem tag/handle com "assinatura" ou "clube".
 *   3. Fallback conservador: total > BRL 200 (assinatura mensal Biohelp ≈ R$ 200+).
 *
 * Apenas marca se status atual for `pending` (não reverte cancelled).
 *
 * Pattern §10 (memória): função NUNCA lança. Em qualquer erro, retorna
 * `{applied:false, reason:'...'}` e webhook v1 segue normal.
 */

export type OrderPaidHookInput = {
  memberId: string
  totalAmount: number
  lineItems: Array<{
    title?: string | null
    productId?: string | null
  }>
  /** Tags por productId — opcional. Se vazio, hook usa só title + total. */
  productTags?: Record<string, string[]>
}

export type OrderPaidHookResult = {
  applied: boolean
  reason?: string
  matched?: "line_item_title" | "product_tag" | "total_threshold"
}

const SUBSCRIPTION_KEYWORDS = ["assinatura", "clube"]
const TOTAL_THRESHOLD_BRL = 200

export function detectSubscriptionPurchase(
  input: Pick<OrderPaidHookInput, "totalAmount" | "lineItems" | "productTags">
): { match: boolean; matched?: OrderPaidHookResult["matched"] } {
  // 1. line_item.title
  for (const item of input.lineItems) {
    const title = (item.title ?? "").toLowerCase()
    if (SUBSCRIPTION_KEYWORDS.some((kw) => title.includes(kw))) {
      return { match: true, matched: "line_item_title" }
    }
  }

  // 2. product tags
  if (input.productTags) {
    for (const item of input.lineItems) {
      const tags = item.productId ? input.productTags[item.productId] ?? [] : []
      const lowered = tags.map((t) => t.toLowerCase())
      if (lowered.some((tag) => SUBSCRIPTION_KEYWORDS.some((kw) => tag.includes(kw)))) {
        return { match: true, matched: "product_tag" }
      }
    }
  }

  // 3. fallback total threshold
  if (input.totalAmount >= TOTAL_THRESHOLD_BRL) {
    return { match: true, matched: "total_threshold" }
  }

  return { match: false }
}

export async function hookOnOrderPaidSubscription(
  input: OrderPaidHookInput
): Promise<OrderPaidHookResult> {
  try {
    const detection = detectSubscriptionPurchase(input)
    if (!detection.match) {
      return { applied: false, reason: "no_subscription_signal" }
    }

    // Idempotência delegada para markSubscriptionPaid.
    const supabase = createServiceClient()
    const { data: m } = await supabase
      .from("members")
      .select("subscription_status")
      .eq("id", input.memberId)
      .single()

    if (m?.subscription_status === "cancelled") {
      // Não reverte cancelled (decisão de design).
      return { applied: false, reason: "member_cancelled" }
    }

    if (m?.subscription_status === "paid") {
      return { applied: false, reason: "already_paid" }
    }

    const res = await markSubscriptionPaid(input.memberId)
    if (!res.ok) {
      return { applied: false, reason: `mark_failed:${res.error}` }
    }
    return {
      applied: res.changed,
      matched: detection.matched,
      reason: res.changed ? undefined : "noop",
    }
  } catch (err) {
    console.error("[hookOnOrderPaidSubscription]", err)
    return { applied: false, reason: "exception" }
  }
}
