/**
 * F-V36 — cliente do Octopods (WhatsApp por template), plugado no fluxo de e-mail.
 *
 * Envia uma mensagem de template:
 *   POST https://app.octopods.io/api/v1/whatsapp/templates/<templateId>/messages
 *   headers: X-Octopods-Auth, Content-Type: application/json
 *   body: { destination_phone, message_variables: { body: [ ...vars ] } }
 *
 * O templateId é o ID do template DENTRO do Octopods (≠ ID na Meta).
 * Token em OCTOPODS_AUTH_TOKEN (Vercel). Sem token → no-op com erro (non-fatal).
 */

const OCTOPODS_BASE = "https://app.octopods.io/api/v1"

export interface OctopodsResult {
  ok: boolean
  status: number
  error?: string
}

/**
 * Normaliza telefone BR para E.164 com "+" (ex.: +5551986442929).
 * O Octopods exige E.164 com "+" (senão "Invalid Phone number").
 * Os números no banco estão inconsistentes (uns com 55, outros só DDD+número).
 * Retorna null se não der pra formar um número plausível.
 */
export function normalizeBrPhone(raw: string | null | undefined): string | null {
  const d = (raw || "").replace(/\D/g, "")
  if (!d) return null
  // Já tem DDI 55 + DDD + número (12-13 dígitos).
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return `+${d}`
  // DDD + número (10 fixo / 11 celular) → prefixa +55.
  if (d.length === 10 || d.length === 11) return `+55${d}`
  return null
}

/** Primeiro nome a partir do nome completo. */
export function firstNameOf(name: string | null | undefined): string {
  return (name || "").trim().split(/\s+/)[0] || ""
}

export async function sendOctopodsTemplate(args: {
  templateId: string
  destinationPhone: string | null | undefined
  bodyVars: string[]
}): Promise<OctopodsResult> {
  const token = process.env.OCTOPODS_AUTH_TOKEN
  if (!token) return { ok: false, status: 0, error: "OCTOPODS_AUTH_TOKEN ausente" }

  const phone = normalizeBrPhone(args.destinationPhone)
  if (!phone) return { ok: false, status: 0, error: "telefone inválido/ausente" }

  try {
    const res = await fetch(`${OCTOPODS_BASE}/whatsapp/templates/${args.templateId}/messages`, {
      method: "POST",
      headers: { "X-Octopods-Auth": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        destination_phone: phone,
        message_variables: { body: args.bodyVars },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, status: res.status, error: t.slice(0, 300) }
    }
    return { ok: true, status: res.status }
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "erro de rede" }
  }
}
