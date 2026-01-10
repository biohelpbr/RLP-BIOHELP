/**
 * API: GET /api/members/me/commissions/details
 * Retorna detalhes das comissões do membro (ledger)
 * 
 * Query params:
 * - month: 'YYYY-MM' (opcional, default = mês atual)
 * - type: tipo de comissão (opcional, filtra por tipo)
 * - limit: número máximo de registros (opcional, default = 50)
 * 
 * Sprint 4 - Biohelp LRP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import type { CommissionDetailsResponse, CommissionDetail, CommissionType, COMMISSION_TYPE_LABELS } from '@/types/database'

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

    // 2. Buscar membro
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 3. Obter parâmetros
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')
    const typeParam = searchParams.get('type') as CommissionType | null
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)

    // Calcular mês de referência
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const month = monthParam || defaultMonth
    const referenceMonth = `${month}-01` // Formato DATE para o banco

    // 4. Buscar comissões do ledger
    let query = supabase
      .from('commission_ledger')
      .select(`
        id,
        commission_type,
        amount,
        cv_base,
        percentage,
        source_member_id,
        source_order_id,
        network_level,
        description,
        created_at,
        source_member:members!source_member_id(name),
        source_order:orders!source_order_id(shopify_order_number)
      `)
      .eq('member_id', member.id)
      .eq('reference_month', referenceMonth)
      .order('created_at', { ascending: false })
      .limit(limitParam)

    if (typeParam) {
      query = query.eq('commission_type', typeParam)
    }

    const { data: commissions, error: commissionsError } = await query

    if (commissionsError) {
      console.error('Erro ao buscar comissões:', commissionsError)
      
      // Se a tabela não existir, retornar dados vazios
      if (commissionsError.message.includes('relation') || commissionsError.code === '42P01') {
        const emptyResponse: CommissionDetailsResponse = {
          month,
          commissions: [],
          totals: {
            fast_track: 0,
            perpetual: 0,
            bonus_3: 0,
            leadership: 0,
            royalty: 0,
            total: 0
          }
        }
        return NextResponse.json(emptyResponse)
      }
      
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes de comissões' },
        { status: 500 }
      )
    }

    // 5. Formatar resposta
    const formattedCommissions: CommissionDetail[] = (commissions || []).map((c: any) => ({
      id: c.id,
      type: c.commission_type as CommissionType,
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

    // 6. Calcular totais
    const totals = {
      fast_track: 0,
      perpetual: 0,
      bonus_3: 0,
      leadership: 0,
      royalty: 0,
      total: 0
    }

    for (const c of formattedCommissions) {
      totals.total += c.amount
      
      if (c.type === 'fast_track_30' || c.type === 'fast_track_20') {
        totals.fast_track += c.amount
      } else if (c.type === 'perpetual') {
        totals.perpetual += c.amount
      } else if (c.type.startsWith('bonus_3')) {
        totals.bonus_3 += c.amount
      } else if (c.type === 'leadership') {
        totals.leadership += c.amount
      } else if (c.type === 'royalty') {
        totals.royalty += c.amount
      }
    }

    const response: CommissionDetailsResponse = {
      month,
      commissions: formattedCommissions,
      totals
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro na API de detalhes de comissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

