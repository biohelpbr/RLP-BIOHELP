/**
 * GET /api/members/me/orders
 * SPEC: Seção 13.5, 13.6, 14.4 — Pedidos do membro
 * SDD: docs/sdd/features/sales-page/
 * 
 * Retorna:
 * - Resumo (total pedidos, CV total, valor total)
 * - Lista de pedidos próprios com items
 * - Lista de vendas da rede (N1 diretos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getCurrentMember } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  title: string
  quantity: number
  price: number
  cv_value: number
}

interface OrderRecord {
  id: string
  shopify_order_id: string
  shopify_order_number: string
  customer_email: string
  total_amount: number
  total_cv: number
  currency: string
  status: string
  paid_at: string | null
  created_at: string
  items: OrderItem[]
}

interface NetworkOrder extends OrderRecord {
  member_name: string
  member_ref_code: string
}

export async function GET(request: NextRequest) {
  try {
    const member = await getCurrentMember()

    if (!member) {
      return NextResponse.json(
        { error: 'Não autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // 1. Buscar pedidos próprios do membro com items
    const { data: ownOrders, error: ownError } = await supabase
      .from('orders')
      .select(`
        id,
        shopify_order_id,
        shopify_order_number,
        customer_email,
        total_amount,
        total_cv,
        currency,
        status,
        paid_at,
        created_at,
        order_items (
          id,
          title,
          quantity,
          price,
          cv_value
        )
      `)
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (ownError) {
      console.error('[orders] Erro ao buscar pedidos próprios:', ownError)
    }

    // 2. Buscar indicados diretos (N1)
    const { data: directRecruits } = await supabase
      .from('members')
      .select('id, name, ref_code')
      .eq('sponsor_id', member.id)

    // 3. Buscar pedidos dos indicados N1
    let networkOrders: NetworkOrder[] = []
    if (directRecruits && directRecruits.length > 0) {
      const recruitIds = directRecruits.map(r => r.id)
      const recruitMap = new Map(directRecruits.map(r => [r.id, r]))

      const { data: n1Orders, error: n1Error } = await supabase
        .from('orders')
        .select(`
          id,
          member_id,
          shopify_order_id,
          shopify_order_number,
          customer_email,
          total_amount,
          total_cv,
          currency,
          status,
          paid_at,
          created_at,
          order_items (
            id,
            title,
            quantity,
            price,
            cv_value
          )
        `)
        .in('member_id', recruitIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (n1Error) {
        console.error('[orders] Erro ao buscar pedidos da rede:', n1Error)
      }

      if (n1Orders) {
        networkOrders = n1Orders.map((order: any) => {
          const recruit = recruitMap.get(order.member_id)
          return {
            id: order.id,
            shopify_order_id: order.shopify_order_id,
            shopify_order_number: order.shopify_order_number,
            customer_email: order.customer_email,
            total_amount: order.total_amount,
            total_cv: order.total_cv,
            currency: order.currency,
            status: order.status,
            paid_at: order.paid_at,
            created_at: order.created_at,
            items: (order.order_items || []).map((item: any) => ({
              id: item.id,
              title: item.title,
              quantity: item.quantity,
              price: item.price,
              cv_value: item.cv_value,
            })),
            member_name: recruit?.name || 'Desconhecido',
            member_ref_code: recruit?.ref_code || '',
          }
        })
      }
    }

    // 4. Formatar pedidos próprios
    const formattedOwnOrders: OrderRecord[] = (ownOrders || []).map((order: any) => ({
      id: order.id,
      shopify_order_id: order.shopify_order_id,
      shopify_order_number: order.shopify_order_number,
      customer_email: order.customer_email,
      total_amount: order.total_amount,
      total_cv: order.total_cv,
      currency: order.currency,
      status: order.status,
      paid_at: order.paid_at,
      created_at: order.created_at,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        cv_value: item.cv_value,
      })),
    }))

    // 5. Calcular resumo
    const paidOwn = formattedOwnOrders.filter(o => o.status === 'paid')
    const paidNetwork = networkOrders.filter(o => o.status === 'paid')

    const summary = {
      own: {
        totalOrders: paidOwn.length,
        totalCV: paidOwn.reduce((sum, o) => sum + (o.total_cv || 0), 0),
        totalAmount: paidOwn.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      },
      network: {
        totalOrders: paidNetwork.length,
        totalCV: paidNetwork.reduce((sum, o) => sum + (o.total_cv || 0), 0),
        totalAmount: paidNetwork.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        totalMembers: directRecruits?.length || 0,
      },
    }

    return NextResponse.json({
      summary,
      ownOrders: formattedOwnOrders,
      networkOrders,
    })

  } catch (error) {
    console.error('[orders] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
