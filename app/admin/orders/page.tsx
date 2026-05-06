import { redirect } from "next/navigation"
import { Receipt, ShoppingCart, TrendingUp } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin, createServiceClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"

type OrderRow = {
  id: string
  customer_email: string
  total_amount: number
  paid_at: string | null
  member_id: string | null
}

type OrderType = "LRP" | "FIRST" | "NORMAL"

function classify(orders: OrderRow[]): Map<string, OrderType> {
  const seenMember = new Set<string>()
  const seenEmail = new Set<string>()
  const map = new Map<string, OrderType>()

  // ordena por paid_at asc (primeira compra é "FIRST")
  const sorted = [...orders].sort((a, b) => {
    const at = a.paid_at ? new Date(a.paid_at).getTime() : 0
    const bt = b.paid_at ? new Date(b.paid_at).getTime() : 0
    return at - bt
  })

  for (const o of sorted) {
    let type: OrderType = "NORMAL"
    if (o.member_id) {
      type = "LRP"
    } else if (!seenEmail.has(o.customer_email.toLowerCase())) {
      type = "FIRST"
      seenEmail.add(o.customer_email.toLowerCase())
    }
    if (o.member_id) seenMember.add(o.member_id)
    map.set(o.id, type)
  }
  return map
}

function monthKey(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const TYPE_COLOR: Record<OrderType, "default" | "secondary" | "outline"> = {
  LRP: "default",
  FIRST: "secondary",
  NORMAL: "outline",
}

const TYPE_DESC: Record<OrderType, string> = {
  LRP: "Comprador é membro do clube (member_id preenchido).",
  FIRST: "Primeira compra registrada por este e-mail (cliente novo).",
  NORMAL: "Recompra de cliente sem cadastro no clube.",
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

export default async function AdminOrdersPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_email, total_amount, paid_at, member_id")
    .order("paid_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[admin/orders]", error)
  }

  const orders = (data || []) as OrderRow[]
  const types = classify(orders)

  const counts: Record<OrderType, number> = { LRP: 0, FIRST: 0, NORMAL: 0 }
  const revenue: Record<OrderType, number> = { LRP: 0, FIRST: 0, NORMAL: 0 }
  const monthly = new Map<string, Record<OrderType, number>>()

  for (const o of orders) {
    const t = types.get(o.id) || "NORMAL"
    counts[t]++
    revenue[t] += Number(o.total_amount) || 0
    const m = monthKey(o.paid_at)
    if (!monthly.has(m)) monthly.set(m, { LRP: 0, FIRST: 0, NORMAL: 0 })
    monthly.get(m)![t] += 1
  }

  const monthlyEntries = Array.from(monthly.entries())
    .filter(([k]) => k !== "—")
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Pedidos & Analytics</h1>
          <p className="text-muted-foreground">
            Classificação dos pedidos do Shopify em <strong>LRP</strong>{" "}
            (membro do clube), <strong>FIRST</strong> (primeira compra de cliente
            sem cadastro) e <strong>NORMAL</strong> (recompra fora do clube).
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-4">
          <BHStat
            label="Pedidos LRP"
            value={`${counts.LRP}`}
            subtitle={formatBRL(revenue.LRP)}
            icon={<TrendingUp className="w-4 h-4" />}
            variant="primary"
          />
          <BHStat
            label="Primeiras compras (FIRST)"
            value={`${counts.FIRST}`}
            subtitle={formatBRL(revenue.FIRST)}
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <BHStat
            label="Recompras NORMAL"
            value={`${counts.NORMAL}`}
            subtitle={formatBRL(revenue.NORMAL)}
            icon={<Receipt className="w-4 h-4" />}
          />
        </div>

        <BHCard variant="elevated" className="space-y-3">
          <h2 className="text-lg font-semibold">Distribuição mensal (últimos 6 meses)</h2>
          {monthlyEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem pedidos com data de pagamento ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 font-medium">Mês</th>
                    <th className="py-2 font-medium">LRP</th>
                    <th className="py-2 font-medium">FIRST</th>
                    <th className="py-2 font-medium">NORMAL</th>
                    <th className="py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyEntries.map(([m, row]) => {
                    const t = row.LRP + row.FIRST + row.NORMAL
                    return (
                      <tr key={m} className="border-t border-border">
                        <td className="py-2 font-mono">{m}</td>
                        <td className="py-2">{row.LRP}</td>
                        <td className="py-2">{row.FIRST}</td>
                        <td className="py-2">{row.NORMAL}</td>
                        <td className="py-2 font-semibold">{t}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>

        <BHCard variant="default" className="space-y-3">
          <h2 className="text-lg font-semibold">Pedidos recentes</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem pedidos importados ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 25).map((o) => {
                const t = types.get(o.id) || "NORMAL"
                return (
                  <li key={o.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-foreground truncate">
                        {o.customer_email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.paid_at
                          ? new Date(o.paid_at).toLocaleString("pt-BR")
                          : "(sem data de pagamento)"}
                      </p>
                    </div>
                    <span className="font-semibold">{formatBRL(Number(o.total_amount))}</span>
                    <Badge variant={TYPE_COLOR[t]} title={TYPE_DESC[t]}>
                      {t}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
