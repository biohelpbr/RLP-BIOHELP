/**
 * F-V19 — Webhook receiver Guru.
 *
 * Anti-SPEC §4 pattern (try/catch isolado): falha em 1 evento NÃO derruba 200
 *   pra evitar retry storm do Guru no resto da fila.
 *
 * Status codes (runbook §"Retries / Timeouts"):
 *   200 → processado OK, member_not_found, ou já processado (idempotência).
 *         Guru NÃO reenvia.
 *   401 → api_token inválido. Guru NÃO reenvia (correto — não vai resolver com retry).
 *   500 → DB indisponível ou erro transitório. Guru reenvia até ~30x.
 *
 * Idempotência: `X-Request-ID` header (Guru garante o mesmo ID em retries do
 *   mesmo dispatch). Fallback UUID em chamadas locais sem header.
 *
 * Quirk: o Guru manda DOIS webhooks em ativação (transaction.approved ~5s antes
 *   de subscription.started). markSubscriptionPaid é idempotente, mas evitamos
 *   notification duplicada checando se já existe row kind=subscription_paid
 *   apontando pro href do member.
 */

import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { createServiceClient } from "@/lib/supabase/server"
import {
  classifyGuruEvent,
  verifyGuruWebhook,
  type GuruDomainEvent,
  type GuruWebhookPayload,
} from "@/lib/subscriptions/providers/guru"
import {
  cancelAutoRenew,
  cancelSubscription,
  extendSubscription,
  markSubscriptionPaid,
} from "@/lib/subscriptions/actions"
import { getMemberByExternalId, type MemberRow } from "@/lib/subscriptions/queries"
import { sendToAbsolut } from "@/lib/crm/absolut"

export const runtime = "nodejs"

/** Pretty-print de event_type pra log/auditoria (não vai pro DB). */
function describeEvent(payload: GuruWebhookPayload): string {
  if (payload.webhook_type === "subscription") {
    return `subscription.${payload.last_status}`
  }
  return `transaction.${payload.status}`
}

/**
 * Shopify sync — cria/atualiza customer + aplica tag subscriber.
 * Usa syncCustomerToShopify (V1, funcional desde jan/2026).
 * Roda em background (não bloqueia resposta do webhook).
 */
async function syncToShopify(args: {
  memberId: string
  memberEmail: string | null
  transactionId: string
  action: "activated" | "renewed" | "deactivated"
  // B4: status Shopify aplicado nas tags. "inactive" remove a tag `subscriber`
  // (merge B5). Default "active" preserva o comportamento de ativação/renovação.
  shopifyStatus?: "active" | "inactive"
}): Promise<void> {
  if (!args.memberEmail) return
  try {
    const supabase = createServiceClient()
    const { data: member } = await supabase
      .from("members")
      .select("ref_code, sponsor_id, name, subscription_expires_at")
      .eq("id", args.memberId)
      .single()
    if (!member) return

    let sponsorRefCode: string | null = null
    if (member.sponsor_id) {
      const { data: sponsor } = await supabase
        .from("members")
        .select("ref_code")
        .eq("id", member.sponsor_id)
        .single()
      sponsorRefCode = sponsor?.ref_code ?? null
    }

    const expiresDate = member.subscription_expires_at
      ? new Date(member.subscription_expires_at).toISOString().slice(0, 10)
      : ""

    const nameParts = (member.name ?? "").split(" ")
    const firstName = nameParts[0] || "Parceira"
    const lastName = nameParts.slice(1).join(" ") || ""

    const { syncCustomerToShopify } = await import("@/lib/shopify/customer")
    const result = await syncCustomerToShopify({
      email: args.memberEmail,
      firstName,
      lastName,
      refCode: member.ref_code ?? "",
      sponsorRefCode,
      level: "membro",
      status: args.shopifyStatus ?? "active",
    })
    console.info("[guru-webhook] shopify sync:", result.success ? "ok" : "failed", {
      action: args.action,
      shopifyCustomerId: result.shopifyCustomerId,
    })
  } catch (err) {
    console.error("[guru-webhook] shopify sync error (non-fatal)", err)
  }
}

async function findMemberByEmail(email: string): Promise<MemberRow | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle()
  return (data as MemberRow | null) ?? null
}

async function lookupMember(domain: GuruDomainEvent): Promise<MemberRow | null> {
  if (domain.kind === "noop") return null

  if (domain.kind === "transaction_refunded") {
    return await findMemberByEmail(domain.email)
  }

  // subscription_* — externalId (utm_term) é a chave primária; email é fallback.
  const subEvent = domain
  let member: MemberRow | null = null
  if (subEvent.kind === "subscription_activated" && subEvent.external_id) {
    member = await getMemberByExternalId(subEvent.external_id)
  }
  if (!member) {
    member = await findMemberByEmail(subEvent.email)
  }
  return member
}

