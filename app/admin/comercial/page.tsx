import Link from "next/link"
import { redirect } from "next/navigation"
import { BadgeCheck, Clock, Handshake } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getComercialData, type ComercialReferral } from "@/lib/admin/comercial"

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—")

function ReferralList({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string
  items: ComercialReferral[]
  emptyText: string
  tone: "warning" | "success"
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
        {tone === "warning" ? (
          <Clock className="h-4 w-4 text-amber-600" />
        ) : (
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
        )}
        {title} · {items.length}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <Link href={`/admin/community/${r.id}`} className="font-medium hover:underline">
                {r.name || "(sem nome)"}
              </Link>
              <span className="truncate text-xs text-muted-foreground">
                {r.email} · {fmtDate(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * W5 (call 05/06, pedido Leo) — aba "Comercial": por vendedor, quem ele indicou
 * (N1), separando Pendentes vs Vendas efetivadas, com totais.
 */
export default async function AdminComercialPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { sellers, totals } = await getComercialData()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Comercial</h1>
          <p className="text-muted-foreground">
            Acompanhamento do time de vendas: indicados diretos (N1) de cada vendedor,
            separados entre pendentes e vendas efetivadas. Dados de teste não contam.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BHStat
            label="Vendas efetivadas"
            value={totals.paid}
            subtitle="Indicados com assinatura paga"
            icon={<BadgeCheck className="w-5 h-5" />}
            variant="success"
          />
          <BHStat
            label="Pendentes"
            value={totals.pending}
            subtitle="Indicados aguardando pagamento"
            icon={<Clock className="w-5 h-5" />}
            variant="warning"
          />
          <BHStat
            label="Vendedores ativos"
            value={sellers.length}
            subtitle="Members com indicados (+ turma de vendas)"
            icon={<Handshake className="w-5 h-5" />}
            variant="primary"
          />
        </div>

        {sellers.map((s) => (
          <BHCard key={s.id} variant="elevated" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/admin/community/${s.id}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {s.name || "(sem nome)"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {s.email} · ref <span className="font-mono">{s.refCode}</span>
                  {s.cancelled > 0 && <> · {s.cancelled} cancelado(s)</>}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {s.pending.length} pendentes
                </Badge>
                <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                  {s.paid.length} vendas
                </Badge>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ReferralList
                title="Pendentes"
                items={s.pending}
                emptyText="Nenhum indicado pendente."
                tone="warning"
              />
              <ReferralList
                title="Vendas efetivadas"
                items={s.paid}
                emptyText="Nenhuma venda efetivada ainda."
                tone="success"
              />
            </div>
          </BHCard>
        ))}

        {sellers.length === 0 && (
          <BHCard variant="elevated">
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum vendedor com indicados ainda.
            </p>
          </BHCard>
        )}
      </div>
    </AdminShell>
  )
}
