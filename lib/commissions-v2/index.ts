/**
 * Módulo de Comissões V2 (Pivô V2)
 *
 * Comissão direta de 50% (líquida de impostos/taxas) sobre a assinatura
 * paga do convidado. Apenas 1 nível — substitui Fast-Track, Perpétua,
 * Bônus 1/2/3, Leadership e Royalty do v1.
 *
 * Status: SHELL — aguardando TBD-1 (sempre 50%?) e TBD-2 (quem retém impostos?)
 * Feature: F-V04 (PIVOT-V2.md §2)
 *
 * NÃO ATIVAR sem flag LRP_V2 ON. Código v1 em lib/commissions/* permanece
 * funcional até onda 6 (cleanup) — ver F-V12.
 */

export type CommissionStatus = 'pending' | 'available' | 'paid' | 'cancelled'

export interface CommissionV2 {
  id: string
  member_id: string             // quem recebe (sponsor do convidado)
  source_member_id: string      // o convidado que pagou a assinatura
  source_subscription_id: string
  gross_amount_brl: number
  net_amount_brl: number        // após impostos/taxas — depende TBD-2
  status: CommissionStatus
  // TODO(F-V04): finalizar após TBD-1 e TBD-2
}

// TODO(F-V04):
//   - calculateCommission(subscriptionId)
//   - retainTaxes(grossAmount) — depende TBD-2
//   - listAvailableForMember(memberId)
