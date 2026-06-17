import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { listAdminFlowSteps } from "@/lib/email/flow-actions"
import { getFlowMode } from "@/lib/email/flow"
import { FlowStepsManager } from "./FlowStepsManager"

const MODE_INFO: Record<
  ReturnType<typeof getFlowMode>,
  { label: string; tone: "default" | "outline" | "destructive"; help: string }
> = {
  off: {
    label: "Desligado",
    tone: "outline",
    help: "O fluxo está inerte: nada é enviado. Edite os passos à vontade — eles só disparam quando o modo virar dryrun/live.",
  },
  dryrun: {
    label: "Ensaio (dry-run)",
    tone: "default",
    help: "Modo de ensaio: registra os envios no log SEM enviar e-mail de verdade. Bom pra validar antes do live.",
  },
  live: {
    label: "Ativo (live)",
    tone: "destructive",
    help: "AO VIVO: os e-mails estão sendo enviados de verdade aos assinantes.",
  },
}

export default async function AdminEmailFlowPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const steps = await listAdminFlowSteps()
  const mode = getFlowMode()
  const info = MODE_INFO[mode]

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <Link
          href="/admin/emails"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pra E-mails
        </Link>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Fluxo de boas-vindas</h1>
            <Badge variant={info.tone}>Modo: {info.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Sequência automática que começa quando alguém vira assinante. Cada passo sai após o
            delay configurado (D+0 = na entrada). O membro para de receber se se descadastrar.
          </p>
        </header>

        <BHCard variant="default">
          <p className="text-sm text-muted-foreground">{info.help}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            O modo é controlado pela variável de ambiente <code>EMAIL_FLOW_MODE</code> (off / dryrun
            / live) — alterada no deploy, não por aqui.
          </p>
        </BHCard>

        <FlowStepsManager steps={steps} />
      </div>
    </AdminShell>
  )
}
