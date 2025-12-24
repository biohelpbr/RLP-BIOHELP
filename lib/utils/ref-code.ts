/**
 * Geração de ref_code único
 * SPEC 3.2: Código único do membro usado no link de indicação, imutável após criado
 * 
 * Formato: 8 caracteres alfanuméricos (ex: "abc12xyz")
 * Nota: TBD-006 pode alterar este formato - usar padrão seguro por enquanto
 */

import { nanoid } from 'nanoid'

/**
 * Gera um ref_code único de 8 caracteres
 * Usa nanoid para garantir aleatoriedade e baixa colisão
 */
export function generateRefCode(): string {
  // 8 caracteres = ~1 trilhão de combinações, suficiente para MVP
  return nanoid(8)
}

/**
 * Valida formato do ref_code
 */
export function isValidRefCodeFormat(refCode: string): boolean {
  // Aceita 6-12 caracteres alfanuméricos
  return /^[a-zA-Z0-9_-]{6,12}$/.test(refCode)
}

