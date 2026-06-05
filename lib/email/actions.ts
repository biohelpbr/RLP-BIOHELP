"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { buildHtml, getFrom, getResend } from "./resend"
import { getCampaign, resolveSegmentMembers } from "./queries"
import { emailCampaignInputSchema, testEmailSchema } from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Cria a campanha como rascunho. */
export async function createCampaign(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = emailCampaignInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const member = await getCurrentMember()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_campaigns")
    .insert({
      subject: parsed.data.subject,
      body: parsed.data.body,
      from_label: getFrom(),
      segment: parsed.data.segment,
      status: "draft",
      created_by: member?.id ?? null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createCampaign]", error)
    return { ok: false, error: "Não foi possível criar a campanha." }
  }
  revalidatePath("/admin/emails")
  return { ok: true, data: { id: data.id as string } }
}

/**
 * W7 (call 05/06, auditoria "tudo é CMS") — edita uma campanha em RASCUNHO.
 * Campanha já enviada é histórico (imutável); o guard `.eq("status",'draft')`
 * garante que só rascunho muda.
 */
export async function updateCampaign(id: string, input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = emailCampaignInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_campaigns")
    .update({
      subject: parsed.data.subject,
      body: parsed.data.body,
      segment: parsed.data.segment,
    })
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[updateCampaign]", error)
    return { ok: false, error: "Não foi possível salvar a campanha." }
  }
  if (!data) {
    return { ok: false, error: "Só campanhas em rascunho podem ser editadas." }
  }

  revalidatePath("/admin/emails")
  revalidatePath(`/admin/emails/${id}`)
  return { ok: true }
}

/** Envia um e-mail de teste só pra um endereço (não registra na base). */
export async function sendTestEmail(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = testEmailSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: parsed.data.to,
      subject: `[TESTE] ${parsed.data.subject}`,
      html: buildHtml(parsed.data.body),
    })
    if (error) return { ok: false, error: `Falha no envio de teste: ${error.message}` }
  } catch (e) {
    console.error("[sendTestEmail]", e)
    return { ok: false, error: "Erro ao enviar o teste (verifique a RESEND_API_KEY)." }
  }
  return { ok: true }
}

/**
 * Dispara a campanha pra todos os membros do segmento (lotes de 100).
 * Registra 1 linha por destinatário com o resend_id (pro webhook atualizar status).
 * Outward-facing: só roda quando o admin confirma explicitamente na UI.
 */
export async function sendCampaign(id: string): Promise<ActionResult<{ sent: number; failed: number }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const campaign = await getCampaign(id)
  if (!campaign) return { ok: false, error: "Campanha não encontrada." }
  if (campaign.status === "sending") return { ok: false, error: "Esta campanha já está sendo enviada." }
  if (campaign.status === "sent") return { ok: false, error: "Esta campanha já foi enviada." }

  const members = await resolveSegmentMembers(campaign.segment)
  if (members.length === 0) return { ok: false, error: "Nenhum destinatário no segmento selecionado." }

  const supabase = createServiceClient()
  const nowIso = new Date().toISOString()
  await supabase
    .from("email_campaigns")
    .update({ status: "sending", total: members.length, updated_at: nowIso })
    .eq("id", id)

  const resend = getResend()
  const from = getFrom()
  const html = buildHtml(campaign.body)

  let sent = 0
  let failed = 0
  const recipients: Array<Record<string, unknown>> = []

  for (const group of chunk(members, 100)) {
    const payload = group.map((m) => ({
      from,
      to: m.email,
      subject: campaign.subject,
      html,
    }))
    try {
      const { data, error } = await resend.batch.send(payload)
      if (error) throw new Error(error.message)
      const ids = (data?.data ?? []) as Array<{ id: string }>
      group.forEach((m, i) => {
        sent++
        recipients.push({
          campaign_id: id,
          member_id: m.id,
          email: m.email,
          status: "sent",
          resend_id: ids[i]?.id ?? null,
        })
      })
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).slice(0, 300)
      group.forEach((m) => {
        failed++
        recipients.push({
          campaign_id: id,
          member_id: m.id,
          email: m.email,
          status: "failed",
          error: msg,
        })
      })
    }
  }

  for (const ins of chunk(recipients, 500)) {
    const { error } = await supabase.from("email_campaign_recipients").insert(ins)
    if (error) console.error("[sendCampaign.recipients]", error)
  }

  await supabase
    .from("email_campaigns")
    .update({
      status: failed === members.length ? "failed" : "sent",
      sent_count: sent,
      error_count: failed,
      sent_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)

  revalidatePath("/admin/emails")
  revalidatePath(`/admin/emails/${id}`)
  return { ok: true, data: { sent, failed } }
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const supabase = createServiceClient()
  const { error } = await supabase.from("email_campaigns").delete().eq("id", id)
  if (error) return { ok: false, error: "Não foi possível excluir a campanha." }
  revalidatePath("/admin/emails")
  return { ok: true }
}
