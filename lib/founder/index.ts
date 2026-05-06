/**
 * Módulo Founder (Pivô V2)
 *
 * Promoção a Founder ao atingir 5 membros ATIVOS no clube.
 * Founder destrava saque cash (CNPJ + NF de serviço — F-V07).
 * Ranking por critério ainda a definir (TBD-8).
 *
 * Status: SHELL — aguardando TBD-8 (critério de ranking) e TBD-13 (perde status?)
 * Features: F-V06 (promoção), F-V08 (ranking)
 */

export interface FounderStatus {
  member_id: string
  promoted_at: string
  active_club_size: number
  is_founder: boolean
  rank?: number
  // TODO(F-V06/F-V08): score de ranking após TBD-8
}

// TODO(F-V06): checkAndPromote(memberId)
// TODO(F-V08): calculateRanking() — depende TBD-8
// TODO(F-V06): handleClubSizeDrop(memberId) — depende TBD-13
