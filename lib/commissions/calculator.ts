/**
 * Motor de Cálculo de Comissões
 * Sprint 4 - Biohelp LRP
 * 
 * Calcula comissões em tempo real (TBD-020) com precisão de 2 casas decimais (TBD-017)
 * 
 * REGRAS DE COMISSÃO PERPÉTUA (Documento Canônico: Biohelp___Loyalty_Reward_Program.md):
 * 
 * - Parceira (N0): 5% CV de clientes N1
 * - Líder/Líder em Formação (N0): 7% CV da rede inteira + 5% CV de clientes N1
 * - Diretora (N0): 10% CV da rede inteira + 7% CV de parceiras N1 + 5% CV de clientes N1
 * - Head (N0): 15% CV da rede inteira + 10% CV de líderes N1 + 7% CV de parceiras N1 + 5% CV de clientes N1
 * 
 * IMPORTANTE: O percentual depende do NÍVEL DO N1 (quem comprou), não apenas do nível do sponsor.
 */

import type {
  CommissionType,
  CommissionLedgerInsert,
  MemberLevel,
  COMMISSION_PERCENTAGES,
  BONUS_3_VALUES
} from '@/types/database'

// Re-export dos valores constantes
export const PERCENTAGES = {
  fast_track: {
    phase_1: 30,  // 30% primeiros 30 dias
    phase_2: 20   // 20% dias 31-60
  },
  fast_track_n2: {
    phase_1: 20,  // 20% primeiros 30 dias (Líder)
    phase_2: 10   // 10% dias 31-60 (Líder)
  },
  // Comissão Perpétua - REGRAS DIFERENCIADAS POR TIPO DE N1
  // Documento canônico: linhas 163-173
  perpetual: {
    // Percentuais BASE sobre N1 (aplicados a todos os níveis elegíveis)
    base_cliente: 5,    // 5% sobre CV de clientes N1
    base_parceira: 7,   // 7% sobre CV de parceiras N1 (Diretora/Head)
    base_lider: 10,     // 10% sobre CV de líderes N1 (Head)
    
    // Percentuais da REDE INTEIRA (além do N1)
    // Estes são aplicados sobre compras de N2, N3, etc.
    rede_lider: 7,      // Líder: 7% CV da rede inteira
    rede_diretora: 10,  // Diretora: 10% CV da rede inteira
    rede_head: 15       // Head: 15% CV da rede inteira
  },
  leadership: {
    diretora: 3,
    head: 4
  },
  royalty: 3  // 3% quando Head forma Head
} as const

/**
 * Determina se um membro é considerado "cliente" (membro que não é parceira+)
 * Cliente = membro ou inativo
 */
export function isClienteLevel(level: MemberLevel): boolean {
  return level === 'membro'
}

/**
 * Determina se um membro é considerado "parceira" (parceira, lider_formacao)
 */
export function isParceiraLevel(level: MemberLevel): boolean {
  return level === 'parceira' || level === 'lider_formacao'
}

/**
 * Determina se um membro é considerado "líder" (lider, diretora, head)
 */
export function isLiderLevel(level: MemberLevel): boolean {
  return level === 'lider' || level === 'diretora' || level === 'head'
}

/**
 * Obtém o percentual de comissão perpétua baseado no nível do sponsor E no nível do comprador (N1)
 * 
 * Regras do documento canônico:
 * - Parceira: 5% de clientes N1
 * - Líder: 7% da rede + 5% de clientes N1
 * - Diretora: 10% da rede + 7% de parceiras N1 + 5% de clientes N1
 * - Head: 15% da rede + 10% de líderes N1 + 7% de parceiras N1 + 5% de clientes N1
 */
