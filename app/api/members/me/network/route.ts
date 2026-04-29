/**
 * API: GET /api/members/me/network
 *
 * Comportamento dual (Pivô V2 — F-V11):
 * - LRP_V2 = false (default): retorna MemberNetworkResponse v1 (rede recursiva
 *   + cv_rede + estatísticas multi-nível). Comportamento atual de produção.
 * - LRP_V2 = true: retorna MemberNetworkResponseV2 — apenas sponsor + N1.
 *
 * Anti-SPEC v2 §3: a rota não toca em RLS, schema, ou contratos do Shopify.
 * Apenas restringe payload por feature flag.
 *
 * Ver: docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md
 */

import { NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { isV2Enabled } from '@/lib/utils/featureFlags'
import { getMemberNetworkV2 } from '@/lib/network/v2'
import type {
  NetworkMember,
  MemberNetworkResponse,
  MemberLevel,
} from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Autenticação via Supabase Auth
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // 2. Buscar membro logado
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, level, current_cv_month, status')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      console.error('[network] Member not found for auth user:', user.id, memberError)
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // 3. PIVÔ V2 — visão restrita (F-V11). Membro só vê sponsor + N1.
    if (isV2Enabled()) {
      const v2Response = await getMemberNetworkV2(member.id)
      if (!v2Response) {
        return NextResponse.json({ error: 'Erro ao carregar rede' }, { status: 500 })
      }
      return NextResponse.json(v2Response)
    }

    // 4. V1 LEGACY — comportamento atual (rede recursiva + CV + estatísticas).
    //    Mantém intocado até onda 6 (F-V12 cleanup).
    const { data: networkCvData } = await supabase.rpc('calculate_network_cv', {
      p_member_id: member.id,
    })
    const cvRede = networkCvData ?? 0

    const { data: networkData, error: networkError } = await supabase.rpc(
      'get_member_network',
      { p_member_id: member.id }
    )

    let network: NetworkMember[] = []
    if (networkError) {
      // Fallback: query manual (apenas N1 se a RPC não existir)
      const { data: directReports } = await supabase
        .from('members')
        .select(
          `id, name, email, phone, phone_visibility, ref_code,
           status, level, current_cv_month, created_at`
        )
        .eq('sponsor_id', member.id)
        .order('created_at', { ascending: false })

      if (directReports) {
        network = directReports.map((m) => formatNetworkMember(m, member.id, 1))
      }
    } else if (networkData) {
      network = networkData.map((m: Record<string, unknown>) =>
        formatNetworkMember(m, member.id, m.depth as number)
      )
    }

    const stats = calculateNetworkStats(network)

    const response: MemberNetworkResponse = {
      member: {
        id: member.id,
        name: member.name,
        level: member.level as MemberLevel,
        cv_pessoal: member.current_cv_month ?? 0,
        cv_rede: cvRede,
      },
      network,
      stats,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar rede:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * @deprecated V1 LEGACY — só usado quando LRP_V2=false.
 * Aplica regras de privacidade (TBD-013 do v1) ao montar membro da árvore.
 */
function formatNetworkMember(
  m: Record<string, unknown>,
  viewerId: string,
  depth: number
): NetworkMember {
  // Regra de telefone (TBD-013):
  // 'public' = visível pra todos
  // 'network' = visível pra sponsor (depth 0) e N1 (depth 1)
  // 'private' = nunca visível
  let phone: string | null = null
  const phoneVisibility = m.phone_visibility as string

  if (m.phone) {
    if (phoneVisibility === 'public') {
      phone = m.phone as string
    } else if (phoneVisibility === 'network' && depth <= 1) {
      phone = m.phone as string
    }
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
    children_count: 0,
    created_at: m.created_at as string,
  }
}

/**
 * @deprecated V1 LEGACY — só usado quando LRP_V2=false.
 */
function calculateNetworkStats(network: NetworkMember[]) {
  const byLevel: Record<number, { total: number; active: number }> = {}
  let totalMembers = 0
  let activeMembers = 0

  for (const member of network) {
    totalMembers++
    if (member.status === 'active') activeMembers++

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
    by_level: byLevel,
  }
}
