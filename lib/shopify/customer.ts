/**
 * Operações de Customer na Shopify Admin API (REST)
 * SPEC: Seção 4.4, 8.2 - Customer create/update + tags
 * 
 * NOTA: Usando REST API ao invés de GraphQL porque:
 * - Planos Basic/Starter da Shopify bloqueiam acesso a PII via GraphQL para custom apps
 * - REST API permite criar/atualizar customers mesmo em planos básicos
 * - Tags são aplicadas corretamente via REST
 * 
 * Tags aplicadas (SPEC 4.4 + TBD-003 RESOLVIDO):
 * - lrp_member
 * - lrp_ref:<ref_code>
 * - lrp_sponsor:<sponsor_ref_code|none>
 * - lrp_status:pending|active|inactive
 * - nivel:<nivel> (membro/parceiro/lider/diretor/head)
 * - subscriber (B4: somente quando status === 'active')
 *
 * F-V19 (sync REST 2024-10):
 * - B3: e-mail marketing consent = "subscribed" no create/update (senão o
 *   comprador entra "não inscrito" e a Shopify não consegue mandar e-mail).
 * - B4: tag `subscriber` quando ativo (paid); ausente quando inativo.
 * - B5: tags são MERGEADAS no update, nunca sobrescritas — preserva as tags
 *   próprias do cliente e só substitui as gerenciadas pelo LRP.
 */

// Versão da API
const SHOPIFY_API_VERSION = '2024-10'

// Parâmetros para sync
export interface CustomerSyncParams {
  email: string
  firstName: string
  lastName?: string
  refCode: string
  sponsorRefCode: string | null
  level?: string        // TBD-003: nível do membro (membro/parceiro/lider/diretor/head)
  status?: string       // Status atual (pending/active/inactive)
}

// Resultado do sync
export interface CustomerSyncResult {
  success: boolean
  shopifyCustomerId: string | null
  error: string | null
}

// Tipos da REST API
interface ShopifyCustomerResponse {
  customer?: {
    id: number
    email: string
    first_name: string
    last_name: string
    tags: string
  }
  errors?: Record<string, string[]> | string
}

interface ShopifyCustomersSearchResponse {
  customers: Array<{
    id: number
    email: string
    first_name: string
    last_name: string
    tags: string
  }>
}

/**
 * Gera as tags do membro conforme SPEC 4.4 + TBD-003
 * Tags: lrp_member, lrp_ref, lrp_sponsor, lrp_status, nivel [, subscriber]
 *
 * B4: inclui `subscriber` SOMENTE quando o status é ativo (paid). Quando
 * inativo, a tag é omitida — e como o sync faz MERGE das tags gerenciadas
 * (ver mergeShopifyTags), a `subscriber` sai sozinha no próximo sync inativo.
 */
export function generateMemberTags(params: CustomerSyncParams): string {
  const status = params.status || 'pending'
  const level = params.level || 'membro'

  const tags: string[] = [
    'lrp_member',
    `lrp_ref:${params.refCode}`,
    `lrp_sponsor:${params.sponsorRefCode ?? 'none'}`,
    `lrp_status:${status}`,
    `nivel:${level}`,  // TBD-003 RESOLVIDO: tag de nível obrigatória
  ]

  // B4: tag `subscriber` apenas quando ativo (assinatura paga).
  if (status === 'active') {
    tags.push('subscriber')
  }

  return tags.join(', ')
}

/**
 * B5: Tags "gerenciadas pelo LRP" = prefixo `lrp_`, prefixo `nivel:`, e a
 * tag `subscriber`. Comparação case-insensitive. Tudo o mais é tag do cliente
 * e deve ser preservado.
 */
export function isLrpManagedTag(tag: string): boolean {
  const t = tag.trim().toLowerCase()
  if (!t) return false
  return t.startsWith('lrp_') || t.startsWith('nivel:') || t === 'subscriber'
}

/**
 * B5: Faz merge das tags, NUNCA sobrescreve.
 * Conjunto final = (tags existentes NÃO gerenciadas pelo LRP) ∪ (tags LRP atuais).
 * Preserva as tags próprias do cliente (~5-10% já são clientes) e só substitui
 * as nossas. Idempotente e sem duplicatas (dedup case-insensitive, mantendo a
 * grafia original da primeira ocorrência).
 */
export function mergeShopifyTags(existingTagsRaw: string, lrpTags: string): string {
  const split = (raw: string) => raw.split(',').map((t) => t.trim()).filter(Boolean)

  const preserved = split(existingTagsRaw).filter((t) => !isLrpManagedTag(t))
  const lrp = split(lrpTags)

  const final: string[] = []
  const seen = new Set<string>()
  for (const tag of [...preserved, ...lrp]) {
    const key = tag.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      final.push(tag)
    }
  }
  return final.join(', ')
}

