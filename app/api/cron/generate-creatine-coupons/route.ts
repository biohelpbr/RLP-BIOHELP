/**
 * Cron Job: Geração de Cupons de Creatina Grátis
 * TBD-019 RESOLVIDO: Cupom Individual Mensal
 * 
 * Funcionalidades:
 * - Executar no 2o dia de cada mês (após fechamento de CV)
 * - Buscar todos os membros ativos (status = 'active')
 * - Gerar cupom individual para cada membro elegível
 * - Registrar em free_creatine_claims
 * 
 * Configuração no Vercel:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-creatine-coupons",
 *     "schedule": "0 5 2 * *"  // Dia 2 às 05:00 UTC (02:00 BRT)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createCreatineCoupon } from '@/lib/shopify/coupon'
import { getCurrentMonthYear } from '@/lib/cv/calculator'
import { HOUSE_ACCOUNT_ID } from '@/lib/utils/ref-code'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutos max (muitos membros)

/**
 * GET - Geração batch de cupons de creatina
 * Protegido por CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()
    const currentMonthYear = getCurrentMonthYear()

    console.info(`[cron/creatine-coupons] Iniciando geração de cupons para ${currentMonthYear}`)

    // 1. Buscar membros ativos elegíveis (status active, não House Account)
    const { data: activeMembers, error: membersError } = await supabase
      .from('members')
      .select('id, name, email, status, current_cv_month')
      .eq('status', 'active')
      .neq('id', HOUSE_ACCOUNT_ID)

    if (membersError) {
      console.error('[cron/creatine-coupons] Erro ao buscar membros:', membersError)
      return NextResponse.json(
        { error: 'Erro ao buscar membros ativos' },
        { status: 500 }
      )
    }

    if (!activeMembers || activeMembers.length === 0) {
      console.info('[cron/creatine-coupons] Nenhum membro ativo encontrado')
      return NextResponse.json({
        success: true,
        message: 'Nenhum membro ativo encontrado',
        stats: { eligible: 0, generated: 0, skipped: 0, errors: 0 }
      })
    }

    console.info(`[cron/creatine-coupons] ${activeMembers.length} membros ativos encontrados`)

    // 2. Para cada membro, verificar se já tem cupom no mês e gerar se não
    let generated = 0
    let skipped = 0
    let errors = 0
    const errorDetails: Array<{ memberId: string; error: string }> = []

    for (const member of activeMembers) {
      try {
        // Verificar se já existe claim para este mês
        const { data: existingClaim } = await supabase
          .from('free_creatine_claims')
          .select('id, coupon_code')
          .eq('member_id', member.id)
          .eq('month_year', currentMonthYear)
          .single()

        if (existingClaim?.coupon_code) {
          // Já tem cupom, pular
          skipped++
          continue
        }

        // Gerar cupom via Shopify API
        const couponResult = await createCreatineCoupon({
          memberName: member.name,
          memberId: member.id,
          monthYear: currentMonthYear,
        })

        if (!couponResult.success || !couponResult.couponCode) {
          errors++
          errorDetails.push({
            memberId: member.id,
            error: couponResult.error || 'Falha na geração do cupom'
          })
          console.error(`[cron/creatine-coupons] Falha para ${member.name}: ${couponResult.error}`)
          continue
        }

        // Registrar claim
        if (existingClaim) {
          // Atualizar claim existente (sem cupom)
          await supabase
            .from('free_creatine_claims')
            .update({
              coupon_code: couponResult.couponCode,
              coupon_shopify_id: couponResult.priceRuleId,
            })
            .eq('id', existingClaim.id)
        } else {
          // Criar novo claim
          await supabase
            .from('free_creatine_claims')
            .insert({
              member_id: member.id,
              month_year: currentMonthYear,
              coupon_code: couponResult.couponCode,
              coupon_shopify_id: couponResult.priceRuleId,
              status: 'claimed',
            })
        }

        generated++
        console.info(`[cron/creatine-coupons] Cupom gerado: ${couponResult.couponCode} para ${member.name}`)

        // Rate limiting: aguardar 500ms entre chamadas à Shopify API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (memberError) {
        errors++
        errorDetails.push({
          memberId: member.id,
          error: memberError instanceof Error ? memberError.message : 'Erro desconhecido'
        })
        console.error(`[cron/creatine-coupons] Erro para membro ${member.id}:`, memberError)
      }
    }

    const stats = {
      eligible: activeMembers.length,
      generated,
      skipped,
      errors,
    }

    console.info(`[cron/creatine-coupons] Concluído:`, stats)

    return NextResponse.json({
      success: true,
      message: `Cupons gerados: ${generated}/${activeMembers.length} (${skipped} já existiam, ${errors} erros)`,
      stats,
      errors: errorDetails.length > 0 ? errorDetails : undefined
    })

  } catch (error) {
    console.error('[cron/creatine-coupons] Erro fatal:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
