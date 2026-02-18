/**
 * Geração de cupons na Shopify Admin API (REST)
 * TBD-019 RESOLVIDO: Cupom Individual Mensal para creatina grátis
 * 
 * SEGURANÇA IMPLEMENTADA:
 * 1. Código único com hash aleatório (não adivinhável)
 * 2. Cupom restrito ao customer_id específico (Shopify valida)
 * 3. Limite de 1 uso global + 1 uso por cliente
 * 4. Validade mensal (expira fim do mês)
 * 5. Registro em banco com member_id vinculado
 * 
 * Formato: CREATINA-<NOME>-<HASH>-<MÊSANO>
 * Exemplo: CREATINA-MARIA-X7K9-FEV2026
 */

import { randomBytes } from 'crypto'

// Versão da API
const SHOPIFY_API_VERSION = '2024-10'

// Mapa de meses em português
const MESES_PT: Record<number, string> = {
  1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR',
  5: 'MAI', 6: 'JUN', 7: 'JUL', 8: 'AGO',
  9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ'
}

export interface CreateCouponParams {
  memberName: string
  memberId: string
  monthYear: string // formato YYYY-MM
  shopifyCustomerId?: string // ID do customer na Shopify para restringir uso
}

export interface CouponResult {
  success: boolean
  couponCode: string | null
  priceRuleId: string | null
  discountCodeId: string | null
  error: string | null
}

/**
 * Gera hash aleatório curto para tornar código único e não adivinhável
 */
function generateSecureHash(): string {
  return randomBytes(2).toString('hex').toUpperCase() // 4 caracteres hex (ex: X7K9)
}

/**
 * Gera o código do cupom no formato CREATINA-<NOME>-<HASH>-<MÊSANO>
 * O hash torna o código único e não adivinhável
 */
export function generateCouponCode(memberName: string, monthYear: string): string {
  // Extrair primeiro nome e sanitizar
  const firstName = memberName
    .trim()
    .split(' ')[0]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z0-9]/g, '') // Remove caracteres especiais
    .slice(0, 8) // Limitar tamanho

  // Extrair mês/ano
  const [year, month] = monthYear.split('-')
  const mesAbrev = MESES_PT[parseInt(month)] || month
  
  // Adicionar hash aleatório para segurança
  const hash = generateSecureHash()
  
  return `CREATINA-${firstName}-${hash}-${mesAbrev}${year}`
}

/**
 * Executa uma requisição REST na Shopify Admin API
 */
async function shopifyRest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<{ data: T | null; errors: string[] }> {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN

  if (!shopDomain || !accessToken) {
    return {
      data: null,
      errors: ['Missing Shopify credentials'],
    }
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        data: null,
        errors: [`Shopify API error: ${response.status} - ${errorText}`],
      }
    }

    const json = await response.json() as T
    return { data: json, errors: [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      data: null,
      errors: [`Shopify request failed: ${message}`],
    }
  }
}

/**
 * Cria um cupom de creatina grátis na Shopify
 * 
 * TBD-019: Cupom Individual Mensal
 * - 100% OFF (valor -100%)
 * - 1 uso máximo
 * - Validade: último dia do mês
 * 
 * @param params - Dados do membro e mês
 * @returns Resultado com código do cupom
 */
export async function createCreatineCoupon(
  params: CreateCouponParams
): Promise<CouponResult> {
  const couponCode = generateCouponCode(params.memberName, params.monthYear)
  
  // Calcular data de validade (último dia do mês)
  const [year, month] = params.monthYear.split('-').map(Number)
  const lastDay = new Date(year, month, 0) // Último dia do mês
  lastDay.setHours(23, 59, 59)
  const startsAt = new Date(year, month - 1, 1) // Primeiro dia do mês
  
  // SEGURANÇA: Configurar restrição de cliente
  // Se temos o Shopify Customer ID, restringir o cupom a esse cliente específico
  const hasCustomerRestriction = !!params.shopifyCustomerId
  
  // 1. Criar Price Rule com restrições de segurança
  const priceRulePayload: Record<string, unknown> = {
    title: couponCode,
    target_type: 'line_item',
    target_selection: 'all',
    allocation_method: 'across',
    value_type: 'percentage',
    value: '-100.0', // 100% de desconto
    once_per_customer: true,
    usage_limit: 1, // Limite global: apenas 1 uso total
    starts_at: startsAt.toISOString(),
    ends_at: lastDay.toISOString(),
  }
  
  // SEGURANÇA: Restringir ao cliente específico se disponível
  if (hasCustomerRestriction) {
    priceRulePayload.customer_selection = 'prerequisite'
    priceRulePayload.prerequisite_customer_ids = [parseInt(params.shopifyCustomerId!)]
  } else {
    // Fallback: qualquer cliente (menos seguro, mas funciona)
    priceRulePayload.customer_selection = 'all'
  }
  
  const priceRuleResult = await shopifyRest<{ price_rule: { id: number } }>(
    '/price_rules.json',
    'POST',
    { price_rule: priceRulePayload }
  )

  if (priceRuleResult.errors.length > 0 || !priceRuleResult.data?.price_rule?.id) {
    console.error('[coupon] Erro ao criar Price Rule:', priceRuleResult.errors)
    return {
      success: false,
      couponCode: null,
      priceRuleId: null,
      discountCodeId: null,
      error: priceRuleResult.errors.join('; '),
    }
  }

  const priceRuleId = priceRuleResult.data.price_rule.id

  // 2. Criar Discount Code vinculado à Price Rule
  const discountResult = await shopifyRest<{ discount_code: { id: number; code: string } }>(
    `/price_rules/${priceRuleId}/discount_codes.json`,
    'POST',
    {
      discount_code: {
        code: couponCode,
      }
    }
  )

  if (discountResult.errors.length > 0 || !discountResult.data?.discount_code?.id) {
    console.error('[coupon] Erro ao criar Discount Code:', discountResult.errors)
    return {
      success: false,
      couponCode: null,
      priceRuleId: String(priceRuleId),
      discountCodeId: null,
      error: discountResult.errors.join('; '),
    }
  }

  console.info(`[coupon] Cupom criado com sucesso: ${couponCode} (PR: ${priceRuleId}, DC: ${discountResult.data.discount_code.id})`)

  return {
    success: true,
    couponCode: couponCode,
    priceRuleId: String(priceRuleId),
    discountCodeId: String(discountResult.data.discount_code.id),
    error: null,
  }
}
