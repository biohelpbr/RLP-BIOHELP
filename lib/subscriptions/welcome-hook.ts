import { createServiceClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email/welcome"

/**
 * F-V30 — gatilho do e-mail de boas-vindas ao novo assinante.
 * Chamado de markSubscriptionPaid no momento da transição pra `paid` (changed=true),
 * que é o ponto único por onde TODO novo assinante passa (Guru + Shopify + manual).
 *
 * Modos (env WELCOME_EMAIL_MODE):
 *   - off (default): não faz nada. Deploy inerte.
 *   - dryrun: registra status='dryrun' e NÃO envia. Serve pro de-para vs subscription_paid_at.
 *   - live: envia de verdade (idempotente por status='sent'); grava sent/failed.
 *
 * Allowlist opcional (env WELCOME_TEST_RECIPIENTS, e-mails separados por vírgula):
 *   em modo live, só envia pros e-mails da lista; os demais viram status='skipped'.
 *   Vazio = envia pra todos. Permite a "compra-teste segura" (só seu e-mail recebe).
 *
 * NUNCA lança — qualquer erro é engolido, pra não derrubar markSubscriptionPaid/webhook.
 */

type Mode = "off" | "dryrun" | "live"

function getMode(): Mode {
  const v = (process.env.WELCOME_EMAIL_MODE || "off").toLowerCase()
  return v === "dryrun" || v === "live" ? v : "off"
}

function allowlist(): string[] {
  return (process.env.WELCOME_TEST_RECIPIENTS || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function onNewSubscriberWelcome(input: {
  memberId: string
  matched?: string | null
}): Promise<void> {
  try {
    const mode = getMode()
    if (mode === "off") return

    const supabase = createServiceClient()
    const { data: m } = await supabase
      .from("members")
      .select("id, email, name")
      .eq("id", input.memberId)
      .single()

    const email = (m?.email as string | undefined)?.trim()
    if (!m || !email) return // sem e-mail válido, nada a fazer

    const name = (m.name as string | null) ?? null
    const matched = input.matched ?? null

    // dry-run: só registra o ensaio, não envia, não checa idempotência.
    if (mode === "dryrun") {
      console.info(
        `[welcome][DRYRUN] would_send to=${email} name=${name ?? ""} member=${m.id} matched=${matched ?? ""}`,
      )
      await supabase.from("welcome_email_log").insert({
        member_id: m.id,
        email,
        status: "dryrun",
        matched,
      })
      return
    }

    // live: idempotência — se já mandou (sent), não reenvia.
    const { data: prior } = await supabase
      .from("welcome_email_log")
      .select("id")
      .eq("member_id", m.id)
      .eq("status", "sent")
      .maybeSingle()
    if (prior) return

    // live + allowlist: fora da lista vira 'skipped' (não envia).
    const allow = allowlist()
    if (allow.length > 0 && !allow.includes(email.toLowerCase())) {
      console.info(`[welcome][LIVE-skip] allowlist member=${m.id} to=${email}`)
      await supabase.from("welcome_email_log").insert({
        member_id: m.id,
        email,
        status: "skipped",
        matched,
      })
      return
    }

    const res = await sendWelcomeEmail({ to: email, name })
    await supabase.from("welcome_email_log").insert({
      member_id: m.id,
      email,
      status: res.ok ? "sent" : "failed",
      matched,
      error: res.ok ? null : res.error,
    })
  } catch (err) {
    console.error("[onNewSubscriberWelcome] isolated failure", err)
  }
}
