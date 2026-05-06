import { redirect } from "next/navigation"
import { Info, Package, Tag } from "lucide-react"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getConsumptionData } from "@/lib/admin/consumption"

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

/**
 * V2 Admin Products (F-V16 — pivô V2).
 *
 * Em S3 esta página mostra os produtos vistos via vendas manuais
 * (member_sales). Cadastro completo (preço sugerido + custo + contribuição
 * líquida) entra em S4 com `/admin/products` mutations + Shopify Admin
 * pull. Por enquanto é uma view consultiva — admin vê o que está sendo
 * vendido fora do canal Shopify.
 *
 * Anti-SPEC §13: NÃO importa de _loveable_import/. Inspirado no visual.
 * TBD-25 (preço sugerido) ainda em hipótese padrão.
 */
export default async function V2AdminProducts() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const data = await getConsumptionData()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">
            Catálogo + métricas de vendas. Em S3 mostra produtos com pelo menos
            1 venda manual (F-V14). Cadastro de "preço sugerido" e "preço de
            custo" entra em S4.
          </p>
        </header>

        <BHCard variant="default" className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">TBD-25</span>{" "}
              (preço sugerido + preço de custo) — hipótese padrão registrada em
              `PIVOT-V2.md` §4.1. Aguardando confirmação do cliente em demo.
            </p>
            <p>
              Para listagem completa via Shopify Admin API com tags e Locksmith,
              acesse a versão v1 (toggle `LRP_V2=false`) ou aguarde S4.
            </p>
          </div>
        </BHCard>

        <BHCard variant="elevated" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mais vendidos (F-V14 manual)</h2>
            <span className="text-xs text-muted-foreground">
              {data.rows.length} produto(s)
            </span>
          </div>
          {data.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma venda manual registrada ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.rows.map((row) => (
                <li
                  key={row.productName}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{row.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.qty} unidade(s) · {row.uniqueBuyers} cliente(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-semibold">{fmtBRL(row.revenue)}</span>
                    <Badge variant="outline">
                      <Tag className="w-3 h-3 mr-1" />
                      ticket {fmtBRL(row.averageTicket)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
