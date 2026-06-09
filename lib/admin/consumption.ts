import { createServiceClient } from "@/lib/supabase/server"

export type ProductConsumption = {
  productName: string
  qty: number
  revenue: number
  averageTicket: number
  uniqueBuyers: number
}

export type ConsumptionData = {
  rows: ProductConsumption[]
  totalRevenue: number
  totalQty: number
  totalUnique: number
}

/**
 * Agregação de produtos consumidos a partir dos PEDIDOS REAIS da Shopify
 * (`orders` + `order_items`), populados pelo webhook `orders/paid` (e pelo
 * backfill de histórico). Substitui a antiga fonte manual `member_sales`.
 *
 * Agrega por título de produto: quantidade, receita (preço unitário × qty),
 * ticket médio e compradores únicos (member_id quando existe; senão e-mail).
 */
export async function getConsumptionData(): Promise<ConsumptionData> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("orders")
    .select("member_id, customer_email, order_items ( title, quantity, price )")
    .eq("status", "paid")
    .limit(5000)

  if (error || !data) {
    console.error("[consumption.getConsumptionData]", error)
    return { rows: [], totalRevenue: 0, totalQty: 0, totalUnique: 0 }
  }

  type Bucket = {
    qty: number
    revenue: number
    buyers: Set<string>
  }

  const byProduct = new Map<string, Bucket>()
  let totalRevenue = 0
  let totalQty = 0
  const allBuyers = new Set<string>()

  for (const order of data as Array<{ member_id: string | null; customer_email: string | null; order_items: Array<{ title: string | null; quantity: number | null; price: number | null }> | null }>) {
    const buyer = String(order.member_id || order.customer_email || "").toLowerCase().trim()
    for (const item of order.order_items || []) {
      const name = (item.title?.trim() || "(produto não informado)").toLowerCase()
      const qty = Number(item.quantity ?? 1)
      const revenue = Number(item.price ?? 0) * qty

      let bucket = byProduct.get(name)
      if (!bucket) {
        bucket = { qty: 0, revenue: 0, buyers: new Set() }
        byProduct.set(name, bucket)
      }
      bucket.qty += qty
      bucket.revenue += revenue
      if (buyer) bucket.buyers.add(buyer)

      totalRevenue += revenue
      totalQty += qty
      if (buyer) allBuyers.add(buyer)
    }
  }

  const rows: ProductConsumption[] = Array.from(byProduct.entries())
    .map(([productName, b]) => ({
      productName,
      qty: b.qty,
      revenue: b.revenue,
      averageTicket: b.qty > 0 ? b.revenue / b.qty : 0,
      uniqueBuyers: b.buyers.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    rows,
    totalRevenue,
    totalQty,
    totalUnique: allBuyers.size,
  }
}
