/**
 * Compressão de Rede — Sprint 6 (FR-12)
 * 
 * Regra: Membro que fica 6 meses consecutivos sem atingir 200 CV
 * é removido da rede e seus indicados sobem um nível (compressão).
 * 
 * Fluxo:
 * 1. Identificar membros com 6+ meses inativos
 * 2. Para cada membro:
 *    a. Mover seus indicados diretos para o sponsor dele
 *    b. Remover membro da rede (sponsor_id = null, status = 'removed')
 *    c. Registrar em auditoria
 * 3. Atualizar tags no Shopify
 */

import { createServiceClient } from '@/lib/supabase/server'
import { syncCustomerToShopify } from '@/lib/shopify/sync'

const INACTIVE_MONTHS_THRESHOLD = 6

interface CompressionResult {
  member_id: string
  member_name: string
  member_email: string
  original_sponsor_id: string | null
  recruits_moved: number
  success: boolean
  error?: string
}

interface CompressionSummary {
  processed: number
  successful: number
  failed: number
  recruits_moved: number
  results: CompressionResult[]
  executed_at: string
}

/**
 * Identifica membros elegíveis para remoção (6+ meses inativos)
 */
export async function getInactiveMembers(): Promise<{
  id: string
  name: string
  email: string
  sponsor_id: string | null
  inactive_months_count: number
}[]> {
  const supabase = createServiceClient()

  const { data: inactiveMembers, error } = await supabase
    .from('members')
    .select('id, name, email, sponsor_id, inactive_months_count')
    .gte('inactive_months_count', INACTIVE_MONTHS_THRESHOLD)
    .neq('status', 'removed')

  if (error) {
    console.error('[compression] Erro ao buscar inativos:', error)
    return []
  }

  return inactiveMembers || []
}

/**
 * Comprime a rede de um membro específico
 * Move seus indicados para o sponsor dele
 */
export async function compressMemberNetwork(memberId: string): Promise<CompressionResult> {
  const supabase = createServiceClient()

  // 1. Buscar dados do membro
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, email, sponsor_id')
    .eq('id', memberId)
    .single()

  if (memberError || !member) {
    return {
      member_id: memberId,
      member_name: 'Unknown',
      member_email: 'Unknown',
      original_sponsor_id: null,
      recruits_moved: 0,
      success: false,
      error: 'Membro não encontrado'
    }
  }

  // 2. Buscar indicados diretos do membro
  const { data: recruits, error: recruitsError } = await supabase
    .from('members')
    .select('id')
    .eq('sponsor_id', memberId)

  if (recruitsError) {
    return {
      member_id: memberId,
      member_name: member.name,
      member_email: member.email,
      original_sponsor_id: member.sponsor_id,
      recruits_moved: 0,
      success: false,
      error: 'Erro ao buscar indicados'
    }
  }

  const recruitIds = recruits?.map(r => r.id) || []

  // 3. Mover indicados para o sponsor do membro removido
  if (recruitIds.length > 0) {
    const { error: moveError } = await supabase
      .from('members')
      .update({ sponsor_id: member.sponsor_id })
      .in('id', recruitIds)

    if (moveError) {
      return {
        member_id: memberId,
        member_name: member.name,
        member_email: member.email,
        original_sponsor_id: member.sponsor_id,
        recruits_moved: 0,
        success: false,
        error: 'Erro ao mover indicados'
      }
    }
  }

  // 4. Marcar membro como removido
  const { error: removeError } = await supabase
    .from('members')
    .update({
      status: 'removed' as any, // Status especial para membros removidos
      sponsor_id: null, // Remove da rede
      level: 'membro'
    })
    .eq('id', memberId)

  if (removeError) {
    // Reverter movimento dos indicados
    if (recruitIds.length > 0) {
      await supabase
        .from('members')
        .update({ sponsor_id: memberId })
        .in('id', recruitIds)
    }

    return {
      member_id: memberId,
      member_name: member.name,
      member_email: member.email,
      original_sponsor_id: member.sponsor_id,
      recruits_moved: 0,
      success: false,
      error: 'Erro ao remover membro'
    }
  }

  // 5. Registrar em auditoria (member_level_history)
  await supabase
    .from('member_level_history')
    .insert({
      member_id: memberId,
      previous_level: null,
      new_level: 'membro',
      reason: `Removido da rede por inatividade (${INACTIVE_MONTHS_THRESHOLD} meses consecutivos sem atingir 200 CV)`,
      criteria_snapshot: {
        compression: true,
        inactive_months: INACTIVE_MONTHS_THRESHOLD,
        recruits_moved: recruitIds.length,
        original_sponsor_id: member.sponsor_id,
        executed_at: new Date().toISOString()
      }
    })

  // 6. Sincronizar com Shopify (remover tags LRP)
  try {
    await syncCustomerToShopify(memberId)
  } catch (syncError) {
    console.error('[compression] Erro ao sincronizar Shopify:', syncError)
    // Não falhar a operação por causa do sync
  }

  return {
    member_id: memberId,
    member_name: member.name,
    member_email: member.email,
    original_sponsor_id: member.sponsor_id,
    recruits_moved: recruitIds.length,
    success: true
  }
}

/**
 * Executa compressão de rede para todos os membros elegíveis
 */
export async function runNetworkCompression(): Promise<CompressionSummary> {
  const inactiveMembers = await getInactiveMembers()
  
  const results: CompressionResult[] = []
  let successful = 0
  let failed = 0
  let totalRecruitsMoved = 0

  for (const member of inactiveMembers) {
    const result = await compressMemberNetwork(member.id)
    results.push(result)

    if (result.success) {
      successful++
      totalRecruitsMoved += result.recruits_moved
    } else {
      failed++
    }
  }

  const summary: CompressionSummary = {
    processed: inactiveMembers.length,
    successful,
    failed,
    recruits_moved: totalRecruitsMoved,
    results,
    executed_at: new Date().toISOString()
  }

  // Log do resultado
  console.log('[compression] Resumo:', {
    processed: summary.processed,
    successful: summary.successful,
    failed: summary.failed,
    recruits_moved: summary.recruits_moved
  })

  return summary
}

/**
 * Incrementa contador de meses inativos para membros que não atingiram 200 CV
 * Chamado pelo cron de fechamento mensal
 */
export async function updateInactiveMonthsCount(): Promise<{
  updated: number
  reset: number
}> {
  const supabase = createServiceClient()

  // 1. Incrementar para membros inativos (status = 'inactive')
  const { data: inactiveMembers, error: inactiveError } = await supabase
    .from('members')
    .select('id, inactive_months_count')
    .eq('status', 'inactive')
    .neq('status', 'removed')

  if (inactiveError) {
    console.error('[compression] Erro ao buscar inativos:', inactiveError)
    return { updated: 0, reset: 0 }
  }

  let updated = 0
  for (const member of inactiveMembers || []) {
    const { error } = await supabase
      .from('members')
      .update({
        inactive_months_count: (member.inactive_months_count || 0) + 1
      })
      .eq('id', member.id)

    if (!error) updated++
  }

  // 2. Resetar contador para membros ativos
  const { data: activeMembers, error: activeError } = await supabase
    .from('members')
    .select('id')
    .eq('status', 'active')
    .gt('inactive_months_count', 0)

  if (activeError) {
    console.error('[compression] Erro ao buscar ativos:', activeError)
    return { updated, reset: 0 }
  }

  let reset = 0
  for (const member of activeMembers || []) {
    const { error } = await supabase
      .from('members')
      .update({ inactive_months_count: 0 })
      .eq('id', member.id)

    if (!error) reset++
  }

  return { updated, reset }
}
