"use server"

import {
  createAdminClient,
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase/server"
import { markSubscriptionPaid } from "@/lib/subscriptions/actions"
import { findMemberFromCheckout } from "@/lib/subscriptions/auto-create"

/**
 * F-V19 RF-5 — /welcome claim.
 *
 * Responsabilidade do /welcome: garantir sessão logada na hora (UX pós-checkout).
 *   1. Localiza o member (por external_id/utm_term ou email).
 *   2. markSubscriptionPaid (idempotente) — só pra liberar o dashboard na hora.
 *   3. Cria auth.user (se preciso) + estabelece sessão via verifyOtp.
 *
 * O que o /welcome NÃO faz (de propósito): estender a assinatura, pagar comissão
 * de ativação, sincronizar Shopify e disparar CRM. Tudo isso é responsabilidade
 * EXCLUSIVA do webhook do Guru (app/api/webhooks/guru/route.ts, case
 * subscription_activated), keyed no subscription_id REAL do Guru, pra acontecer
 * exatamente 1x por ativação — mesmo no caminho normal em que o /welcome roda
 * ANTES do webhook chegar. (Antes, o /welcome estendia a assinatura e o webhook
 * estendia de novo → dobro; e a comissão, gated em paid.changed, era perdida
 * porque o /welcome já consumia a transição pending→paid.)
 *
 * Estado degradado conhecido: se o webhook nunca chegar, o member fica `paid`
 * (UX OK) mas SEM extensão/comissão/Shopify/CRM. Não é "broken" — é detectável
 * pelo log [welcome] abaixo + ausência do evento em guru_webhook_events.
 *
 * Não dispara notification subscription_paid daqui — o webhook é quem faz isso.
 */

export type ClaimResult =
  | { ok: true; redirect_to: string; member_id: string }
  | { ok: false; error: string }

interface ClaimInput {
  external_id?: string | null
  transaction_id?: string | null
  email?: string | null
  name?: string | null
  phone?: string | null
}

export async function claimPreRegistration(input: ClaimInput): Promise<ClaimResult> {
  if (!input.external_id && !input.email) {
    return { ok: false, error: "Token de transação ausente. Procure o suporte com seu comprovante." }
  }

  // F-V19 hotfix 02/06 (security): /welcome usa lookup-only. Auto-create
  // ficou exclusivo do webhook Guru (autenticado por api_token). Sem isso,
  // qualquer URL `/welcome?email=X` criava conta+sessão sem validação ←
  // vetor de auth bypass + spam.
  //
  // Race possível: redirect Guru chega ANTES do webhook activate criar o
  // member. Cliente vê msg "aguardando confirmação" e atualiza em ~30s.
  if (!input.email) {
    return { ok: false, error: "Email não recebido do checkout. Contate o suporte." }
  }
  const resolved = await findMemberFromCheckout({
    email: input.email,
    externalId: input.external_id ?? null,
  })
  if (!resolved.ok) {
    if (resolved.error === "not_found") {
      return {
        ok: false,
        error:
          "Sua compra ainda está sendo confirmada pelo Guru. Aguarde uns 30 segundos e atualize esta página. Se persistir, fale com o suporte com seu comprovante.",
      }
    }
    console.error("[claimPreRegistration] findMember failed", resolved)
    return { ok: false, error: "Erro ao localizar membro. Contate o suporte." }
  }
  const member = resolved.member
  if (!member.email) {
    return { ok: false, error: "Member sem email cadastrado. Contate o suporte." }
  }

  // Só marca paid (idempotente) pra liberar o dashboard na hora. Extensão,
  // comissão, Shopify e CRM são donos EXCLUSIVOS do webhook (ver JSDoc).
  if (member.subscription_status !== "paid") {
    const paid = await markSubscriptionPaid(member.id)
    if (!paid.ok) {
      console.error("[claimPreRegistration] markPaid failed", paid)
      return { ok: false, error: "Erro ao ativar assinatura. Tente recarregar a página." }
    }
    console.info(
      "[welcome] paid set for UX; extension/commission/sync depend on webhook",
      { memberId: member.id },
    )
  }

  const admin = createAdminClient()
  const supabase = createServiceClient()

  // Cria auth.user se ainda não existe.
  let authUserId = member.auth_user_id as string | null
  if (!authUserId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: member.email,
      email_confirm: true,
      user_metadata: { member_id: member.id, ref_code: member.ref_code },
    })
    if (createErr || !created?.user) {
      // Pode falhar com "email already exists" se auth.user existe mas o link
      // members.auth_user_id ainda não foi feito (cenário raro). Tenta lookup.
      console.warn("[claimPreRegistration] createUser falhou", createErr?.message)
      const { data: existing } = await admin.auth.admin.listUsers()
      const found = existing?.users.find((u) => u.email?.toLowerCase() === member.email!.toLowerCase())
      if (!found) {
        return { ok: false, error: "Erro ao criar usuário. Suporte." }
      }
      authUserId = found.id
    } else {
      authUserId = created.user.id
    }

    const { error: linkErr } = await supabase
      .from("members")
      .update({ auth_user_id: authUserId })
      .eq("id", member.id)
    if (linkErr) {
      console.error("[claimPreRegistration] link auth_user_id failed", linkErr)
      return { ok: false, error: "Erro ao vincular usuário ao membro. Suporte." }
    }
  }

  // Gera magic link só pra extrair `hashed_token`. Depois consumimos
  // server-side via verifyOtp pra setar cookie de sessão na hora, evitando
  // o fluxo de fragmento (#access_token=...) que requer JS no /login pra
  // processar — coisa que V2Login ainda não faz (ver V2Login JSDoc).
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: member.email,
  })

  const tokenHash = linkData?.properties?.hashed_token
  if (linkErr || !tokenHash) {
    console.error("[claimPreRegistration] generateLink failed", linkErr)
    return { ok: false, error: "Erro ao gerar link de login. Tente novamente em alguns segundos." }
  }

  // verifyOtp via cliente cookie-aware → seta sb-* cookies no response.
  const browserClient = await createServerSupabaseClient()
  const { error: otpErr } = await browserClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  })
  if (otpErr) {
    console.error("[claimPreRegistration] verifyOtp failed", otpErr)
    return { ok: false, error: "Erro ao estabelecer sessão. Tente novamente." }
  }

  return { ok: true, redirect_to: "/dashboard", member_id: member.id }
}
