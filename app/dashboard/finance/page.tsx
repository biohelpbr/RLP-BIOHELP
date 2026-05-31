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
import { FinanceClient } from "./FinanceClient"

/**
 * `/dashboard/finance` — F-V05 (saldo + créditos) + F-V07 (triple resgate)
 *   + F-V20 (alinhado à Política Financeira Nutrition Club + Lovable UI).
 *
 * Server Component. Carrega saldo via RPC `get_available_balance` + histórico
 * de payout_requests + dados bancários cadastrados em members (autopreenchem
 * o WithdrawDialog).
 */
const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise",
  awaiting_document: "Aguardando documento",
  under_review: "Em análise",
  approved: "Aprovado",
  processing: "Em processamento",
  completed: "Pago",
  rejected: "Recusado",
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

  const [balance, payouts] = await Promise.all([
    getMemberBalance(member.id),
    listMemberPayouts(member.id),
  ])

  const bankData = {
    person_type: (member.person_type ?? null) as "pf" | "pj" | null,
    holder_name: member.bank_holder_name ?? null,
    document_number: member.document_number ?? null,
    bank_name: member.bank_name ?? null,
    bank_agency: member.bank_agency ?? null,
    bank_account: member.bank_account ?? null,
    pix_key: member.bank_pix_key ?? null,
    contact_phone: member.bank_contact_phone ?? null,
    bank_data_updated_at: member.bank_data_updated_at ?? null,
  }

  return (
    <PartnerShell
      memberName={member.name}
      isActive={member.subscription_status === "paid"}
      memberSubtitle={getMemberSubtitle(member)}
    >
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Resultado &amp; Resgate</h1>
          <p className="text-muted-foreground">
            Seu centro financeiro: resultado do mês, liberações e antecipação.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BHStat
            label="Disponível"
            value={fmtBRL(balance.available_for_withdrawal)}
            subtitle="Liberado para resgate imediato"
            icon={<Wallet className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Pendente (Net-15)"
            value={fmtBRL(balance.pending_balance)}
            subtitle="Fechamento dia 1º; liberado até dia 10"
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
          bankData={bankData}
        />

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="text-left py-2 font-semibold">Data</th>
                    <th className="text-left py-2 font-semibold">Modalidade</th>
                    <th className="text-right py-2 font-semibold">Bruto</th>
                    <th className="text-right py-2 font-semibold">Descontos</th>
                    <th className="text-right py-2 font-semibold">Líquido</th>
                    <th className="text-right py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p: PayoutRequestRow) => {
                    const gross = Number(p.gross_amount ?? p.amount)
                    const net = Number(p.net_amount ?? p.amount)
                    const discounts = Math.max(0, Number((gross - net).toFixed(2)))
                    return (
                      <tr
                        key={p.id}
                        className="border-t border-border last:border-b-0"
                        data-testid="payout-row"
                      >
                        <td className="py-2">{fmtDate(p.created_at)}</td>
                        <td className="py-2 text-foreground">
                          {p.payout_method
                            ? PAYOUT_METHOD_LABELS[p.payout_method]
                            : "Resgate"}
                        </td>
                        <td className="py-2 text-right">{fmtBRL(gross)}</td>
                        <td className="py-2 text-right text-destructive">
                          {discounts > 0 ? `-${fmtBRL(discounts)}` : "—"}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {fmtBRL(net)}
                        </td>
                        <td className="py-2 text-right">
                          <Badge variant={STATUS_BADGE[p.status] ?? "outline"}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>
      </div>
    </PartnerShell>
  )
}
