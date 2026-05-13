/**
 * Módulo de Comissões V2 (Pivô V2)
 *
 * Comissão variável por tier de afiliadas ativas (40%→55%), com imposto de
 * 15% deduzido sempre (NF/Cashin/Crédito). Apenas 1 nível — substitui
 * Fast-Track, Perpétua, Bônus 1/2/3, Leadership e Royalty do v1.
 *
 * Decisões cliente 13/05/2026:
 * - TBD-1 (sempre 50%?) → resolvido: tier variável por afiliadas ativas.
 *   Bônus por consumo médio da rede em definição (próxima iteração).
 * - TBD-2 (impostos retidos?) → resolvido: ~15% sempre deduzido, em todos
 *   os métodos.
 *
 * Tier helper: lib/commissions-v2/tier.ts (canônico). Este arquivo expõe os
 * shapes para integração com payouts/ledger.
 *
 * Feature: F-V04 (PIVOT-V2.md §2)
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
