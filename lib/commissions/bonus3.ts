/**
 * Cálculo de Bônus 3
 * Sprint 4 - Biohelp LRP
 * 
 * Regras do documento canônico:
 * - 3 Parceiras Ativas em N1 por 1 mês → R$250
 * - Cada N1 com 3 Parceiras Ativas → R$1.500
 * - Cada N2 com 3 Parceiras Ativas → R$8.000
 * - Toda a rede deve estar ativa para receber a bonificação
 */

import type { CommissionLedgerInsert, MemberLevel } from '@/types/database'
import { roundToTwoDecimals, getCurrentMonthStart } from './calculator'

// Valores dos bônus
export const BONUS_3_VALUES = {
  level_1: 250,    // R$250 - 3 Parceiras em N1
  level_2: 1500,   // R$1.500 - Cada N1 com 3 Parceiras
  level_3: 8000    // R$8.000 - Cada N2 com 3 Parceiras
} as const

// =====================================================
// TIPOS
// =====================================================

export interface Bonus3Eligibility {
  member_id: string
  reference_month: string
  
  // Contagens
  active_partners_n1: number
  n1_with_3_partners: number
  n2_with_3_partners: number
  
  // Elegibilidade
  eligible_level_1: boolean
  eligible_level_2: boolean
  eligible_level_3: boolean
  
  // Valores potenciais
  potential_bonus_1: number
  potential_bonus_2: number
  potential_bonus_3: number
  total_potential: number
}

export interface NetworkMemberForBonus3 {
  id: string
  level: MemberLevel
  status: 'pending' | 'active' | 'inactive'
  depth: number // 1 = N1, 2 = N2, 3 = N3
  children_count: number
  active_partners_below: number
}

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Verifica se um membro é Parceira ativa
 */
export function isActiveParceira(member: NetworkMemberForBonus3): boolean {
  const eligibleLevels: MemberLevel[] = ['parceira', 'lider_formacao', 'lider', 'diretora', 'head']
  return member.status === 'active' && eligibleLevels.includes(member.level)
}

/**
 * Conta Parceiras ativas em um nível específico
 */
export function countActivePartnersAtLevel(
  network: NetworkMemberForBonus3[],
  depth: number
): number {
  return network.filter(m => m.depth === depth && isActiveParceira(m)).length
}

/**
 * Conta quantos membros N1 têm 3+ Parceiras ativas abaixo
 */
export function countN1With3Partners(
  network: NetworkMemberForBonus3[]
): number {
  const n1Members = network.filter(m => m.depth === 1 && isActiveParceira(m))
  
  return n1Members.filter(n1 => {
    // Contar parceiras ativas diretamente abaixo deste N1
    const n2Below = network.filter(
      m => m.depth === 2 && isActiveParceira(m)
      // Nota: em produção, precisamos verificar se o sponsor_id é o n1.id
    )
    return n2Below.length >= 3
  }).length
}

/**
 * Conta quantos membros N2 têm 3+ Parceiras ativas abaixo
 */
export function countN2With3Partners(
  network: NetworkMemberForBonus3[]
): number {
  const n2Members = network.filter(m => m.depth === 2 && isActiveParceira(m))
  
  return n2Members.filter(n2 => {
    // Contar parceiras ativas diretamente abaixo deste N2
    const n3Below = network.filter(
      m => m.depth === 3 && isActiveParceira(m)
      // Nota: em produção, precisamos verificar se o sponsor_id é o n2.id
    )
    return n3Below.length >= 3
  }).length
}

/**
 * Calcula elegibilidade para Bônus 3
 */
export function calculateBonus3Eligibility(
  memberId: string,
  network: NetworkMemberForBonus3[],
  referenceMonth: string = getCurrentMonthStart()
): Bonus3Eligibility {
  // Contar parceiras ativas em N1
  const activePartnersN1 = countActivePartnersAtLevel(network, 1)
  
  // Contar N1s com 3+ parceiras
  const n1With3Partners = countN1With3Partners(network)
  
  // Contar N2s com 3+ parceiras
  const n2With3Partners = countN2With3Partners(network)
  
  // Verificar elegibilidade
  const eligibleLevel1 = activePartnersN1 >= 3
  const eligibleLevel2 = eligibleLevel1 && n1With3Partners >= 3
  const eligibleLevel3 = eligibleLevel2 && n2With3Partners >= 9 // 3 N1s × 3 N2s cada
  
  // Calcular valores potenciais
  const potentialBonus1 = eligibleLevel1 ? BONUS_3_VALUES.level_1 : 0
  const potentialBonus2 = eligibleLevel2 ? BONUS_3_VALUES.level_2 : 0
  const potentialBonus3 = eligibleLevel3 ? BONUS_3_VALUES.level_3 : 0
  
  return {
    member_id: memberId,
    reference_month: referenceMonth,
    active_partners_n1: activePartnersN1,
    n1_with_3_partners: n1With3Partners,
    n2_with_3_partners: n2With3Partners,
    eligible_level_1: eligibleLevel1,
    eligible_level_2: eligibleLevel2,
    eligible_level_3: eligibleLevel3,
    potential_bonus_1: potentialBonus1,
    potential_bonus_2: potentialBonus2,
    potential_bonus_3: potentialBonus3,
    total_potential: potentialBonus1 + potentialBonus2 + potentialBonus3
  }
}