export function getPerpetualPercentage(sponsorLevel: MemberLevel, buyerLevel: MemberLevel): number {
  // Sponsor precisa ser pelo menos parceira
  const eligibleSponsorLevels: MemberLevel[] = ['parceira', 'lider_formacao', 'lider', 'diretora', 'head']
  if (!eligibleSponsorLevels.includes(sponsorLevel)) {
    return 0
  }

  // PARCEIRA: só recebe 5% de clientes N1
  if (sponsorLevel === 'parceira') {
    if (isClienteLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_cliente // 5%
    }
    return 0 // Parceira não recebe de outras parceiras
  }

  // LÍDER / LÍDER EM FORMAÇÃO: 7% da rede + 5% de clientes N1
  if (sponsorLevel === 'lider' || sponsorLevel === 'lider_formacao') {
    // Líder recebe de todos na rede (7%), mas clientes N1 dão 5% adicional
    // Na prática, para N1: cliente = 5%, parceira+ = 7%
    if (isClienteLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_cliente // 5% de clientes N1
    }
    return PERCENTAGES.perpetual.rede_lider // 7% de parceiras+ N1 (faz parte da rede)
  }

  // DIRETORA: 10% da rede + 7% de parceiras N1 + 5% de clientes N1
  if (sponsorLevel === 'diretora') {
    if (isClienteLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_cliente // 5% de clientes N1
    }
    if (isParceiraLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_parceira // 7% de parceiras N1
    }
    // Líderes N1 fazem parte da rede (10%)
    return PERCENTAGES.perpetual.rede_diretora // 10% de líderes+ N1
  }

  // HEAD: 15% da rede + 10% de líderes N1 + 7% de parceiras N1 + 5% de clientes N1
  if (sponsorLevel === 'head') {
    if (isClienteLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_cliente // 5% de clientes N1
    }
    if (isParceiraLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_parceira // 7% de parceiras N1
    }
    if (isLiderLevel(buyerLevel)) {
      return PERCENTAGES.perpetual.base_lider // 10% de líderes N1
    }
    // Fallback para rede
    return PERCENTAGES.perpetual.rede_head // 15%
  }

  return 0
}

export const BONUS_3 = {
  level_1: 250,    // R$250 - 3 Parceiras em N1
  level_2: 1500,   // R$1.500 - Cada N1 com 3 Parceiras
  level_3: 8000    // R$8.000 - Cada N2 com 3 Parceiras
} as const

// =====================================================
// TIPOS INTERNOS
// =====================================================

export interface CommissionCalculation {
  member_id: string
  commission_type: CommissionType
  amount: number
  cv_base: number
  percentage: number
  source_member_id: string
  source_order_id: string
  network_level: number
  description: string
}

export interface FastTrackWindow {
  sponsor_id: string
  member_id: string
  started_at: Date
  phase_1_ends_at: Date
  phase_2_ends_at: Date
  is_active: boolean
}

export interface MemberForCommission {
  id: string
  sponsor_id: string | null
  level: MemberLevel
  status: 'pending' | 'active' | 'inactive'
  name: string
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Arredonda valor para 2 casas decimais (TBD-017)
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Calcula percentual de um valor
 */
export function calculatePercentage(value: number, percentage: number): number {
  return roundToTwoDecimals(value * (percentage / 100))
}

/**
 * Obtém o primeiro dia do mês atual
 */
export function getCurrentMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Verifica se uma data está dentro da janela Fast-Track fase 1 (30%)
 */
export function isInFastTrackPhase1(window: FastTrackWindow, checkDate: Date = new Date()): boolean {
  return window.is_active && checkDate <= window.phase_1_ends_at
}

/**
 * Verifica se uma data está dentro da janela Fast-Track fase 2 (20%)
 */
export function isInFastTrackPhase2(window: FastTrackWindow, checkDate: Date = new Date()): boolean {
  return window.is_active && 
         checkDate > window.phase_1_ends_at && 
         checkDate <= window.phase_2_ends_at
}

/**
 * Verifica se a janela Fast-Track expirou
 */
export function isFastTrackExpired(window: FastTrackWindow, checkDate: Date = new Date()): boolean {
  return checkDate > window.phase_2_ends_at
}

// =====================================================
// CÁLCULO DE COMISSÕES
// =====================================================

/**
 * Calcula comissões Fast-Track para um pedido
 * 
 * Regras:
 * - N0 recebe 30% CV de N1 nos primeiros 30 dias
 * - N0 recebe 20% CV de N1 nos próximos 30 dias
 * - Líder N0 recebe 20%/10% CV de N2
 */
export function calculateFastTrack(
  cvTotal: number,
  orderId: string,
  buyer: MemberForCommission,
  sponsor: MemberForCommission | null,
  fastTrackWindow: FastTrackWindow | null,
  now: Date = new Date()
): CommissionCalculation[] {
  const commissions: CommissionCalculation[] = []
  
  // Se não tem sponsor ou janela Fast-Track, não há comissão
  if (!sponsor || !fastTrackWindow) {
    return commissions
  }
  
  // Sponsor precisa estar ativo para receber comissão
  if (sponsor.status !== 'active') {
    return commissions
  }
  
  // Verificar fase do Fast-Track
  if (isInFastTrackPhase1(fastTrackWindow, now)) {
    // Fase 1: 30%
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'fast_track_30',
      amount: calculatePercentage(cvTotal, PERCENTAGES.fast_track.phase_1),
      cv_base: cvTotal,
      percentage: PERCENTAGES.fast_track.phase_1,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 1,
      description: `Fast-Track 30% - ${buyer.name} (primeiros 30 dias)`
    })
  } else if (isInFastTrackPhase2(fastTrackWindow, now)) {
    // Fase 2: 20%
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'fast_track_20',
      amount: calculatePercentage(cvTotal, PERCENTAGES.fast_track.phase_2),
      cv_base: cvTotal,
      percentage: PERCENTAGES.fast_track.phase_2,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 1,
      description: `Fast-Track 20% - ${buyer.name} (dias 31-60)`
    })
  }
  
  return commissions
}

