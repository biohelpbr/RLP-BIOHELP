"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient, createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import {
  cancelAutoRenew,
  cancelSubscription,
  extendSubscription,
  markSubscriptionPaid,
} from "@/lib/subscriptions/actions"
import { syncCustomerToShopify } from "@/lib/shopify/customer"
import {
  generateProvisionalPassword,
  sendProvisionalPasswordEmail,
} from "@/lib/auth/provisional-password"

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<ActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Apenas administradores podem executar esta ação." }
  }
  return { ok: true }
}

/**
 * F-V24 — Cancelamento manual da RENOVAÇÃO (admin).
 * Regra de negócio (call 02/06): só desliga o auto-renovar; o membro mantém o
 * acesso até o fim do ciclo. O cron diário move pra `cancelled` quando expira.
 */
export async function adminCancelRenewal(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const res = await cancelAutoRenew(memberId)
  if (!res.ok) return { ok: false, error: res.error }

  revalidatePath(`/admin/community/${memberId}`)
  revalidatePath("/admin/community")
  return { ok: true }
}

/**
 * Ativação MANUAL da assinatura (admin) — pedido call 03/06 (Gabriel: "tem como
 * ativar um membro manualmente?"). Usado para a turma de vendas e contas criadas
 * à mão que precisam ficar ativas sem passar pelo checkout do Guru.
 *
 * Replica o efeito da ativação via webhook: subscription_status='paid' (+ tags
 * do sponsor), estende o ciclo de acesso e liga o auto-renovar, normaliza o
 * status legado e sincroniza a tag `subscriber` na Shopify (best-effort).
 *
 * NÃO cria credencial de login — para o membro conseguir entrar, use a senha
 * provisória (adminGenerateProvisionalPassword) ou o login por código.
 */
export async function adminActivateMember(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const paid = await markSubscriptionPaid(memberId)
  if (!paid.ok) return { ok: false, error: paid.error }

  const ext = await extendSubscription(memberId, 1)
  if (!ext.ok) return { ok: false, error: ext.error }

  const supabase = createServiceClient()
  // Coerência do status legado (badge do detalhe lê `status`).
  await supabase.from("members").update({ status: "active" }).eq("id", memberId)

  // Sincroniza acesso na Shopify (aplica tag subscriber). Best-effort.
  try {
    const { data: m } = await supabase
      .from("members")
      .select("email, name, ref_code, sponsor_id")
      .eq("id", memberId)
      .single()
    if (m?.email) {
      let sponsorRefCode: string | null = null
      if (m.sponsor_id) {
        const { data: s } = await supabase
          .from("members")
          .select("ref_code")
          .eq("id", m.sponsor_id as string)
          .single()
        sponsorRefCode = (s?.ref_code as string | null) ?? null
      }
      const nameParts = ((m.name as string | null) ?? "").split(" ")
      await syncCustomerToShopify({
        email: m.email as string,
        firstName: nameParts[0] || "Parceira",
        lastName: nameParts.slice(1).join(" ") || "",
        refCode: (m.ref_code as string) ?? "",
        sponsorRefCode,
        status: "active",
      })
    }
  } catch (e) {
    console.error("[adminActivateMember] shopify sync (non-fatal)", e)
  }

  revalidatePath(`/admin/community/${memberId}`)
  revalidatePath("/admin/community")
  return { ok: true }
}

type ProvisionalPasswordResult =
  | { ok: true; password: string; emailSent: boolean }
  | { ok: false; error: string }

/**
 * F-V28 — Gera uma SENHA PROVISÓRIA pro membro (admin sob demanda).
 * Caminho de emergência quando a parceira não recebe o código OTP por e-mail.
 *
 * - Grava a senha no Supabase Auth user (cria/linka o auth_user se faltar — mesmo
 *   padrão do /welcome) e marca `app_metadata.must_reset_password=true`, que o
 *   middleware usa pra forçar a troca no primeiro acesso.
 * - Retorna a senha em claro UMA vez (mostrada no admin pra repasse manual) e
 *   também tenta enviá-la por e-mail (Resend). Falha de e-mail não derruba a ação.
 */
