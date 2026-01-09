/**
 * API: GET /api/members/me/network
 * Sprint 3 - Rede Visual
 * 
 * Retorna a rede do membro logado com:
 * - Toda a rede abaixo (TBD-012: opção D - ilimitado)
 * - Campos visíveis conforme TBD-013
 * - Telefone visível conforme phone_visibility
 * 
 * SPEC 1.3 + TBD-012 + TBD-013
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { NetworkMember, MemberNetworkResponse, MemberLevel } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // 2. Buscar membro logado
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, level, current_cv_month, status')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 3. Buscar CV da rede usando função do banco
    const { data: networkCvData } = await supabase
      .rpc('calculate_network_cv', { p_member_id: member.id })

    const cvRede = networkCvData ?? 0

    // 4. Buscar rede completa usando CTE recursiva
    // Usamos uma query raw para ter controle total sobre a recursão
    const { data: networkData, error: networkError } = await supabase
      .rpc('get_member_network', { p_member_id: member.id })

    // Se a função RPC não existir, fazemos uma query alternativa
    let network: NetworkMember[] = []
    
    if (networkError) {
      // Fallback: buscar rede manualmente (apenas N1 se a função não existir)
      const { data: directReports } = await supabase
        .from('members')
        .select(`
          id, name, email, phone, phone_visibility, ref_code, 
          status, level, current_cv_month, created_at
        `)
        .eq('sponsor_id', member.id)
        .order('created_at', { ascending: false })

      if (directReports) {
        network = directReports.map(m => formatNetworkMember(m, member.id, 1))
      }
    } else if (networkData) {
      network = networkData.map((m: Record<string, unknown>) => 
        formatNetworkMember(m, member.id, m.depth as number)
      )
    }

    // 5. Calcular estatísticas
    const stats = calculateNetworkStats(network)

    // 6. Montar resposta
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
 * Formata um membro da rede aplicando regras de privacidade (TBD-013)
 */
function formatNetworkMember(
  m: Record<string, unknown>, 
  viewerId: string, 
  depth: number
): NetworkMember {
  // Regra de telefone (TBD-013):
  // - 'public': visível para todos
  // - 'network': visível apenas para sponsor (depth 0) e N1 (depth 1)
  // - 'private': não visível
  let phone: string | null = null
  const phoneVisibility = m.phone_visibility as string
  
  if (m.phone) {
    if (phoneVisibility === 'public') {
      phone = m.phone as string
    } else if (phoneVisibility === 'network' && depth <= 1) {
      phone = m.phone as string
    }
    // 'private' = phone permanece null
  }

  return {
    id: m.id as string,
    name: m.name as string,
    email: m.email as string,
    phone,
    ref_code: m.ref_code as string,
    status: m.status as 'pending' | 'active' | 'inactive',
    level: (m.level as MemberLevel) ?? 'membro',
    cv_month: (m.current_cv_month as number) ?? null,
    depth,
    children_count: 0, // Será calculado depois se necessário
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