/**
 * Calcula comissões Fast-Track N2 para Líderes
 */
export function calculateFastTrackN2(
  cvTotal: number,
  orderId: string,
  buyer: MemberForCommission,
  grandSponsor: MemberForCommission | null,
  fastTrackWindow: FastTrackWindow | null,
  now: Date = new Date()
): CommissionCalculation[] {
  const commissions: CommissionCalculation[] = []
  
  // Grand sponsor precisa existir, estar ativo e ser pelo menos Líder
  if (!grandSponsor || !fastTrackWindow) {
    return commissions
  }
  
  if (grandSponsor.status !== 'active') {
    return commissions
  }
  
  const eligibleLevels: MemberLevel[] = ['lider', 'lider_formacao', 'diretora', 'head']
  if (!eligibleLevels.includes(grandSponsor.level)) {
    return commissions
  }
  
  // Verificar fase do Fast-Track
  if (isInFastTrackPhase1(fastTrackWindow, now)) {
    // Fase 1: 20% (Líder)
    commissions.push({
      member_id: grandSponsor.id,
      commission_type: 'fast_track_30', // Usa o mesmo tipo mas com % diferente
      amount: calculatePercentage(cvTotal, PERCENTAGES.fast_track_n2.phase_1),
      cv_base: cvTotal,
      percentage: PERCENTAGES.fast_track_n2.phase_1,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 2,
      description: `Fast-Track Líder 20% - ${buyer.name} (N2, primeiros 30 dias)`
    })
  } else if (isInFastTrackPhase2(fastTrackWindow, now)) {
    // Fase 2: 10% (Líder)
    commissions.push({
      member_id: grandSponsor.id,
      commission_type: 'fast_track_20',
      amount: calculatePercentage(cvTotal, PERCENTAGES.fast_track_n2.phase_2),
      cv_base: cvTotal,
      percentage: PERCENTAGES.fast_track_n2.phase_2,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 2,
      description: `Fast-Track Líder 10% - ${buyer.name} (N2, dias 31-60)`
    })
  }
  
  return commissions
}

/**
 * Calcula Comissão Perpétua para um pedido
 * 
 * REGRAS DO DOCUMENTO CANÔNICO (Biohelp___Loyalty_Reward_Program.md linhas 163-173):
 * 
 * - Parceira (N0): 5% CV de clientes N1 (APENAS clientes, não parceiras)
 * - Líder/Líder em Formação (N0): 7% CV da rede inteira + 5% CV de clientes N1
 * - Diretora (N0): 10% CV da rede inteira + 7% CV de parceiras N1 + 5% CV de clientes N1
 * - Head (N0): 15% CV da rede inteira + 10% CV de líderes N1 + 7% CV de parceiras N1 + 5% CV de clientes N1
 * 
 * IMPORTANTE: O percentual depende do NÍVEL DO COMPRADOR (N1), não apenas do nível do sponsor.
 * 
 * Nota: Só é aplicada APÓS o Fast-Track expirar
 */
export function calculatePerpetual(
  cvTotal: number,
  orderId: string,
  buyer: MemberForCommission,
  sponsor: MemberForCommission | null,
  fastTrackExpired: boolean
): CommissionCalculation[] {
  const commissions: CommissionCalculation[] = []
  
  // Só calcula perpétua se Fast-Track expirou
  if (!fastTrackExpired || !sponsor) {
    return commissions
  }
  
  // Sponsor precisa estar ativo
  if (sponsor.status !== 'active') {
    return commissions
  }
  
  // Obter percentual baseado no nível do sponsor E no nível do comprador
  const percentage = getPerpetualPercentage(sponsor.level, buyer.level)
  
  // Se percentual é 0, não há comissão (ex: Parceira não recebe de outras Parceiras)
  if (percentage === 0) {
    return commissions
  }
  
  // Gerar descrição detalhada
  const buyerTypeLabel = getBuyerTypeLabel(buyer.level)
  const description = `Comissão Perpétua ${percentage}% - ${buyer.name} (${buyerTypeLabel})`
  
  commissions.push({
    member_id: sponsor.id,
    commission_type: 'perpetual',
    amount: calculatePercentage(cvTotal, percentage),
    cv_base: cvTotal,
    percentage: percentage,
    source_member_id: buyer.id,
    source_order_id: orderId,
    network_level: 1,
    description
  })
  
  return commissions
}

