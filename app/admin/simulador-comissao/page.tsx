import { redirect } from "next/navigation"
import { Calculator } from "lucide-react"

import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { SimuladorComissao } from "./SimuladorComissao"

/**
 * F-V34/F-V35 — Simulador de comissão (dry-run). Puramente client-side/matemático:
 * não lê nem grava nada, só mostra o resultado das regras pro cliente validar.
 */
export default async function SimuladorComissaoPage() {
  if (!isV2Enabled()) redirect("/admin")

  const me = await getCurrentMember()
  if (!me) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  return (
    <AdminShell adminName={me.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="inline-flex items-center gap-2 text-3xl font-bold text-foreground">
            <Calculator className="h-7 w-7 text-primary" />
            Simulador de comissão
          </h1>
          <p className="text-muted-foreground">
            Esta é uma calculadora de conferência. Preencha um cenário nas caixas abaixo e veja,
            na hora, quanto cada pessoa recebe. Não paga ninguém e não altera nada — serve só para
            confirmar se as regras de comissão estão certas.
          </p>
        </header>

        <SimuladorComissao />

        <p className="text-xs text-muted-foreground">
          Os valores aqui são exatamente os que o sistema paga na ativação/venda real. Simulação
          não grava dados nem envia nada.
        </p>
      </div>
    </AdminShell>
  )
}
