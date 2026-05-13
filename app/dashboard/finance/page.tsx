import { redirect } from "next/navigation"
import { CircleDollarSign, Clock, Wallet } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import {
  getMemberBalance,
  listMemberPayouts,
  type PayoutRequestRow,
} from "@/lib/payouts/v2/queries"
import { PAYOUT_METHOD_LABELS } from "@/lib/payouts/v2/schema"
import {
  getMemberCommissionTier,
  COMMISSION_TIERS,
} from "@/lib/commissions-v2/tier"
import { FinanceClient } from "./FinanceClient"

/**
 * `/dashboard/finance` — F-V05 (saldo + créditos) + F-V07 (triple resgate).
 *
 * Server Component. Rota nova v2-only — flag OFF redireciona pro dashboard.
 * Carrega saldo via RPC `get_available_balance` e histórico de payout_requests.
 * Dialog de resgate em client component (FinanceClient).
 */
const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  awaiting_document: "Aguardando documento",
  under_review: "Em análise",
  approved: "Aprovado",
  processing: "Em processamento",
  completed: "Concluído",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  awaiting_document: "secondary",
  under_review: "secondary",
  approved: "default",
  processing: "default",
  completed: "default",
  rejected: "destructive",
  cancelled: "outline",
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR")

export default async function FinancePage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const [balance, payouts, tierInfo] = await Promise.all([
    getMemberBalance(member.id),
    listMemberPayouts(member.id),
    getMemberCommissionTier(member.id),
  ])

  return (
    <PartnerShell memberName={member.name} isActive={member.status === "active"} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Resultado &amp; Resgate</h1>
          <p className="text-muted-foreground">
            Acompanhe seu saldo e converta em crédito ou cash.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BHStat
            label="Disponível"
            value={fmtBRL(balance.available_for_withdrawal)}
            subtitle="Pronto para resgate"
            icon={<Wallet className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Pendente (Net-15)"
            value={fmtBRL(balance.pending_balance)}
            subtitle="Aguardando liberação"
            icon={<Clock className="w-5 h-5" />}
            variant="warning"
          />
          <BHStat
            label="Recebido total"
            value={fmtBRL(balance.total_earned)}
            subtitle="Acumulado histórico"
            icon={<CircleDollarSign className="w-5 h-5" />}
            variant="success"
          />
        </div>

        <FinanceClient
          available={balance.available_for_withdrawal}
          tier={{
            label: tierInfo.tier.label,
            gross_rate: tierInfo.gross_rate,
            net_rate: tierInfo.net_rate,
            active_referrals: tierInfo.active_referrals,
          }}
        />

        <BHCard variant="default" className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold">Sua taxa de comissão</h2>
              <p className="text-sm text-muted-foreground">
                Tier <span className="font-medium">{tierInfo.tier.label}</span> ·
                {" "}
                {tierInfo.active_referrals}{" "}
                {tierInfo.active_referrals === 1
                  ? "afiliada ativa"
                  : "afiliadas ativas"}
                {" · "}
                {(tierInfo.gross_rate * 100).toFixed(0)}% bruto (
                {(tierInfo.net_rate * 100).toFixed(1)}% líquido)
              </p>
            </div>
            <span className="text-xs text-muted-foreground italic">
              Modelo em refinamento — bônus por consumo médio em definição
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {COMMISSION_TIERS.map((t) => {
              const isCurrent =
                tierInfo.active_referrals >= t.min_referrals &&
                (t.max_referrals === null ||
                  tierInfo.active_referrals <= t.max_referrals)
              const range =
                t.max_referrals === null
                  ? `${t.min_referrals}+`
                  : `${t.min_referrals}-${t.max_referrals}`
              return (
                <div
                  key={t.label}
                  className={
                    isCurrent
                      ? "rounded-lg border-2 border-primary bg-primary/10 p-3"
                      : "rounded-lg border border-border bg-muted/30 p-3"
                  }
                >
                  <p className="text-xs font-semibold text-foreground">
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {range} afiliadas
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {(t.gross_rate * 100).toFixed(0)}%
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      bruto
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </BHCard>

        <BHCard variant="default" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Histórico de resgates</h2>
            <span className="text-xs text-muted-foreground">
              {payouts.length} {payouts.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Você ainda não pediu nenhum resgate.
            </p>
          ) : (
            <ul className="space-y-2">
              {payouts.map((p: PayoutRequestRow) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {p.payout_method
                        ? PAYOUT_METHOD_LABELS[p.payout_method]
                        : "Resgate"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(p.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      {fmtBRL(Number(p.amount))}
                    </span>
                    <Badge variant={STATUS_BADGE[p.status] ?? "outline"}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </PartnerShell>
  )
}
