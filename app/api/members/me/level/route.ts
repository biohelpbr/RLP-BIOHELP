/**
 * API: GET /api/members/me/level
 * Sprint 3 - Níveis de Liderança
 * 
 * Retorna o nível atual do membro e progresso para o próximo nível
 * 
 * SPEC 1.3 + TBD-011 (Regras de progressão)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { MemberLevelResponse, MemberLevel, LevelRequirement } from '@/types/database'

export const dynamic = 'force-dynamic'

// Mapeamento de níveis para nomes amigáveis
const LEVEL_NAMES: Record<MemberLevel, string> = {
  membro: 'Membro',
  parceira: 'Parceira',
  lider_formacao: 'Líder em Formação',
  lider: 'Líder',
  diretora: 'Diretora',
  head: 'Head'
}

// Ordem dos níveis
const LEVEL_ORDER: MemberLevel[] = [
  'membro',
  'parceira',
  'lider_formacao',
  'lider',
  'diretora',
  'head'
]

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
      .select('id, name, level, level_updated_at, status, current_cv_month')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    const currentLevel = (member.level as MemberLevel) ?? 'membro'

    // 3. Buscar métricas necessárias para calcular progresso
    // CV da rede
    const { data: cvRedeData } = await supabase
      .rpc('calculate_network_cv', { p_member_id: member.id })
    const cvRede = cvRedeData ?? 0

    // Parceiras ativas em N1
    const { data: parceirasN1Data } = await supabase
      .rpc('count_active_parceiras_n1', { p_member_id: member.id })
    const parceirasN1 = parceirasN1Data ?? 0

    // Líderes ativas em N1
    const { data: lideresN1Data } = await supabase
      .rpc('count_active_lideres_n1', { p_member_id: member.id })
    const lideresN1 = lideresN1Data ?? 0

    // Diretoras ativas em N1
    const { data: diretorasN1Data } = await supabase
      .rpc('count_active_diretoras_n1', { p_member_id: member.id })
    const diretorasN1 = diretorasN1Data ?? 0

    // 4. Calcular próximo nível e requisitos
    const nextLevel = getNextLevel(currentLevel)
    const requirements = calculateRequirements(
      currentLevel,
      nextLevel,
      {
        status: member.status,
        cv_pessoal: member.current_cv_month ?? 0,
        cv_rede: cvRede,
        parceiras_n1: parceirasN1,
        lideres_n1: lideresN1,
        diretoras_n1: diretorasN1
      }
    )

    // 5. Buscar histórico de níveis
    const { data: historyData } = await supabase
      .from('member_level_history')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // 6. Montar resposta
    const response: MemberLevelResponse = {
      current: {
        level: currentLevel,
        since: member.level_updated_at
      },
      progress: {
        next_level: nextLevel,
        requirements
      },
      history: historyData ?? []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar nível:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Retorna o próximo nível na hierarquia
 */
function getNextLevel(currentLevel: MemberLevel): MemberLevel | null {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
  if (currentIndex === -1 || currentIndex >= LEVEL_ORDER.length - 1) {
    return null // Já é Head ou nível inválido
  }
  return LEVEL_ORDER[currentIndex + 1]
}

/**
 * Calcula os requisitos para o próximo nível
 * Baseado em TBD-011 (documento canônico)
 */
function calculateRequirements(
  currentLevel: MemberLevel,
  nextLevel: MemberLevel | null,
  metrics: {
    status: string
    cv_pessoal: number
    cv_rede: number
    parceiras_n1: number
    lideres_n1: number
    diretoras_n1: number
  }
): LevelRequirement[] {
  if (!nextLevel) {
    return [] // Já é Head
  }

  const requirements: LevelRequirement[] = []

  switch (nextLevel) {
    case 'parceira':
      // Membro → Parceira: Membro Ativo + CV_rede >= 500
      requirements.push({
        name: 'Status Ativo',
        current: metrics.status === 'active' ? 1 : 0,
        required: 1,
        met: metrics.status === 'active'
      })
      requirements.push({
        name: 'CV da Rede',
        current: metrics.cv_rede,
        required: 500,
        met: metrics.cv_rede >= 500
      })
      break

    case 'lider_formacao':
      // Parceira → Líder em Formação: Trouxe primeira Parceira em N1
      requirements.push({
        name: 'Parceiras em N1',
        current: metrics.parceiras_n1,
        required: 1,
        met: metrics.parceiras_n1 >= 1
      })
      break

    case 'lider':
      // Parceira/Líder em Formação → Líder: 4 Parceiras Ativas em N1
      requirements.push({
        name: 'Status Ativo',
        current: metrics.status === 'active' ? 1 : 0,
        required: 1,
        met: metrics.status === 'active'
      })
      requirements.push({
        name: 'Parceiras Ativas em N1',
        current: metrics.parceiras_n1,
        required: 4,
        met: metrics.parceiras_n1 >= 4
      })
      break

    case 'diretora':
      // Líder → Diretora: 3 Líderes Ativas em N1 + 80.000 CV na rede
      requirements.push({
        name: 'Líderes Ativas em N1',
        current: metrics.lideres_n1,
        required: 3,
        met: metrics.lideres_n1 >= 3
      })
      requirements.push({
        name: 'CV da Rede',
        current: metrics.cv_rede,
        required: 80000,
        met: metrics.cv_rede >= 80000
      })
      break

    case 'head':
      // Diretora → Head: 3 Diretoras Ativas em N1 + 200.000 CV na rede
      requirements.push({
        name: 'Diretoras Ativas em N1',
        current: metrics.diretoras_n1,
        required: 3,
        met: metrics.diretoras_n1 >= 3
      })
      requirements.push({
        name: 'CV da Rede',
        current: metrics.cv_rede,
        required: 200000,
        met: metrics.cv_rede >= 200000
      })
      break
  }

  return requirements
}

