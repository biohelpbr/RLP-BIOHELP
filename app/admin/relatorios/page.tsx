import { redirect } from "next/navigation"
import { FileDown, FileText } from "lucide-react"

import { isV2Enabled } from "@/lib/utils/featureFlags"
import { createServiceClient, getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ de?: string; ate?: string }>
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/** 'YYYY-MM-DD' de um Date em horário de Brasília. */
function diaBrt(d: Date): string {
  return new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10)
}

/** Converte 'YYYY-MM-DD' (dia local BRT) pro instante UTC correspondente. */
function brtParaUtc(dia: string, fimDoDia = false): string {
  return `${dia}T${fimDoDia ? "23:59:59.999" : "00:00:00"}-03:00`
}

/**
 * Relatório: quem assinou por período (fonte: nossa base, alimentada em tempo
 * real pelos webhooks de pagamento da Guru). Não consulta a Guru diretamente —
 * a cópia local é atualizada a cada venda confirmada.
 */
export default async function RelatoriosPage({ searchParams }: Props) {
  if (!isV2Enabled()) redirect("/admin")
  const me = await getCurrentMember()
  if (!me) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const sp = await searchParams
  const hoje = new Date()
  const ontem = new Date(hoje.getTime() - 24 * 3600_000)
  const de = sp.de || diaBrt(ontem)
  const ate = sp.ate || diaBrt(hoje)

  const supabase = createServiceClient()
  const { data } = await supabase
    .from("members")
    .select("name, email, phone, subscription_paid_at, sponsor:members!sponsor_id(name, ref_code)")
    .eq("subscription_status", "paid")
    .gte("subscription_paid_at", brtParaUtc(de))
    .lte("subscription_paid_at", brtParaUtc(ate, true))
    .order("subscription_paid_at", { ascending: false })
    .limit(2000)

  type Row = {
    name: string | null
    email: string
    phone: string | null
    subscription_paid_at: string
    sponsor: { name: string | null; ref_code: string | null } | { name: string | null; ref_code: string | null }[] | null
  }
  const rows = ((data || []) as Row[]).map((r) => {
    const s = Array.isArray(r.sponsor) ? r.sponsor[0] : r.sponsor
    return { ...r, sponsorName: s?.name ?? "—", sponsorRef: s?.ref_code ?? "" }
  })

  const csvHref = `/api/admin/relatorio-assinaturas?de=${de}&ate=${ate}`

  return (
    <AdminShell adminName={me.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold text-foreground">
            <FileText className="h-7 w-7 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Assinaturas confirmadas por período. Fonte: confirmações de pagamento da Guru,
            recebidas em tempo real.
          </p>
        </header>

        <BHCard variant="elevated">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="de" className="mb-1 block text-sm font-medium">De</label>
              <input
                id="de" name="de" type="date" defaultValue={de}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ate" className="mb-1 block text-sm font-medium">Até</label>
              <input
                id="ate" name="ate" type="date" defaultValue={ate}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <Button type="submit" size="sm">Filtrar</Button>
            <Button asChild variant="outline" size="sm">
              <a href={csvHref} className="inline-flex items-center gap-1.5">
                <FileDown className="h-4 w-4" />
                Baixar CSV
              </a>
            </Button>
            <p className="ml-auto text-sm text-muted-foreground">
              <strong className="text-foreground">{rows.length}</strong> assinatura(s) no período
            </p>
          </form>
        </BHCard>

        <BHCard variant="elevated">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma assinatura confirmada no período selecionado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">E-mail</th>
                    <th className="py-2 pr-3">Telefone</th>
                    <th className="py-2 pr-3">Indicado por</th>
                    <th className="py-2">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-medium text-foreground">{r.name || "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.email}</td>
                      <td className="py-2 pr-3">{r.phone || "—"}</td>
                      <td className="py-2 pr-3">
                        {r.sponsorName}{" "}
                        {r.sponsorRef && (
                          <span className="font-mono text-xs text-muted-foreground">({r.sponsorRef})</span>
                        )}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {new Date(r.subscription_paid_at).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                          timeZone: "America/Sao_Paulo",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>

        <p className="text-xs text-muted-foreground">
          Obs.: se a Guru ficar sem processar (ex.: créditos esgotados), as confirmações param de
          chegar até a normalização — para conciliação fim-a-fim, use também o export de Vendas da
          própria Guru.
        </p>
      </div>
    </AdminShell>
  )
}
