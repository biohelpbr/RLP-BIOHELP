/**
 * API: GET /api/admin/commissions
 * Lista todas as comissões (admin)
 * 
 * Query params:
 * - month: 'YYYY-MM' (opcional, default = mês atual)
 * - member_id: UUID (opcional, filtra por membro)
 * - type: tipo de comissão (opcional)
 * - limit: número máximo de registros (opcional, default = 100)
 * - offset: paginação (opcional, default = 0)
 * 
 * Sprint 4 - Biohelp LRP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import type { CommissionType } from '@/types/database'

export const dynamic = 'force-dynamic'

// Labels para tipos de comissão
const TYPE_LABELS: Record<CommissionType, string> = {
  fast_track_30: 'Fast-Track 30%',
  fast_track_20: 'Fast-Track 20%',
  perpetual: 'Comissão Perpétua',
  bonus_3_level_1: 'Bônus 3 - Nível 1',
  bonus_3_level_2: 'Bônus 3 - Nível 2',
  bonus_3_level_3: 'Bônus 3 - Nível 3',
  leadership: 'Leadership Bônus',
  royalty: 'Royalty',
  adjustment: 'Ajuste Manual',
  reversal: 'Reversão'
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // 2. Verificar se é admin
    const { data: adminMember } = await supabase
      .from('members')
      .select('id, is_admin')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminMember?.is_admin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // 3. Obter parâmetros
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')
    const memberIdParam = searchParams.get('member_id')
    const typeParam = searchParams.get('type') as CommissionType | null
    const limitParam = parseInt(searchParams.get('limit') || '100', 10)
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10)

    // Calcular mês de referência
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const month = monthParam || defaultMonth
    const referenceMonth = `${month}-01`

    // 4. Buscar comissões
    let query = supabase
      .from('commission_ledger')
      .select(`
        id,
        member_id,
        commission_type,
        amount,
        cv_base,
        percentage,
        source_member_id,
        source_order_id,
        network_level,
        reference_month,
        description,
        created_at,
        member:members!member_id(id, name, email, level),
        source_member:members!source_member_id(name),
        source_order:orders!source_order_id(shopify_order_number)
      `, { count: 'exact' })
      .eq('reference_month', referenceMonth)
      .order('created_at', { ascending: false })
      .range(offsetParam, offsetParam + limitParam - 1)

    if (memberIdParam) {
      query = query.eq('member_id', memberIdParam)
    }

    if (typeParam) {
      query = query.eq('commission_type', typeParam)
    }

    const { data: commissions, count, error: commissionsError } = await query

    if (commissionsError) {
      console.error('Erro ao buscar comissões:', commissionsError)
      
      // Se a tabela não existir, retornar dados vazios
      if (commissionsError.message.includes('relation') || commissionsError.code === '42P01') {
        return NextResponse.json({
          commissions: [],
          pagination: {
            total: 0,
            limit: limitParam,
            offset: offsetParam,
            hasMore: false
          },
          summary: {
            total_amount: 0,
            by_type: {}
          }
        })
      }
      
      return NextResponse.json(
        { error: 'Erro ao buscar comissões' },
        { status: 500 }
      )
    }

    // 5. Formatar resposta
    const formattedCommissions = (commissions || []).map((c: any) => ({
      id: c.id,
      member: {
        id: c.member?.id,
        name: c.member?.name,
        email: c.member?.email,
        level: c.member?.level
      },
      type: c.commission_type,
      type_label: TYPE_LABELS[c.commission_type as CommissionType] || c.commission_type,
      amount: c.amount,
      cv_base: c.cv_base,
      percentage: c.percentage,
      source_member_name: c.source_member?.name || null,
      source_order_number: c.source_order?.shopify_order_number || null,
      network_level: c.network_level,
      description: c.description,
      created_at: c.created_at
    }))

    // 6. Calcular resumo
    const summary = {
      total_amount: formattedCommissions.reduce((sum: number, c: any) => sum + c.amount, 0),
      by_type: {} as Record<string, number>
    }

    for (const c of formattedCommissions) {
      if (!summary.by_type[c.type]) {
        summary.by_type[c.type] = 0
      }
      summary.by_type[c.type] += c.amount
    }

    return NextResponse.json({
      commissions: formattedCommissions,
      pagination: {
        total: count || 0,
        limit: limitParam,
        offset: offsetParam,
        hasMore: (count || 0) > offsetParam + limitParam
      },
      summary
    })

  } catch (error) {
    console.error('Erro na API admin de comissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