/**
 * B3: shape do consent de e-mail marketing para a REST Admin API 2024-10.
 * Sem este objeto o customer entra "não inscrito" (not_subscribed) e a Shopify
 * não envia e-mails de marketing.
 */
function buildEmailMarketingConsent(): {
  state: 'subscribed'
  opt_in_level: 'single_opt_in'
  consent_updated_at: string
} {
  return {
    state: 'subscribed',
    opt_in_level: 'single_opt_in',
    consent_updated_at: new Date().toISOString(),
  }
}

/**
 * Executa uma requisição REST na Shopify Admin API
 * SPEC 8.1: Token apenas em variáveis de ambiente no servidor
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
      errors: ['Missing Shopify credentials (SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN)'],
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
        errors: [`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`],
      }
    }

    const json = await response.json() as T
    return {
      data: json,
      errors: [],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      data: null,
      errors: [`Shopify request failed: ${message}`],
    }
  }
}

/**
 * Busca customer por email usando REST API
 */
async function findCustomerByEmail(email: string): Promise<number | null> {
  const result = await shopifyRest<ShopifyCustomersSearchResponse>(
    `/customers/search.json?query=email:${encodeURIComponent(email)}`
  )

  if (result.errors.length > 0) {
    console.error('[shopify] Error searching customer:', result.errors)
    return null
  }

  const customers = result.data?.customers || []
  if (customers.length > 0) {
    return customers[0].id
  }

  return null
}

/**
 * Cria um novo customer usando REST API
 */