export async function adminGenerateProvisionalPassword(
  memberId: string,
): Promise<ProvisionalPasswordResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, email, name, auth_user_id")
    .eq("id", memberId)
    .single()

  if (memberErr || !member?.email) {
    return { ok: false, error: "Membro não encontrado ou sem e-mail." }
  }

  const admin = createAdminClient()
  const email = (member.email as string).toLowerCase().trim()
  const password = generateProvisionalPassword()

  // Garante o auth_user (membros do Guru podem ter auth_user_id nulo até o 1º login).
  let authUserId = member.auth_user_id as string | null
  if (!authUserId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { must_reset_password: true },
      user_metadata: { member_id: member.id },
    })
    if (createErr || !created?.user) {
      // Pode existir auth.user sem o link em members.auth_user_id. Faz lookup.
      const { data: existing } = await admin.auth.admin.listUsers()
      const found = existing?.users.find(
        (u) => u.email?.toLowerCase() === email,
      )
      if (!found) {
        console.error("[adminGenerateProvisionalPassword] createUser falhou", createErr?.message)
        return { ok: false, error: "Erro ao preparar o usuário de autenticação." }
      }
      authUserId = found.id
    } else {
      authUserId = created.user.id
    }

    await supabase
      .from("members")
      .update({ auth_user_id: authUserId })
      .eq("id", member.id)
  }

  // Se o auth_user já existia (ou veio do fallback de lookup), grava senha + flag.
  const { error: updErr } = await admin.auth.admin.updateUserById(authUserId, {
    password,
    app_metadata: { must_reset_password: true },
  })
  if (updErr) {
    console.error("[adminGenerateProvisionalPassword] updateUserById", updErr.message)
    return { ok: false, error: "Erro ao definir a senha provisória." }
  }

  const mail = await sendProvisionalPasswordEmail(
    email,
    member.name as string | null,
    password,
  )

  console.info("[adminGenerateProvisionalPassword] senha gerada", {
    memberId: member.id,
    emailSent: mail.ok,
  })

  return { ok: true, password, emailSent: mail.ok }
}

/**
 * F-V24 — Cancelamento IMEDIATO (com estorno) (admin).
 * Regra de negócio (call 02/06): corta o acesso na hora — `subscription_status`
 * vira `cancelled` + remove a tag `subscriber` na Shopify (preço de clube some).
 * Usado quando o Gabriel já estornou no Guru e precisa cortar o acesso já.
 */
export async function adminCancelImmediate(memberId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const res = await cancelSubscription(memberId)
  if (!res.ok) return { ok: false, error: res.error }

  const supabase = createServiceClient()
  // Coerência: imediato também desliga o auto-renovar.
  await supabase
    .from("members")
    .update({ subscription_auto_renew: false })
    .eq("id", memberId)

  // Revoga acesso na Shopify (remove tag subscriber). Best-effort — não derruba a ação.
  try {
    const { data: m } = await supabase
      .from("members")
      .select("email, name, ref_code, sponsor_id")
      .eq("id", memberId)
      .single()
    if (m?.email) {
      let sponsorRefCode: string | null = null
      if (m.sponsor_id) {
        const { data: s } = await supabase
          .from("members")
          .select("ref_code")
          .eq("id", m.sponsor_id as string)
          .single()
        sponsorRefCode = (s?.ref_code as string | null) ?? null
      }
      const nameParts = ((m.name as string | null) ?? "").split(" ")
      await syncCustomerToShopify({
        email: m.email as string,
        firstName: nameParts[0] || "Parceira",
        lastName: nameParts.slice(1).join(" ") || "",
        refCode: (m.ref_code as string) ?? "",
        sponsorRefCode,
        status: "inactive",
      })
    }
  } catch (e) {
    console.error("[adminCancelImmediate] shopify revoke (non-fatal)", e)
  }

  revalidatePath(`/admin/community/${memberId}`)
  revalidatePath("/admin/community")
  return { ok: true }
}
