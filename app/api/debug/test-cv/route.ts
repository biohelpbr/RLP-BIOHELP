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
  
  console.info(`[debug-cv] Testando fetchProductCV para produto ${productId}...`)
  
  const startTime = Date.now()
  const cv = await fetchProductCV(productId)
  const elapsed = Date.now() - startTime
  
  const result = {
    test: 'fetchProductCV',
    productId,
    cv,
    elapsed: `${elapsed}ms`,
    timestamp: new Date().toISOString(),
    version: 'v4.1-cv-api-fix',
    envCheck: {
      hasShopDomain: !!process.env.SHOPIFY_STORE_DOMAIN,
      hasApiToken: !!process.env.SHOPIFY_ADMIN_API_TOKEN,
      shopDomain: process.env.SHOPIFY_STORE_DOMAIN 
        ? process.env.SHOPIFY_STORE_DOMAIN.substring(0, 10) + '...' 
        : 'MISSING',
    }
  }
  
  console.info(`[debug-cv] Resultado:`, JSON.stringify(result))
  
  return NextResponse.json(result)
}