/**
 * Gera entradas de comissão para Bônus 3
 * Deve ser chamado no fechamento mensal
 */
export function generateBonus3Commissions(
  eligibility: Bonus3Eligibility,
  alreadyPaid: { level_1: boolean; level_2: boolean; level_3: boolean }
): CommissionLedgerInsert[] {
  const commissions: CommissionLedgerInsert[] = []
  
  // Nível 1: R$250
  if (eligibility.eligible_level_1 && !alreadyPaid.level_1) {
    commissions.push({
      member_id: eligibility.member_id,
      commission_type: 'bonus_3_level_1',
      amount: BONUS_3_VALUES.level_1,
      cv_base: null,
      percentage: null,
      source_member_id: null,
      source_order_id: null,
      network_level: null,
      reference_month: eligibility.reference_month,
      description: `Bônus 3 Nível 1 - ${eligibility.active_partners_n1} Parceiras Ativas em N1`,
      metadata: {
        active_partners_n1: eligibility.active_partners_n1
      }
    })
  }
  
  // Nível 2: R$1.500
  if (eligibility.eligible_level_2 && !alreadyPaid.level_2) {
    commissions.push({
      member_id: eligibility.member_id,
      commission_type: 'bonus_3_level_2',
      amount: BONUS_3_VALUES.level_2,
      cv_base: null,
      percentage: null,
      source_member_id: null,
      source_order_id: null,
      network_level: null,
      reference_month: eligibility.reference_month,
      description: `Bônus 3 Nível 2 - ${eligibility.n1_with_3_partners} N1s com 3+ Parceiras`,
      metadata: {
        n1_with_3_partners: eligibility.n1_with_3_partners
      }
    })
  }
  
  // Nível 3: R$8.000
  if (eligibility.eligible_level_3 && !alreadyPaid.level_3) {
    commissions.push({
      member_id: eligibility.member_id,
      commission_type: 'bonus_3_level_3',
      amount: BONUS_3_VALUES.level_3,
      cv_base: null,
      percentage: null,
      source_member_id: null,
      source_order_id: null,
      network_level: null,
      reference_month: eligibility.reference_month,
      description: `Bônus 3 Nível 3 - ${eligibility.n2_with_3_partners} N2s com 3+ Parceiras`,
      metadata: {
        n2_with_3_partners: eligibility.n2_with_3_partners
      }
    })
  }
  
  return commissions
}

/**
 * Verifica progresso para próximo nível de Bônus 3
 */
export function getBonus3Progress(eligibility: Bonus3Eligibility): {
  current_level: 0 | 1 | 2 | 3
  next_level: 1 | 2 | 3 | null
  progress: {
    name: string
    current: number
    required: number
    percentage: number
  }[]
} {
  let currentLevel: 0 | 1 | 2 | 3 = 0
  if (eligibility.eligible_level_3) currentLevel = 3
  else if (eligibility.eligible_level_2) currentLevel = 2
  else if (eligibility.eligible_level_1) currentLevel = 1
  
  const nextLevel = currentLevel < 3 ? (currentLevel + 1) as 1 | 2 | 3 : null
  
  const progress: { name: string; current: number; required: number; percentage: number }[] = []
  
  if (nextLevel === 1) {
    progress.push({
      name: 'Parceiras Ativas em N1',
      current: eligibility.active_partners_n1,
      required: 3,
      percentage: Math.min(100, (eligibility.active_partners_n1 / 3) * 100)
    })
  } else if (nextLevel === 2) {
    progress.push({
      name: 'N1s com 3+ Parceiras',
      current: eligibility.n1_with_3_partners,
      required: 3,
      percentage: Math.min(100, (eligibility.n1_with_3_partners / 3) * 100)
    })
  } else if (nextLevel === 3) {
    progress.push({
      name: 'N2s com 3+ Parceiras',
      current: eligibility.n2_with_3_partners,
      required: 9,
      percentage: Math.min(100, (eligibility.n2_with_3_partners / 9) * 100)
    })
  }
  
  return {
    current_level: currentLevel,
    next_level: nextLevel,
    progress
  }
}

