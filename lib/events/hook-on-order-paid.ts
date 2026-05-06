/**
 * F-V15 hook em webhook orders/paid.
 *
 * IMPORTANTE: este hook roda em composição com o webhook v1
 * (`app/api/webhooks/shopify/orders/paid/route.ts`). Ele NUNCA pode
 * lançar exceção pra fora — toda falha é capturada e logada.
 *
 * Estratégia de atribuição (resiliente a cookie cross-site):
 *  1. Recebe `member_id` + `product_ids` da ordem (já calculados pelo webhook v1).
 *  2. Procura evento ativo cujo produto elegível casa com a ordem.
 *  3. Confere se o membro visitou o evento nos últimos 7 dias (`event_visits`).
 *  4. Se sim, aplica tag `evento:<slug>` em `members.tags` (jsonb append idempotente).
 *  5. Se não, fallback: usa o evento ativo mais recente como atribuição.
 */

import { createServiceClient } from "@/lib/supabase/server"
import { findAttributableEventForOrder } from "./queries"

export interface HookOrderInput {
  memberId: string
  memberEmail: string
  productIds: string[]
}

export interface HookOrderResult {
  ok: boolean
  applied: boolean
  eventSlug?: string
  reason?: string
}

export async function hookOnOrderPaid(input: HookOrderInput): Promise<HookOrderResult> {
  try {
    if (!input.memberId || input.productIds.length === 0) {
      return { ok: true, applied: false, reason: "missing-member-or-products" }
    }

    const event = await findAttributableEventForOrder({
      memberId: input.memberId,
      productIds: input.productIds,
    })

    if (!event) {
      return { ok: true, applied: false, reason: "no-active-event" }
    }

    const supabase = createServiceClient()
    const { data: memberRow, error: readError } = await supabase
      .from("members")
      .select("id, tags")
      .eq("id", input.memberId)
      .maybeSingle()

    if (readError || !memberRow) {
      return { ok: true, applied: false, reason: "member-not-found" }
    }

    const tag = `evento:${event.slug}`
    const currentTags: string[] = Array.isArray(memberRow.tags)
      ? (memberRow.tags as string[])
      : []

    if (currentTags.includes(tag)) {
      return { ok: true, applied: false, eventSlug: event.slug, reason: "already-tagged" }
    }

    const newTags = [...currentTags, tag]
    const { error: updateError } = await supabase
      .from("members")
      .update({ tags: newTags })
      .eq("id", input.memberId)

    if (updateError) {
      console.error("[hookOnOrderPaid] update tags failed", updateError)
      return { ok: false, applied: false, eventSlug: event.slug, reason: "update-failed" }
    }

    console.info(
      `[hookOnOrderPaid] tag ${tag} aplicada em member ${input.memberId} (event ${event.id})`,
    )
    return { ok: true, applied: true, eventSlug: event.slug }
  } catch (err) {
    // Hook NUNCA quebra o webhook v1.
    console.error("[hookOnOrderPaid] unexpected error", err)
    return { ok: false, applied: false, reason: "exception" }
  }
}