async function createCustomer(
  params: CustomerSyncParams
): Promise<{ id: number | null; error: string | null }> {
  const nameParts = params.firstName.trim().split(' ')
  const firstName = nameParts[0] || params.firstName
  const lastName = nameParts.slice(1).join(' ') || params.lastName || ''

  const result = await shopifyRest<ShopifyCustomerResponse>(
    '/customers.json',
    'POST',
    {
      customer: {
        email: params.email,
        first_name: firstName,
        last_name: lastName || undefined,
        tags: generateMemberTags(params),
        // B3: marca o comprador como inscrito para marketing por e-mail.
        email_marketing_consent: buildEmailMarketingConsent(),
        // Não enviar senha - customer pode criar conta depois
        send_email_welcome: false,
      },
    }
  )

  if (result.errors.length > 0) {
    return { id: null, error: result.errors.join('; ') }
  }

  if (result.data?.errors) {
    const errorMsg = typeof result.data.errors === 'string'
      ? result.data.errors
      : Object.entries(result.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
    return { id: null, error: errorMsg }
  }

  if (!result.data?.customer?.id) {
    return { id: null, error: 'Customer not returned from Shopify' }
  }

  return { id: result.data.customer.id, error: null }
}

/**
 * Busca as tags atuais de um customer (para o merge no update — B5).
 * Em caso de erro retorna '' (degrada para só-tags-LRP, evitando travar o sync).
 */
async function fetchCustomerTags(customerId: number): Promise<string> {
  const result = await shopifyRest<ShopifyCustomerResponse>(
    `/customers/${customerId}.json`
  )

  if (result.errors.length > 0) {
    console.error('[shopify] Error fetching customer tags for merge:', result.errors)
    return ''
  }

  return result.data?.customer?.tags ?? ''
}

/**
 * Atualiza um customer existente usando REST API
 */
async function updateCustomer(
  customerId: number,
  params: CustomerSyncParams
): Promise<{ success: boolean; error: string | null }> {
  const nameParts = params.firstName.trim().split(' ')
  const firstName = nameParts[0] || params.firstName
  const lastName = nameParts.slice(1).join(' ') || params.lastName || ''

  // B5: busca as tags atuais e faz MERGE — nunca sobrescreve as tags do cliente.
  const existingTags = await fetchCustomerTags(customerId)
  const mergedTags = mergeShopifyTags(existingTags, generateMemberTags(params))

  const result = await shopifyRest<ShopifyCustomerResponse>(
    `/customers/${customerId}.json`,
    'PUT',
    {
      customer: {
        id: customerId,
        first_name: firstName,
        last_name: lastName || undefined,
        tags: mergedTags,
        // B3: garante consent de marketing também no update.
        email_marketing_consent: buildEmailMarketingConsent(),
      },
    }
  )

  if (result.errors.length > 0) {
    return { success: false, error: result.errors.join('; ') }
  }

  if (result.data?.errors) {
    const errorMsg = typeof result.data.errors === 'string'
      ? result.data.errors
      : Object.entries(result.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
    return { success: false, error: errorMsg }
  }

  return { success: true, error: null }
}

/**
 * Busca o metafield custom.cv de um produto na Shopify
 * TBD-014: CV é definido via metafield custom.cv do produto
 * 
 * @param productId - ID numérico do produto no Shopify
 * @returns Valor do CV ou null se não encontrado
 */
export async function fetchProductCV(productId: string): Promise<number | null> {
  // Extrair ID numérico (pode vir como "gid://shopify/Product/123" ou "123")
  const numericId = productId.replace(/\D/g, '')
  if (!numericId) {
    console.warn(`[shopify-cv] fetchProductCV: ID inválido "${productId}"`)
    return null
  }

  console.info(`[shopify-cv] Buscando metafield para produto ${numericId}...`)
  
  // Buscar TODOS os metafields do namespace custom (sem filtro por key no URL
  // para máxima compatibilidade com versões da API)
  const endpoint = `/products/${numericId}/metafields.json?namespace=custom`
  console.info(`[shopify-cv] Endpoint: ${endpoint}`)
  
  const result = await shopifyRest<{
    metafields: Array<{
      id: number
      namespace: string
      key: string
      value: string
      type: string
    }>
  }>(endpoint)

  if (result.errors.length > 0) {
    console.error(`[shopify-cv] ERRO API para produto ${numericId}:`, JSON.stringify(result.errors))
    return null
  }

  const metafields = result.data?.metafields || []
  console.info(`[shopify-cv] Produto ${numericId}: ${metafields.length} metafield(s) retornados:`, 
    JSON.stringify(metafields.map(m => ({ ns: m.namespace, key: m.key, value: m.value, type: m.type })))
  )
  
  const cvMetafield = metafields.find(m => m.namespace === 'custom' && m.key === 'cv')

  if (cvMetafield) {
    const cv = parseFloat(cvMetafield.value)
    if (!isNaN(cv)) {
      console.info(`[shopify-cv] ✅ Produto ${numericId}: CV=${cv} (via API metafield)`)
      return cv
    }
    console.warn(`[shopify-cv] Metafield encontrado mas valor não numérico: "${cvMetafield.value}"`)
  }

  console.warn(`[shopify-cv] ❌ Produto ${numericId}: metafield custom.cv NÃO encontrado entre ${metafields.length} metafields`)
  return null
}

/**
 * Busca CVs de múltiplos produtos em batch
 * Retorna mapa de productId → CV
 */
export async function fetchProductCVsBatch(
  productIds: string[]
): Promise<Map<string, number>> {
  const cvMap = new Map<string, number>()
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)))

  for (const productId of uniqueIds) {
    const cv = await fetchProductCV(productId)
    if (cv !== null) {
      cvMap.set(productId, cv)
    }
    // Rate limiting mínimo entre chamadas
    if (uniqueIds.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return cvMap
}

/**
 * Cria ou atualiza customer na Shopify com tags LRP
 * SPEC 4.4: Ao cadastrar (ou re-sincronizar), garantir customer existe + tags aplicadas
 * SPEC 8.2: Customer create/update por e-mail
 * 
 * Usa REST API ao invés de GraphQL para compatibilidade com planos Basic/Starter
 */
export async function syncCustomerToShopify(
  params: CustomerSyncParams
): Promise<CustomerSyncResult> {
  // 1. Buscar customer existente por email
  const existingCustomerId = await findCustomerByEmail(params.email)

  // 2. Se existe, atualizar; senão, criar
  if (existingCustomerId) {
    console.info('[shopify] Updating existing customer:', existingCustomerId)
    
    const updateResult = await updateCustomer(existingCustomerId, params)
    
    if (!updateResult.success) {
      console.error('[shopify] Error updating customer:', updateResult.error)
      return {
        success: false,
        shopifyCustomerId: null,
        error: updateResult.error,
      }
    }

    console.info('[shopify] Customer updated successfully:', {
      id: existingCustomerId,
      lrpTags: generateMemberTags(params), // tags LRP aplicadas; demais tags do cliente preservadas via merge (B5)
    })

    return {
      success: true,
      shopifyCustomerId: `gid://shopify/Customer/${existingCustomerId}`,
      error: null,
    }
  } else {
    console.info('[shopify] Creating new customer for:', params.email)
    
    const createResult = await createCustomer(params)
    
    if (!createResult.id) {
      console.error('[shopify] Error creating customer:', createResult.error)
      return {
        success: false,
        shopifyCustomerId: null,
        error: createResult.error,
      }
    }

    console.info('[shopify] Customer created successfully:', {
      id: createResult.id,
      tags: generateMemberTags(params),
    })

    return {
      success: true,
      shopifyCustomerId: `gid://shopify/Customer/${createResult.id}`,
      error: null,
    }
  }
}
