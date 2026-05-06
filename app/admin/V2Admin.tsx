import { redirect } from "next/navigation"
import {
  Award,
  CalendarHeart,
  CircleDollarSign,
  Crown,
  ShoppingBag,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getAdminOverviewV2 } from "@/lib/admin/overview-v2"

/**
 * V2 Admin Visão Geral (F-V16 — pivô v2).
 *
 * Server Component. Anti-SPEC §13: NÃO importa de _loveable_import/.
 * Inspirado em `_loveable_import/src/pages/admin/Overview.tsx` mas
 * reescrito com modelo v2 (breakdownByStatus em vez de breakdownByRank,
 * tags auto:lider/auto:influenciador, sem totalCVMonth).
 */
const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

const STATUS_LABEL: Record<string, string> = {
  active: "Ativos",
  pending: "Pendentes",
  inactive: "Inativos",
}

export default async function V2Admin() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect("/dashboard")

  const overview = await getAdminOverviewV2()
  const adminName = member.name ?? "Admin"

  return (
    <AdminShell adminName={adminName}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground">
            Snapshot do clube Biohelp Nutrition em tempo real.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BHStat
            label="Total de membros"
            value={overview.members.total}
            subtitle={`${overview.members.newThisMonth} novos no mês`}
            icon={<Users className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Ativos"
            value={overview.members.active}
            subtitle={`${overview.members.pending} pendentes · ${overview.members.inactive} inativos`}
            icon={<UserCheck className="w-5 h-5" />}
            variant="success"
          />
          <BHStat
            label="Vendas no mês"
            value={overview.sales.salesThisMonth}
            subtitle={fmtBRL(overview.sales.revenueThisMonth)}
            icon={<ShoppingBag className="w-5 h-5" />}
            variant="accent"
          />
          <BHStat
            label="Resgates pendentes"
            value={overview.payouts.pendingCount}
            subtitle={fmtBRL(overview.payouts.pendingAmount)}
            icon={<CircleDollarSign className="w-5 h-5" />}
            variant="warning"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BHCard variant="elevated" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Distribuição por status</h2>
                <p className="text-sm text-muted-foreground">
                  Substitui `breakdownByRank` v1 — agora reflete pivô V2.
                </p>
              </div>
            </div>
            {overview.members.breakdownByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sem membros cadastrados.
              </p>
            ) : (
              <ul className="space-y-2">
                {overview.members.breakdownByStatus
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <li
                      key={row.status}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <span className="font-medium text-foreground">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                      <span className="font-semibold">{row.count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </BHCard>

          <BHCard variant="elevated" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/30 text-accent-foreground">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tags automáticas (F-V18)</h2>
                <p className="text-sm text-muted-foreground">
                  Recalculadas diariamente às 03:00 UTC.
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">auto:lider</Badge>
                  <span className="text-sm text-muted-foreground">
                    ≥ 5 afiliados ativos
                  </span>
                </div>
                <span className="font-semibold">{overview.tags.autoLider}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">auto:influenciador</Badge>
                  <span className="text-sm text-muted-foreground">
                    ≥ 40 afiliados ativos
                  </span>
                </div>
                <span className="font-semibold">{overview.tags.autoInfluenciador}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    <Crown className="w-3 h-3 mr-1" />
                    FOUNDER
                  </Badge>
                  <span className="text-sm text-muted-foreground">F-V06</span>
                </div>
                <span className="font-semibold">{overview.tags.founder}</span>
              </li>
            </ul>
          </BHCard>
        </div>

        <BHCard variant="default" className="space-y-2">
          <div className="flex items-center gap-3">
            <CalendarHeart className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Próximos passos do pivô V2</h2>
              <p className="text-sm text-muted-foreground">
                S4 (eventos + academy + finance/payouts) • S5 (SSO Shopify + Cashin live).
              </p>
            </div>
          </div>
        </BHCard>
      </div>
    </AdminShell>
  )
}
