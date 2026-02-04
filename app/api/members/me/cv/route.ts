/**
 * GET /api/members/me/cv
 * SPEC: Sprint 2 + Sprint 7 (FR-17)
 * 
 * Retorna:
 * - CV do mês atual (próprio)
 * - CV da rede (indicados)
 * - Progresso para meta de 200 CV
 * - Histórico de meses anteriores
 */

import { NextResponse } from 'next/server'
import { createServiceClient, getCurrentMember } from '@/lib/supabase/server'
import {
  CV_TARGET_MONTHLY,
  getCurrentMonthYear,
  cvRemaining,
  cvProgressPercentage
} from '@/lib/cv/calculator'
import { MemberCVResponse } from '@/types/database'

/**
 * Calcula o CV da rede (indicados diretos e indiretos)
 */
async function getNetworkCV(memberId: string, monthYear: string): Promise<number> {
  const supabase = createServiceClient()
  
  // Buscar todos os indicados (recursivo) usando CTE
  const { data, error } = await supabase.rpc('get_network_cv', {
    p_member_id: memberId,
    p_month_year: monthYear
  })

  if (error) {
    console.error('[cv/network] RPC error:', error)
    // Fallback: buscar apenas N1
    return await getDirectRecruitsCV(memberId, monthYear)
  }

  return data || 0
}

/**
 * Fallback: CV apenas dos indicados diretos (N1)
 */
async function getDirectRecruitsCV(memberId: string, monthYear: string): Promise<number> {
  const supabase = createServiceClient()
  
  // Buscar indicados diretos
  const { data: recruits } = await supabase
    .from('members')
    .select('id, current_cv_month, current_cv_month_year')
    .eq('sponsor_id', memberId)

  if (!recruits || recruits.length === 0) return 0

  // Somar CV dos indicados do mês atual
  let totalCV = 0
  for (const recruit of recruits) {
    if (recruit.current_cv_month_year === monthYear) {
      totalCV += recruit.current_cv_month || 0
    }
  }

  return totalCV
}

export async function GET() {
  // 1. Verificar autenticação
  const member = await getCurrentMember()
  
  if (!member) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()
  const currentMonth = getCurrentMonthYear()

  // 2. Buscar CV próprio do membro
  const ownCV = member.current_cv_month_year === currentMonth
    ? (member.current_cv_month || 0)
    : 0

  // 3. Buscar CV da rede (FR-17)
  const networkCV = await getNetworkCV(member.id, currentMonth)

  // 4. CV total = próprio + rede
  const totalCV = ownCV + networkCV

  // 5. Buscar histórico de meses anteriores
  const { data: history } = await supabase
    .from('cv_monthly_summary')
    .select('month_year, total_cv, orders_count, status_at_close')
    .eq('member_id', member.id)
    .neq('month_year', currentMonth) // Excluir mês atual
    .order('month_year', { ascending: false })
    .limit(12) // Últimos 12 meses

  // 6. Contar indicados diretos ativos
  const { count: activeRecruitsCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('sponsor_id', member.id)
    .eq('status', 'active')

  // 7. Montar resposta
  const response: MemberCVResponse & {
    network: {
      ownCV: number
      networkCV: number
      totalCV: number
      activeRecruits: number
    }
  } = {
    currentMonth: {
      month: currentMonth,
      cv: ownCV, // CV próprio (mantém compatibilidade)
      target: CV_TARGET_MONTHLY,
      remaining: cvRemaining(ownCV),
      status: member.status,
      percentage: cvProgressPercentage(ownCV)
    },
    // Novo: dados separados de CV (FR-17)
    network: {
      ownCV: ownCV,
      networkCV: networkCV,
      totalCV: totalCV,
      activeRecruits: activeRecruitsCount || 0
    },
    history: (history || []).map(h => ({
      month: h.month_year,
      cv: h.total_cv,
      status: h.status_at_close || 'pending',
      ordersCount: h.orders_count
    }))
  }

  return NextResponse.json(response)
}

