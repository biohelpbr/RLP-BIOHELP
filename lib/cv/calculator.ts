/**
 * Calculador de CV (Commission Volume)
 * SPEC: Seção 1.2, 3.3 - CV por item/pedido
 * 
 * Regra (TBD-008 + TBD-014 RESOLVIDOS):
 * - CV é definido por produto via metafield `custom.cv`
 * - CV do pedido = Σ(CV_do_produto × quantidade)
 * - Se metafield não existir → CV = 0 (sem fallback para preço)
 * 
 * Fonte canônica: documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md
 * Ex: Lemon Dreams (R$159) gera CV=77
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
 * Namespace e key do metafield de CV no Shopify
 * TBD-014 RESOLVIDO: Usar `custom.cv` — se ausente, CV = 0
 */
export const CV_METAFIELD_NAMESPACE = 'custom'
export const CV_METAFIELD_NAMESPACES = ['custom'] // Mantido para compatibilidade
export const CV_METAFIELD_KEY = 'cv'

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Extrai o CV do metafield de um item do Shopify
 * 
 * @param item - Item do pedido Shopify com metafields
 * @returns CV do metafield ou null se não encontrado
 */
export function extractCVFromMetafield(
  item: ShopifyLineItem
): number | null {
  // Verificar se o item tem propriedades/metafields
  if (!item.properties && !item.metafields) {
    return null
  }

  // Tentar extrair de properties (formato comum em line_items)
  if (item.properties) {
    for (const prop of item.properties) {
      if (prop.name === '_cv' || prop.name === 'cv' || prop.name === 'CV') {
        const cvValue = parseFloat(prop.value)
        if (!isNaN(cvValue)) {
          return cvValue
        }
      }
    }
  }

  // Tentar extrair de metafields (se disponível no payload)
  if (item.metafields) {
    for (const metafield of item.metafields) {
      if (
        CV_METAFIELD_NAMESPACES.includes(metafield.namespace) &&
        metafield.key === CV_METAFIELD_KEY
      ) {
        const cvValue = parseFloat(metafield.value)
        if (!isNaN(cvValue)) {
          return cvValue
        }
      }
    }
  }

  return null
}

/**
 * Calcula o CV de um item do pedido
 * 
 * REGRA (TBD-008 + TBD-014 RESOLVIDOS):
 * 1. Tenta ler o CV do metafield `custom.cv` do produto
 * 2. Se não encontrar → CV = 0 (sem fallback para preço)
 * 3. Loga warning para produtos sem metafield configurado
 * 
 * @param item - Item do pedido (Shopify ou interno)
 * @param metafieldCV - CV do metafield (se já extraído)
 * @returns CV calculado para o item
 */
export function calculateItemCV(
  item: { price: number | string; quantity: number },
  metafieldCV?: number | null
): number {
  // Se temos CV do metafield, usar ele
  if (metafieldCV !== undefined && metafieldCV !== null) {
    const cv = metafieldCV * item.quantity
    return Math.round(cv * 100) / 100
  }
  
  // TBD-014 RESOLVIDO: Sem fallback para preço — CV = 0
  console.warn(
    `[CV] missing_cv_metafield: Metafield custom.cv não encontrado para item. CV = 0 (sem fallback para preço)`
  )
  return 0
}

/**
 * Calcula o CV total de um pedido baseado nos itens
 * 
 * REGRA: CV do pedido = Σ(CV_do_produto × quantidade)
 * 
 * @param items - Lista de itens do pedido com CV já calculado
 * @returns CV total do pedido
 */
export function calculateOrderCV(
  items: Array<{ cv_value: number }>
): number {
  const totalCV = items.reduce((sum, item) => {
    return sum + item.cv_value
  }, 0)
  
  // Arredondar para 2 casas decimais
  return Math.round(totalCV * 100) / 100
}

/**
 * Processa itens do Shopify e retorna dados para inserção
 * 
 * REGRA (TBD-008 + TBD-014 RESOLVIDOS):
 * - CV é extraído do metafield `custom.cv` do produto
 * - Se não houver metafield → CV = 0 (sem fallback para preço)
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
  cv_source: 'metafield' | 'zero_no_metafield'
}> {
  return lineItems.map(item => {
    // Tentar extrair CV do metafield
    const metafieldCV = extractCVFromMetafield(item)
    const cvSource = metafieldCV !== null ? 'metafield' : 'zero_no_metafield'
    
    // Calcular CV (usa metafield ou 0 se ausente — TBD-014)
    const cvValue = calculateItemCV(
      { price: item.price, quantity: item.quantity },
      metafieldCV
    )

    if (cvSource === 'metafield') {
      console.info(`[CV] Item "${item.title}": CV=${metafieldCV} × ${item.quantity} = ${cvValue} (via metafield)`)
    } else {
      console.warn(`[CV] missing_cv_metafield: Item "${item.title}" sem metafield custom.cv — CV=0`)
    }

    return {
      order_id: orderId,
      shopify_line_item_id: String(item.id),
      product_id: item.product_id ? String(item.product_id) : null,
      variant_id: item.variant_id ? String(item.variant_id) : null,
      sku: item.sku || null,
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      cv_value: cvValue,
      cv_source: cvSource
    }
  })
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

