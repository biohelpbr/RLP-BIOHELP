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
 * F-V16: agregação de produtos consumidos via vendas manuais (F-V14).
 *
 * Em S3 a fonte é só `member_sales`. Em S4 (`OrdersAnalytics`) entra
 * Shopify orgânico via `orders` + `order_items`.
 */
export async function getConsumptionData(): Promise<ConsumptionData> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("member_sales")
    .select("product_name, qty, paid_amount, customer_name")
    .limit(2000)

  if (error || !data) {
    console.error("[consumption.getConsumptionData]", error)
    return { rows: [], totalRevenue: 0, totalQty: 0, totalUnique: 0 }
  }

  type Bucket = {
    qty: number
    revenue: number
    customers: Set<string>
  }

  const byProduct = new Map<string, Bucket>()
  let totalRevenue = 0
  let totalQty = 0
  const allCustomers = new Set<string>()

  for (const sale of data) {
    const name = ((sale.product_name as string | null)?.trim() || "(produto não informado)").toLowerCase()
    const qty = Number(sale.qty ?? 1)
    const revenue = Number(sale.paid_amount ?? 0)
    const customer = ((sale.customer_name as string | null) ?? "").trim().toLowerCase()

    let bucket = byProduct.get(name)
    if (!bucket) {
      bucket = { qty: 0, revenue: 0, customers: new Set() }
      byProduct.set(name, bucket)
    }
    bucket.qty += qty
    bucket.revenue += revenue
    if (customer) bucket.customers.add(customer)

    totalRevenue += revenue
    totalQty += qty
    if (customer) allCustomers.add(customer)
  }

  const rows: ProductConsumption[] = Array.from(byProduct.entries())
    .map(([productName, b]) => ({
      productName,
      qty: b.qty,
      revenue: b.revenue,
      averageTicket: b.qty > 0 ? b.revenue / b.qty : 0,
      uniqueBuyers: b.customers.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    rows,
    totalRevenue,
    totalQty,
    totalUnique: allCustomers.size,
  }
}
