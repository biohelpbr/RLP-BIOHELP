/**
 * API: GET/PATCH /api/admin/payouts
 * GET: Lista todas as solicitações de saque (admin)
 * PATCH: Atualiza status de uma solicitação
 * 
 * Sprint 5 - FR-32 (Workflow de aprovação)
 * SPEC 7.4: Workflow de aprovação
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient, isCurrentUserAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Listar todos os saques (admin)
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação e permissão admin
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const supabase = createServiceClient()

    // 2. Parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 3. Buscar saques usando RPC
    const { data: payouts, error: payoutsError } = await supabase
      .rpc('get_all_payouts', {
        p_status: status,
        p_limit: limit,
        p_offset: offset
      })

    if (payoutsError) {
      console.error('Erro ao buscar saques:', payoutsError)
      return NextResponse.json(
        { error: 'Erro ao buscar saques' },
        { status: 500 }
      )
    }

    // 4. Calcular totais por status
    const { data: stats } = await supabase
      .from('payout_requests')
      .select('status')
    
    const statusCounts = {
      pending: 0,
      awaiting_document: 0,
      under_review: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    }

    if (stats) {
      stats.forEach((row: { status: string }) => {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts]++
        }
      })
    }

    return NextResponse.json({
      payouts: payouts ?? [],
      total_count: payouts?.[0]?.total_count ?? 0,
      stats: statusCounts,
      pagination: {
        limit,
        offset,
        has_more: (payouts?.length ?? 0) === limit
      }
    })

  } catch (error) {
    console.error('Erro na API admin de saques:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH: Atualizar status de saque
export async function PATCH(request: NextRequest) {
  try {
    // 1. Verificar autenticação e permissão admin
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const supabase = createServiceClient()

    // 2. Buscar admin member_id
    const { data: adminMember } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminMember) {
      return NextResponse.json(
        { error: 'Admin não encontrado' },
        { status: 404 }
      )
    }

    // 3. Validar body
    const body = await request.json()
    const { payout_id, new_status, reason } = body

    if (!payout_id) {
      return NextResponse.json(
        { error: 'ID do saque é obrigatório' },
        { status: 400 }
      )
    }

    const validStatuses = [
      'pending', 'awaiting_document', 'under_review', 
      'approved', 'processing', 'completed', 'rejected', 'cancelled'
    ]

    if (!new_status || !validStatuses.includes(new_status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Rejeição requer motivo
    if (new_status === 'rejected' && !reason) {
      return NextResponse.json(
        { error: 'Motivo é obrigatório para rejeição' },
        { status: 400 }
      )
    }

    // 4. Chamar função RPC para atualizar status
    const { data: result, error: updateError } = await supabase
      .rpc('update_payout_status', {
        p_payout_id: payout_id,
        p_new_status: new_status,
        p_admin_id: adminMember.id,
        p_reason: reason || null
      })

    if (updateError) {
      console.error('Erro ao atualizar saque:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar atualização' },
        { status: 500 }
      )
    }

    const updateResult = result?.[0]

    if (!updateResult?.success) {
      return NextResponse.json(
        { error: updateResult?.message || 'Erro ao atualizar status' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: updateResult.message
    })

  } catch (error) {
    console.error('Erro na API admin de saques:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
