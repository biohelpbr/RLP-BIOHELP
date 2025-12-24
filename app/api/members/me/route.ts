/**
 * GET /api/members/me
 * SPEC: Suporte ao dashboard v1
 * Sprint: 1
 * 
 * Retorna dados do membro autenticado.
 * 
 * TODO: Integrar com Supabase Auth quando implementado
 * Por enquanto aceita member_id via cookie ou query param para testes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Member, ShopifyCustomer } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // TODO: Substituir por auth real (Supabase Auth session)
    // Por enquanto, aceitar member_id de cookie ou query para testes
    const memberId = 
      request.cookies.get('member_id')?.value ||
      request.nextUrl.searchParams.get('member_id')

    if (!memberId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar membro com sponsor
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        ref_code,
        sponsor_id,
        status,
        created_at
      `)
      .eq('id', memberId)
      .single()

    if (memberError || !memberData) {
      console.error('[me] Member not found:', memberError)
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Type assertion para garantir tipagem correta
    const member = memberData as Member

    // Buscar dados do sponsor se existir
    let sponsorName: string | null = null
    let sponsorRefCode: string | null = null

    if (member.sponsor_id) {
      const { data: sponsorData } = await supabase
        .from('members')
        .select('name, ref_code')
        .eq('id', member.sponsor_id)
        .single()

      const sponsor = sponsorData as Pick<Member, 'name' | 'ref_code'> | null
      if (sponsor) {
        sponsorName = sponsor.name
        sponsorRefCode = sponsor.ref_code
      }
    }

    // Buscar status de sync Shopify
    const { data: syncData } = await supabase
      .from('shopify_customers')
      .select('last_sync_status')
      .eq('member_id', memberId)
      .single()
    
    const shopifySync = syncData as Pick<ShopifyCustomer, 'last_sync_status'> | null

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        ref_code: member.ref_code,
        sponsor_name: sponsorName,
        sponsor_ref_code: sponsorRefCode,
        status: member.status,
        created_at: member.created_at,
        shopify_sync_status: shopifySync?.last_sync_status || null,
      },
    })
  } catch (error) {
    console.error('[me] Unexpected error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno' },
      { status: 500 }
    )
  }
}

