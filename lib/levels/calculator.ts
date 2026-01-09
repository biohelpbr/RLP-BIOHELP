/**
 * Calculadora de Níveis - Sprint 3
 * 
 * Implementa as regras de progressão de nível conforme TBD-011
 * Fonte: documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md
 * 
 * Níveis:
 * - Membro: Cliente cadastrada
 * - Parceira: Membro Ativo + CV_rede >= 500
 * - Líder em Formação: Parceira + primeira Parceira em N1 (janela 90 dias)
 * - Líder: Parceira Ativa + 4 Parceiras Ativas em N1
 * - Diretora: 3 Líderes Ativas em N1 + 80.000 CV na rede
 * - Head: 3 Diretoras Ativas em N1 + 200.000 CV na rede
 */

import type { MemberLevel, LevelCriteriaSnapshot } from '@/types/database'

// Ordem dos níveis (do menor para o maior)
export const LEVEL_ORDER: MemberLevel[] = [
  'membro',
  'parceira',
  'lider_formacao',
  'lider',
  'diretora',
  'head'
]

// Nomes amigáveis
export const LEVEL_NAMES: Record<MemberLevel, string> = {
  membro: 'Membro',
  parceira: 'Parceira',
  lider_formacao: 'Líder em Formação',
  lider: 'Líder',
  diretora: 'Diretora',
  head: 'Head'
}

// Métricas necessárias para calcular nível
export interface LevelMetrics {
  status: 'pending' | 'active' | 'inactive'
  cv_pessoal: number
  cv_rede: number
  parceiras_ativas_n1: number
  lideres_ativas_n1: number
  diretoras_ativas_n1: number
  // Para Líder em Formação
  has_any_parceira_n1: boolean
  lider_formacao_started_at: Date | null
}

// Resultado do cálculo
export interface LevelCalculationResult {
  new_level: MemberLevel
  previous_level: MemberLevel
  changed: boolean
  reason: string
  criteria_snapshot: LevelCriteriaSnapshot
}

/**
 * Calcula o nível que um membro deveria ter baseado nas métricas
 * 
 * @param currentLevel Nível atual do membro
 * @param metrics Métricas atuais do membro
 * @returns Resultado do cálculo com o novo nível (ou o mesmo se não mudou)
 */
export function calculateLevel(
  currentLevel: MemberLevel,
  metrics: LevelMetrics
): LevelCalculationResult {
  const snapshot: LevelCriteriaSnapshot = {
    cv_pessoal: metrics.cv_pessoal,
    cv_rede: metrics.cv_rede,
    parceiras_ativas_n1: metrics.parceiras_ativas_n1,
    lideres_ativas_n1: metrics.lideres_ativas_n1,
    diretoras_ativas_n1: metrics.diretoras_ativas_n1,
    status: metrics.status
  }

  // Calcular qual nível o membro deveria ter
  const calculatedLevel = determineLevel(metrics)

  // Verificar se houve mudança
  const changed = calculatedLevel !== currentLevel
  
  // Determinar razão da mudança
  let reason = 'Sem mudança'
  if (changed) {
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
    const newIndex = LEVEL_ORDER.indexOf(calculatedLevel)
    
    if (newIndex > currentIndex) {
      reason = `Promovido: ${LEVEL_NAMES[currentLevel]} → ${LEVEL_NAMES[calculatedLevel]}`
    } else {
      reason = `Rebaixado: ${LEVEL_NAMES[currentLevel]} → ${LEVEL_NAMES[calculatedLevel]}`
    }
  }

  return {
    new_level: calculatedLevel,
    previous_level: currentLevel,
    changed,
    reason,
    criteria_snapshot: snapshot
  }
}

/**
 * Determina qual nível o membro deveria ter baseado nas métricas
 * Começa do nível mais alto e vai descendo até encontrar um que se qualifica
 */
