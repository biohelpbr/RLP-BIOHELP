/**
 * GET /api/admin/members/[id]/cv
 * POST /api/admin/members/[id]/cv (ajuste manual)
 * SPEC: Sprint 2 - CV detalhado do membro (admin)
 * 
 * GET: Retorna CV detalhado de um membro específico
 * POST: Permite ajuste manual de CV (admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isCurrentUserAdmin } from '@/lib/supabase/server'
import {
  CV_TARGET_MONTHLY,
  getCurrentMonthYear,
  cvRemaining,
  cvProgressPercentage,
  createCVManualAdjustment,
  isActiveCV
} from '@/lib/cv/calculator'
import { CVAdjustmentRequest } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Retorna CV detalhado de um membro
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // 1. Verificar se é admin
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const { id: memberId } = await params
  const supabase = createServiceClient()
  const currentMonth = getCurrentMonthYear()

  // 2. Buscar membro
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, email, status, current_cv_month, current_cv_month_year, last_cv_calculation_at')
    .eq('id', memberId)
    .single()

  if (memberError || !member) {
    return NextResponse.json(
      { error: 'Member not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 3. Buscar CV atual
  const currentCV = member.current_cv_month_year === currentMonth
    ? (member.current_cv_month || 0)
    : 0

  // 4. Buscar histórico de meses
  const { data: history } = await supabase
    .from('cv_monthly_summary')
    .select('month_year, total_cv, orders_count, status_at_close, closed_at')
    .eq('member_id', memberId)
    .order('month_year', { ascending: false })
    .limit(12)

  // 5. Buscar ledger detalhado do mês atual
  const { data: ledger } = await supabase
    .from('cv_ledger')
    .select('id, cv_amount, cv_type, description, created_at, order_id')
    .eq('member_id', memberId)
    .eq('month_year', currentMonth)
    .order('created_at', { ascending: false })

  // 6. Buscar pedidos do mês atual
  const { data: orders } = await supabase
    .from('orders')
    .select('id, shopify_order_number, total_amount, total_cv, status, paid_at')
    .eq('member_id', memberId)
    .gte('paid_at', `${currentMonth}-01`)
    .order('paid_at', { ascending: false })

  return NextResponse.json({
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      status: member.status,
      lastCalculation: member.last_cv_calculation_at
    },
    currentMonth: {
      month: currentMonth,
      cv: currentCV,
      target: CV_TARGET_MONTHLY,
      remaining: cvRemaining(currentCV),
      percentage: cvProgressPercentage(currentCV)
    },
    history: (history || []).map(h => ({
      month: h.month_year,
      cv: h.total_cv,
      ordersCount: h.orders_count,
      status: h.status_at_close,
      closedAt: h.closed_at
    })),
    ledger: ledger || [],
    orders: orders || []
  })
}

/**
 * POST - Ajuste manual de CV
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  // 1. Verificar se é admin
  const isAdmin = await isCurrentUserAdmin()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const { id: memberId } = await params

  // 2. Validar body
  let body: CVAdjustmentRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (typeof body.amount !== 'number' || !body.description) {
    return NextResponse.json(
      { error: 'amount (number) and description (string) are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const monthYear = body.month || getCurrentMonthYear()

  // 3. Verificar se membro existe
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, current_cv_month, current_cv_month_year, status')
    .eq('id', memberId)
    .single()

  if (memberError || !member) {
    return NextResponse.json(
      { error: 'Member not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 4. Buscar admin que está fazendo o ajuste
  const { data: adminMember } = await supabase
    .from('members')
    .select('id')
    .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  // 5. Criar entrada no ledger
  const ledgerEntry = createCVManualAdjustment(
    memberId,
    body.amount,
    body.description,
    monthYear,
    adminMember?.id || memberId
  )

  const { error: ledgerError } = await supabase
    .from('cv_ledger')
    .insert(ledgerEntry)

  if (ledgerError) {
    console.error('[admin] Erro ao criar ajuste no cv_ledger:', ledgerError)
    return NextResponse.json(
      { error: 'Failed to create adjustment', details: ledgerError.message },
      { status: 500 }
    )
  }

  // 6. Atualizar CV mensal se for o mês atual
  const currentMonth = getCurrentMonthYear()
  if (monthYear === currentMonth) {
    const newCV = (member.current_cv_month_year === currentMonth)
      ? (member.current_cv_month || 0) + body.amount
      : body.amount

    const newStatus = isActiveCV(newCV) ? 'active' : 'pending'

    await supabase
      .from('members')
      .update({
        current_cv_month: newCV,
        current_cv_month_year: currentMonth,
        last_cv_calculation_at: new Date().toISOString(),
        status: newStatus
      })
      .eq('id', memberId)

    // Atualizar resumo mensal
    const { data: summary } = await supabase
      .from('cv_monthly_summary')
      .select('id, total_cv')
      .eq('member_id', memberId)
      .eq('month_year', currentMonth)
      .single()

    if (summary) {
      await supabase
        .from('cv_monthly_summary')
        .update({ total_cv: summary.total_cv + body.amount })
        .eq('id', summary.id)
    } else {
      await supabase
        .from('cv_monthly_summary')
        .insert({
          member_id: memberId,
          month_year: currentMonth,
          total_cv: body.amount,
          orders_count: 0
        })
    }

    return NextResponse.json({
      success: true,
      adjustment: {
        amount: body.amount,
        month: monthYear,
        description: body.description
      },
      newCV,
      newStatus
    })
  }

  return NextResponse.json({
    success: true,
    adjustment: {
      amount: body.amount,
      month: monthYear,
      description: body.description
    },
    message: 'Adjustment applied to historical month'
  })
}