/**
 * Retorna label amigável para o tipo de comprador
 */
function getBuyerTypeLabel(level: MemberLevel): string {
  if (isClienteLevel(level)) return 'Cliente'
  if (isParceiraLevel(level)) return 'Parceira'
  if (isLiderLevel(level)) return 'Líder'
  return 'Membro'
}

/**
 * Calcula Leadership Bônus para um pedido
 * 
 * Regras:
 * - Diretora: 3% CV da rede
 * - Head: 4% CV da rede
 */
export function calculateLeadership(
  cvTotal: number,
  orderId: string,
  buyer: MemberForCommission,
  sponsor: MemberForCommission | null
): CommissionCalculation[] {
  const commissions: CommissionCalculation[] = []
  
  if (!sponsor || sponsor.status !== 'active') {
    return commissions
  }
  
  // Só Diretora e Head recebem Leadership Bônus
  if (sponsor.level === 'diretora') {
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'leadership',
      amount: calculatePercentage(cvTotal, PERCENTAGES.leadership.diretora),
      cv_base: cvTotal,
      percentage: PERCENTAGES.leadership.diretora,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 1,
      description: `Leadership Bônus Diretora 3% - ${buyer.name}`
    })
  } else if (sponsor.level === 'head') {
    commissions.push({
      member_id: sponsor.id,
      commission_type: 'leadership',
      amount: calculatePercentage(cvTotal, PERCENTAGES.leadership.head),
      cv_base: cvTotal,
      percentage: PERCENTAGES.leadership.head,
      source_member_id: buyer.id,
      source_order_id: orderId,
      network_level: 1,
      description: `Leadership Bônus Head 4% - ${buyer.name}`
    })
  }
  
  return commissions
}

/**
 * Calcula todas as comissões para um pedido
 * 
 * Esta é a função principal que orquestra todos os cálculos
 */
export function calculateAllCommissions(
  cvTotal: number,
  orderId: string,
  buyer: MemberForCommission,
  sponsor: MemberForCommission | null,
  grandSponsor: MemberForCommission | null,
  fastTrackWindow: FastTrackWindow | null,
  fastTrackWindowN2: FastTrackWindow | null,
  now: Date = new Date()
): CommissionCalculation[] {
  const commissions: CommissionCalculation[] = []
  
  // Se CV é zero ou negativo, não há comissão
  if (cvTotal <= 0) {
    return commissions
  }
  
  // Verificar se Fast-Track expirou
  const fastTrackExpired = !fastTrackWindow || isFastTrackExpired(fastTrackWindow, now)
  
  // 1. Fast-Track N1
  if (!fastTrackExpired) {
    commissions.push(...calculateFastTrack(cvTotal, orderId, buyer, sponsor, fastTrackWindow, now))
  }
  
  // 2. Fast-Track N2 (para Líderes)
  if (fastTrackWindowN2 && !isFastTrackExpired(fastTrackWindowN2, now)) {
    commissions.push(...calculateFastTrackN2(cvTotal, orderId, buyer, grandSponsor, fastTrackWindowN2, now))
  }
  
  // 3. Comissão Perpétua (só se Fast-Track expirou)
  if (fastTrackExpired) {
    commissions.push(...calculatePerpetual(cvTotal, orderId, buyer, sponsor, fastTrackExpired))
  }
  
  // 4. Leadership Bônus (sempre, se aplicável)
  commissions.push(...calculateLeadership(cvTotal, orderId, buyer, sponsor))
  
  return commissions
}

/**
 * Converte cálculos para formato de inserção no banco
 */
export function toCommissionLedgerInserts(
  calculations: CommissionCalculation[],
  referenceMonth: string = getCurrentMonthStart()
): CommissionLedgerInsert[] {
  return calculations.map(calc => ({
    member_id: calc.member_id,
    commission_type: calc.commission_type,
    amount: calc.amount,
    cv_base: calc.cv_base,
    percentage: calc.percentage,
    source_member_id: calc.source_member_id,
    source_order_id: calc.source_order_id,
    network_level: calc.network_level,
    reference_month: referenceMonth,
    description: calc.description,
    metadata: {}
  }))
}

/**
 * Cria entrada de reversão para refund
 */
export function createReversalEntry(
  originalCommission: CommissionLedgerInsert,
  reason: string = 'Pedido reembolsado'
): CommissionLedgerInsert {
  return {
    ...originalCommission,
    commission_type: 'reversal',
    amount: -Math.abs(originalCommission.amount), // Sempre negativo
    description: `Reversão: ${reason}`,
    metadata: {
      original_commission_type: originalCommission.commission_type,
      original_amount: originalCommission.amount
    }
  }
}

