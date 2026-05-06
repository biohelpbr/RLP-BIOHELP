import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertCircle,
  DollarSign,
  Plus,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  computeMonthlyStats,
  listLeads,
  listSales,
  splitOpportunities,
  type MemberLead,
  type MemberSale,
} from "@/lib/sales-manual/queries"
import { OrdersClientList } from "./OrdersClientList"

/**
 * `/dashboard/orders` — F-V14 (vendas manuais do membro, CRM leve).
 *
 * Server Component. Rota nova v2-only — flag OFF redireciona pro dashboard.
 * Lista leads + vendas recentes do membro. CTAs para criar lead/venda.
 * Métricas mês corrente (vendas, receita, ticket, clientes únicos).
 */
const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

export default async function OrdersPage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const [leads, sales] = await Promise.all([listLeads(member.id), listSales(member.id)])
  const stats = computeMonthlyStats(sales)
  const { opportunities, fresh } = splitOpportunities(leads)
  const isActive = member.status === "active"

  return (
    <PartnerShell memberName={member.name} isActive={isActive}>
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Minhas vendas</h1>
            <p className="text-muted-foreground">
              Registre leads e vendas que você fez fora da loja Shopify.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/orders/new?tipo=venda">
                <Plus className="w-4 h-4 mr-2" />
                Nova venda
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders/new?tipo=lead">
                <Plus className="w-4 h-4 mr-2" />
                Novo lead
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BHStat
            label="Vendas no mês"
            value={stats.salesThisMonth}
            subtitle="Registradas por você"
            icon={<ShoppingBag className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Receita do mês"
            value={fmtBRL(stats.revenueThisMonth)}
            subtitle="Soma do valor pago"
            icon={<DollarSign className="w-5 h-5" />}
            variant="accent"
          />
          <BHStat
            label="Ticket médio"
            value={fmtBRL(stats.averageTicket)}
            subtitle="Receita ÷ vendas"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
          <BHStat
            label="Clientes únicos"
            value={stats.uniqueCustomersThisMonth}
            subtitle="Pessoas distintas no mês"
            icon={<Users className="w-5 h-5" />}
            variant="default"
          />
        </div>

        {opportunities.length > 0 && (
          <BHCard variant="default" className="border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Oportunidades</h2>
                <p className="text-sm text-muted-foreground">
                  Leads com mais de 30 dias sem retorno — bom momento para reabordar.
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {opportunities.map((lead: MemberLead) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg bg-background p-3 border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.contact}</p>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning">
                    {Math.floor(
                      (Date.now() - Date.parse(lead.last_contact_at)) / 86_400_000
                    )}
                    d sem retorno
                  </Badge>
                </li>
              ))}
            </ul>
          </BHCard>
        )}

        <OrdersClientList leads={fresh} sales={sales as MemberSale[]} />
      </div>
    </PartnerShell>
  )
}
