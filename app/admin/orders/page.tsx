import { redirect } from "next/navigation"
import { CheckCircle2, Clock, TrendingUp, XCircle } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getSubscriptionsGuruData } from "@/lib/admin/subscriptions-guru"

/**
 * `/admin/orders` — Assinaturas & Compras (canal Guru).
 *
 * Reproposta da call 03/06: a página antiga lia a Shopify (`orders/paid`), mas
 * neste modelo o pagamento passa pelo Guru — a tabela `orders` nunca popula.
 * Agora lê os eventos reais do Guru (view `admin_subscription_events`) e mostra
 * ativações/cancelamentos POR DIA + feed de eventos recentes.
 */

const KIND_LABEL: Record<string, string> = {
  ativacao: "Nova assinatura",
  cancelamento: "Cancelamento",
  expiracao: "Expiração",
  iniciada: "Checkout iniciado",
}

const KIND_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ativacao: "default",
  cancelamento: "destructive",
  expiracao: "secondary",
  iniciada: "outline",
}

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR")

export default async function AdminOrdersPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const data = await getSubscriptionsGuruData()
  const dailyWithActivity = data.daily.slice(0, 14)

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Assinaturas &amp; Compras</h1>
          <p className="text-muted-foreground">
            Movimento de assinaturas pelo <strong>Guru</strong> (canal de pagamento real).
            Ativações e cancelamentos por dia, direto dos webhooks recebidos.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BHStat
            label="Assinaturas ativas"
            value={data.now.active}
            subtitle={`${data.now.pending} pendentes · ${data.now.cancelled} canceladas`}
            icon={<CheckCircle2 className="w-4 h-4" />}
            variant="primary"
          />
          <BHStat
            label="Ativações (30 dias)"
            value={data.last30.activations}
            subtitle="Novas assinaturas confirmadas"
            icon={<TrendingUp className="w-4 h-4" />}
            variant="success"
          />
          <BHStat
            label="Cancelamentos (30 dias)"
            value={data.last30.cancellations}
            subtitle="Pedidos de cancelamento"
            icon={<XCircle className="w-4 h-4" />}
            variant="warning"
          />
          <BHStat
            label="Pendentes agora"
            value={data.now.pending}
            subtitle="Aguardando ativação"
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        <BHCard variant="elevated" className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Por dia (últimos 14 dias)</h2>
            <p className="text-sm text-muted-foreground">
              Ativações confirmadas vs. cancelamentos recebidos do Guru.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 font-medium">Dia</th>
                  <th className="py-2 font-medium text-right">Ativações</th>
                  <th className="py-2 font-medium text-right">Cancelamentos</th>
                  <th className="py-2 font-medium text-right">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {dailyWithActivity.map((row) => {
                  const net = row.activations - row.cancellations
                  return (
                    <tr key={row.day} className="border-t border-border">
                      <td className="py-2 font-mono">{row.day}</td>
                      <td className="py-2 text-right text-emerald-600">{row.activations}</td>
                      <td className="py-2 text-right text-red-600">{row.cancellations}</td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          net > 0 ? "text-emerald-600" : net < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {net > 0 ? `+${net}` : net}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </BHCard>

        <BHCard variant="default" className="space-y-3">
          <h2 className="text-lg font-semibold">Eventos recentes</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem eventos de assinatura recebidos ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((e) => (
                <li key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">
                      {e.name || e.email || "(sem identificação)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.email} · {fmtDateTime(e.receivedAt)}
                    </p>
                  </div>
                  {!e.ok && (
                    <Badge variant="outline" title={e.error ?? undefined}>
                      não processado
                    </Badge>
                  )}
                  <Badge variant={KIND_BADGE[e.kind] ?? "outline"}>
                    {KIND_LABEL[e.kind] ?? e.kind}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </BHCard>

        <BHCard variant="default" className="text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Fonte:</span> webhooks do Guru
            (<code className="text-xs">subscription.*</code>). A contagem &quot;ativa agora&quot;
            vem de <code className="text-xs">members.subscription_status</code>. Dados sintéticos
            do teste de carga (27-28/05) são excluídos automaticamente.
          </p>
        </BHCard>
      </div>
    </AdminShell>
  )
}
