/**
 * Calculador de CV (Commission Volume)
 * SPEC: Seção 1.2, 3.3 - CV por item/pedido
 * 
 * Regra padrão (TBD-008): CV = 100% do preço do item
 * Esta regra pode ser alterada conforme decisão do cliente
 */

import { ShopifyLineItem, OrderItem, CVLedgerInsert } from '@/types/database'

// =====================================================
// CONSTANTES
// =====================================================

/**
 * Meta de CV mensal para status "active"
 * SPEC 3.3: Ativa se CV >= 200 no mês
 */
export const CV_TARGET_MONTHLY = 200

/**
 * Percentual do preço que conta como CV
 * TBD-008: Regra padrão = 100%
 */
export const CV_PERCENTAGE = 1.0 // 100%

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Calcula o CV de um item do pedido
 * 
 * @param item - Item do pedido (Shopify ou interno)
 * @param cvPercentage - Percentual do preço que conta como CV (default: 100%)
 * @returns CV calculado para o item
 * 
 * SPEC 3.3: CV é a pontuação associada aos produtos/pedidos
 * TBD-008: Regra padrão = 100% do preço
 */
export function calculateItemCV(
  item: { price: number | string; quantity: number },
  cvPercentage: number = CV_PERCENTAGE
): number {
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
  const cv = price * item.quantity * cvPercentage
  
  // Arredondar para 2 casas decimais
  return Math.round(cv * 100) / 100
}

/**
 * Calcula o CV total de um pedido baseado nos itens
 * 
 * @param items - Lista de itens do pedido
 * @param cvPercentage - Percentual do preço que conta como CV
 * @returns CV total do pedido
 */
export function calculateOrderCV(
  items: Array<{ price: number | string; quantity: number }>,
  cvPercentage: number = CV_PERCENTAGE
): number {
  const totalCV = items.reduce((sum, item) => {
    return sum + calculateItemCV(item, cvPercentage)
  }, 0)
  
  // Arredondar para 2 casas decimais
  return Math.round(totalCV * 100) / 100
}

/**
 * Processa itens do Shopify e retorna dados para inserção
 * 
 * @param lineItems - Itens do pedido Shopify
 * @param orderId - ID do pedido no banco
 * @returns Dados para inserção na tabela order_items
 */
export function processShopifyLineItems(
  lineItems: ShopifyLineItem[],
  orderId: string
): Array<{
  order_id: string
  shopify_line_item_id: string
  product_id: string | null
  variant_id: string | null
  sku: string | null
  title: string
  quantity: number
  price: number
  cv_value: number
}> {
  return lineItems.map(item => ({
    order_id: orderId,
    shopify_line_item_id: String(item.id),
    product_id: item.product_id ? String(item.product_id) : null,
    variant_id: item.variant_id ? String(item.variant_id) : null,
    sku: item.sku || null,
    title: item.title,
    quantity: item.quantity,
    price: parseFloat(item.price),
    cv_value: calculateItemCV({
      price: item.price,
      quantity: item.quantity
    })
  }))
}

/**
 * Cria entradas no CV ledger para um pedido pago
 * 
 * @param memberId - ID do membro
 * @param orderId - ID do pedido
 * @param items - Itens processados com CV
 * @param monthYear - Mês/ano no formato YYYY-MM
 * @returns Entradas para o cv_ledger
 */
export function createCVLedgerEntriesForOrder(
  memberId: string,
  orderId: string,
  items: Array<{ id?: string; cv_value: number; title: string }>,
  monthYear: string
): CVLedgerInsert[] {
  return items.map(item => ({
    member_id: memberId,
    order_id: orderId,
    order_item_id: item.id || null,
    cv_amount: item.cv_value,
    cv_type: 'order_paid' as const,
    month_year: monthYear,
    description: `CV do item: ${item.title}`
  }))
}

/**
 * Cria entradas de reversão no CV ledger (refund/cancel)
 * 
 * @param memberId - ID do membro
 * @param orderId - ID do pedido
 * @param items - Itens a reverter
 * @param monthYear - Mês/ano no formato YYYY-MM
 * @param type - Tipo de reversão ('order_refunded' ou 'order_cancelled')
 * @returns Entradas de reversão para o cv_ledger
 */
export function createCVLedgerReversalEntries(
  memberId: string,
  orderId: string,
  items: Array<{ id?: string; cv_value: number; title: string }>,
  monthYear: string,
  type: 'order_refunded' | 'order_cancelled'
): CVLedgerInsert[] {
  return items.map(item => ({
    member_id: memberId,
    order_id: orderId,
    order_item_id: item.id || null,
    cv_amount: -item.cv_value, // Valor negativo para reversão
    cv_type: type,
    month_year: monthYear,
    description: `Reversão CV (${type === 'order_refunded' ? 'reembolso' : 'cancelamento'}): ${item.title}`
  }))
}

/**
 * Cria entrada de ajuste manual de CV
 * 
 * @param memberId - ID do membro
 * @param amount - Valor do ajuste (positivo ou negativo)
 * @param description - Descrição do ajuste
 * @param monthYear - Mês/ano no formato YYYY-MM
 * @param createdBy - ID do admin que fez o ajuste
 * @returns Entrada para o cv_ledger
 */
export function createCVManualAdjustment(
  memberId: string,
  amount: number,
  description: string,
  monthYear: string,
  createdBy: string
): CVLedgerInsert {
  return {
    member_id: memberId,
    order_id: null,
    order_item_id: null,
    cv_amount: amount,
    cv_type: 'manual_adjustment',
    month_year: monthYear,
    description: description,
    created_by: createdBy
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Retorna o mês/ano atual no formato YYYY-MM
 */
export function getCurrentMonthYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Retorna o mês/ano anterior no formato YYYY-MM
 */
export function getPreviousMonthYear(): string {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Converte timestamp ISO para mês/ano no formato YYYY-MM
 */
export function timestampToMonthYear(timestamp: string): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Verifica se o CV atinge a meta para status "active"
 * SPEC 3.3: Ativa se CV >= 200 no mês
 */
export function isActiveCV(cv: number): boolean {
  return cv >= CV_TARGET_MONTHLY
}

/**
 * Calcula quanto falta para atingir a meta
 */
export function cvRemaining(currentCV: number): number {
  const remaining = CV_TARGET_MONTHLY - currentCV
  return remaining > 0 ? remaining : 0
}

/**
 * Calcula percentual de progresso para a meta
 */
export function cvProgressPercentage(currentCV: number): number {
  const percentage = (currentCV / CV_TARGET_MONTHLY) * 100
  return Math.min(percentage, 100) // Máximo 100%
}

