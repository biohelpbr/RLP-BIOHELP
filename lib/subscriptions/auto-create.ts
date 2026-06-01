/**
 * F-V19 hotfix go-live 01/06/2026: lookup-or-create de member pós-pagamento.
 *
 * Caminho 1 (/convite → Guru): member existe (criado por createPreRegistration),
 *   já tem sponsor real, vínculo guru_subscriber_id ou email casa.
 *
 * Caminho 2 (checkout direto sem /convite): nada existe no DB. Pagamento OK no
 *   Guru, redirect manda email+name+phone pra cá. Auto-criamos member com
 *   sponsor_id=HOUSE (sem comissão de afiliado) pra que /welcome e webhook
 *   consigam ativar e logar.
 *
 * Reutilizado em /welcome (actions.ts) e webhook Guru (route.ts) pra que ambos
 *   caminhos resolvam o mesmo membro — não tem race.
 *
 * Anti-SPEC: sponsor_id=HOUSE em vez de NULL preserva a invariante de v2
 *   "todo member tem sponsor". HOUSE_ACCOUNT_ID é a row fixa Biohelp House.
 */

import { createServiceClient } from "@/lib/supabase/server"
import { generateRefCode, HOUSE_ACCOUNT_ID } from "@/lib/utils/ref-code"
import { getMemberByExternalId, type MemberRow } from "@/lib/subscriptions/queries"

export interface FindOrCreateInput {
  email: string
  name?: string | null
  phone?: string | null
  externalId?: string | null
}

export interface FindOrCreateResult {
  ok: true
  member: MemberRow
  created: boolean
}

export interface FindOrCreateError {
  ok: false
  error: string
}

export async function findOrCreateMemberFromCheckout(
  input: FindOrCreateInput,
): Promise<FindOrCreateResult | FindOrCreateError> {
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: "email_required" }

  const supabase = createServiceClient()

  // 1. Lookup por external_id (Guru subscription id ou token de pré-cadastro).
  let member: MemberRow | null = null
  if (input.externalId) {
    member = await getMemberByExternalId(input.externalId)
  }

  // 2. Lookup por email.
  if (!member) {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("email", email)
      .maybeSingle()
    member = (data as MemberRow | null) ?? null
  }

  if (member) {
    return { ok: true, member, created: false }
  }

  // 3. Não achou — auto-criar com HOUSE como sponsor.
  const refCode = await generateRefCode()
  const name = (input.name?.trim() || email.split("@")[0] || "Cliente").slice(0, 120)
  const phone = input.phone?.replace(/\D/g, "") || null

  const { data: created, error: insertErr } = await supabase
    .from("members")
    .insert({
      ref_code: refCode,
      sponsor_id: HOUSE_ACCOUNT_ID,
      name,
      email,
      phone,
      auth_user_id: null,
      subscription_status: "pending",
      pre_registered_at: new Date().toISOString(),
      status: "inactive",
      level: "membro",
    })
    .select("*")
    .single()

  if (insertErr || !created) {
    console.error("[findOrCreateMember] insert failed", insertErr)
    return { ok: false, error: insertErr?.message || "insert_failed" }
  }

  // Log do caminho "direct_checkout" pra distinguir de /convite.
  await supabase.from("referral_events").insert({
    member_id: created.id,
    ref_code_used: "HOUSE",
    utm_json: {
      kind: "direct_checkout",
      sponsor_id: HOUSE_ACCOUNT_ID,
      source: input.externalId ? "external_id" : "email_redirect",
    },
  })

  await supabase.from("notifications").insert({
    recipient_role: "admin",
    kind: "pre_registration_created",
    title: `Compra direta (sem /convite): ${name}`,
    body: `Checkout sem indicador (sponsor=HOUSE). Verifique se precisa atribuir sponsor manual.`,
    href: `/admin/community/${created.id}`,
  })

  console.info("[findOrCreateMember] auto-created member from direct checkout", {
    memberId: created.id,
    email,
    refCode,
  })

  return { ok: true, member: created as MemberRow, created: true }
}
