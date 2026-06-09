import { redirect } from "next/navigation"
import { Info, ShoppingBag } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { getConsumptionData } from "@/lib/admin/consumption"

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

export default async function ConsumptionPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const data = await getConsumptionData()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Consumo <span className="text-base font-normal text-muted-foreground">(pedidos reais da Shopify)</span>
          </h1>
          <p className="text-muted-foreground">
            {data.rows.length} {data.rows.length === 1 ? "produto" : "produtos"}{" "}
            comprados nos pedidos pagos da loja (via webhook <code className="text-xs">orders/paid</code>).
          </p>
        </header>

        <BHCard variant="default" className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Receita total</p>
            <p className="text-2xl font-bold">{fmtBRL(data.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidades vendidas</p>
            <p className="text-2xl font-bold">{data.totalQty}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Clientes únicos</p>
            <p className="text-2xl font-bold">{data.totalUnique}</p>
          </div>
        </BHCard>

        <BHCard variant="elevated" className="space-y-3">
          <h2 className="text-lg font-semibold">Ranking por receita</h2>
          {data.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum pedido pago ainda. Assim que entrar uma compra na loja
              (webhook <code className="text-xs">orders/paid</code>), os produtos aparecem aqui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 px-3">Produto</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Receita</th>
                    <th className="py-2 px-3 text-right">Ticket médio</th>
                    <th className="py-2 px-3 text-right">Clientes únicos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.productName} className="border-b border-border last:border-0">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize">{row.productName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">{row.qty}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {fmtBRL(row.revenue)}
                      </td>
                      <td className="py-2 px-3 text-right">{fmtBRL(row.averageTicket)}</td>
                      <td className="py-2 px-3 text-right">{row.uniqueBuyers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>

        <BHCard variant="default" className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <span className="font-medium text-foreground">O que este painel mostra:</span>{" "}
              os produtos efetivamente comprados nos <em>pedidos pagos</em> da loja
              Shopify (tabelas <code className="text-xs">orders</code> +{" "}
              <code className="text-xs">order_items</code>), populados pelo webhook{" "}
              <code className="text-xs">orders/paid</code>.
            </p>
            <p>
              <span className="font-medium text-foreground">Compradores únicos:</span>{" "}
              quantos membros (ou clientes) distintos compraram cada produto —
              base pra média por membro.
            </p>
            <p>
              <span className="font-medium text-foreground">Histórico:</span>{" "}
              pedidos novos entram automaticamente. Vendas anteriores ao go-live só
              aparecem após um <em>backfill</em> (importação do histórico).
            </p>
          </div>
        </BHCard>
      </div>
    </AdminShell>
  )
}
