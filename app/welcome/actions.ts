"use server"

import {
  createAdminClient,
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase/server"
import {
  extendSubscription,
  markSubscriptionPaid,
} from "@/lib/subscriptions/actions"
import {
  getMemberByExternalId,
  type MemberRow,
} from "@/lib/subscriptions/queries"

/**
 * F-V19 RF-5 — /welcome claim.
 *
 * Cobre 2 caminhos:
 *   • Webhook Guru já chegou (member.status='paid'): só cria auth.user (se preciso)
 *     + gera magic link.
 *   • Webhook ainda não chegou (member.status='pending'): markSubscriptionPaid +
 *     extendSubscription antes do auth.user + magic link. Race com webhook é OK
 *     porque markSubscriptionPaid é idempotente; a única consequência é que
 *     o sponsor recompute F-V18 pode rodar 2x (idempotente).
 *
 * Não dispara notification subscription_paid daqui — o webhook é quem faz isso.
 * Se welcome rodar antes do webhook, a notification só aparece quando o webhook
 * chegar (poucos segundos depois).
 */

export type ClaimResult =
  | { ok: true; redirect_to: string; member_id: string }
  | { ok: false; error: string }

interface ClaimInput {
  external_id?: string | null
  transaction_id?: string | null
  email?: string | null
}

export async function claimPreRegistration(input: ClaimInput): Promise<ClaimResult> {
  if (!input.external_id && !input.email) {
    return { ok: false, error: "Token de transação ausente. Procure o suporte com seu comprovante." }
  }

  // Lookup: external_id (utm_term) OU email (redirect Guru só envia email).
  // Guru webhook sobrescreve guru_subscriber_id com subscription_id real,
  // então em races onde o webhook chega primeiro o token UUID original não bate.
  let member: MemberRow | null = null
  if (input.external_id) {
    member = await getMemberByExternalId(input.external_id)
  }
  if (!member && input.email) {
    const supabaseLookup = createServiceClient()
    const { data } = await supabaseLookup
      .from("members")
      .select("*")
      .eq("email", input.email.toLowerCase())
      .maybeSingle()
    member = (data as MemberRow | null) ?? null
  }
  if (!member) {
    return {
      ok: false,
      error:
        "Pré-cadastro não encontrado. Pode ser que o pagamento ainda esteja processando — aguarde 30s e atualize a página.",
    }
  }
  if (!member.email) {
    return { ok: false, error: "Member sem email cadastrado. Contate o suporte." }
  }

  // Garante paid + expires (idempotente se o webhook já tiver chegado).
  if (member.subscription_status !== "paid") {
    const paid = await markSubscriptionPaid(member.id)
    if (!paid.ok) {
      console.error("[claimPreRegistration] markPaid failed", paid)
      return { ok: false, error: "Erro ao ativar assinatura. Tente recarregar a página." }
    }
    const ext = await extendSubscription(member.id, 1)
    if (!ext.ok) {
      console.error("[claimPreRegistration] extend failed", ext)
      return { ok: false, error: "Assinatura ativa mas sem data de expiração. Suporte." }
    }
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
