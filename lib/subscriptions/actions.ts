"use server"

import { randomUUID } from "node:crypto"

import { createServiceClient } from "@/lib/supabase/server"
import {
  PreRegistrationSchema,
  type PreRegistrationInput,
  type PreRegistrationResult,
} from "@/lib/subscriptions/schemas"
import { onMemberStatusChange } from "@/lib/tags/hook-on-status-change"
import { generateRefCode } from "@/lib/utils/ref-code"

type Result =
  | { ok: true; changed: boolean }
  | { ok: false; error: string }

/**
 * F-V03: marca a assinatura do membro como paga.
 * - Idempotente: se já está `paid`, retorna `{ok:true, changed:false}` sem reescrever timestamp.
 * - Após mudança bem-sucedida, dispara `onMemberStatusChange` pra recalcular tags F-V18 do sponsor.
 */
export async function markSubscriptionPaid(memberId: string): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }

  const supabase = createServiceClient()

  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("id, sponsor_id, subscription_status")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }

  if (current.subscription_status === "paid") {
    return { ok: true, changed: false }
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("members")
    .update({
      subscription_status: "paid",
      subscription_paid_at: now,
    })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[markSubscriptionPaid]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  // Hook F-V18: recompute tags do sponsor (não do membro alterado).
  // Falha do hook não derruba a mutação principal.
  await onMemberStatusChange({
    memberId,
    sponsorId: (current.sponsor_id as string | null) ?? null,
    newStatus: "paid",
  })

  return { ok: true, changed: true }
}

/**
 * F-V03: cancela a assinatura. Sponsor perde 1 ativo na contagem.
 */
export async function cancelSubscription(memberId: string): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }

  const supabase = createServiceClient()
  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("id, sponsor_id, subscription_status")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }

  if (current.subscription_status === "cancelled") {
    return { ok: true, changed: false }
  }

  const { error: updateErr } = await supabase
    .from("members")
    .update({ subscription_status: "cancelled" })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[cancelSubscription]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  await onMemberStatusChange({
    memberId,
    sponsorId: (current.sponsor_id as string | null) ?? null,
    newStatus: "cancelled",
  })

  return { ok: true, changed: true }
}

/**
 * F-V19: cria pré-cadastro (lista de espera) + monta URL do checkout Guru.
 * - Idempotente por (email + sponsor_id): re-submeter mesmo formulário não duplica member.
 * - Sponsor com `subscription_status='cancelled'` bloqueia novos cadastros.
 * - Notifica admin via tabela `notifications` (sininho).
 * - Comissão NÃO dispara aqui — só quando webhook Guru confirmar pagamento (ver markSubscriptionPaid).
 */