async function notifyAdminPaid(member: MemberRow): Promise<void> {
  const supabase = createServiceClient()
  // Skip se já existe notification subscription_paid pro mesmo member
  // (race transaction.approved vs subscription.started — Guru manda os 2).
  const href = `/admin/community/${member.id}`
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("kind", "subscription_paid")
    .eq("href", href)
    .limit(1)
    .maybeSingle()

  if (existing) return

  await supabase.from("notifications").insert({
    recipient_role: "admin",
    kind: "subscription_paid",
    title: `Assinatura confirmada: ${member.name ?? member.email ?? member.id}`,
    body: "Member ativo, sponsor recebeu +1 na contagem.",
    href,
  })
}

async function notifyAdminRefund(member: MemberRow, transactionId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from("notifications").insert({
    recipient_role: "admin",
    kind: "subscription_refunded",
    title: `Reembolso recebido: ${member.name ?? member.email ?? member.id}`,
    body: `Transação ${transactionId}. Cancelar manualmente no admin se necessário.`,
    href: `/admin/community/${member.id}`,
  })
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID()

  // 1. Parse body
  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ error: "Body unreadable" }, { status: 400 })
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Guru envelopa o payload real dentro de { "payload": {...}, "connection": "pubsub", ... }
  // Desembrulhar se necessário.
  const envelope = json as Record<string, unknown>
  if (envelope?.payload && typeof envelope.payload === "object" && (envelope.payload as any)?.api_token) {
    json = envelope.payload
  }

  // 2. Valida schema + api_token
  let payload = verifyGuruWebhook(json)
  if (!payload) {
    // Zod rejeitou o payload real do Guru. Em vez de retornar 401 (Guru para retries),
    // tenta extrair dados mínimos do body raw pra não perder a venda.
    const raw_obj = json as Record<string, unknown>
    const token = raw_obj?.api_token as string | undefined
    const expected = process.env.GURU_WEBHOOK_API_TOKEN
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    // Payload real do Guru não bateu no Zod — processar com fallback
    console.error("[guru-webhook] Zod parse failed — using raw fallback. Payload keys:", Object.keys(raw_obj))
    const webhookType = raw_obj?.webhook_type as string ?? "unknown"
    const subscriber = raw_obj?.subscriber as Record<string, unknown> | undefined
    const email = (subscriber?.email as string) ?? (raw_obj as any)?.contact?.email ?? null
    const lastStatus = (raw_obj?.last_status as string) ?? (raw_obj?.status as string) ?? "unknown"
    const subId = (raw_obj?.id as string) ?? "unknown"
    const chargedTimes = (raw_obj?.charged_times as number) ?? 1
    const source = raw_obj?.source as Record<string, unknown> | undefined

    if (webhookType === "subscription" && email) {
      // Construir payload mínimo compatível com o schema
      payload = {
        api_token: token ?? "",
        webhook_type: "subscription",
        id: subId,
        last_status: lastStatus as any,
        subscriber: { id: subscriber?.id as string ?? "unknown", email, name: subscriber?.name as string },
        product: { id: "unknown" },
        charged_times: chargedTimes,
        source: source as any,
      } as any
    } else if (webhookType === "transaction" && email) {
      payload = {
        api_token: token ?? "",
        webhook_type: "transaction",
        id: subId,
        status: lastStatus as any,
        contact: { email },
        product: { id: "unknown" },
      } as any
    } else {
      console.error("[guru-webhook] Cannot extract minimum fields from raw payload")
      return NextResponse.json({ error: "Unprocessable payload", webhook_type: webhookType }, { status: 200 })
    }
  }

  const eventType = describeEvent(payload!)
  const supabase = createServiceClient()

  // 3. Idempotência: insert no audit log com event_id UNIQUE
  const { error: insertErr } = await supabase
    .from("guru_webhook_events")
    .insert({ event_id: requestId, event_type: eventType, payload: payload as never })

  if (insertErr) {
    // 23505 = unique_violation → já processado (idempotência).
    if (insertErr.code === "23505") {
      console.info("[guru-webhook] duplicate request_id, no-op", { requestId, eventType })
      return NextResponse.json({ success: true, message: "already_processed" })
    }
    // Erro de DB → 5xx pro Guru reenviar (transitório).
    console.error("[guru-webhook] db insert audit row failed", insertErr)
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }

  // 4. Classifica + processa (try/catch isolado).
  try {
    const domain = classifyGuruEvent(payload!)

    if (domain.kind === "noop") {
      await supabase
        .from("guru_webhook_events")
        .update({ processed_at: new Date().toISOString(), error: "noop_event" })
        .eq("event_id", requestId)
      return NextResponse.json({ success: true, kind: "noop" })
    }

    const member = await lookupMember(domain)

    if (!member) {
      // member_not_found não é resolvível com retry — retorna 200 + loga error
      // pra Guru não bombardear a fila.
      await supabase
        .from("guru_webhook_events")
        .update({ processed_at: new Date().toISOString(), error: "member_not_found" })
        .eq("event_id", requestId)
      return NextResponse.json({ success: false, reason: "member_not_found" })
    }

    switch (domain.kind) {
      case "subscription_activated": {
        // Idempotência por guru_subscriber_id: Guru manda started + active com
        // o MESMO subscription_id mas X-Request-IDs diferentes (runbook §Quirks).
        // Audit log passa por ambos. Aqui paramos a 2ª passagem pra não dobrar
        // extendSubscription (markSubscriptionPaid já é idempotente).
        if (
          member.subscription_status === "paid" &&
          member.guru_subscriber_id === domain.subscription_id
        ) {
          console.warn(
            "[guru-webhook] duplicate activation dispatch — same subscription_id already paid",
            { memberId: member.id, subscriptionId: domain.subscription_id },
          )
          break
        }

        const paid = await markSubscriptionPaid(member.id)
        if (!paid.ok) throw new Error(`markSubscriptionPaid: ${paid.error}`)

        const ext = await extendSubscription(member.id, 1)
        if (!ext.ok) throw new Error(`extendSubscription: ${"error" in ext ? ext.error : "fail"}`)

        // Comissão fixa por ativação: R$80 (≤20 ativos) ou R$40 (>20).
        // Só dispara se paid.changed (idempotente — não duplica comissão em replay).
        if (paid.changed && member.sponsor_id) {
          const { calculateActivationCommission } = await import("@/lib/commissions-v2/calculate-activation")
          const commResult = await calculateActivationCommission(
            member.sponsor_id as string,
            member.id,
            domain.subscription_id,
          )
          if (commResult.ok) {
            console.info(`[guru-webhook] commission R$${commResult.amount} (${commResult.tier}) for sponsor`)
          } else {
            console.error("[guru-webhook] commission failed (non-fatal)", commResult.error)
          }
        }

        // Persiste guru_subscriber_id (sobrescreve token UUID temporário do pré-cadastro).
        if (member.guru_subscriber_id !== domain.subscription_id) {
          await supabase
            .from("members")
            .update({ guru_subscriber_id: domain.subscription_id })
            .eq("id", member.id)
        }

        await notifyAdminPaid(member)
        await syncToShopify({
          memberId: member.id,
          memberEmail: member.email,
          transactionId: domain.subscription_id,
          action: "activated",
        })

        // F-V20: "virou_cliente" pro CRM Absolut só na 1ª ativação efetiva
        // (paid.changed — idempotente, não redispara em replay). non-fatal e
        // gated. ref_code do sponsor segue o mesmo padrão de query do syncToShopify.
        if (paid.changed) {
          let sponsorRefCode: string | null = null
          if (member.sponsor_id) {
            const { data: sponsorRow } = await supabase
              .from("members")
              .select("ref_code")
              .eq("id", member.sponsor_id)
              .single()
            sponsorRefCode = (sponsorRow?.ref_code as string | null) ?? null
          }
          await sendToAbsolut({
            evento: "virou_cliente",
            nome: member.name ?? "",
            email: member.email ?? "",
            telefone: (member.phone as string | null) ?? "",
            codigoIndicacao: sponsorRefCode,
          })
        }
        break
      }

      case "subscription_renewed": {
        const ext = await extendSubscription(member.id, 1)
        if (!ext.ok) throw new Error(`extendSubscription: ${"error" in ext ? ext.error : "fail"}`)

        await syncToShopify({
          memberId: member.id,
          memberEmail: member.email,
          transactionId: domain.subscription_id,
          action: "renewed",
        })
        break
      }

      case "subscription_canceled": {
        const c = await cancelAutoRenew(member.id)
        if (!c.ok) throw new Error(`cancelAutoRenew: ${"error" in c ? c.error : "fail"}`)
        // NÃO inativa agora no LRP. Cron diário move pra cancelled quando expires_at < now().
        // B4: remove a tag `subscriber` na Shopify (non-fatal, merge B5 preserva o resto).
        await syncToShopify({
          memberId: member.id,
          memberEmail: member.email,
          transactionId: domain.subscription_id,
          action: "deactivated",
          shopifyStatus: "inactive",
        })
        break
      }

      case "subscription_expired": {
        const c = await cancelSubscription(member.id)
        if (!c.ok) throw new Error(`cancelSubscription: ${"error" in c ? c.error : "fail"}`)
        // B4: remove a tag `subscriber` na Shopify ao inativar (non-fatal).
        await syncToShopify({
          memberId: member.id,
          memberEmail: member.email,
          transactionId: domain.subscription_id,
          action: "deactivated",
          shopifyStatus: "inactive",
        })
        break
      }

      case "transaction_refunded": {
        await notifyAdminRefund(member, domain.transaction_id)
        // Gabriel 30:55: cancelamento por reembolso é manual no admin.
        break
      }
    }

    await supabase
      .from("guru_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", requestId)

    return NextResponse.json({ success: true, kind: domain.kind })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[guru-webhook] processing failed", { requestId, eventType, err: msg })
    await supabase
      .from("guru_webhook_events")
      .update({ processed_at: new Date().toISOString(), error: msg })
      .eq("event_id", requestId)
    // 5xx → Guru reenvia. Se o erro for permanente, o reprocesso bate em 23505
    // na próxima tentativa e devolve 200 no-op.
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
