/**
 * API: GET /api/admin/payouts/[id]
 * Detalhes de uma solicitação de saque específica (admin)
 * 
 * Sprint 5 - FR-32 (Workflow de aprovação)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient, isCurrentUserAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Detalhes do saque
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id: payoutId } = await context.params
    const supabase = createServiceClient()

    // 2. Buscar saque com detalhes
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        member:members(id, name, email, ref_code, level, status),
        reviewer:members!payout_requests_reviewed_by_fkey(id, name, email)
      `)
      .eq('id', payoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: 'Saque não encontrado' },
        { status: 404 }
      )
    }

    // 3. Buscar documentos anexados
    const { data: documents } = await supabase
      .from('payout_documents')
      .select('*')
      .eq('payout_request_id', payoutId)
      .order('created_at', { ascending: false })

    // 4. Buscar histórico
    const { data: history } = await supabase
      .from('payout_history')
      .select(`
        *,
        changed_by_member:members!payout_history_changed_by_fkey(id, name, email)
      `)
      .eq('payout_request_id', payoutId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      payout,
      documents: documents ?? [],
      history: history ?? []
    })

  } catch (error) {
    console.error('Erro na API admin de saques:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
