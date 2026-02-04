/**
 * API: GET/PATCH/DELETE /api/admin/members/[id]
 * Sprint 6 - FR-37: Gestão completa de membro
 * 
 * GET: Detalhes completos do membro
 * PATCH: Editar dados, ajustar nível, bloquear
 * DELETE: Remover membro (soft delete ou bloqueio)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isCurrentUserAdmin, getAuthUser } from '@/lib/supabase/server'
import { syncMemberToShopify } from '@/lib/shopify/sync'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Tipos de ação permitidas
type MemberAction = 'edit' | 'adjust_level' | 'block' | 'unblock' | 'adjust_commission'

interface PatchBody {
  action: MemberAction
  data?: {
    name?: string
    email?: string
    phone?: string
    phone_visibility?: 'public' | 'network' | 'private'
    level?: 'membro' | 'parceira' | 'lider_formacao' | 'lider' | 'diretora' | 'head'
    status?: 'pending' | 'active' | 'inactive'
    commission_adjustment?: {
      amount: number
      description: string
    }
  }
  reason?: string
}

/**
 * GET - Detalhes completos do membro
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const { id: memberId } = await params
    const supabase = createServiceClient()

    // Buscar membro com todos os dados
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        phone,
        phone_visibility,
        ref_code,
        sponsor_id,
        status,
        level,
        level_updated_at,
        current_cv_month,
        current_cv_month_year,
        inactive_months_count,
        lider_formacao_started_at,
        created_at,
        auth_user_id
      `)
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Buscar sponsor
    let sponsor = null
    if (member.sponsor_id) {
      const { data: sponsorData } = await supabase
        .from('members')
        .select('id, name, email, ref_code')
        .eq('id', member.sponsor_id)
        .single()
      sponsor = sponsorData
    }

    // Buscar indicados diretos (N1)
    const { data: directRecruits, count: directRecruitsCount } = await supabase
      .from('members')
      .select('id, name, email, status, level', { count: 'exact' })
      .eq('sponsor_id', memberId)

    // Buscar saldo de comissões
    const { data: balance } = await supabase
      .from('commission_balances')
      .select('*')
      .eq('member_id', memberId)
      .single()

    // Buscar sync Shopify
    const { data: shopifySync } = await supabase
      .from('shopify_customers')
      .select('*')
      .eq('member_id', memberId)
      .single()

    // Buscar histórico de níveis
    const { data: levelHistory } = await supabase
      .from('member_level_history')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar últimas comissões
    const { data: recentCommissions } = await supabase
      .from('commission_ledger')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar saques
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      member: {
        ...member,
        sponsor,
        direct_recruits: directRecruits || [],
        direct_recruits_count: directRecruitsCount || 0
      },
      balance: balance || {
        total_earned: 0,
        total_withdrawn: 0,
        available_balance: 0,
        pending_balance: 0
      },
      shopify_sync: shopifySync,
      level_history: levelHistory || [],
      recent_commissions: recentCommissions || [],
      recent_payouts: payouts || []
    })

  } catch (error) {
    console.error('[admin/members/[id]] GET error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Editar membro, ajustar nível, bloquear
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const user = await getAuthUser()
    const { id: memberId } = await params
    const body: PatchBody = await request.json()
    const supabase = createServiceClient()

    // Buscar admin atual
    const { data: adminMember } = await supabase
      .from('members')
      .select('id, name')
      .eq('auth_user_id', user!.id)
      .single()

    // Verificar se membro existe
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    let updateData: Record<string, unknown> = {}
    let auditLog: Record<string, unknown> = {
      admin_id: adminMember?.id,
      admin_name: adminMember?.name,
      action: body.action,
      reason: body.reason,
      timestamp: new Date().toISOString()
    }

    switch (body.action) {
      case 'edit':
        // Editar dados básicos
        if (body.data?.name) updateData.name = body.data.name
        if (body.data?.phone !== undefined) updateData.phone = body.data.phone
        if (body.data?.phone_visibility) updateData.phone_visibility = body.data.phone_visibility
        
        auditLog.changes = body.data
        break

      case 'adjust_level':
        // Ajustar nível manualmente
        if (!body.data?.level) {
          return NextResponse.json(
            { error: 'Nível é obrigatório' },
            { status: 400 }
          )
        }

        const oldLevel = member.level
        updateData.level = body.data.level
        updateData.level_updated_at = new Date().toISOString()

        // Registrar no histórico de níveis
        await supabase
          .from('member_level_history')
          .insert({
            member_id: memberId,
            previous_level: oldLevel,
            new_level: body.data.level,
            reason: `Ajuste manual por admin: ${body.reason || 'Sem motivo informado'}`,
            criteria_snapshot: {
              manual_adjustment: true,
              adjusted_by: adminMember?.id,
              adjusted_at: new Date().toISOString()
            }
          })

        auditLog.old_level = oldLevel
        auditLog.new_level = body.data.level
        break

      case 'block':
        // Bloquear membro
        updateData.status = 'inactive'
        auditLog.blocked = true
        break

      case 'unblock':
        // Desbloquear membro
        updateData.status = 'pending' // Volta para pending, precisa comprar para ativar
        auditLog.unblocked = true
        break

      case 'adjust_commission':
        // Ajustar comissão manualmente
        if (!body.data?.commission_adjustment) {
          return NextResponse.json(
            { error: 'Dados do ajuste são obrigatórios' },
            { status: 400 }
          )
        }

        const { amount, description } = body.data.commission_adjustment

        // Criar entrada no ledger
        const { error: ledgerError } = await supabase
          .from('commission_ledger')
          .insert({
            member_id: memberId,
            commission_type: amount >= 0 ? 'adjustment' : 'reversal',
            amount: amount,
            reference_month: new Date().toISOString().slice(0, 10),
            description: `[Admin] ${description}`,
            metadata: {
              adjusted_by: adminMember?.id,
              reason: body.reason
            }
          })

        if (ledgerError) {
          console.error('Erro ao criar ajuste:', ledgerError)
          return NextResponse.json(
            { error: 'Erro ao criar ajuste de comissão' },
            { status: 500 }
          )
        }

        // Atualizar saldo
        const { data: currentBalance } = await supabase
          .from('commission_balances')
          .select('*')
          .eq('member_id', memberId)
          .single()

        if (currentBalance) {
          await supabase
            .from('commission_balances')
            .update({
              total_earned: (currentBalance.total_earned || 0) + (amount > 0 ? amount : 0),
              available_balance: (currentBalance.available_balance || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('member_id', memberId)
        } else {
          await supabase
            .from('commission_balances')
            .insert({
              member_id: memberId,
              total_earned: amount > 0 ? amount : 0,
              available_balance: amount,
              total_withdrawn: 0,
              pending_balance: 0
            })
        }

        auditLog.commission_adjustment = body.data.commission_adjustment
        
        return NextResponse.json({
          success: true,
          message: 'Ajuste de comissão realizado',
          adjustment: {
            amount,
            description
          }
        })

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }

    // Aplicar atualizações se houver
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId)

      if (updateError) {
        console.error('Erro ao atualizar membro:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar membro' },
          { status: 500 }
        )
      }

      // Sincronizar com Shopify se necessário
      if (body.action === 'edit' || body.action === 'block' || body.action === 'unblock') {
        try {
          // Buscar dados atualizados do membro para sync
          const { data: updatedMember } = await supabase
            .from('members')
            .select('id, email, name, ref_code, sponsor_id')
            .eq('id', memberId)
            .single()
          
          if (updatedMember) {
            // Buscar ref_code do sponsor
            let sponsorRefCode: string | null = null
            if (updatedMember.sponsor_id) {
              const { data: sponsorData } = await supabase
                .from('members')
                .select('ref_code')
                .eq('id', updatedMember.sponsor_id)
                .single()
              sponsorRefCode = sponsorData?.ref_code || null
            }
            
            await syncMemberToShopify({
              memberId: updatedMember.id,
              email: updatedMember.email,
              name: updatedMember.name,
              refCode: updatedMember.ref_code,
              sponsorRefCode
            })
          }
        } catch (syncError) {
          console.error('Erro ao sincronizar com Shopify:', syncError)
          // Não falhar a operação por causa do sync
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ação '${body.action}' executada com sucesso`,
      audit: auditLog
    })

  } catch (error) {
    console.error('[admin/members/[id]] PATCH error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
