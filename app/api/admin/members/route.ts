/**
 * GET /api/admin/members
 * SPEC: Seção 5.3, 6.3 - Admin lista/busca membros
 * Sprint: 1
 * 
 * Query params:
 * - search: busca por email ou ref_code
 * - page: página (default 1)
 * - limit: itens por página (default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Member, ShopifyCustomer } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // TODO: Verificar se é admin (Supabase Auth + role check)
    // Por enquanto aceita admin_token via header para testes
    const adminToken = request.headers.get('x-admin-token')
    const isAdminCookie = request.cookies.get('is_admin')?.value === 'true'
    
    if (!adminToken && !isAdminCookie) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso não autorizado' },
        { status: 401 }
      )
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    // Query base
    let query = supabase
      .from('members')
      .select(`
        id,
        name,
        email,
        ref_code,
        sponsor_id,
        status,
        created_at
      `, { count: 'exact' })

    // Aplicar busca se fornecida
    if (search) {
      query = query.or(`email.ilike.%${search}%,ref_code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Ordenar e paginar
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: members, error, count } = await query

    if (error) {
      console.error('[admin/members] Query error:', error)
      return NextResponse.json(
        { error: 'QUERY_ERROR', message: 'Erro ao buscar membros' },
        { status: 500 }
      )
    }

    // Buscar sponsors para cada membro
    const membersWithSponsors = await Promise.all(
      (members || []).map(async (member) => {
        // Type assertion para garantir tipagem correta
        const typedMember = member as Member
        let sponsor: Pick<Member, 'id' | 'name' | 'ref_code'> | null = null
        
        if (typedMember.sponsor_id) {
          const { data: sponsorData } = await supabase
            .from('members')
            .select('id, name, ref_code')
            .eq('id', typedMember.sponsor_id)
            .single()
          sponsor = sponsorData as Pick<Member, 'id' | 'name' | 'ref_code'> | null
        }

        // Buscar status de sync
        const { data: syncData } = await supabase
          .from('shopify_customers')
          .select('last_sync_status, last_sync_at, last_sync_error')
          .eq('member_id', typedMember.id)
          .single()

        return {
          ...typedMember,
          sponsor,
          shopify_sync: (syncData as Pick<ShopifyCustomer, 'last_sync_status' | 'last_sync_at' | 'last_sync_error'> | null) || null,
        }
      })
    )

    return NextResponse.json({
      members: membersWithSponsors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[admin/members] Unexpected error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno' },
      { status: 500 }
    )
  }
}

