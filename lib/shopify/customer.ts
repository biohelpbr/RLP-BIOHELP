/**
 * Operações de Customer na Shopify Admin API
 * SPEC: Seção 4.4, 8.2 - Customer create/update + tags
 * 
 * Tags aplicadas (SPEC 4.4):
 * - lrp_member
 * - lrp_ref:<ref_code>
 * - lrp_sponsor:<sponsor_ref_code|none>
 * - lrp_status:pending (Sprint 1)
 */

import { shopifyGraphQL } from './client'

// Tipos de resposta da Shopify
interface CustomerSetResponse {
  customerSet: {
    customer: {
      id: string
      email: string
      tags: string[]
    } | null
    userErrors: Array<{
      field: string[] | null
      message: string
      code: string | null
    }>
  }
}

// Parâmetros para sync
export interface CustomerSyncParams {
  email: string
  firstName: string
  lastName?: string
  refCode: string
  sponsorRefCode: string | null
}

// Resultado do sync
export interface CustomerSyncResult {
  success: boolean
  shopifyCustomerId: string | null
  error: string | null
}

/**
 * Gera as tags do membro conforme SPEC 4.4
 */
function generateMemberTags(params: CustomerSyncParams): string[] {
  const tags: string[] = [
    'lrp_member',
    `lrp_ref:${params.refCode}`,
    `lrp_sponsor:${params.sponsorRefCode ?? 'none'}`,
    'lrp_status:pending', // SPEC: pending no Sprint 1
  ]
  return tags
}

/**
 * Mutation GraphQL validada pelo Shopify Dev MCP
 * Usa customerSet para upsert por email
 */
const CUSTOMER_SET_MUTATION = `
  mutation customerSet($input: CustomerSetInput!, $identifier: CustomerSetIdentifiers) {
    customerSet(input: $input, identifier: $identifier) {
      customer {
        id
        email
        tags
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`

/**
 * Cria ou atualiza customer na Shopify com tags LRP
 * SPEC 4.4: Ao cadastrar (ou re-sincronizar), garantir customer existe + tags aplicadas
 * SPEC 8.2: Customer create/update por e-mail
 */
export async function syncCustomerToShopify(
  params: CustomerSyncParams
): Promise<CustomerSyncResult> {
  const tags = generateMemberTags(params)

  // Separar nome em firstName e lastName
  const nameParts = params.firstName.trim().split(' ')
  const firstName = nameParts[0] || params.firstName
  const lastName = nameParts.slice(1).join(' ') || params.lastName || ''

  const variables = {
    input: {
      email: params.email,
      firstName,
      lastName: lastName || undefined,
      tags,
    },
    identifier: {
      email: params.email, // Upsert por email
    },
  }

  const result = await shopifyGraphQL<CustomerSetResponse>(
    CUSTOMER_SET_MUTATION,
    variables
  )

  // Tratar erros de conexão
  if (result.errors.length > 0) {
    console.error('[shopify] GraphQL errors:', result.errors)
    return {
      success: false,
      shopifyCustomerId: null,
      error: result.errors.join('; '),
    }
  }

  // Tratar erros de validação da mutation
  const payload = result.data?.customerSet
  if (!payload) {
    return {
      success: false,
      shopifyCustomerId: null,
      error: 'Empty response from Shopify',
    }
  }

  if (payload.userErrors && payload.userErrors.length > 0) {
    const errorMessages = payload.userErrors.map((e) => e.message).join('; ')
    console.error('[shopify] User errors:', payload.userErrors)
    return {
      success: false,
      shopifyCustomerId: null,
      error: errorMessages,
    }
  }

  if (!payload.customer) {
    return {
      success: false,
      shopifyCustomerId: null,
      error: 'Customer not returned from Shopify',
    }
  }

  console.info('[shopify] Customer synced:', {
    id: payload.customer.id,
    email: payload.customer.email,
    tags: payload.customer.tags,
  })

  return {
    success: true,
    shopifyCustomerId: payload.customer.id,
    error: null,
  }
}

