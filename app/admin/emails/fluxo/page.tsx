import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { listAdminFlowSteps } from "@/lib/email/flow-actions"
import { getFlowMode, getWhatsAppMode } from "@/lib/email/flow"
import { FlowStepsManager } from "./FlowStepsManager"

type Mode = ReturnType<typeof getFlowMode>

const MODE_LABEL: Record<Mode, { label: string; tone: "default" | "outline" | "destructive" }> = {
  off: { label: "Desligado", tone: "outline" },
  dryrun: { label: "Ensaio (dry-run)", tone: "default" },
  live: { label: "Ativo (live)", tone: "destructive" },
}

function modeHelp(mode: Mode, canal: string): string {
  if (mode === "live") return `AO VIVO: ${canal} sendo enviado de verdade aos assinantes.`
  if (mode === "dryrun") return `Ensaio: registra no log SEM enviar ${canal} de verdade.`
  return `${canal} desligado: nada é enviado por este canal.`
}

export default async function AdminEmailFlowPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const steps = await listAdminFlowSteps()
  const emailMode = getFlowMode()
  const waMode = getWhatsAppMode()
  const emailInfo = MODE_LABEL[emailMode]
  const waInfo = MODE_LABEL[waMode]

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
            <Badge variant={emailInfo.tone}>E-mail: {emailInfo.label}</Badge>
            <Badge variant={waInfo.tone}>WhatsApp: {waInfo.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Sequência automática que começa quando alguém vira assinante. Cada passo sai após o
            delay configurado (D+0 = na entrada). O membro para de receber se se descadastrar.
          </p>
        </header>

        <BHCard variant="default">
          <p className="text-sm text-muted-foreground">
            <strong>E-mail:</strong> {modeHelp(emailMode, "e-mail")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong>WhatsApp:</strong> {modeHelp(waMode, "WhatsApp")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Os canais são independentes: <code>EMAIL_FLOW_MODE</code> e{" "}
            <code>WHATSAPP_FLOW_MODE</code> (off / dryrun / live), alterados no deploy — não por aqui.
          </p>
        </BHCard>

        <FlowStepsManager steps={steps} />
      </div>
    </AdminShell>
  )
}
