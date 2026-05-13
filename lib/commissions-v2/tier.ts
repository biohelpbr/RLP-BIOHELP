/**
 * Tier de Comissão V2 — variável por nº de afiliados ativos (Pivô V2).
 *
 * Decisão cliente 13/05/2026:
 *   "A comissão precisa ser variável de acordo com nº de membros e nº médio de
 *    itens comprados pela rede (regra exata a definir)."
 *
 * Implementação para demo 13/05: tier por afiliados ativos (N1) já validado
 * com o cliente. Bônus por itens médios fica como TBD pra próxima iteração.
 *
 * Imposto: 15% sobre o bruto, aplicado independentemente do método de resgate
 * (PIX/NF, Cashback Cashin, Crédito Shopify). Decisão cliente 13/05/2026:
 *   "Em toda comissão é descontado impostos (vai dar +-15% de desconto),
 *    independente se for NF, crédito ou cashin."
 */

import { createServiceClient } from "@/lib/supabase/server"

export type CommissionTier = {
  /** Faixa de afiliados ativos (inclusivo). `max_referrals=null` = sem teto. */
  min_referrals: number
  max_referrals: number | null
  /** Percentual bruto antes do imposto (0.40 = 40%). */
  gross_rate: number
  /** Rótulo curto pra UI (não é título oficial; só conveniência). */
  label: string
}

export const COMMISSION_TIERS: readonly CommissionTier[] = [
  { min_referrals: 0, max_referrals: 4, gross_rate: 0.4, label: "Inicial" },
  { min_referrals: 5, max_referrals: 9, gross_rate: 0.45, label: "Líder" },
  { min_referrals: 10, max_referrals: 19, gross_rate: 0.5, label: "Avançado" },
  { min_referrals: 20, max_referrals: null, gross_rate: 0.55, label: "Top" },
] as const

/** Imposto fixo aplicado sempre (NF/Cashin/Crédito). */
export const COMMISSION_TAX_RATE = 0.15

/** Devolve o tier correspondente a um nº de afiliados ativos. */
export function getTierForReferrals(activeReferrals: number): CommissionTier {
  if (activeReferrals < 0) return COMMISSION_TIERS[0]
  return (
    COMMISSION_TIERS.find(
      (t) =>
        activeReferrals >= t.min_referrals &&
        (t.max_referrals === null || activeReferrals <= t.max_referrals)
    ) ?? COMMISSION_TIERS[0]
  )
}

/** Taxa líquida após imposto. Ex.: 0.50 → 0.425 (50% × 0.85). */
export function getNetRate(grossRate: number): number {
  return Number((grossRate * (1 - COMMISSION_TAX_RATE)).toFixed(4))
}

/** Aplica imposto sobre um valor bruto. Ex.: 100 → 85. */
export function applyTax(grossAmount: number): number {
  return Number((grossAmount * (1 - COMMISSION_TAX_RATE)).toFixed(2))
}

export type MemberCommissionTier = {
  tier: CommissionTier
  active_referrals: number
  gross_rate: number
  net_rate: number
}

/**
 * Calcula o tier do membro hoje. Conta `members.sponsor_id = memberId AND
 * status='active'`. Falha silenciosa → tier 0.
 */
export async function getMemberCommissionTier(
  memberId: string
): Promise<MemberCommissionTier> {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("sponsor_id", memberId)
    .eq("status", "active")

  if (error) {
    console.error("[commission-tier] count failed", error)
    return {
      tier: COMMISSION_TIERS[0],
      active_referrals: 0,
      gross_rate: COMMISSION_TIERS[0].gross_rate,
      net_rate: getNetRate(COMMISSION_TIERS[0].gross_rate),
    }
  }

  const active = count ?? 0
  const tier = getTierForReferrals(active)
  return {
    tier,
    active_referrals: active,
    gross_rate: tier.gross_rate,
    net_rate: getNetRate(tier.gross_rate),
  }
}
