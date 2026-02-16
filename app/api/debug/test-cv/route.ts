/**
 * DEBUG ENDPOINT — TEMPORÁRIO
 * Testa a chamada à API do Shopify para buscar metafield custom.cv
 * Remover após diagnóstico
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchProductCV } from '@/lib/shopify/customer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('product_id') || '8224592003106'
  
  // Chamada direta à Shopify REST API para diagnóstico completo
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN
  
  let rawApiResponse: any = null
  let rawApiError: string | null = null
  let rawApiStatus: number | null = null
  
  try {
    // 1. Buscar TODOS os metafields do produto (sem filtro)
    const url = `https://${shopDomain}/admin/api/2024-10/products/${productId}/metafields.json`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken || '',
      },
    })
    rawApiStatus = response.status
    const text = await response.text()
    try {
      rawApiResponse = JSON.parse(text)
    } catch {
      rawApiResponse = text.substring(0, 500)
    }
  } catch (err) {
    rawApiError = err instanceof Error ? err.message : String(err)
  }
  
  // 2. Também testar com filtro de namespace
  let filteredResponse: any = null
  try {
    const url2 = `https://${shopDomain}/admin/api/2024-10/products/${productId}/metafields.json?namespace=custom`
    const resp2 = await fetch(url2, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken || '',
      },
    })
    filteredResponse = { status: resp2.status, body: await resp2.json() }
  } catch (err) {
    filteredResponse = { error: err instanceof Error ? err.message : String(err) }
  }
  
  // 3. Chamar fetchProductCV normalmente
  const cv = await fetchProductCV(productId)
  
  return NextResponse.json({
    version: 'v4.1-debug-raw',
    productId,
    cv_result: cv,
    envCheck: {
      hasShopDomain: !!shopDomain,
      hasApiToken: !!accessToken,
      shopDomain: shopDomain ? shopDomain.substring(0, 15) + '...' : 'MISSING',
    },
    raw_api: {
      status: rawApiStatus,
      error: rawApiError,
      metafields_count: rawApiResponse?.metafields?.length ?? 'N/A',
      metafields: rawApiResponse?.metafields || rawApiResponse,
    },
    filtered_api: filteredResponse,
    timestamp: new Date().toISOString(),
  })
}
