/**
 * F-V20 — CRM Absolut (outbound).
 *
 * Envia eventos de lead/cliente para o CRM do Abner via webhook HTTP.
 * Contrato confirmado pelo cliente (Abner):
 *   • Campos: nome, telefone, email, codigo_indicacao. SEM CPF/CNPJ.
 *   • Dois eventos via etiqueta: "lead_novo" e "virou_cliente".
 *   • Telefone DEVE sair em +55 (no repo gravamos só dígitos nacionais, ~11).
 *   • Token/senha ainda NÃO confirmado pelo Abner → suporte opcional via env.
 *
 * Anti-SPEC §4: módulo isolado, SEMPRE non-fatal. Nenhuma falha aqui pode
 * derrubar o chamador (webhook Guru / server action). try/catch envolve tudo.
 *
 * Wiring em app/api/webhooks/guru/route.ts e lib/subscriptions/actions.ts
 * fica para outra sessão — este módulo só expõe `sendToAbsolut`.
 */

export interface SendToAbsolutInput {
  evento: "lead_novo" | "virou_cliente"
  nome: string
  email: string
  telefone: string
  codigoIndicacao: string | null
}

export interface SendToAbsolutResult {
  ok: boolean
  skipped?: boolean
  error?: string
}

/**
 * Normaliza um telefone brasileiro para o formato E.164 com DDI: `+55XXXXXXXXXXX`.
 *
 * No repo gravamos só dígitos nacionais (10-11 dígitos: DDD + número). Quando
 * já vier com DDI (12-13 dígitos começando com 55) não duplica o prefixo.
 * Números nacionais com DDD 55 (Santa Maria/RS) têm 11 dígitos, logo nunca
 * colidem com a checagem de DDI (que exige ≥12 dígitos).
 */
export function formatPhoneBR(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length >= 12 && digits.startsWith("55")) {
    return `+${digits}`
  }
  return `+55${digits}`
}

/**
 * Envia um evento ao CRM Absolut. SEMPRE non-fatal — nunca lança pro chamador.
 *
 * Comportamento:
 *  • Gated por `CRM_ABSOLUT_LIVE`: se != "true", retorna { ok, skipped } sem rede.
 *  • URL em `CRM_ABSOLUT_WEBHOOK_URL`; ausente → { ok:false, error:"missing_url" }.
 *  • Header `Authorization: Bearer <token>` só se `CRM_ABSOLUT_TOKEN` existir.
 *  • POST JSON { evento, nome, email, telefone(+55), codigo_indicacao }.
 */
export async function sendToAbsolut(input: SendToAbsolutInput): Promise<SendToAbsolutResult> {
  try {
    // Gate: desligado por padrão. Só envia quando explicitamente "true".
    if (process.env.CRM_ABSOLUT_LIVE !== "true") {
      return { ok: true, skipped: true }
    }

    const url = process.env.CRM_ABSOLUT_WEBHOOK_URL
    if (!url) {
      console.warn("[crm-absolut] CRM_ABSOLUT_WEBHOOK_URL ausente — pulando envio (non-fatal)")
      return { ok: false, error: "missing_url" }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    // Token ainda não confirmado pelo Abner — só envia o header se a env existir.
    const token = process.env.CRM_ABSOLUT_TOKEN
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const body = {
      evento: input.evento,
      nome: input.nome,
      email: input.email,
      telefone: formatPhoneBR(input.telefone),
      codigo_indicacao: input.codigoIndicacao,
    }

    // Timeout ~4s: o CRM do Abner é externo; não deixar o webhook/server action
    // pendurado. Abort dispara AbortError → cai no catch (non-fatal).
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    let res: Response
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      console.warn(`[crm-absolut] resposta non-2xx: ${res.status} (non-fatal)`)
      return { ok: false, error: `http_${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    // Anti-SPEC §4: jamais propagar erro pro chamador.
    console.warn(
      "[crm-absolut] envio falhou (non-fatal):",
      err instanceof Error ? err.message : err,
    )
    return { ok: false, error: "exception" }
  }
}
