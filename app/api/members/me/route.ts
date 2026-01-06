/**
 * GET /api/members/me
 * SPEC: Seção 5.1 - Dashboard mostra dados do membro
 * Sprint: 1
 * 
 * Retorna dados do membro autenticado via Supabase Auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/supabase/server'
import type { Member, ShopifyCustomer } from '@/types/database'

// Força rota dinâmica (usa cookies)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação via Supabase Auth
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Buscar membro pelo auth_user_id
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
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !memberData) {
      console.error('[me] Member not found for auth user:', user.id, memberError)
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
      .eq('member_id', member.id)
      .single()
    
    const shopifySync = syncData as Pick<ShopifyCustomer, 'last_sync_status'> | null

    // Verificar se é admin
    const { data: roleData } = await supabase
      .from('roles')
      .select('role')
      .eq('member_id', member.id)
      .single()
    
    const isAdmin = roleData?.role === 'admin'

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        ref_code: member.ref_code,
        sponsor: sponsorName ? {
          name: sponsorName,
          ref_code: sponsorRefCode,
        } : null,
        status: member.status,
        created_at: member.created_at,
        shopify_sync_status: shopifySync?.last_sync_status || null,
      },
      isAdmin,
    })
  } catch (error) {
    console.error('[me] Unexpected error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno' },
      { status: 500 }
    )
  }
}
