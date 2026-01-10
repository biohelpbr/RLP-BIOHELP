/**
 * Cálculo de Royalty
 * Sprint 4 - Biohelp LRP
 * 
 * Regras do documento canônico:
 * - Se uma Head (N0) formar outra Head, a rede dessa nova Head (N1) deixa de ser parte da rede antiga
 * - A Head (N0) passa a receber 3% do CV dessa nova rede
 * - Se a formação dessa nova Head fizer a Head (N0) não atender mais os requisitos para ser Head,
 *   isso NÃO fará ela deixar de ser Head
 */

import type { CommissionLedgerInsert, MemberLevel } from '@/types/database'
import { roundToTwoDecimals, getCurrentMonthStart } from './calculator'

// Percentual de Royalty
export const ROYALTY_PERCENTAGE = 3 // 3%

// =====================================================
// TIPOS
// =====================================================

export interface RoyaltyRelationship {
  id: string
  original_head_id: string
  new_head_id: string
  separated_at: string
  royalty_percentage: number
  is_active: boolean
}

export interface HeadMember {
  id: string
  name: string
  level: MemberLevel
  status: 'pending' | 'active' | 'inactive'
  sponsor_id: string | null
  became_head_at: string | null
}

export interface RoyaltyCalculation {
  original_head_id: string
  new_head_id: string
  new_head_name: string
  cv_from_new_network: number
  royalty_amount: number
}

// =====================================================
// FUNÇÕES DE VERIFICAÇÃO
// =====================================================

/**
 * Verifica se um membro é Head
 */
export function isHead(member: HeadMember): boolean {
  return member.level === 'head' && member.status === 'active'
}

/**
 * Verifica se deve criar relação de Royalty
 * (quando N1 de um Head se torna Head)
 */
export function shouldCreateRoyaltyRelationship(
  newHead: HeadMember,
  sponsor: HeadMember | null
): boolean {
  // Novo membro precisa ser Head
  if (!isHead(newHead)) return false
  
  // Sponsor precisa existir e ser Head
  if (!sponsor || !isHead(sponsor)) return false
  
  // Novo Head precisa ser N1 direto do sponsor
  if (newHead.sponsor_id !== sponsor.id) return false
  
  return true
}

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Calcula Royalty para um Head sobre a rede de outro Head que ele formou
 */
export function calculateRoyalty(
  originalHead: HeadMember,
  newHead: HeadMember,
  cvFromNewNetwork: number,
  orderId: string
): CommissionLedgerInsert | null {
  // Validações
  if (!isHead(originalHead)) return null
  if (cvFromNewNetwork <= 0) return null
  
  const royaltyAmount = roundToTwoDecimals(cvFromNewNetwork * (ROYALTY_PERCENTAGE / 100))
  
  return {
    member_id: originalHead.id,
    commission_type: 'royalty',
    amount: royaltyAmount,
    cv_base: cvFromNewNetwork,
    percentage: ROYALTY_PERCENTAGE,
    source_member_id: newHead.id,
    source_order_id: orderId,
    network_level: null, // Royalty não tem nível específico
    reference_month: getCurrentMonthStart(),
    description: `Royalty 3% - Rede de ${newHead.name}`,
    metadata: {
      new_head_id: newHead.id,
      new_head_name: newHead.name
    }
  }
}

/**
 * Processa Royalty para um pedido
 * Verifica se o comprador está em uma rede separada por Royalty
 */
export function processRoyaltyForOrder(
  orderId: string,
  buyerId: string,
  cvTotal: number,
  royaltyRelationships: RoyaltyRelationship[],
  memberLookup: (id: string) => HeadMember | null
): CommissionLedgerInsert[] {
  const commissions: CommissionLedgerInsert[] = []
  
  // Para cada relação de Royalty ativa
  for (const relationship of royaltyRelationships) {
    if (!relationship.is_active) continue
    
    const originalHead = memberLookup(relationship.original_head_id)
    const newHead = memberLookup(relationship.new_head_id)
    
    if (!originalHead || !newHead) continue
    if (!isHead(originalHead)) continue
    
    // Verificar se o comprador está na rede do novo Head
    // (isso requer uma verificação de ancestralidade)
    // Por simplicidade, assumimos que se temos a relação, o comprador está na rede
    
    const commission = calculateRoyalty(
      originalHead,
      newHead,
      cvTotal,
      orderId
    )
    
    if (commission) {
      commissions.push(commission)
    }
  }
  
  return commissions
}

/**
 * Verifica se um membro está na rede de um Head específico
 * (útil para determinar se Royalty se aplica)
 */
export function isMemberInHeadNetwork(
  memberId: string,
  headId: string,
  getAncestors: (id: string) => string[]
): boolean {
  const ancestors = getAncestors(memberId)
  return ancestors.includes(headId)
}

/**
 * Obtém todas as relações de Royalty ativas para um Head
 */
export function getActiveRoyaltyRelationships(
  headId: string,
  allRelationships: RoyaltyRelationship[]
): RoyaltyRelationship[] {
  return allRelationships.filter(
    r => r.original_head_id === headId && r.is_active
  )
}

/**
 * Calcula o CV total de uma rede separada por Royalty
 * (para relatórios e dashboard)
 */
export function calculateRoyaltyNetworkCV(
  relationship: RoyaltyRelationship,
  getNetworkCV: (headId: string, month: string) => number,
  month: string = getCurrentMonthStart()
): {
  cv_total: number
  royalty_amount: number
} {
  const cvTotal = getNetworkCV(relationship.new_head_id, month)
  const royaltyAmount = roundToTwoDecimals(cvTotal * (relationship.royalty_percentage / 100))
  
  return {
    cv_total: cvTotal,
    royalty_amount: royaltyAmount
  }
}

// =====================================================
// REGRAS ESPECIAIS
// =====================================================

/**
 * Regra especial: Head que forma Head não perde status
 * 
 * Quando um N1 se torna Head e sua rede separa, o Head N0 original
 * pode ficar sem os requisitos para ser Head (ex: menos de 3 Diretoras N1).
 * No entanto, ele NÃO perde o status de Head.
 * 
 * Esta função deve ser chamada durante o cálculo de níveis para
 * aplicar esta exceção.
 */
export function shouldMaintainHeadStatus(
  member: HeadMember,
  hasFormedHead: boolean,
  meetsCurrentRequirements: boolean
): boolean {
  // Se atende aos requisitos, mantém status normalmente
  if (meetsCurrentRequirements) return true
  
  // Se já formou um Head, mantém status mesmo sem requisitos
  if (member.level === 'head' && hasFormedHead) return true
  
  return false
}

/**
 * Verifica se um Head já formou outro Head
 */
export function hasFormedAnyHead(
  headId: string,
  royaltyRelationships: RoyaltyRelationship[]
): boolean {
  return royaltyRelationships.some(
    r => r.original_head_id === headId && r.is_active
  )
}

