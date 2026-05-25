import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Award, CircleDollarSign, Crown, Users } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCommunityMember } from "@/lib/admin/community"
import { PAYOUT_METHOD_LABELS } from "@/lib/payouts/v2/schema"

interface CommunityDetailProps {
  params: Promise<{ id: string }>
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—")

export default async function CommunityDetailPage({ params }: CommunityDetailProps) {
  if (!isV2Enabled()) redirect("/admin")

  const me = await getCurrentMember()
  if (!me) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { id } = await params
  const detail = await getCommunityMember(id)
  if (!detail) notFound()

  const { member, sponsor, activeCount, payouts, leadsCount, salesCount } = detail

  return (
    <AdminShell adminName={me.name ?? "Admin"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/community">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à comunidade
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/members/${member.id}`}>Detalhe v1 (legado)</Link>
          </Button>
        </div>

        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{member.name || "(sem nome)"}</h1>
          <p className="text-muted-foreground">
            {member.email} · ref <span className="font-mono">{member.ref_code}</span> · ingressou{" "}
            {fmtDate(member.created_at)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={member.status === "active" ? "default" : "outline"}>
              {member.status}
            </Badge>
            {member.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t === "manual:influenciador" ? (
                  <Award className="w-3 h-3 mr-1" />
                ) : t === "FOUNDER" || t === "manual:founder" ? (
                  <Crown className="w-3 h-3 mr-1" />
                ) : null}
                {t}
              </Badge>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BHStat
            label="Afiliados ativos"
            value={activeCount}
            subtitle="Proxy: status='active' (S3)"
            icon={<Users className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Leads + Vendas (F-V14)"
            value={`${leadsCount} / ${salesCount}`}
            subtitle="leads / vendas registrados"
            icon={<Award className="w-5 h-5" />}
            variant="accent"
          />
          <BHStat
            label="Resgates pedidos"
            value={payouts.length}
            subtitle={
              payouts.length > 0
                ? fmtBRL(payouts.reduce((a, p) => a + Number(p.amount ?? 0), 0))
                : "Nenhum até hoje"
            }
            icon={<CircleDollarSign className="w-5 h-5" />}
            variant="success"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BHCard variant="elevated" className="space-y-3">
            <h2 className="text-lg font-semibold">Vínculo na rede</h2>
            {sponsor ? (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Sponsor</p>
                <Link
                  href={`/admin/community/${sponsor.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {sponsor.name}
                </Link>
                <p className="text-xs text-muted-foreground">ref {sponsor.ref_code}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem sponsor — provavelmente conta admin ou House Account legado.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              N1 (afiliados diretos): {activeCount} ativos.
            </p>
          </BHCard>

          <BHCard variant="elevated" className="space-y-3">
            <h2 className="text-lg font-semibold">Últimos resgates (até 10)</h2>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                Nenhum resgate registrado.
              </p>
            ) : (
              <ul className="space-y-2">
                {payouts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {p.payout_method
                          ? PAYOUT_METHOD_LABELS[
                              p.payout_method as keyof typeof PAYOUT_METHOD_LABELS
                            ] ?? p.payout_method
                          : "Resgate"}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{fmtBRL(Number(p.amount))}</span>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </BHCard>
        </div>
      </div>
    </AdminShell>
  )
}
