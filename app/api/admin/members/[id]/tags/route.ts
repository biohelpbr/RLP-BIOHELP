/**
 * API: GET/POST/DELETE /api/admin/members/[id]/tags
 * Sprint 6 - FR-38: Gestão de tags
 * 
 * GET: Lista tags do membro
 * POST: Adiciona tag ao membro
 * DELETE: Remove tag do membro
 * 
 * Tags são sincronizadas com Shopify Customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, isCurrentUserAdmin } from '@/lib/supabase/server'
import { shopifyAdminClient } from '@/lib/shopify/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Tags padrão do sistema LRP
const SYSTEM_TAGS = [
  'lrp_member',
  'lrp_status:pending',
  'lrp_status:active',
  'lrp_status:inactive'
]

/**
 * GET - Lista tags do membro (do Shopify)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const { id: memberId } = await params
    const supabase = createServiceClient()

    // Buscar shopify_customer_id
    const { data: shopifyData, error: shopifyError } = await supabase
      .from('shopify_customers')
      .select('shopify_customer_id')
      .eq('member_id', memberId)
      .single()

    if (shopifyError || !shopifyData?.shopify_customer_id) {
      return NextResponse.json({
        tags: [],
        system_tags: [],
        custom_tags: [],
        shopify_synced: false,
        message: 'Membro não sincronizado com Shopify'
      })
    }

    // Buscar tags do Shopify
    const query = `
      query getCustomerTags($id: ID!) {
        customer(id: $id) {
          id
          tags
        }
      }
    `

    const response = await shopifyAdminClient(query, {
      id: shopifyData.shopify_customer_id
    })

    const tags: string[] = response.customer?.tags || []
    
    // Separar tags do sistema e customizadas
    const systemTags = tags.filter(t => 
      t.startsWith('lrp_') || SYSTEM_TAGS.some(st => t.startsWith(st.split(':')[0]))
    )
    const customTags = tags.filter(t => !systemTags.includes(t))

    return NextResponse.json({
      tags,
      system_tags: systemTags,
      custom_tags: customTags,
      shopify_synced: true,
      shopify_customer_id: shopifyData.shopify_customer_id
    })

  } catch (error) {
    console.error('[admin/members/[id]/tags] GET error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tags' },
      { status: 500 }
    )
  }
}

/**
 * POST - Adiciona tag ao membro
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const { id: memberId } = await params
    const body = await request.json()
    const { tag } = body

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json(
        { error: 'Tag é obrigatória' },
        { status: 400 }
      )
    }

    // Sanitizar tag (remover caracteres especiais)
    const sanitizedTag = tag.trim().replace(/[,]/g, '').slice(0, 100)

    if (!sanitizedTag) {
      return NextResponse.json(
        { error: 'Tag inválida' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Buscar shopify_customer_id
    const { data: shopifyData, error: shopifyError } = await supabase
      .from('shopify_customers')
      .select('shopify_customer_id')
      .eq('member_id', memberId)
      .single()

    if (shopifyError || !shopifyData?.shopify_customer_id) {
      return NextResponse.json(
        { error: 'Membro não sincronizado com Shopify' },
        { status: 400 }
      )
    }

    // Buscar tags atuais
    const getQuery = `
      query getCustomerTags($id: ID!) {
        customer(id: $id) {
          id
          tags
        }
      }
    `

    const currentData = await shopifyAdminClient(getQuery, {
      id: shopifyData.shopify_customer_id
    })

    const currentTags: string[] = currentData.customer?.tags || []

    // Verificar se tag já existe
    if (currentTags.includes(sanitizedTag)) {
      return NextResponse.json({
        success: true,
        message: 'Tag já existe',
        tags: currentTags
      })
    }

    // Adicionar nova tag
    const newTags = [...currentTags, sanitizedTag]

    const updateQuery = `
      mutation updateCustomerTags($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const updateResult = await shopifyAdminClient(updateQuery, {
      input: {
        id: shopifyData.shopify_customer_id,
        tags: newTags
      }
    })

    if (updateResult.customerUpdate?.userErrors?.length > 0) {
      console.error('Shopify errors:', updateResult.customerUpdate.userErrors)
      return NextResponse.json(
        { error: 'Erro ao adicionar tag no Shopify' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Tag '${sanitizedTag}' adicionada`,
      tags: updateResult.customerUpdate?.customer?.tags || newTags
    })

  } catch (error) {
    console.error('[admin/members/[id]/tags] POST error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar tag' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove tag do membro
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const { id: memberId } = await params
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag é obrigatória' },
        { status: 400 }
      )
    }

    // Não permitir remover tags do sistema
    if (tag.startsWith('lrp_')) {
      return NextResponse.json(
        { error: 'Não é permitido remover tags do sistema LRP' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Buscar shopify_customer_id
    const { data: shopifyData, error: shopifyError } = await supabase
      .from('shopify_customers')
      .select('shopify_customer_id')
      .eq('member_id', memberId)
      .single()

    if (shopifyError || !shopifyData?.shopify_customer_id) {
      return NextResponse.json(
        { error: 'Membro não sincronizado com Shopify' },
        { status: 400 }
      )
    }

    // Buscar tags atuais
    const getQuery = `
      query getCustomerTags($id: ID!) {
        customer(id: $id) {
          id
          tags
        }
      }
    `

    const currentData = await shopifyAdminClient(getQuery, {
      id: shopifyData.shopify_customer_id
    })

    const currentTags: string[] = currentData.customer?.tags || []

    // Remover tag
    const newTags = currentTags.filter(t => t !== tag)

    if (newTags.length === currentTags.length) {
      return NextResponse.json({
        success: true,
        message: 'Tag não encontrada',
        tags: currentTags
      })
    }

    const updateQuery = `
      mutation updateCustomerTags($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const updateResult = await shopifyAdminClient(updateQuery, {
      input: {
        id: shopifyData.shopify_customer_id,
        tags: newTags
      }
    })

    if (updateResult.customerUpdate?.userErrors?.length > 0) {
      console.error('Shopify errors:', updateResult.customerUpdate.userErrors)
      return NextResponse.json(
        { error: 'Erro ao remover tag no Shopify' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Tag '${tag}' removida`,
      tags: updateResult.customerUpdate?.customer?.tags || newTags
    })

  } catch (error) {
    console.error('[admin/members/[id]/tags] DELETE error:', error)
    return NextResponse.json(
      { error: 'Erro ao remover tag' },
      { status: 500 }
    )
  }
}
