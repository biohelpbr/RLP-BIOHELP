/**
 * API: GET /api/members/me/commissions
 * Retorna resumo de comissões do membro logado
 * 
 * Sprint 4 - Biohelp LRP
 */

import { NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import type { MemberCommissionsResponse } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // 3. Chamar função RPC para obter resumo
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_member_commission_summary', { p_member_id: member.id })

    if (summaryError) {
      console.error('Erro ao buscar resumo de comissões:', summaryError)
      
      // Se a função RPC não existir, retornar dados zerados
      if (summaryError.message.includes('function') || summaryError.code === '42883') {
        const emptyResponse: MemberCommissionsResponse = {
          balance: {
            total_earned: 0,
            total_withdrawn: 0,
            available: 0,
            pending: 0
          },
          current_month: {
            fast_track: 0,
            perpetual: 0,
            bonus_3: 0,
            leadership: 0,
            royalty: 0,
            total: 0
          },
          history: []
        }
        return NextResponse.json(emptyResponse)
      }
      
      return NextResponse.json(
        { error: 'Erro ao buscar comissões' },
        { status: 500 }
      )
    }

    // 4. Formatar resposta
    const response: MemberCommissionsResponse = {
      balance: {
        total_earned: summary?.balance?.total_earned ?? 0,
        total_withdrawn: summary?.balance?.total_withdrawn ?? 0,
        available: summary?.balance?.available ?? 0,
        pending: summary?.balance?.pending ?? 0
      },
      current_month: {
        fast_track: summary?.current_month?.fast_track ?? 0,
        perpetual: summary?.current_month?.perpetual ?? 0,
        bonus_3: summary?.current_month?.bonus_3 ?? 0,
        leadership: summary?.current_month?.leadership ?? 0,
        royalty: summary?.current_month?.royalty ?? 0,
        total: summary?.current_month?.total ?? 0
      },
      history: summary?.history ?? []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro na API de comissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

