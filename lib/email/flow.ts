import { createServiceClient } from "@/lib/supabase/server"
import { getResend, getFrom } from "./resend"
import { unsubscribeUrl } from "./unsubscribe"
import { sendOctopodsTemplate, firstNameOf, normalizeBrPhone } from "@/lib/whatsapp/octopods"

/**
 * F-V32 — motor do fluxo de e-mails (drip por gatilho "novo assinante").
 *
 * Peças:
 *   - email_flow_steps: passos editáveis (D+0, D+x...) — conteúdo no CMS.
 *   - email_flow_sends: 1 linha por (membro,passo) — idempotência + auditoria.
 *   - members.subscription_paid_at: âncora do D+0.
 *   - members.email_unsubscribed_at: descadastro → para o fluxo.
 *
 * Modos (env EMAIL_FLOW_MODE):
 *   - off (default): NÃO faz nada. Deploy inerte.
 *   - dryrun: grava status='dryrun' e NÃO envia.
 *   - live: envia (idempotente por linha em email_flow_sends).
 *
 * Allowlist (env EMAIL_FLOW_TEST_RECIPIENTS, vírgula): em live, só envia pros
 * e-mails da lista; os demais viram 'skipped'. Vazio = envia pra todos.
 *
 * NUNCA lança nas funções de envio — erros são engolidos/registrados pra não
 * derrubar gatilho/cron (Anti-SPEC §4).
 */

export type FlowMode = "off" | "dryrun" | "live"
export const DEFAULT_FLOW_KEY = "new_subscriber"

export function getFlowMode(): FlowMode {
  const v = (process.env.EMAIL_FLOW_MODE || "off").toLowerCase()
  return v === "dryrun" || v === "live" ? v : "off"
}

