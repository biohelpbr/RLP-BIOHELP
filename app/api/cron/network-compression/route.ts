/**
 * Cron Job: Compressão de Rede
 * Sprint 6 - FR-12: Regra de 6 meses inativo
 * 
 * Executa mensalmente após o fechamento de CV:
 * 1. Atualiza contador de meses inativos
 * 2. Remove membros com 6+ meses inativos
 * 3. Comprime a rede (move indicados para o sponsor)
 * 
 * Configuração: vercel.json (cron: "0 4 1 * *" - dia 1 às 04:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  runNetworkCompression, 
  updateInactiveMonthsCount 
} from '@/lib/network/compression'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutos

// Verificar autorização via header (Vercel Cron)
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Se não há CRON_SECRET configurado, permitir em dev
  if (!cronSecret && process.env.NODE_ENV === 'development') {
    return true
  }

  // Verificar header de autorização do Vercel Cron
  if (authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  // Verificar header específico do Vercel
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  if (vercelCronHeader === '1') {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  console.log('[cron/network-compression] Iniciando...')

  // Verificar autorização
  if (!isAuthorized(request)) {
    console.error('[cron/network-compression] Não autorizado')
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    // 1. Atualizar contadores de meses inativos
    console.log('[cron/network-compression] Atualizando contadores...')
    const countersResult = await updateInactiveMonthsCount()
    console.log('[cron/network-compression] Contadores:', countersResult)

    // 2. Executar compressão de rede
    console.log('[cron/network-compression] Executando compressão...')
    const compressionResult = await runNetworkCompression()
    console.log('[cron/network-compression] Compressão:', {
      processed: compressionResult.processed,
      successful: compressionResult.successful,
      failed: compressionResult.failed
    })

    return NextResponse.json({
      success: true,
      counters: countersResult,
      compression: {
        processed: compressionResult.processed,
        successful: compressionResult.successful,
        failed: compressionResult.failed,
        recruits_moved: compressionResult.recruits_moved
      },
      executed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('[cron/network-compression] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao executar compressão',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Endpoint POST para execução manual (admin)
export async function POST(request: NextRequest) {
  console.log('[cron/network-compression] Execução manual...')

  // Para execução manual, verificar se é admin
  // Por simplicidade, usar o mesmo header de autorização
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    )
  }

  return GET(request)
}
