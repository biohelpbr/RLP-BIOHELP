/**
 * POST /api/admin/members/:id/resync-shopify
 * SPEC: Seção 7.2 - Reaplica tags/metacampos e revalida customer
 * Sprint: 1
 * 
 * Admin pode forçar resync de um membro específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncMemberToShopify } from '@/lib/shopify/sync'
import type { Member } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Tipo para o retorno da query
type MemberQueryResult = Pick<Member, 'id' | 'name' | 'email' | 'ref_code' | 'sponsor_id'>

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: memberId } = await params
    const supabase = createServiceClient()

    // TODO: Verificar se é admin (Supabase Auth + role check)
    const adminToken = request.headers.get('x-admin-token')
    const isAdminCookie = request.cookies.get('is_admin')?.value === 'true'
    
    if (!adminToken && !isAdminCookie) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso não autorizado' },
        { status: 401 }
      )
    }

    // Buscar membro
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        ref_code,
        sponsor_id
      `)
      .eq('id', memberId)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Type assertion para garantir tipagem correta
    const member = memberData as MemberQueryResult

    // Buscar ref_code do sponsor
    let sponsorRefCode: string | null = null
    if (member.sponsor_id) {
      const { data: sponsor } = await supabase
        .from('members')
        .select('ref_code')
        .eq('id', member.sponsor_id)
        .single()
      sponsorRefCode = (sponsor as Pick<Member, 'ref_code'> | null)?.ref_code || null
    }

    // Executar resync
    const result = await syncMemberToShopify({
      memberId: member.id,
      email: member.email,
      name: member.name,
      refCode: member.ref_code,
      sponsorRefCode,
    })

    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: 'Sync realizado com sucesso',
        shopify_customer_id: result.shopifyCustomerId,
      })
    } else {
      // Retorna sucesso parcial - o erro foi registrado no banco
      return NextResponse.json({
        ok: false,
        message: 'Sync falhou',
        error: result.error,
      }, { status: 502 })
    }
  } catch (error) {
    console.error('[resync-shopify] Unexpected error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno' },
      { status: 500 }
    )
  }
}