function allowlist(): string[] {
  return (process.env.EMAIL_FLOW_TEST_RECIPIENTS || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface FlowStep {
  id: string
  flow_key: string
  step_order: number
  delay_days: number
  subject: string
  body: string
  enabled: boolean
  /** F-V36 — ID do template no Octopods; null = passo sem WhatsApp. */
  whatsapp_template_id: string | null
}

/** F-V36 — modo do canal WhatsApp (independente do e-mail). */
export function getWhatsAppMode(): FlowMode {
  const v = (process.env.WHATSAPP_FLOW_MODE || "off").toLowerCase()
  return v === "dryrun" || v === "live" ? v : "off"
}

/** Allowlist de telefones (E.164) pra teste do WhatsApp em live. Vazio = todos. */
function whatsappAllowlist(): string[] {
  return (process.env.WHATSAPP_FLOW_TEST_RECIPIENTS || "")
    .split(",")
    .map((s) => normalizeBrPhone(s.trim()))
    .filter((s): s is string => Boolean(s))
}

/** Passos habilitados do fluxo, em ordem. */
export async function listEnabledSteps(flowKey = DEFAULT_FLOW_KEY): Promise<FlowStep[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_flow_steps")
    .select("*")
    .eq("flow_key", flowKey)
    .eq("enabled", true)
    .order("step_order", { ascending: true })
  if (error) {
    console.error("[listEnabledSteps]", error)
    return []
  }
  return (data || []) as FlowStep[]
}

/**
 * Monta o HTML final do passo: corpo do admin + rodapé com link de descadastro.
 * Placeholders suportados no corpo:
 *   {{nome}}        → primeiro nome do membro ("Olá, !" vira "Olá!" quando vazio)
 *   {{unsubscribe}} → link de descadastro (senão vai no rodapé)
 */
export function renderFlowStepHtml(
  body: string,
  unsubUrl: string | null,
  firstName?: string | null,
): string {
  const raw = body.includes("<") ? body : body.replace(/\n/g, "<br>")
  // {{nome}} → primeiro nome; limpa "Olá, !" quando não há nome.
  const fn = (firstName || "").trim().split(/\s+/)[0] || ""
  const content = raw.replace(/\{\{nome\}\}/g, fn).replace(/Olá,\s*!/g, "Olá!")
  const unsubLink = unsubUrl
    ? `<a href="${unsubUrl}" style="color:#9a9a9a;">descadastrar destes e-mails</a>`
    : "descadastrar (link indisponível)"
  const withPlaceholder = content.includes("{{unsubscribe}}")
    ? content.replace(/\{\{unsubscribe\}\}/g, unsubLink)
    : content
  const footerUnsub = content.includes("{{unsubscribe}}") ? "" : ` · ${unsubLink}`
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:24px;">
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;color:#1a1a1a;line-height:1.55;font-size:15px;">
    ${withPlaceholder}
    <hr style="border:none;border-top:1px solid #ececec;margin:28px 0 14px;">
    <p style="font-size:12px;color:#9a9a9a;margin:0;">Biohelp Nutrition Club · você recebe este e-mail por ser membro do clube${footerUnsub}.</p>
  </div>
</body></html>`
}

type StepResult = { status: "sent" | "failed" | "skipped" | "dryrun" | "noop"; error?: string }

/**
 * Envia (ou ensaia) UM passo pra UM membro, idempotente via email_flow_sends.
 * Retorna 'noop' quando já havia envio registrado (não duplica).
 * Não lança — em qualquer exceção devolve {status:'failed'}.
 */
export async function sendStepToMember(args: {
  memberId: string
  email: string
  name: string | null
  step: FlowStep
  mode: FlowMode
}): Promise<StepResult> {
  const { memberId, step } = args
  const email = args.email.trim().toLowerCase()
  try {
    if (args.mode === "off") return { status: "noop" }
    const supabase = createServiceClient()

    // Idempotência: já existe linha pra (member, flow, step, canal e-mail)? não reenvia.
    const { data: prior } = await supabase
      .from("email_flow_sends")
      .select("id")
      .eq("member_id", memberId)
      .eq("flow_key", step.flow_key)
      .eq("step_order", step.step_order)
      .eq("channel", "email")
      .maybeSingle()
    if (prior) return { status: "noop" }

    const record = async (status: StepResult["status"], error?: string) => {
      const { error: insErr } = await supabase.from("email_flow_sends").insert({
        member_id: memberId,
        flow_key: step.flow_key,
        step_order: step.step_order,
        channel: "email",
        status: status === "noop" ? "skipped" : status,
        email,
        error: error ?? null,
      })
      // 23505 = corrida com outra execução; o outro já gravou — tratamos como noop.
      if (insErr && insErr.code !== "23505") console.error("[sendStepToMember.record]", insErr)
    }

    if (!email || !email.includes("@")) {
      await record("skipped", "destinatário inválido")
      return { status: "skipped", error: "destinatário inválido" }
    }

    if (args.mode === "dryrun") {
      console.info(`[flow][DRYRUN] would_send step=${step.step_order} to=${email} member=${memberId}`)
      await record("dryrun")
      return { status: "dryrun" }
    }

    // live + allowlist
    const allow = allowlist()
    if (allow.length > 0 && !allow.includes(email)) {
      await record("skipped", "fora da allowlist")
      return { status: "skipped" }
    }

    const html = renderFlowStepHtml(step.body, unsubscribeUrl(memberId), args.name)
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to: email,
      subject: step.subject,
      html,
    })
    if (error) {
      await record("failed", error.message || "falha no envio")
      return { status: "failed", error: error.message }
    }
    await record("sent")
    console.info(`[flow][SENT] step=${step.step_order} to=${email} id=${data?.id ?? ""}`)
    return { status: "sent" }
  } catch (err) {
    console.error("[sendStepToMember] exception", err)
    return { status: "failed", error: "exceção no envio" }
  }
}

/**
 * F-V36 — envia (ou ensaia) o WhatsApp de UM passo pra UM membro via Octopods,
 * idempotente via email_flow_sends (channel='whatsapp'). Espelha sendStepToMember.
 * Só age se o passo tiver whatsapp_template_id. Nunca lança.
 */
export async function sendStepWhatsAppToMember(args: {
  memberId: string
  phone: string | null
  name: string | null
  step: FlowStep
  mode: FlowMode
}): Promise<StepResult> {
  const { memberId, step } = args
  try {
    if (args.mode === "off") return { status: "noop" }
    if (!step.whatsapp_template_id) return { status: "noop" } // passo sem WhatsApp
    const supabase = createServiceClient()

    // Idempotência por canal whatsapp.
    const { data: prior } = await supabase
      .from("email_flow_sends")
      .select("id")
      .eq("member_id", memberId)
      .eq("flow_key", step.flow_key)
      .eq("step_order", step.step_order)
      .eq("channel", "whatsapp")
      .maybeSingle()
    if (prior) return { status: "noop" }

    const record = async (status: StepResult["status"], error?: string) => {
      const { error: insErr } = await supabase.from("email_flow_sends").insert({
        member_id: memberId,
        flow_key: step.flow_key,
        step_order: step.step_order,
        channel: "whatsapp",
        status: status === "noop" ? "skipped" : status,
        email: null,
        error: error ?? null,
      })
      if (insErr && insErr.code !== "23505") console.error("[sendStepWhatsApp.record]", insErr)
    }

    const phone = normalizeBrPhone(args.phone)
    if (!phone) {
      await record("skipped", "telefone inválido/ausente")
      return { status: "skipped", error: "telefone inválido/ausente" }
    }

    if (args.mode === "dryrun") {
      console.info(`[whatsapp][DRYRUN] would_send step=${step.step_order} to=${phone} member=${memberId}`)
      await record("dryrun")
      return { status: "dryrun" }
    }

    // live + allowlist de telefones
    const allow = whatsappAllowlist()
    if (allow.length > 0 && !allow.includes(phone)) {
      await record("skipped", "fora da allowlist")
      return { status: "skipped" }
    }

    const r = await sendOctopodsTemplate({
      templateId: step.whatsapp_template_id,
      destinationPhone: phone,
      bodyVars: [firstNameOf(args.name)],
    })
    if (!r.ok) {
      await record("failed", r.error || "falha no envio")
      return { status: "failed", error: r.error }
    }
    await record("sent")
    console.info(`[whatsapp][SENT] step=${step.step_order} to=${phone} member=${memberId}`)
    return { status: "sent" }
  } catch (err) {
    console.error("[sendStepWhatsAppToMember] exception", err)
    return { status: "failed", error: "exceção no envio" }
  }
}

export interface FlowRunSummary {
  mode: FlowMode
  candidates: number
  steps: number
  sent: number
  dryrun: number
  skipped: number
  failed: number
  noop: number
  /** F-V36 — canal WhatsApp (Octopods). */
  whatsapp: {
    mode: FlowMode
    sent: number
    dryrun: number
    skipped: number
    failed: number
    noop: number
  }
}

/**
 * Corpo do cron: percorre assinantes pagos não-descadastrados e, pra cada passo
 * habilitado cujo delay já venceu (now - subscription_paid_at >= delay_days),
 * envia se ainda não houver registro. Idempotente.
 *
 * `now` injetável pra teste. Em mode 'off' retorna sem tocar em nada.
 */
export async function runNewSubscriberFlow(now: Date = new Date()): Promise<FlowRunSummary> {
  const mode = getFlowMode()
  const waMode = getWhatsAppMode()
  const summary: FlowRunSummary = {
    mode,
    candidates: 0,
    steps: 0,
    sent: 0,
    dryrun: 0,
    skipped: 0,
    failed: 0,
    noop: 0,
    whatsapp: { mode: waMode, sent: 0, dryrun: 0, skipped: 0, failed: 0, noop: 0 },
  }
  // Roda se e-mail OU whatsapp estiver ligado.
  if (mode === "off" && waMode === "off") return summary

  const steps = await listEnabledSteps()
  summary.steps = steps.length
  if (steps.length === 0) return summary

  const supabase = createServiceClient()
  // CORTE DE DATA: só entram na régua quem virou assinante a partir de
  // EMAIL_FLOW_START_DATE (ISO). Protege os assinantes atuais de receber a
  // sequência inteira de uma vez no 1º cron. Sem a env = ninguém entra (fail-safe).
  const startIso = (process.env.EMAIL_FLOW_START_DATE || "").trim()
  const start = startIso ? new Date(startIso) : null
  if (!start || Number.isNaN(start.getTime())) {
    console.warn("[runNewSubscriberFlow] EMAIL_FLOW_START_DATE ausente/inválida — nada a fazer")
    return summary
  }

  // Assinantes pagos, com data de pagamento >= corte, não descadastrados, com e-mail.
  const { data: members, error } = await supabase
    .from("members")
    .select("id, email, name, phone, subscription_paid_at")
    .eq("subscription_status", "paid")
    .not("subscription_paid_at", "is", null)
    .gte("subscription_paid_at", start.toISOString())
    .is("email_unsubscribed_at", null)
    .not("email", "is", null)
  if (error) {
    console.error("[runNewSubscriberFlow] members", error)
    return summary
  }

  const rows = (members || []) as Array<{
    id: string
    email: string | null
    name: string | null
    phone: string | null
    subscription_paid_at: string | null
  }>
  summary.candidates = rows.length

  for (const m of rows) {
    if (!m.email || !m.subscription_paid_at) continue
    const paidAt = new Date(m.subscription_paid_at).getTime()
    const ageDays = (now.getTime() - paidAt) / 86_400_000
    for (const step of steps) {
      if (ageDays < step.delay_days) continue // ainda não chegou a hora deste passo
      const res = await sendStepToMember({
        memberId: m.id,
        email: m.email,
        name: m.name,
        step,
        mode,
      })
      summary[res.status === "noop" ? "noop" : res.status] += 1

      // F-V36 — canal WhatsApp (só age se o passo tiver template + waMode != off).
      const wa = await sendStepWhatsAppToMember({
        memberId: m.id,
        phone: m.phone,
        name: m.name,
        step,
        mode: waMode,
      })
      summary.whatsapp[wa.status === "noop" ? "noop" : wa.status] += 1
    }
  }
  return summary
}

/**
 * F-V32 — dispara o passo D+0 na hora em que o membro vira assinante.
 * (Absorção do F-V30 — NÃO ligado ainda no markSubscriptionPaid; será o último
 * passo, depois do motor provado e do conteúdo do Leo cadastrado.)
 */
export async function fireStepZero(memberId: string): Promise<StepResult> {
  const mode = getFlowMode()
  const waMode = getWhatsAppMode()
  if (mode === "off" && waMode === "off") return { status: "noop" }
  const steps = await listEnabledSteps()
  const zero = steps.find((s) => s.step_order === 1 || s.delay_days === 0)
  if (!zero) return { status: "noop" }
  const supabase = createServiceClient()
  const { data: m } = await supabase
    .from("members")
    .select("id, email, name, phone, email_unsubscribed_at")
    .eq("id", memberId)
    .single()
  if (!m || !m.email || m.email_unsubscribed_at) return { status: "noop" }

  const emailRes = await sendStepToMember({
    memberId,
    email: m.email as string,
    name: (m.name as string | null) ?? null,
    step: zero,
    mode,
  })
  // F-V36 — dispara o WhatsApp do D+0 também (non-fatal, canal separado).
  await sendStepWhatsAppToMember({
    memberId,
    phone: (m.phone as string | null) ?? null,
    name: (m.name as string | null) ?? null,
    step: zero,
    mode: waMode,
  })
  return emailRes
}
