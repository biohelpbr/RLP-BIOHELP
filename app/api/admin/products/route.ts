/**
 * GET /api/admin/products
 * TBD-023 — Página de Produtos no Admin
 * SDD: docs/sdd/features/admin-products/
 * 
 * Lista produtos da Shopify com CV (metafield custom.cv)
 * Requer: admin auth + read_products scope no token Shopify
 */

import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SHOPIFY_API_VERSION = '2024-10'

interface ShopifyProduct {
  id: number
  title: string
  status: string
  product_type: string
  vendor: string
  created_at: string
  updated_at: string
  images: Array<{ id: number; src: string; alt: string | null }>
  variants: Array<{
    id: number
    title: string
    price: string
    sku: string | null
    inventory_quantity: number
  }>
}

async function shopifyRest<T>(
  endpoint: string
): Promise<{ data: T | null; error: string | null; status: number }> {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

  if (!shopDomain || !accessToken) {
    return { data: null, error: 'Missing Shopify env vars', status: 500 }
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: `Shopify API ${response.status}: ${errorText}`, status: response.status }
    }

    const data = await response.json()
    return { data, error: null, status: response.status }
  } catch (err) {
    return { data: null, error: `Fetch error: ${err}`, status: 500 }
  }
}

export async function GET() {
  try {
    // 1. Verificar admin
    const admin = await isCurrentUserAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    console.info('[admin/products] Buscando produtos da Shopify...')

    // 2. Buscar produtos da Shopify (sem filtro de status = retorna todos)
    const productsResult = await shopifyRest<{ products: ShopifyProduct[] }>(
      '/products.json?limit=250'
    )

    if (productsResult.error || !productsResult.data) {
      console.error('[admin/products] Erro Shopify:', productsResult.error, 'Status:', productsResult.status)
      return NextResponse.json(
        { error: 'Erro ao buscar produtos da Shopify', detail: productsResult.error },
        { status: 500 }
      )
    }

    const products = productsResult.data.products || []
    console.info(`[admin/products] ${products.length} produtos encontrados`)

    // 3. Buscar CVs (metafield custom.cv) para cada produto
    const cvMap = new Map<number, number | null>()

    // Buscar metafields em batch (paralelamente, max 5 de cada vez)
    const batchSize = 5
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const promises = batch.map(async (product) => {
        try {
          const metaResult = await shopifyRest<{ metafields: Array<{ namespace: string; key: string; value: string }> }>(
            `/products/${product.id}/metafields.json?namespace=custom`
          )
          if (metaResult.data) {
            const cvMeta = metaResult.data.metafields.find(
              m => m.namespace === 'custom' && m.key === 'cv'
            )
            cvMap.set(product.id, cvMeta ? parseFloat(cvMeta.value) : null)
          } else {
            console.warn(`[admin/products] Metafield erro para produto ${product.id}:`, metaResult.error)
            cvMap.set(product.id, null)
          }
        } catch (err) {
          console.warn(`[admin/products] Exceção metafield produto ${product.id}:`, err)
          cvMap.set(product.id, null)
        }
      })
      await Promise.all(promises)
    }

    // 4. Montar resposta
    const formattedProducts = products.map((p) => {
      const firstVariant = p.variants?.[0]
      const cv = cvMap.get(p.id)
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        product_type: p.product_type || null,
        vendor: p.vendor || null,
        image: p.images?.[0]?.src || null,
        image_alt: p.images?.[0]?.alt || p.title,
        price: firstVariant?.price || '0.00',
        sku: firstVariant?.sku || null,
        inventory_quantity: firstVariant?.inventory_quantity ?? null,
        cv: cv,
        cv_configured: cv !== null && cv !== undefined,
        variants_count: p.variants?.length || 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }
    })

    // Ordenar: ativos primeiro, depois por título
    formattedProducts.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return a.title.localeCompare(b.title)
    })

    // 5. Resumo
    const summary = {
      total: formattedProducts.length,
      active: formattedProducts.filter(p => p.status === 'active').length,
      draft: formattedProducts.filter(p => p.status === 'draft').length,
      archived: formattedProducts.filter(p => p.status === 'archived').length,
      withCV: formattedProducts.filter(p => p.cv_configured).length,
      withoutCV: formattedProducts.filter(p => !p.cv_configured).length,
    }

    return NextResponse.json({
      summary,
      products: formattedProducts,
    })

  } catch (error) {
    console.error('[admin/products] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
