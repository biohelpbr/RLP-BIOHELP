/**
 * Geração de ref_code único
 * SPEC 3.2 + TBD-006 RESOLVIDO:
 * - Formato padrão: BH00001 (sequencial)
 * - Admin pode customizar (ex: MARIA2026)
 * - Imutável após criado
 * - Membros existentes mantêm código atual (UUID curto)
 */

import { createServiceClient } from '@/lib/supabase/server'

/**
 * ID fixo da House Account (TBD-001)
 */
export const HOUSE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Gera um ref_code sequencial no formato BH00001
 * Usa função RPC do Supabase para garantir atomicidade
 * 
 * TBD-006 RESOLVIDO: Padrão sequencial
 */
export async function generateRefCode(): Promise<string> {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase.rpc('generate_sequential_ref_code')
  
  if (error || !data) {
    console.error('[ref-code] Erro ao gerar ref_code sequencial:', error)
    // Fallback de emergência — gera código aleatório no formato BH + 5 dígitos
    const fallback = 'BH' + String(Math.floor(10000 + Math.random() * 90000))
    console.warn(`[ref-code] Usando fallback de emergência: ${fallback}`)
    return fallback
  }
  
  return data as string
}

/**
 * Valida formato do ref_code
 * Aceita formato sequencial (BH00001) e customizados (MARIA2026)
 * Também aceita formato antigo UUID curto para membros existentes
 */
export function isValidRefCodeFormat(refCode: string): boolean {
  // Aceita 4-20 caracteres alfanuméricos (ampliado para customizações)
  return /^[a-zA-Z0-9_-]{4,20}$/.test(refCode)
}

