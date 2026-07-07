import { redirect } from "next/navigation"
import { Trophy, ShoppingBag } from "lucide-react"

import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { listAffiliatesGmvForMonth, currentReferenceMonth } from "@/lib/affiliates/gmv"
import { CloseCommissionsButton } from "./CloseCommissionsButton"
import { CustomerLookup } from "./CustomerLookup"

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/**
 * F-V35 fase 2 — painel de afiliados: GMV do mês, faixa de comissão e Experience.
 * Só leitura (agrega affiliate_sales). Não paga nada.
 */
export default async function AfiliadosPage() {
  if (!isV2Enabled()) redirect("/admin")
  const me = await getCurrentMember()
  if (!me) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const month = currentReferenceMonth()
  const rows = await listAffiliatesGmvForMonth(month)
  const mesLabel = new Date(month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const totalGmv = rows.reduce((s, r) => s + r.gmv, 0)

  // Mês anterior (o que se fecha "após a virada").
  const nowD = new Date()
  const prevD = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1)
  const prevMonth = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}-01`
  const prevLabel = prevD.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <AdminShell adminName={me.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold text-foreground">
            <ShoppingBag className="h-7 w-7 text-primary" />
            Afiliados
          </h1>
          <p className="text-muted-foreground">
            GMV e faixa de comissão de {mesLabel}. Total do mês: <strong>{brl(totalGmv)}</strong> ·{" "}
            <strong>{rows.length}</strong> afiliados com venda.
          </p>
        </header>

        <BHCard variant="elevated">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma venda de afiliado neste mês ainda. (A captura precisa estar ligada e cupons
              de afiliado em uso no Shopify.)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Afiliado</th>
                    <th className="py-2 pr-3">Código</th>
                    <th className="py-2 pr-3 text-right">Vendas</th>
                    <th className="py-2 pr-3 text-right">GMV</th>
                    <th className="py-2 pr-3 text-center">Faixa</th>
                    <th className="py-2 text-center">Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.affiliate_member_id} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-medium text-foreground">{r.name || "—"}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{r.ref_code || "—"}</td>
                      <td className="py-2 pr-3 text-right">{r.sales_count}</td>
                      <td className="py-2 pr-3 text-right font-semibold">{brl(r.gmv)}</td>
                      <td className="py-2 pr-3 text-center">
                        <Badge variant={r.tier_pct >= 15 ? "default" : "secondary"}>{r.tier_pct}%</Badge>
                      </td>
                      <td className="py-2 text-center">
                        {r.experience ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <Trophy className="h-3.5 w-3.5" /> Sim
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>

        <BHCard variant="elevated">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Fechamento de comissão</h2>
            <p className="text-sm text-muted-foreground">
              Simule e lance as comissões de afiliado do mês fechado ({prevLabel}). A simulação
              não grava; o lançamento entra no extrato dos afiliados (idempotente por mês).
            </p>
            <CloseCommissionsButton referenceMonth={prevMonth} monthLabel={prevLabel} />
          </div>
        </BHCard>

        <BHCard variant="elevated">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Consultar cliente</h2>
            <p className="text-sm text-muted-foreground">
              Veja o Afiliado Originador e o histórico de vendas (Afiliado Atual) de um cliente.
            </p>
            <CustomerLookup />
          </div>
        </BHCard>

        <p className="text-xs text-muted-foreground">
          Faixa: até R$10 mil de GMV no mês = 10%; acima = 15%. Experience: GMV do mês acima de
          R$50 mil. Comissão da venda vai pro Afiliado Atual; perpétua (10%) pro Originador.
        </p>
      </div>
    </AdminShell>
  )
}
