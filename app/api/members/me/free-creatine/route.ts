/**
 * API: GET/POST /api/members/me/free-creatine
 * Sprint 7 - TBD-019: Creatina mensal grátis
 * 
 * GET: Verifica elegibilidade do membro para creatina grátis
 * POST: Registra uso da creatina grátis (chamado pelo webhook de pedido)
 * 
 * Regra: Membro Ativo (200 CV) tem direito a 1 creatina grátis/mês
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getCurrentMember } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET - Verifica elegibilidade para creatina grátis
 */
export async function GET() {
  try {
    const member = await getCurrentMember()
    
    if (!member) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Chamar função de verificação
    const { data, error } = await supabase.rpc('check_free_creatine_eligibility', {
      p_member_id: member.id
    })

    if (error) {
      console.error('[free-creatine] RPC error:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar elegibilidade' },
        { status: 500 }
      )
    }

    const result = data?.[0] || {
      is_eligible: false,
      reason: 'Erro ao verificar',
      month_year: new Date().toISOString().slice(0, 7),
      already_claimed: false,
      member_status: member.status,
      current_cv: member.current_cv_month || 0
    }

    return NextResponse.json({
      eligible: result.is_eligible,
      reason: result.reason,
      month: result.month_year,
      alreadyClaimed: result.already_claimed,
      memberStatus: result.member_status,
      currentCV: result.current_cv,
      // Informações adicionais para o frontend
      benefit: {
        name: 'Creatina Grátis',
        description: 'Membros Ativos (200+ CV) têm direito a 1 unidade de creatina grátis por mês.',
        howToUse: 'Adicione a creatina ao seu carrinho. O desconto de 100% será aplicado automaticamente no checkout.'
      }
    })

  } catch (error) {
    console.error('[free-creatine] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Registra uso da creatina grátis
 * Body: { orderId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    
    if (!member) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { orderId } = body

    const supabase = createServiceClient()

    // Chamar função de registro
    const { data, error } = await supabase.rpc('claim_free_creatine', {
      p_member_id: member.id,
      p_order_id: orderId || null
    })

    if (error) {
      console.error('[free-creatine] RPC error:', error)
      return NextResponse.json(
        { error: 'Erro ao registrar uso' },
        { status: 500 }
      )
    }

    const result = data?.[0] || {
      success: false,
      message: 'Erro ao registrar',
      claim_id: null
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      claimId: result.claim_id
    })

  } catch (error) {
    console.error('[free-creatine] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
