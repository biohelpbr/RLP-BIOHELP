/**
 * F-V19 — Simulador local de webhook Guru (DEV only).
 *
 * Gera payload no formato REAL (não SPEC original) e chama o handler interno
 * /api/webhooks/guru via fetch. Sem HMAC: Guru valida via `api_token` no body.
 * X-Request-ID enviado no header (idempotência idêntica ao Guru real).
 *
 * Habilitado apenas quando NODE_ENV !== 'production' OU DEV_SIMULATE_GURU=true.
 * Remoção: deletar este arquivo quando webhook Guru real estiver em produção.
 *
 * Payload mínimo aceito:
 *   {
 *     "kind": "activated" | "renewed" | "canceled" | "expired" | "refunded",
 *     "external_id": "<uuid do pré-cadastro — chave primária de lookup>",
 *     "email": "<email do lead>",
 *     "subscription_id"?: "<sub id Guru, default sub_<ts>>",
 *     "charged_times"?: <number — 1 ativa, 2+ renova>
 *   }
 */

import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type SimulateInput = {
  kind?: "activated" | "renewed" | "canceled" | "expired" | "refunded"
  external_id?: string
  email?: string
  subscription_id?: string
  transaction_id?: string
  charged_times?: number
}

function buildSubscriptionPayload(args: {
  apiToken: string
  externalId?: string
  email: string
  subscriptionId: string
  lastStatus: "started" | "canceled" | "expired"
  chargedTimes: number
}) {
  return {
    api_token: args.apiToken,
    webhook_type: "subscription" as const,
    id: args.subscriptionId,
    last_status: args.lastStatus,
    subscriber: {
      id: `sber_${args.subscriptionId}`,
      email: args.email,
    },
    product: {
      id: "prod_mock_clube_mensal",
      name: "Clube Biohelp (mock)",
      offer: { id: process.env.GURU_OFFER_ID_CLUBE_MENSAL ?? "offer_mock" },
    },
    charged_times: args.chargedTimes,
    source: {
      utm_source: "lrp",
      utm_medium: "pre_registration",
      utm_term: args.externalId ?? null,
    },
    dates: {
      started_at: Math.floor(Date.now() / 1000),
    },
  }
}

function buildTransactionRefundPayload(args: {
  apiToken: string
  email: string
  transactionId: string
}) {
  return {
    api_token: args.apiToken,
    webhook_type: "transaction" as const,
    id: args.transactionId,
    status: "refunded" as const,
    contact: { email: args.email },
    product: {
      id: "prod_mock_clube_mensal",
      name: "Clube Biohelp (mock)",
    },
    dates: {
      created_at: Math.floor(Date.now() / 1000),
    },
  }
}

export async function POST(req: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEV_SIMULATE_GURU !== "true"
  ) {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 })
  }

  const apiToken = process.env.GURU_WEBHOOK_API_TOKEN
  if (!apiToken) {
    return NextResponse.json(
      { error: "GURU_WEBHOOK_API_TOKEN not set in env" },
      { status: 500 },
    )
  }

  let body: SimulateInput
  try {
    body = (await req.json()) as SimulateInput
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.email) {
    return NextResponse.json(
      { error: "field `email` required" },
      { status: 400 },
    )
  }

  const kind = body.kind ?? "activated"
  const ts = Date.now()
  const subscriptionId = body.subscription_id ?? `sub_${ts}`
  const transactionId = body.transaction_id ?? `tx_${ts}`

  let payload: object
  switch (kind) {
    case "activated":
      payload = buildSubscriptionPayload({
        apiToken,
        externalId: body.external_id,
        email: body.email,
        subscriptionId,
        lastStatus: "started",
        chargedTimes: body.charged_times ?? 1,
      })
      break
    case "renewed":
      payload = buildSubscriptionPayload({
        apiToken,
        externalId: body.external_id,
        email: body.email,
        subscriptionId,
        lastStatus: "started",
        chargedTimes: body.charged_times ?? 2,
      })
      break
    case "canceled":
      payload = buildSubscriptionPayload({
        apiToken,
        externalId: body.external_id,
        email: body.email,
        subscriptionId,
        lastStatus: "canceled",
        chargedTimes: body.charged_times ?? 1,
      })
      break
    case "expired":
      payload = buildSubscriptionPayload({
        apiToken,
        externalId: body.external_id,
        email: body.email,
        subscriptionId,
        lastStatus: "expired",
        chargedTimes: body.charged_times ?? 1,
      })
      break
    case "refunded":
      payload = buildTransactionRefundPayload({
        apiToken,
        email: body.email,
        transactionId,
      })
      break
    default:
      return NextResponse.json(
        { error: `unknown kind: ${kind}` },
        { status: 400 },
      )
  }

  const requestId = `dev_${kind}_${ts}`
  const origin = new URL(req.url).origin
  const targetUrl = `${origin}/api/webhooks/guru`

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to call /api/webhooks/guru", detail: String(err) },
      { status: 502 },
    )
  }

  const handlerJson = await response.json().catch(() => ({}))

  return NextResponse.json({
    simulated: {
      kind,
      request_id: requestId,
      target_url: targetUrl,
      payload,
    },
    handler_response: {
      status: response.status,
      body: handlerJson,
    },
  })
}
