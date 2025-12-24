/**
 * Cliente Shopify Admin API (GraphQL)
 * SPEC: Seção 8.1 - Token apenas no servidor, nunca expor no client
 * 
 * Requisitos:
 * - write_customers scope
 * - read_customers scope
 */

const SHOPIFY_API_VERSION = '2024-10'

interface ShopifyGraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

/**
 * Executa uma query/mutation GraphQL na Shopify Admin API
 * SPEC 8.1: Token apenas em variáveis de ambiente no servidor
 */
export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T | null; errors: string[] }> {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN

  if (!shopDomain || !accessToken) {
    return {
      data: null,
      errors: ['Missing Shopify credentials (SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN)'],
    }
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      return {
        data: null,
        errors: [`Shopify API error: ${response.status} ${response.statusText}`],
      }
    }

    const json: ShopifyGraphQLResponse<T> = await response.json()

    if (json.errors && json.errors.length > 0) {
      return {
        data: null,
        errors: json.errors.map((e) => e.message),
      }
    }

    return {
      data: json.data ?? null,
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

