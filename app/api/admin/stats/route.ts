/**
 * GET /api/admin/stats
 * Sprint 6 - FR-35: Dashboard global com KPIs
 * 
 * Retorna estatísticas globais:
 * - Total de membros (cadastrados, ativos, inativos)
 * - Membros por nível
 * - CV global (mês atual e histórico)
 * - Comissões globais (por tipo e total)
 * - Saques (pendentes, aprovados, pagos)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface LevelCount {
  level: string
  count: number
}

interface CommissionByType {
  commission_type: string
  total: number
  count: number
}

interface PayoutStats {
  status: string
  count: number
  total: number
}

export async function GET() {
  try {
    // Verificar autenticação e permissão admin
    const authClient = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Verificar se é admin
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 401 }
      )
    }

    const { data: role } = await supabase
      .from('roles')
      .select('role')
      .eq('member_id', member.id)
      .single()

    if (role?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    // Mês atual
    const now = new Date()
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 1. Estatísticas de membros
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    const { count: activeMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: inactiveMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive')

    const { count: pendingMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 2. Membros por nível
    const { data: levelCounts } = await supabase
      .rpc('get_members_by_level')

    // Se a função RPC não existir, fazer query manual
    let membersByLevel: LevelCount[] = []
    if (!levelCounts) {
      const { data: levels } = await supabase
        .from('members')
        .select('level')
      
      if (levels) {
        const levelMap = new Map<string, number>()
        levels.forEach((m: { level: string | null }) => {
          const lvl = m.level || 'membro'
          levelMap.set(lvl, (levelMap.get(lvl) || 0) + 1)
        })
        membersByLevel = Array.from(levelMap.entries()).map(([level, count]) => ({
          level,
          count
        }))
      }
    } else {
      membersByLevel = levelCounts as LevelCount[]
    }

    // 3. CV Global
    // CV do mês atual
    const { data: cvCurrentMonth } = await supabase
      .from('cv_ledger')
      .select('cv_amount')
      .eq('month_year', currentMonthYear)
      .gt('cv_amount', 0)

    const totalCVCurrentMonth = cvCurrentMonth?.reduce((sum, row) => sum + Number(row.cv_amount), 0) || 0

    // CV total histórico
    const { data: cvTotal } = await supabase
      .from('cv_ledger')
      .select('cv_amount')
      .gt('cv_amount', 0)

    const totalCVAllTime = cvTotal?.reduce((sum, row) => sum + Number(row.cv_amount), 0) || 0

    // 4. Comissões globais
    // Total de comissões pagas (all time)
    const { data: commissionTotals } = await supabase
      .from('commission_ledger')
      .select('commission_type, amount')
      .gt('amount', 0)

    let totalCommissions = 0
    const commissionsByType: CommissionByType[] = []
    const typeMap = new Map<string, { total: number; count: number }>()

    if (commissionTotals) {
      commissionTotals.forEach((c: { commission_type: string; amount: number }) => {
        const amount = Number(c.amount)
        totalCommissions += amount
        const existing = typeMap.get(c.commission_type) || { total: 0, count: 0 }
        typeMap.set(c.commission_type, {
          total: existing.total + amount,
          count: existing.count + 1
        })
      })

      typeMap.forEach((value, key) => {
        commissionsByType.push({
          commission_type: key,
          total: value.total,
          count: value.count
        })
      })
    }

    // Comissões do mês atual
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { data: commissionCurrentMonth } = await supabase
      .from('commission_ledger')
      .select('amount')
      .gte('created_at', firstDayOfMonth.toISOString())
      .gt('amount', 0)

    const totalCommissionsCurrentMonth = commissionCurrentMonth?.reduce(
      (sum, row) => sum + Number(row.amount), 0
    ) || 0

    // 5. Estatísticas de saques
    const { data: payoutData } = await supabase
      .from('payout_requests')
      .select('status, amount')

    const payoutStats: PayoutStats[] = []
    const payoutMap = new Map<string, { count: number; total: number }>()

    if (payoutData) {
      payoutData.forEach((p: { status: string; amount: number }) => {
        const existing = payoutMap.get(p.status) || { count: 0, total: 0 }
        payoutMap.set(p.status, {
          count: existing.count + 1,
          total: existing.total + Number(p.amount)
        })
      })

      payoutMap.forEach((value, key) => {
        payoutStats.push({
          status: key,
          count: value.count,
          total: value.total
        })
      })
    }

    // Total de saques pagos
    const paidPayouts = payoutStats.find(p => p.status === 'completed')
    const pendingPayouts = payoutStats.filter(p => 
      ['pending', 'awaiting_document', 'under_review', 'approved', 'processing'].includes(p.status)
    )
    const totalPendingPayouts = pendingPayouts.reduce((sum, p) => sum + p.total, 0)
    const countPendingPayouts = pendingPayouts.reduce((sum, p) => sum + p.count, 0)

    // 6. Pedidos
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')

    const { data: ordersTotalValue } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'paid')

    const totalOrdersValue = ordersTotalValue?.reduce(
      (sum, row) => sum + Number(row.total_amount), 0
    ) || 0

    // 7. Novos membros este mês
    const { count: newMembersThisMonth } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    return NextResponse.json({
      members: {
        total: totalMembers || 0,
        active: activeMembers || 0,
        inactive: inactiveMembers || 0,
        pending: pendingMembers || 0,
        newThisMonth: newMembersThisMonth || 0,
        byLevel: membersByLevel.sort((a, b) => {
          const order = ['membro', 'parceira', 'lider_formacao', 'lider', 'diretora', 'head']
          return order.indexOf(a.level) - order.indexOf(b.level)
        })
      },
      cv: {
        currentMonth: totalCVCurrentMonth,
        currentMonthYear,
        allTime: totalCVAllTime
      },
      commissions: {
        currentMonth: totalCommissionsCurrentMonth,
        allTime: totalCommissions,
        byType: commissionsByType.sort((a, b) => b.total - a.total)
      },
      payouts: {
        pending: {
          count: countPendingPayouts,
          total: totalPendingPayouts
        },
        completed: {
          count: paidPayouts?.count || 0,
          total: paidPayouts?.total || 0
        },
        byStatus: payoutStats
      },
      orders: {
        total: totalOrders || 0,
        totalValue: totalOrdersValue
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[admin/stats] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
