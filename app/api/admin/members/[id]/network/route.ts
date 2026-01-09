/**
 * API: GET /api/admin/members/[id]/network
 * Sprint 3 - Rede Visual (Admin)
 * 
 * Retorna a rede de qualquer membro (apenas para admins)
 * 
 * SPEC 1.3 + TBD-012 + TBD-013
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/supabase/server'
import type { NetworkMember, MemberNetworkResponse, MemberLevel } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params
    
    // 1. Verificar autenticação via Supabase Auth
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Usar service client para bypass RLS
    const supabase = createServiceClient()

    // 2. Verificar se é admin
    const { data: adminMember } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminMember) {
      console.error('[admin/network] Admin member not found for auth user:', user.id)
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    const { data: role } = await supabase
      .from('roles')
      .select('role')
      .eq('member_id', adminMember.id)
      .single()

    if (role?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas admins' },
        { status: 403 }
      )
    }

    // 3. Buscar membro alvo
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, level, current_cv_month, status')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 4. Buscar CV da rede usando função do banco
    const { data: networkCvData } = await supabase
      .rpc('calculate_network_cv', { p_member_id: member.id })

    const cvRede = networkCvData ?? 0

    // 5. Buscar rede completa
    const { data: networkData, error: networkError } = await supabase
      .rpc('get_member_network', { p_member_id: member.id })

    let network: NetworkMember[] = []
    
    if (networkError) {
      // Fallback: buscar apenas N1
      const { data: directReports } = await supabase
        .from('members')
        .select(`
          id, name, email, phone, phone_visibility, ref_code, 
          status, level, current_cv_month, created_at
        `)
        .eq('sponsor_id', member.id)
        .order('created_at', { ascending: false })

      if (directReports) {
        network = directReports.map(m => formatNetworkMemberAdmin(m, 1))
      }
    } else if (networkData) {
      network = networkData.map((m: Record<string, unknown>) => 
        formatNetworkMemberAdmin(m, m.depth as number)
      )
    }

    // 6. Calcular estatísticas
    const stats = calculateNetworkStats(network)

    // 7. Montar resposta
    const response: MemberNetworkResponse = {
      member: {
        id: member.id,
        name: member.name,
        level: member.level as MemberLevel,
        cv_pessoal: member.current_cv_month ?? 0,
        cv_rede: cvRede
      },
      network,
      stats
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar rede:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Formata um membro da rede para admin (sem restrições de privacidade)
 */
function formatNetworkMemberAdmin(
  m: Record<string, unknown>, 
  depth: number
): NetworkMember {
  return {
    id: m.id as string,
    name: m.name as string,
    email: m.email as string,
    phone: (m.phone as string) ?? null, // Admin vê tudo
    ref_code: m.ref_code as string,
    status: m.status as 'pending' | 'active' | 'inactive',
    level: (m.level as MemberLevel) ?? 'membro',
    cv_month: (m.current_cv_month as number) ?? null,
    depth,
    children_count: 0,
    created_at: m.created_at as string
  }
}

/**
 * Calcula estatísticas da rede
 */
function calculateNetworkStats(network: NetworkMember[]) {
  const byLevel: Record<number, { total: number; active: number }> = {}
  let totalMembers = 0
  let activeMembers = 0

  for (const member of network) {
    totalMembers++
    if (member.status === 'active') {
      activeMembers++
    }

    if (!byLevel[member.depth]) {
      byLevel[member.depth] = { total: 0, active: 0 }
    }
    byLevel[member.depth].total++
    if (member.status === 'active') {
      byLevel[member.depth].active++
    }
  }

  return {
    total_members: totalMembers,
    active_members: activeMembers,
    by_level: byLevel
  }
}

