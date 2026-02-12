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
 * Tags: lrp_member, lrp_ref, lrp_sponsor, lrp_status, nivel
 */
function generateMemberTags(params: CustomerSyncParams): string {
  const status = params.status || 'pending'
  const level = params.level || 'membro'
  
  const tags: string[] = [
    'lrp_member',
    `lrp_ref:${params.refCode}`,
    `lrp_sponsor:${params.sponsorRefCode ?? 'none'}`,
    `lrp_status:${status}`,
    `nivel:${level}`,  // TBD-003 RESOLVIDO: tag de nível obrigatória
  ]
  return tags.join(', ')
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
 * Atualiza um customer existente usando REST API
 */
async function updateCustomer(
  customerId: number,
  params: CustomerSyncParams
): Promise<{ success: boolean; error: string | null }> {
  const nameParts = params.firstName.trim().split(' ')
  const firstName = nameParts[0] || params.firstName
  const lastName = nameParts.slice(1).join(' ') || params.lastName || ''

  const result = await shopifyRest<ShopifyCustomerResponse>(
    `/customers/${customerId}.json`,
    'PUT',
    {
      customer: {
        id: customerId,
        first_name: firstName,
        last_name: lastName || undefined,
        tags: generateMemberTags(params),
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
      tags: generateMemberTags(params),
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
