import { createServiceClient } from "@/lib/supabase/server"

/**
 * F-V35 fase 1 — captura de atribuição de venda de loja a um afiliado.
 *
 * Regra: o cupom usado no pedido É o `ref_code` do afiliado (BH00…). Se um código
 * do pedido casar com o ref_code de um membro, a venda é atribuída a ele.
 *
 * Só grava (affiliate_sales + affiliate_customer_origin). NÃO calcula/paga comissão
 * (fase 2+). SEMPRE non-fatal — nunca lança pro webhook (Anti-SPEC §4).
 *
 * - Autocompra (cupom = ref_code do próprio comprador): grava com is_self_purchase
 *   e NÃO define Originador (não gera comissão pra si — regra antifraude).
 * - Originador é first-touch: a 1ª compra do cliente define; as seguintes não trocam.
 * - Cupons CREATINA-* (e qualquer código que não seja ref_code) são ignorados.
 */
export interface CaptureArgs {
  shopifyOrderId: string
  orderId: string | null
  customerEmail: string
  buyerMemberId: string | null
  totalAmount: number
  discountCodes: Array<{ code: string }>
}

function referenceMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export async function captureAffiliateSale(args: CaptureArgs): Promise<void> {
  try {
    const codes = (args.discountCodes || [])
      .map((d) => (d?.code || "").trim())
      .filter(Boolean)
      .filter((c) => !c.toUpperCase().startsWith("CREATINA-"))
    if (codes.length === 0) return

    const supabase = createServiceClient()
    const email = (args.customerEmail || "").toLowerCase().trim()
    const ref = referenceMonth()

    for (const code of codes) {
      // Afiliado = membro cujo ref_code == cupom (case-insensitive, sem wildcard).
      const { data: aff } = await supabase
        .from("members")
        .select("id, ref_code")
        .ilike("ref_code", code)
        .maybeSingle()
      if (!aff) continue

      const isSelf = args.buyerMemberId != null && args.buyerMemberId === aff.id

      const { error: saleErr } = await supabase.from("affiliate_sales").insert({
        shopify_order_id: args.shopifyOrderId,
        order_id: args.orderId,
        affiliate_member_id: aff.id,
        buyer_member_id: args.buyerMemberId,
        customer_email: email || null,
        coupon_code: aff.ref_code,
        gross_amount: args.totalAmount ?? 0,
        is_self_purchase: isSelf,
        reference_month: ref,
      })
      // 23505 = já capturado (idempotência por pedido+afiliado) → ok.
      if (saleErr && saleErr.code !== "23505") {
        console.error("[affiliate-capture] insert sale", saleErr)
      } else if (!saleErr) {
        console.info(`[affiliate-capture] venda atribuída → afiliado ${aff.ref_code} (order ${args.shopifyOrderId})`)
      }

      // Originador (first-touch). Autocompra não define originador.
      if (!isSelf && email) {
        const { error: origErr } = await supabase.from("affiliate_customer_origin").insert({
          customer_email: email,
          originador_member_id: aff.id,
          first_shopify_order_id: args.shopifyOrderId,
        })
        // 23505 = cliente já tem originador → mantém o primeiro (correto).
        if (origErr && origErr.code !== "23505") {
          console.error("[affiliate-capture] insert origin", origErr)
        }
      }
    }
  } catch (err) {
    console.error("[affiliate-capture] exception (non-fatal)", err)
  }
}
