import Link from "next/link"
import { redirect } from "next/navigation"
import { Mail, Plus } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listCampaigns, type CampaignRow } from "@/lib/email/queries"
import { SEGMENT_LABEL } from "@/lib/email/schema"

const STATUS_LABEL: Record<CampaignRow["status"], string> = {
  draft: "Rascunho",
  sending: "Enviando",
  sent: "Enviada",
  failed: "Falhou",
}

function statusVariant(s: CampaignRow["status"]) {
  if (s === "sent") return "default" as const
  if (s === "failed") return "destructive" as const
  return "outline" as const
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminEmailsPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const campaigns = await listCampaigns()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">E-mails</h1>
            <p className="text-muted-foreground">
              Dispare comunicados pra base direto do painel (lives, novidades, renovação). Envio
              via Resend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/emails/fluxo">Fluxo de boas-vindas</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/emails/new" className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova campanha
              </Link>
            </Button>
          </div>
        </header>

        <BHCard variant="elevated">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <Mail className="h-8 w-8" />
              <p className="text-sm">Nenhuma campanha ainda.</p>
              <Button asChild size="sm">
                <Link href="/admin/emails/new">Criar a primeira</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {campaigns.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/emails/${c.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {c.subject}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {SEGMENT_LABEL[c.segment]} · {c.total || 0} destinatários · {fmtDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.status === "sent" && (
                      <span className="text-xs text-muted-foreground">
                        {c.delivered_count}/{c.sent_count} entregues
                        {c.error_count > 0 && ` · ${c.error_count} erro(s)`}
                      </span>
                    )}
                    <Badge variant={statusVariant(c.status)}>{STATUS_LABEL[c.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
