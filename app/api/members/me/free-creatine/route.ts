/**
 * API: GET/POST /api/members/me/free-creatine
 * Sprint 7 - TBD-019 RESOLVIDO: Cupom Individual Mensal
 * 
 * GET: Verifica elegibilidade + gera/retorna cupom do mês
 * POST: Registra uso da creatina grátis (chamado pelo webhook de pedido)
 * 
 * Regra: Membro Ativo (200 CV) recebe cupom CREATINA-<NOME>-<MÊSANO>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getCurrentMember } from '@/lib/supabase/server'
import { createCreatineCoupon, generateCouponCode } from '@/lib/shopify/coupon'

export const dynamic = 'force-dynamic'

/**
 * GET - Verifica elegibilidade + gera/retorna cupom
 * TBD-019: Se elegível e sem cupom no mês → cria cupom via Shopify API
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
    const currentMonthYear = new Date().toISOString().slice(0, 7) // YYYY-MM

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
      month_year: currentMonthYear,
      already_claimed: false,
      member_status: member.status,
      current_cv: member.current_cv_month || 0
    }

    // Verificar se já existe cupom gerado para este mês
    const { data: existingClaim } = await supabase
      .from('free_creatine_claims')
      .select('coupon_code, status')
      .eq('member_id', member.id)
      .eq('month_year', currentMonthYear)
      .single()

    let couponCode: string | null = existingClaim?.coupon_code || null

    // Se elegível, sem cupom existente e não claimed → gerar cupom
    if (result.is_eligible && !couponCode && !result.already_claimed) {
      const couponResult = await createCreatineCoupon({
        memberName: member.name,
        memberId: member.id,
        monthYear: currentMonthYear,
      })

      if (couponResult.success && couponResult.couponCode) {
        couponCode = couponResult.couponCode

        // Registrar claim com cupom (status 'generated', não 'claimed' ainda)
        await supabase
          .from('free_creatine_claims')
          .upsert({
            member_id: member.id,
            month_year: currentMonthYear,
            coupon_code: couponCode,
            coupon_shopify_id: couponResult.priceRuleId,
            status: 'claimed', // Marca como gerado/disponível
          }, {
            onConflict: 'member_id,month_year'
          })

        console.info(`[free-creatine] Cupom gerado para ${member.name}: ${couponCode}`)
      } else {
        console.error('[free-creatine] Falha ao criar cupom:', couponResult.error)
      }
    }

    // Se não gerou cupom mas é elegível, gerar código preview
    const previewCode = !couponCode && result.is_eligible 
      ? generateCouponCode(member.name, currentMonthYear)
      : null

    return NextResponse.json({
      eligible: result.is_eligible,
      reason: result.reason,
      month: result.month_year,
      alreadyClaimed: result.already_claimed,
      memberStatus: result.member_status,
      currentCV: result.current_cv,
      // TBD-019: Cupom individual
      couponCode: couponCode,
      // Informações adicionais para o frontend
      benefit: {
        name: 'Creatina Grátis',
        description: 'Membros Ativos (200+ CV) têm direito a 1 unidade de creatina grátis por mês.',
        howToUse: couponCode
          ? `Use o cupom ${couponCode} no checkout da loja para obter sua creatina grátis.`
          : 'Atinja 200 CV para liberar seu cupom de creatina grátis.',
        previewCode: previewCode,
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
