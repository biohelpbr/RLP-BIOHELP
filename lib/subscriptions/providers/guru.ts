/**
 * F-V19 — Provider Guru (Digital Manager Guru).
 *
 * Schema + verify + classifier. Cópia direta de
 * `docs/wiki/runbooks/webhook-guru-debug.md` §"Schema Zod CORRIGIDO".
 *
 * Anti-SPEC §11: interface agnóstica — facilita troca por Cakto/Hotmart depois.
 * Pontos críticos vs SPEC original (RF-4/RF-7/RF-8):
 *   • Sem HMAC. Autenticação via `api_token` no body (env GURU_WEBHOOK_API_TOKEN).
 *   • Sem 5 eventos discretos: `webhook_type` (transaction|subscription) + status.
 *   • Sem `metadata.external_id`: token vai em `source.utm_term`.
 */

import { z } from "zod"

// ─── Subschemas comuns ──────────────────────────────────────────────────────

export const GuruContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone_number: z.string().optional(),
  doc: z.string().optional(),
}).passthrough()

export const GuruProductSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  marketplace_id: z.string().optional(),
  type: z.enum(["principal", "plan", "orderbump", "upsell"]).optional(),
  qty: z.number().optional(),
  unit_value: z.number().optional(),
  offer: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).partial().optional(),
}).passthrough()

export const GuruSourceSchema = z.object({
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),   // ← external_id (hack documentado)
  sck: z.string().nullable().optional(),         // ← alternativa
  src: z.string().nullable().optional(),
  pptc: z.string().nullable().optional(),
}).passthrough()

// ─── Transaction webhook ────────────────────────────────────────────────────

export const GuruTransactionStatusSchema = z.enum([
  "abandoned", "analysis", "approved", "billet_printed", "blocked",
  "canceled", "chargeback", "charging", "completed", "delayed",
  "dispute", "expired", "failed", "in_recovery", "pending",
  "pending_transfer", "processing", "refunded", "rejected",
  "scheduled", "started", "transferred", "trial", "waiting_payment",
])

export const GuruTransactionWebhookSchema = z.object({
  api_token: z.string(),
  webhook_type: z.literal("transaction"),
  id: z.string(),                                  // transaction_id (UUID)
  status: GuruTransactionStatusSchema,
  type: z.string().optional(),
  contact: GuruContactSchema,
  product: GuruProductSchema,
  items: z.array(GuruProductSchema).optional(),
  source: GuruSourceSchema.optional(),
  payment: z.object({
    method: z.string().optional(),
    total: z.number().optional(),
    net: z.number().optional(),
  }).passthrough().optional(),
  dates: z.object({
    created_at: z.number().optional(),
    confirmed_at: z.number().nullable().optional(),
    ordered_at: z.number().optional(),
  }).passthrough().optional(),
  subscription: z.object({
    id: z.string().optional(),
    subscriber: z.object({
      id: z.string(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  checkout_url: z.string().optional(),
}).passthrough()

// ─── Subscription webhook ───────────────────────────────────────────────────

export const GuruSubscriptionStatusSchema = z.enum([
  "started", "active", "trial", "pastdue",
  "canceled", "expired", "inactive",
])

export const GuruSubscriptionWebhookSchema = z.object({
  api_token: z.string(),
  webhook_type: z.literal("subscription"),
  id: z.string(),                                  // subscription_id Guru
  internal_id: z.string().optional(),
  last_status: GuruSubscriptionStatusSchema,
  subscriber: z.object({
    id: z.string(),                                // subscriber_id
    name: z.string().optional(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    doc: z.string().optional(),
  }).passthrough(),
  product: GuruProductSchema,
  next_product: GuruProductSchema.optional(),
  current_invoice: z.object({
    id: z.string().optional(),
    status: z.string().optional(),
    value: z.number().optional(),
    cycle: z.number().optional(),
    charge_at: z.number().nullable().optional(),
  }).passthrough().optional(),
  last_transaction: GuruTransactionWebhookSchema.partial().passthrough().optional(),
  dates: z.object({
    started_at: z.number().nullable().optional(),
    cycle_start_date: z.number().nullable().optional(),
    cycle_end_date: z.number().nullable().optional(),
    next_cycle_at: z.number().nullable().optional(),
    canceled_at: z.number().nullable().optional(),
  }).passthrough().optional(),
  payment_method: z.string().optional(),
  charged_every_days: z.number().optional(),
  charged_times: z.number().optional(),
  source: GuruSourceSchema.optional(),
}).passthrough()

// ─── Discriminated union ────────────────────────────────────────────────────

export const GuruWebhookPayloadSchema = z.discriminatedUnion("webhook_type", [
  GuruTransactionWebhookSchema,
  GuruSubscriptionWebhookSchema,
])

export type GuruWebhookPayload = z.infer<typeof GuruWebhookPayloadSchema>

// ─── Validação ──────────────────────────────────────────────────────────────

export function verifyGuruWebhook(body: unknown): GuruWebhookPayload | null {
  const parsed = GuruWebhookPayloadSchema.safeParse(body)
  if (!parsed.success) return null
  const expected = process.env.GURU_WEBHOOK_API_TOKEN
  if (!expected) {
    console.warn("[guru] GURU_WEBHOOK_API_TOKEN not set — accepting and logging token for first-time capture:", parsed.data.api_token)
  } else if (parsed.data.api_token !== expected) {
    return null
  }
  return parsed.data
}

// ─── Router de evento → ação F-V19 ──────────────────────────────────────────

export type GuruDomainEvent =
  | { kind: "subscription_activated"; subscriber_id: string; subscription_id: string; email: string; external_id?: string }
  | { kind: "subscription_canceled";  subscriber_id: string; subscription_id: string; email: string }
  | { kind: "subscription_expired";   subscriber_id: string; subscription_id: string; email: string }
  | { kind: "subscription_renewed";   subscriber_id: string; subscription_id: string; email: string }
  | { kind: "transaction_refunded";   transaction_id: string; email: string }
  | { kind: "noop" }

export function classifyGuruEvent(payload: GuruWebhookPayload): GuruDomainEvent {
  if (payload.webhook_type === "subscription") {
    const externalId = payload.source?.utm_term ?? payload.source?.sck ?? undefined
    switch (payload.last_status) {
      case "started":
      case "active":
        if ((payload.charged_times ?? 1) === 1) {
          return {
            kind: "subscription_activated",
            subscriber_id: payload.subscriber.id,
            subscription_id: payload.id,
            email: payload.subscriber.email,
            external_id: externalId ?? undefined,
          }
        }
        return {
          kind: "subscription_renewed",
          subscriber_id: payload.subscriber.id,
          subscription_id: payload.id,
          email: payload.subscriber.email,
        }
      case "canceled":
        return {
          kind: "subscription_canceled",
          subscriber_id: payload.subscriber.id,
          subscription_id: payload.id,
          email: payload.subscriber.email,
        }
      case "expired":
      case "inactive":
        return {
          kind: "subscription_expired",
          subscriber_id: payload.subscriber.id,
          subscription_id: payload.id,
          email: payload.subscriber.email,
        }
      default:
        return { kind: "noop" }
    }
  }
  if (payload.webhook_type === "transaction" && payload.status === "refunded") {
    return {
      kind: "transaction_refunded",
      transaction_id: payload.id,
      email: payload.contact.email,
    }
  }
  return { kind: "noop" }
}