export async function createPreRegistration(
  input: PreRegistrationInput
): Promise<PreRegistrationResult> {
  const parsed = PreRegistrationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." }
  }

  const supabase = createServiceClient()

  const { data: sponsor, error: sponsorErr } = await supabase
    .from("members")
    .select("id, ref_code, name, subscription_status")
    .eq("ref_code", parsed.data.ref_code)
    .maybeSingle()

  if (sponsorErr) {
    console.error("[createPreRegistration] sponsor lookup", sponsorErr)
    return { ok: false, error: "Erro ao validar convite." }
  }
  if (!sponsor) return { ok: false, error: "Convite não encontrado." }
  if (sponsor.subscription_status === "cancelled") {
    return { ok: false, error: "Este link não está mais ativo." }
  }

  const { data: existing } = await supabase
    .from("members")
    .select("id, guru_subscriber_id")
    .eq("email", parsed.data.email)
    .eq("sponsor_id", sponsor.id)
    .maybeSingle()

  let memberId: string
  let token: string

  if (existing) {
    memberId = existing.id as string
    token = (existing.guru_subscriber_id as string | null) ?? randomUUID()
    if (!existing.guru_subscriber_id) {
      const { error: tokenErr } = await supabase
        .from("members")
        .update({ guru_subscriber_id: token })
        .eq("id", memberId)
      if (tokenErr) {
        console.error("[createPreRegistration] token refresh", tokenErr)
        return { ok: false, error: "Erro ao atualizar pré-cadastro." }
      }
    }
  } else {
    const refCode = await generateRefCode()
    token = randomUUID()

    const { data: newMember, error: insertErr } = await supabase
      .from("members")
      .insert({
        ref_code: refCode,
        sponsor_id: sponsor.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        auth_user_id: null,
        subscription_status: "pending",
        pre_registered_at: new Date().toISOString(),
        guru_subscriber_id: token,
        status: "inactive",
        level: "membro",
      })
      .select("id")
      .single()

    if (insertErr || !newMember) {
      console.error("[createPreRegistration] insert", insertErr)
      return { ok: false, error: "Erro ao criar pré-cadastro." }
    }
    memberId = newMember.id as string

    // referral_events schema atual: member_id (novo membro), ref_code_used, utm_json.
    // sponsor_id e kind ficam no utm_json (jsonb livre).
    await supabase.from("referral_events").insert({
      member_id: memberId,
      ref_code_used: sponsor.ref_code,
      utm_json: {
        kind: "pre_registration",
        sponsor_id: sponsor.id,
      },
    })
  }

  await supabase.from("notifications").insert({
    recipient_role: "admin",
    kind: "pre_registration_created",
    title: `Novo pré-cadastro: ${parsed.data.name}`,
    body: `Convidado(a) por ${sponsor.name ?? sponsor.ref_code}. Aguardando pagamento.`,
    href: `/admin/community/${memberId}`,
  })

  // Digital Manager Guru não tem campo `metadata.external_id` na URL do checkout.
  // Workaround documentado em docs/wiki/runbooks/webhook-guru-debug.md:
  // passamos o token como `utm_term`; Guru ecoa em `source.utm_term` no webhook.
  // TODO 🟡 Léo: confirmar URL base real copiando do painel Guru
  //   (doc oficial: https://clkdmg.site/subscribe/<offer_uuid>;
  //    SPEC original assumia https://pay.guru.com.br/<id> — pode ser alias).
  // TODO 🟡 Léo: confirmar se Guru aceita pré-população via ?email&name&cpf&phone
  //   (não documentado publicamente — se não funcionar, lead redigita no checkout).
  const offerId = process.env.GURU_OFFER_ID_CLUBE_MENSAL ?? "PLACEHOLDER"
  const params = new URLSearchParams({
    email: parsed.data.email,
    name: parsed.data.name,
    cpf: parsed.data.cpf,
    phone: parsed.data.phone,
    utm_source: "lrp",
    utm_medium: "pre_registration",
    utm_campaign: sponsor.ref_code,
    utm_term: token,
  })
  const guruRedirectUrl = `https://clkdmg.site/subscribe/${offerId}?${params.toString()}`

  return {
    ok: true,
    member_id: memberId,
    transaction_token: token,
    guru_redirect_url: guruRedirectUrl,
  }
}

/**
 * F-V19: estende `subscription_expires_at` em +N anos a partir da data atual de expiração
 * (acumula em vez de resetar — renovação antecipada continua valendo).
 * Se `subscription_expires_at` for null, parte de `now()`.
 * Sempre liga `subscription_auto_renew=true` (renovação confirmada pelo Guru).
 */
export async function extendSubscription(
  memberId: string,
  years: number = 1
): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }
  if (!Number.isFinite(years) || years <= 0) {
    return { ok: false, error: "years deve ser > 0" }
  }

  const supabase = createServiceClient()
  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("subscription_expires_at")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }

  const base = current.subscription_expires_at
    ? new Date(current.subscription_expires_at as string)
    : new Date()
  const next = new Date(base)
  next.setFullYear(next.getFullYear() + years)

  const { error: updateErr } = await supabase
    .from("members")
    .update({
      subscription_expires_at: next.toISOString(),
      subscription_auto_renew: true,
    })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[extendSubscription]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  return { ok: true, changed: true }
}

/**
 * F-V19: marca `subscription_auto_renew=false` (cancelamento da renovação).
 * NÃO inativa o member — o cron diário (inactivate-expired-subscriptions)
 * é quem move para `cancelled` quando `expires_at < now()`.
 * Idempotente.
 */
export async function cancelAutoRenew(memberId: string): Promise<Result> {
  if (!memberId) return { ok: false, error: "memberId obrigatório" }

  const supabase = createServiceClient()
  const { data: current, error: readErr } = await supabase
    .from("members")
    .select("subscription_auto_renew")
    .eq("id", memberId)
    .single()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "member não encontrado" }
  }
  if (current.subscription_auto_renew === false) {
    return { ok: true, changed: false }
  }

  const { error: updateErr } = await supabase
    .from("members")
    .update({ subscription_auto_renew: false })
    .eq("id", memberId)

  if (updateErr) {
    console.error("[cancelAutoRenew]", updateErr)
    return { ok: false, error: updateErr.message }
  }

  return { ok: true, changed: true }
}