function determineLevel(metrics: LevelMetrics): MemberLevel {
  // Head: 3 Diretoras Ativas em N1 + 200.000 CV na rede
  if (
    metrics.diretoras_ativas_n1 >= 3 &&
    metrics.cv_rede >= 200000
  ) {
    return 'head'
  }

  // Diretora: 3 Líderes Ativas em N1 + 80.000 CV na rede
  if (
    metrics.lideres_ativas_n1 >= 3 &&
    metrics.cv_rede >= 80000
  ) {
    return 'diretora'
  }

  // Líder: Parceira Ativa + 4 Parceiras Ativas em N1
  if (
    metrics.status === 'active' &&
    metrics.parceiras_ativas_n1 >= 4
  ) {
    return 'lider'
  }

  // Líder em Formação: Parceira + primeira Parceira em N1 (janela 90 dias)
  // Só entra nesse nível se já for Parceira e tiver pelo menos 1 Parceira em N1
  // A janela de 90 dias é controlada externamente
  if (
    metrics.status === 'active' &&
    metrics.cv_rede >= 500 &&
    metrics.has_any_parceira_n1 &&
    metrics.parceiras_ativas_n1 < 4 // Ainda não é Líder
  ) {
    // Se já está em formação há mais de 90 dias e não atingiu Líder, volta para Parceira
    if (metrics.lider_formacao_started_at) {
      const daysSinceStart = Math.floor(
        (Date.now() - metrics.lider_formacao_started_at.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceStart > 90) {
        return 'parceira' // Expirou a janela
      }
    }
    return 'lider_formacao'
  }

  // Parceira: Membro Ativo + CV_rede >= 500
  if (
    metrics.status === 'active' &&
    metrics.cv_rede >= 500
  ) {
    return 'parceira'
  }

  // Membro: Nível padrão
  return 'membro'
}

/**
 * Verifica se um membro pode subir de nível
 */
export function canPromote(
  currentLevel: MemberLevel,
  metrics: LevelMetrics
): { can: boolean; reason: string } {
  const calculatedLevel = determineLevel(metrics)
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
  const calculatedIndex = LEVEL_ORDER.indexOf(calculatedLevel)

  if (calculatedIndex > currentIndex) {
    return {
      can: true,
      reason: `Requisitos para ${LEVEL_NAMES[calculatedLevel]} atingidos`
    }
  }

  // Explicar o que falta para o próximo nível
  const nextLevel = LEVEL_ORDER[currentIndex + 1]
  if (!nextLevel) {
    return { can: false, reason: 'Já está no nível máximo (Head)' }
  }

  const missing = getMissingRequirements(nextLevel, metrics)
  return {
    can: false,
    reason: `Falta para ${LEVEL_NAMES[nextLevel]}: ${missing.join(', ')}`
  }
}

/**
 * Retorna lista do que falta para atingir um nível
 */
function getMissingRequirements(
  targetLevel: MemberLevel,
  metrics: LevelMetrics
): string[] {
  const missing: string[] = []

  switch (targetLevel) {
    case 'parceira':
      if (metrics.status !== 'active') {
        missing.push('Status Ativo')
      }
      if (metrics.cv_rede < 500) {
        missing.push(`CV Rede: ${metrics.cv_rede}/500`)
      }
      break

    case 'lider_formacao':
      if (!metrics.has_any_parceira_n1) {
        missing.push('1 Parceira em N1')
      }
      break

    case 'lider':
      if (metrics.status !== 'active') {
        missing.push('Status Ativo')
      }
      if (metrics.parceiras_ativas_n1 < 4) {
        missing.push(`Parceiras N1: ${metrics.parceiras_ativas_n1}/4`)
      }
      break

    case 'diretora':
      if (metrics.lideres_ativas_n1 < 3) {
        missing.push(`Líderes N1: ${metrics.lideres_ativas_n1}/3`)
      }
      if (metrics.cv_rede < 80000) {
        missing.push(`CV Rede: ${metrics.cv_rede.toLocaleString()}/80.000`)
      }
      break

    case 'head':
      if (metrics.diretoras_ativas_n1 < 3) {
        missing.push(`Diretoras N1: ${metrics.diretoras_ativas_n1}/3`)
      }
      if (metrics.cv_rede < 200000) {
        missing.push(`CV Rede: ${metrics.cv_rede.toLocaleString()}/200.000`)
      }
      break
  }

  return missing
}

/**
 * Compara dois níveis e retorna qual é maior
 * @returns -1 se a < b, 0 se iguais, 1 se a > b
 */
export function compareLevels(a: MemberLevel, b: MemberLevel): number {
  const indexA = LEVEL_ORDER.indexOf(a)
  const indexB = LEVEL_ORDER.indexOf(b)
  
  if (indexA < indexB) return -1
  if (indexA > indexB) return 1
  return 0
}

/**
 * Verifica se um nível é maior ou igual a outro
 */
export function isLevelAtLeast(
  level: MemberLevel,
  minimumLevel: MemberLevel
): boolean {
  return compareLevels(level, minimumLevel) >= 0
}

