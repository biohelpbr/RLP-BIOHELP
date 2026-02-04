/**
 * API: GET/POST /api/members/me/payouts
 * GET: Lista solicitações de saque do membro
 * POST: Cria nova solicitação de saque
 * 
 * Sprint 5 - FR-29, FR-30, FR-31
 * SPEC 7.1: Solicitação de saque
 * 
 * TBDs Resolvidos:
 * - TBD-015: Limite PF = R$ 1.000/mês
 * - TBD-016: Mínimo para saque = R$ 100
 * - TBD-021: Net-15 (disponível 15 dias após virada do mês)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { 
  PF_MONTHLY_LIMIT, 
  MIN_PAYOUT_AMOUNT, 
  PAYOUT_ERRORS,
  PAYOUT_NEXT_STEPS 
} from '@/lib/payouts/constants'

export const dynamic = 'force-dynamic'

// Tipos para a API
interface PayoutRequest {
  amount: number
  person_type: 'pf' | 'mei' | 'pj'
  bank_name: string
  bank_agency: string
  bank_account: string
  bank_account_type: 'corrente' | 'poupanca'
  pix_key?: string
  cpf_cnpj: string
  holder_name: string
}

interface PayoutListItem {
  id: string
  amount: number
  gross_amount: number
  tax_amount: number
  net_amount: number
  person_type: string
  status: string
  bank_name: string
  pix_key: string | null
  created_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

// GET: Listar saques do membro
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

    // 3. Buscar saldo disponível
    const { data: balance } = await supabase
      .from('commission_balances')
      .select('available_balance, pending_balance, total_earned, total_withdrawn')
      .eq('member_id', member.id)
      .single()

    // 4. Buscar saques usando RPC
    const { data: payouts, error: payoutsError } = await supabase
      .rpc('get_member_payouts', { p_member_id: member.id })

    if (payoutsError) {
      console.error('Erro ao buscar saques:', payoutsError)
      return NextResponse.json(
        { error: 'Erro ao buscar saques' },
        { status: 500 }
      )
    }

    // 5. Verificar limite mensal PF
    const { data: limitCheck } = await supabase
      .rpc('check_pf_monthly_limit', { 
        p_member_id: member.id, 
        p_amount: 0 
      })

    return NextResponse.json({
      balance: {
        available: balance?.available_balance ?? 0,
        pending: balance?.pending_balance ?? 0,
        total_earned: balance?.total_earned ?? 0,
        total_withdrawn: balance?.total_withdrawn ?? 0
      },
      pf_monthly_limit: {
        limit: limitCheck?.[0]?.monthly_limit ?? PF_MONTHLY_LIMIT,
        used: limitCheck?.[0]?.current_total ?? 0,
        remaining: limitCheck?.[0]?.remaining ?? PF_MONTHLY_LIMIT
      },
      payouts: (payouts as PayoutListItem[]) ?? []
    })

  } catch (error) {
    console.error('Erro na API de saques:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Criar solicitação de saque
export async function POST(request: NextRequest) {
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
      .select('id, name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 3. Validar body
    const body: PayoutRequest = await request.json()

    // Validações básicas
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }

    // TBD-016: Valor mínimo para saque = R$100
    if (body.amount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { error: PAYOUT_ERRORS.MIN_AMOUNT },
        { status: 400 }
      )
    }

    if (!['pf', 'mei', 'pj'].includes(body.person_type)) {
      return NextResponse.json(
        { error: PAYOUT_ERRORS.INVALID_PERSON_TYPE },
        { status: 400 }
      )
    }

    if (!body.bank_name || !body.bank_agency || !body.bank_account) {
      return NextResponse.json(
        { error: PAYOUT_ERRORS.INCOMPLETE_BANK_DATA },
        { status: 400 }
      )
    }

    if (!body.cpf_cnpj || !body.holder_name) {
      return NextResponse.json(
        { error: PAYOUT_ERRORS.MISSING_CPF_CNPJ },
        { status: 400 }
      )
    }

    // SPEC 7.1: Conta sempre em nome da parceira (não terceiros)
    // Verificação simplificada: nome do titular deve conter parte do nome do membro
    const memberNameParts = member.name.toLowerCase().split(' ')
    const holderNameLower = body.holder_name.toLowerCase()
    const nameMatch = memberNameParts.some((part: string) =>
      part.length > 2 && holderNameLower.includes(part)
    )

    if (!nameMatch) {
      return NextResponse.json(
        { error: PAYOUT_ERRORS.THIRD_PARTY_ACCOUNT },
        { status: 400 }
      )
    }

    // 4. Chamar função RPC para criar saque
    const { data: result, error: createError } = await supabase
      .rpc('create_payout_request', {
        p_member_id: member.id,
        p_amount: body.amount,
        p_person_type: body.person_type,
        p_bank_name: body.bank_name,
        p_bank_agency: body.bank_agency,
        p_bank_account: body.bank_account,
        p_bank_account_type: body.bank_account_type,
        p_pix_key: body.pix_key || null,
        p_cpf_cnpj: body.cpf_cnpj,
        p_holder_name: body.holder_name
      })

    if (createError) {
      console.error('Erro ao criar saque:', createError)
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
      )
    }

    const createResult = result?.[0]
    
    if (!createResult?.success) {
      return NextResponse.json(
        { error: createResult?.message || 'Erro ao criar solicitação' },
        { status: 400 }
      )
    }

    // 5. Determinar próximos passos baseado no tipo
    const nextSteps = body.person_type === 'pf' 
      ? PAYOUT_NEXT_STEPS.PF 
      : body.person_type === 'mei' 
        ? PAYOUT_NEXT_STEPS.MEI 
        : PAYOUT_NEXT_STEPS.PJ

    return NextResponse.json({
      success: true,
      payout_id: createResult.payout_id,
      message: createResult.message,
      next_steps: nextSteps,
      requires_document: body.person_type === 'pj'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de saques:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
