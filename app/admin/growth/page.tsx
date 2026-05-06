import { redirect } from "next/navigation"
import { TrendingUp } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { getGrowthData } from "@/lib/admin/growth"
import { GrowthCharts } from "./GrowthCharts"

/**
 * `/admin/growth` — gráficos de crescimento (F-V16).
 *
 * Server Component faz query agregada; cliente renderiza Recharts.
 * Histórico = 6 meses (incluindo atual). Projeção = média móvel dos
 * últimos 3 meses extrapolada por +3 meses.
 */
export default async function GrowthPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const data = await getGrowthData()

  const totalNewLast6 = data.history.reduce((a, r) => a + r.newMembers, 0)
  const totalRevenueLast6 = data.history.reduce((a, r) => a + r.revenue, 0)
  const totalPayoutsLast6 = data.history.reduce((a, r) => a + r.payouts, 0)

  const fmtBRL = (n: number) =>
    n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Crescimento</h1>
          <p className="text-muted-foreground">
            Últimos 6 meses + projeção 3 meses (média móvel).
          </p>
        </header>

        <BHCard variant="default" className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Novos membros (6m)</p>
            <p className="text-2xl font-bold">{totalNewLast6}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita acumulada (6m)</p>
            <p className="text-2xl font-bold">{fmtBRL(totalRevenueLast6)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resgates pagos (6m)</p>
            <p className="text-2xl font-bold">{fmtBRL(totalPayoutsLast6)}</p>
          </div>
        </BHCard>

        <GrowthCharts history={data.history} projection={data.projection} />

        <BHCard variant="default" className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Receita</span> conta
              vendas registradas manualmente em F-V14 (`member_sales.paid_amount`).
              Não inclui pedidos Shopify orgânicos — virá em S4 com
              `OrdersAnalytics`.
            </p>
            <p>
              <span className="font-medium text-foreground">Resgates pagos</span>{" "}
              conta `payout_requests` com status approved/processing/completed.
            </p>
          </div>
        </BHCard>
      </div>
    </AdminShell>
  )
}
