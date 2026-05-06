import { createServiceClient } from "@/lib/supabase/server"
import { getCashinClient } from "./cashin"

export type TransferResult =
  | { ok: true; transactionId: string; status: "processing" | "paid" }
  | { ok: false; error: string; code?: string }

/**
 * F-V07b: dispara a transferência Cashin pra um payout pending.
 *
 * Pré-condições: payout existe, status='pending', payout_method='pix' ou
 * 'cashback_cashin'. Outros métodos não vão pra Cashin (shopify_credit é
 * tratado por outra rota — F-V05).
 */
export async function transferPayout(payoutId: string): Promise<TransferResult> {
  if (!payoutId) return { ok: false, error: "payoutId obrigatório" }

  const supabase = createServiceClient()

  const { data: payout, error: readErr } = await supabase
    .from("payout_requests")
    .select(
      "id, member_id, amount, status, payout_method, pix_key, holder_name, cpf_cnpj"
    )
    .eq("id", payoutId)
    .single()

  if (readErr || !payout) {
    return { ok: false, error: "payout não encontrado" }
  }

  if (payout.status !== "pending") {
    return {
      ok: false,
      error: `payout em status ${payout.status} (esperado: pending)`,
      code: "INVALID_STATE",
    }
  }

  if (payout.payout_method !== "pix" && payout.payout_method !== "cashback_cashin") {
    return {
      ok: false,
      error: `payout_method ${payout.payout_method} não vai pra Cashin`,
      code: "INVALID_METHOD",
    }
  }

  const pixKey = (payout.pix_key as string | null) ?? ""
  if (!pixKey) {
    return {
      ok: false,
      error: "pix_key ausente",
      code: "MISSING_PIX_KEY",
    }
  }

  const client = getCashinClient()
  const result = await client.transfer({
    amount: Number(payout.amount),
    pixKey,
    payoutId: payout.id as string,
    beneficiaryDocument: (payout.cpf_cnpj as string | null) ?? undefined,
    beneficiaryName: (payout.holder_name as string | null) ?? undefined,
  })

  if (!result.ok) {
    // Em erro, mantemos status=pending pra permitir retry. Logamos via console.
    console.error("[transferPayout] cashin error", result)
    return result
  }

  // Atualiza status — usa apenas colunas existentes em payout_requests.
  const { error: updateErr } = await supabase
    .from("payout_requests")
    .update({
      status: "processing",
      transaction_id: result.transactionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payout.id)

  if (updateErr) {
    console.error("[transferPayout] db update error", updateErr)
    return {
      ok: false,
      error: "transferência aceita pelo provider mas falhou ao gravar status",
      code: "DB_UPDATE_ERROR",
    }
  }

  return { ok: true, transactionId: result.transactionId, status: result.status }
}

/**
 * F-V07b: webhook handler — atualiza status conforme retorno do Cashin.
 */
export async function applyCashinStatusUpdate(input: {
  transactionId: string
  status: "paid" | "failed" | "processing"
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServiceClient()

  const { data: payout, error } = await supabase
    .from("payout_requests")
    .select("id, status")
    .eq("transaction_id", input.transactionId)
    .single()

  if (error || !payout) {
    return { ok: false, error: "payout não encontrado por transaction_id" }
  }

  let newStatus = payout.status as string
  if (input.status === "paid") newStatus = "paid"
  else if (input.status === "failed") newStatus = "pending" // permite retry
  else if (input.status === "processing") newStatus = "processing"

  if (newStatus === payout.status) return { ok: true }

  const { error: updateErr } = await supabase
    .from("payout_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", payout.id)

  if (updateErr) return { ok: false, error: updateErr.message }
  return { ok: true }
}
