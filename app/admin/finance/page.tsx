import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Banknote, Receipt, ShoppingCart, Wallet } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin, createServiceClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  cashback_cashin: "Cashback Cashin",
  shopify_credit: "Crédito Shopify",
}

async function loadFinance() {
  const supabase = createServiceClient()

  const [{ data: payouts }, { data: balances }, salesRes] = await Promise.all([
    supabase.from("payout_requests").select("payout_method, status, gross_amount, net_amount, created_at"),
    supabase.from("commission_balances").select("balance_total, balance_pending, balance_available"),
    supabase
      .from("member_sales")
      .select("paid_amount")
      .gte("sold_at", new Date(new Date().setDate(1)).toISOString().slice(0, 10)),
  ])

  const payoutsByMethod: Record<string, { count: number; gross: number; net: number; pending: number }> = {
    pix: { count: 0, gross: 0, net: 0, pending: 0 },
    cashback_cashin: { count: 0, gross: 0, net: 0, pending: 0 },
    shopify_credit: { count: 0, gross: 0, net: 0, pending: 0 },
  }

  ;(payouts || []).forEach(
    (p: { payout_method: string; status: string; gross_amount: number; net_amount: number }) => {
      const m = payoutsByMethod[p.payout_method] || { count: 0, gross: 0, net: 0, pending: 0 }
      m.count += 1
      m.gross += Number(p.gross_amount) || 0
      m.net += Number(p.net_amount) || 0
      if (p.status === "pending" || p.status === "under_review") m.pending += Number(p.gross_amount) || 0
      payoutsByMethod[p.payout_method] = m
    },
  )

  const totals = {
    payoutsCount: (payouts || []).length,
    payoutsPending: (payouts || []).filter(
      (p: { status: string }) => p.status === "pending" || p.status === "under_review",
    ).length,
    grossTotal: (payouts || []).reduce(
      (s: number, p: { gross_amount: number }) => s + (Number(p.gross_amount) || 0),
      0,
    ),
    netTotal: (payouts || []).reduce(
      (s: number, p: { net_amount: number }) => s + (Number(p.net_amount) || 0),
      0,
    ),
    balanceAvailable: (balances || []).reduce(
      (s: number, b: { balance_available: number }) => s + (Number(b.balance_available) || 0),
      0,
    ),
    balanceTotal: (balances || []).reduce(
      (s: number, b: { balance_total: number }) => s + (Number(b.balance_total) || 0),
      0,
    ),
    salesMonth: (salesRes.data || []).reduce(
      (s: number, r: { paid_amount: number }) => s + (Number(r.paid_amount) || 0),
      0,
    ),
    salesCount: (salesRes.data || []).length,
  }

  return { payoutsByMethod, totals }
}

export default async function AdminFinancePage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { payoutsByMethod, totals } = await loadFinance()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">
              Visão consolidada de comissões (F-V04), saldos (F-V05) e resgates (F-V07).
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/payouts" className="inline-flex items-center gap-2">
              Ver resgates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BHStat
            label="Saldo total na plataforma"
            value={formatBRL(totals.balanceTotal)}
            icon={<Wallet className="w-4 h-4" />}
            variant="primary"
          />
          <BHStat
            label="Saldo disponível"
            value={formatBRL(totals.balanceAvailable)}
            icon={<Banknote className="w-4 h-4" />}
          />
          <BHStat
            label="Resgates pendentes"
            value={`${totals.payoutsPending}`}
            subtitle={`${formatBRL(totals.grossTotal)} bruto · ${formatBRL(totals.netTotal)} líquido`}
            icon={<Receipt className="w-4 h-4" />}
          />
          <BHStat
            label="Vendas manuais (mês)"
            value={formatBRL(totals.salesMonth)}
            subtitle={`${totals.salesCount} venda(s) registrada(s)`}
            icon={<ShoppingCart className="w-4 h-4" />}
          />
        </div>

        <BHCard variant="elevated" className="space-y-3">
          <h2 className="text-lg font-semibold">Resgates por método</h2>
          <p className="text-sm text-muted-foreground">
            F-V07 oferece 3 caminhos: PIX (CNPJ + NF), Cashback Cashin (CPF aceita, direto na conta) e
            Crédito Shopify (1:1, sem prazo de expiração). Imposto (~15%) sempre deduzido — os valores
            líquidos abaixo já refletem o desconto.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(["pix", "cashback_cashin", "shopify_credit"] as const).map((m) => {
              const row = payoutsByMethod[m]
              return (
                <div key={m} className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{METHOD_LABEL[m]}</span>
                    <Badge variant="outline">{row.count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Bruto: {formatBRL(row.gross)}</p>
                  <p className="text-xs text-muted-foreground">Líquido: {formatBRL(row.net)}</p>
                  <p className="text-xs text-muted-foreground">Pendente: {formatBRL(row.pending)}</p>
                </div>
              )
            })}
          </div>
        </BHCard>

        <BHCard variant="default" className="space-y-2">
          <h2 className="text-lg font-semibold">Comissões (F-V04)</h2>
          <p className="text-sm text-muted-foreground">
            Modelo de comissão variável por tier de afiliadas ativas (40%→55%), com imposto fixo de
            15% deduzido sempre. Refinamento pendente: bônus por consumo médio da rede (regra exata
            a definir com a Biohelp). Próximo iteração: agregado mensal, top sponsors e comparativo.
          </p>
          <Button asChild variant="ghost" className="self-start">
            <Link href="/admin/commissions" className="inline-flex items-center gap-2">
              Abrir painel v1 (legacy)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </BHCard>
      </div>
    </AdminShell>
  )
}
