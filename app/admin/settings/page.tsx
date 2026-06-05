import { redirect } from "next/navigation"
import { LifeBuoy } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { getSupportContact } from "@/lib/settings/queries"
import { SupportContactForm } from "./SupportContactForm"

/**
 * W4 (call 05/06) — /admin/settings: CMS de configurações do app.
 * Primeiro bloco: contato do suporte (telefone + horário) exibido no card
 * "Comunidade & Atendimento" da home do membro. Sem deploy pra mudar.
 */
export default async function AdminSettingsPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const support = await getSupportContact()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Conteúdos editáveis do painel — a mudança vale na hora, sem deploy.
          </p>
        </header>

        <BHCard variant="elevated" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Suporte / Atendimento</h2>
              <p className="text-sm text-muted-foreground">
                Telefone e horário exibidos no card &quot;Comunidade &amp; Atendimento&quot; da
                home do membro (botão de WhatsApp incluso).
              </p>
            </div>
          </div>
          <SupportContactForm initial={support} />
        </BHCard>
      </div>
    </AdminShell>
  )
}
