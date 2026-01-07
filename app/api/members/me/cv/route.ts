/**
 * GET /api/members/me/cv
 * SPEC: Sprint 2 - Retorna CV do membro autenticado
 * 
 * Retorna:
 * - CV do mês atual
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

  // 2. Buscar CV atual do membro
  const currentCV = member.current_cv_month_year === currentMonth
    ? (member.current_cv_month || 0)
    : 0

  // 3. Buscar histórico de meses anteriores
  const { data: history } = await supabase
    .from('cv_monthly_summary')
    .select('month_year, total_cv, orders_count, status_at_close')
    .eq('member_id', member.id)
    .neq('month_year', currentMonth) // Excluir mês atual
    .order('month_year', { ascending: false })
    .limit(12) // Últimos 12 meses

  // 4. Montar resposta
  const response: MemberCVResponse = {
    currentMonth: {
      month: currentMonth,
      cv: currentCV,
      target: CV_TARGET_MONTHLY,
      remaining: cvRemaining(currentCV),
      status: member.status,
      percentage: cvProgressPercentage(currentCV)
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

