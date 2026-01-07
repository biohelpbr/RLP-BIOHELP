/**
 * Cron Job: Fechamento Mensal de CV
 * SPEC: Sprint 2 - Job de fechamento mensal
 * 
 * Funcionalidades:
 * - Executar no primeiro dia de cada mês
 * - Fechar CV do mês anterior
 * - Atualizar status de todos os membros
 * - Atualizar tags no Shopify
 * - Resetar CV mensal para o novo mês
 * 
 * Configuração no Vercel:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/close-monthly-cv",
 *     "schedule": "0 3 1 * *"  // Dia 1 às 03:00 UTC (00:00 BRT)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncCustomerToShopify } from '@/lib/shopify/customer'
import {
  getPreviousMonthYear,
  getCurrentMonthYear,
  isActiveCV
} from '@/lib/cv/calculator'

// Secret para proteger o endpoint
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // 1. Validar autorização
  const authHeader = request.headers.get('authorization')
  
  // Aceitar Vercel Cron ou secret manual
  if (authHeader !== `Bearer ${CRON_SECRET}` && 
      request.headers.get('x-vercel-cron') !== '1') {
    console.error('[cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const previousMonth = getPreviousMonthYear()
  const currentMonth = getCurrentMonthYear()

  console.info(`[cron] Iniciando fechamento do mês ${previousMonth}`)

  const supabase = createServiceClient()

  // 2. Buscar todos os membros com CV no mês anterior
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select(`
      id,
      name,
      email,
      ref_code,
      sponsor_id,
      status,
      current_cv_month,
      current_cv_month_year
    `)

  if (membersError) {
    console.error('[cron] Erro ao buscar membros:', membersError)
    return NextResponse.json(
      { error: 'Failed to fetch members', details: membersError.message },
      { status: 500 }
    )
  }

  const results = {
    processed: 0,
    activated: 0,
    deactivated: 0,
    unchanged: 0,
    errors: 0,
    shopifyUpdates: 0
  }

  // 3. Processar cada membro
  for (const member of members || []) {
    try {
      // Calcular CV do mês anterior
      const cvPreviousMonth = member.current_cv_month_year === previousMonth
        ? (member.current_cv_month || 0)
        : 0

      // Determinar novo status
      const shouldBeActive = isActiveCV(cvPreviousMonth)
      const newStatus = shouldBeActive ? 'active' : 'inactive'
      const statusChanged = newStatus !== member.status

      // 4. Atualizar ou criar resumo mensal
      const { data: existingSummary } = await supabase
        .from('cv_monthly_summary')
        .select('id')
        .eq('member_id', member.id)
        .eq('month_year', previousMonth)
        .single()

      if (existingSummary) {
        await supabase
          .from('cv_monthly_summary')
          .update({
            status_at_close: newStatus,
            closed_at: new Date().toISOString()
          })
          .eq('id', existingSummary.id)
      } else {
        // Criar resumo se não existir (membro sem pedidos no mês)
        await supabase
          .from('cv_monthly_summary')
          .insert({
            member_id: member.id,
            month_year: previousMonth,
            total_cv: cvPreviousMonth,
            orders_count: 0,
            status_at_close: newStatus,
            closed_at: new Date().toISOString()
          })
      }

      // 5. Atualizar membro para o novo mês
      await supabase
        .from('members')
        .update({
          status: newStatus,
          current_cv_month: 0,
          current_cv_month_year: currentMonth,
          last_cv_calculation_at: new Date().toISOString()
        })
        .eq('id', member.id)

      // 6. Atualizar contadores
      results.processed++
      if (statusChanged) {
        if (newStatus === 'active') {
          results.activated++
        } else {
          results.deactivated++
        }
      } else {
        results.unchanged++
      }

      // 7. Atualizar tag no Shopify se status mudou
      if (statusChanged) {
        try {
          // Buscar sponsor ref_code
          let sponsorRefCode: string | null = null
          if (member.sponsor_id) {
            const { data: sponsor } = await supabase
              .from('members')
              .select('ref_code')
              .eq('id', member.sponsor_id)
              .single()
            sponsorRefCode = sponsor?.ref_code || null
          }

          await syncCustomerToShopify({
            email: member.email,
            firstName: member.name,
            refCode: member.ref_code,
            sponsorRefCode
          })

          results.shopifyUpdates++
        } catch (shopifyError) {
          console.error(`[cron] Erro ao atualizar Shopify para ${member.email}:`, shopifyError)
        }
      }

    } catch (error) {
      console.error(`[cron] Erro ao processar membro ${member.id}:`, error)
      results.errors++
    }
  }

  const duration = Date.now() - startTime

  console.info(`[cron] Fechamento concluído:`, {
    month: previousMonth,
    ...results,
    duration: `${duration}ms`
  })

  return NextResponse.json({
    success: true,
    month: previousMonth,
    newMonth: currentMonth,
    results,
    duration: `${duration}ms`
  })
}

/**
 * POST - Permite execução manual do fechamento
 * Útil para testes ou recuperação
 */
export async function POST(request: NextRequest) {
  // Mesma lógica do GET, mas permite especificar o mês
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Delegar para GET
  return GET(request)
}

