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
 * Busca customer por email
 */
const FIND_CUSTOMER_QUERY = `
  query findCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          tags
        }
      }
    }
  }
`

/**
 * Mutation para criar customer
 */
const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`

/**
 * Mutation para atualizar customer
 */
const CUSTOMER_UPDATE_MUTATION = `
  mutation customerUpdate($input: CustomerInput!, $id: ID!) {
    customerUpdate(input: $input, id: $id) {
      customer {
        id
        email
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`

interface FindCustomerResponse {
  customers: {
    edges: Array<{
      node: {
        id: string
        email: string
        tags: string[]
      }
    }>
  }
}

interface CustomerCreateResponse {
  customerCreate: {
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

interface CustomerUpdateResponse {
  customerUpdate: {
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

/**
 * Cria ou atualiza customer na Shopify com tags LRP
 * SPEC 4.4: Ao cadastrar (ou re-sincronizar), garantir customer existe + tags aplicadas
 * SPEC 8.2: Customer create/update por e-mail
 * 
 * Nota: Usa customerCreate/customerUpdate porque customerSet não está disponível
 * para esta loja/token. Implementação alternativa com busca por email primeiro.
 */
export async function syncCustomerToShopify(
  params: CustomerSyncParams
): Promise<CustomerSyncResult> {
  const tags = generateMemberTags(params)

  // Separar nome em firstName e lastName
  const nameParts = params.firstName.trim().split(' ')
  const firstName = nameParts[0] || params.firstName
  const lastName = nameParts.slice(1).join(' ') || params.lastName || ''

  // 1. Buscar customer existente por email
  const findResult = await shopifyGraphQL<FindCustomerResponse>(
    FIND_CUSTOMER_QUERY,
    { query: `email:${params.email}` }
  )

  if (findResult.errors.length > 0) {
    console.error('[shopify] Error finding customer:', findResult.errors)
    return {
      success: false,
      shopifyCustomerId: null,
      error: findResult.errors.join('; '),
    }
  }

  const existingCustomer = findResult.data?.customers.edges[0]?.node

  const customerInput = {
    email: params.email,
    firstName,
    lastName: lastName || undefined,
    tags,
  }

  // 2. Se existe, atualizar; senão, criar
  if (existingCustomer) {
    // Atualizar customer existente
    const updateResult = await shopifyGraphQL<CustomerUpdateResponse>(
      CUSTOMER_UPDATE_MUTATION,
      {
        input: customerInput,
        id: existingCustomer.id,
      }
    )

    if (updateResult.errors.length > 0) {
      console.error('[shopify] GraphQL errors on update:', updateResult.errors)
      return {
        success: false,
        shopifyCustomerId: null,
        error: updateResult.errors.join('; '),
      }
    }

    const payload = updateResult.data?.customerUpdate
    if (!payload) {
      return {
        success: false,
        shopifyCustomerId: null,
        error: 'Empty response from Shopify on update',
      }
    }

    if (payload.userErrors && payload.userErrors.length > 0) {
      const errorMessages = payload.userErrors.map((e) => e.message).join('; ')
      console.error('[shopify] User errors on update:', payload.userErrors)
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
        error: 'Customer not returned from Shopify on update',
      }
    }

    console.info('[shopify] Customer updated:', {
      id: payload.customer.id,
      email: payload.customer.email,
      tags: payload.customer.tags,
    })

    return {
      success: true,
      shopifyCustomerId: payload.customer.id,
      error: null,
    }
  } else {
    // Criar novo customer
    const createResult = await shopifyGraphQL<CustomerCreateResponse>(
      CUSTOMER_CREATE_MUTATION,
      { input: customerInput }
    )

    if (createResult.errors.length > 0) {
      console.error('[shopify] GraphQL errors on create:', createResult.errors)
      return {
        success: false,
        shopifyCustomerId: null,
        error: createResult.errors.join('; '),
      }
    }

    const payload = createResult.data?.customerCreate
    if (!payload) {
      return {
        success: false,
        shopifyCustomerId: null,
        error: 'Empty response from Shopify on create',
      }
    }

    if (payload.userErrors && payload.userErrors.length > 0) {
      const errorMessages = payload.userErrors.map((e) => e.message).join('; ')
      console.error('[shopify] User errors on create:', payload.userErrors)
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
        error: 'Customer not returned from Shopify on create',
      }
    }

    console.info('[shopify] Customer created:', {
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
}

