import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getCampaign, getCampaignRecipients, countSegment, type RecipientRow } from "@/lib/email/queries"
import { SEGMENT_LABEL } from "@/lib/email/schema"
import { SendCampaignButton } from "../SendCampaignButton"

const REC_LABEL: Record<RecipientRow["status"], string> = {
  queued: "Na fila",
  sent: "Enviado",
  delivered: "Entregue",
  bounced: "Bounce",
  complained: "Spam",
  failed: "Falhou",
}

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) notFound()

  const isDraft = campaign.status === "draft"
  const [recipients, draftCount] = await Promise.all([
    isDraft ? Promise.resolve([] as RecipientRow[]) : getCampaignRecipients(id),
    isDraft ? countSegment(campaign.segment) : Promise.resolve(campaign.total),
  ])

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/admin/emails"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para e-mails
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{campaign.subject}</h1>
            <Badge variant={campaign.status === "sent" ? "default" : campaign.status === "failed" ? "destructive" : "outline"}>
              {campaign.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Segmento: <span className="font-medium">{SEGMENT_LABEL[campaign.segment]}</span>
            {" · "}De: {campaign.from_label}
          </p>
        </header>

        {isDraft && (
          <BHCard variant="elevated" className="space-y-3">
            <h2 className="text-lg font-semibold">Pronto pra disparar</h2>
            <p className="text-sm text-muted-foreground">
              Confira a prévia abaixo. O disparo envia agora pra todos do segmento e não pode ser
              desfeito.
            </p>
            <SendCampaignButton id={campaign.id} recipients={draftCount} />
          </BHCard>
        )}

        {!isDraft && (
          <div className="grid gap-4 sm:grid-cols-4">
            <BHCard><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{campaign.total}</p></BHCard>
            <BHCard><p className="text-xs text-muted-foreground">Enviados</p><p className="text-2xl font-bold">{campaign.sent_count}</p></BHCard>
            <BHCard><p className="text-xs text-muted-foreground">Entregues</p><p className="text-2xl font-bold text-primary">{campaign.delivered_count}</p></BHCard>
            <BHCard><p className="text-xs text-muted-foreground">Erros</p><p className="text-2xl font-bold text-destructive">{campaign.error_count}</p></BHCard>
          </div>
        )}

        <BHCard variant="elevated" className="space-y-2">
          <h2 className="text-lg font-semibold">Prévia</h2>
          <div
            className="rounded-lg border border-border bg-muted/30 p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: campaign.body.includes("<") ? campaign.body : campaign.body.replace(/\n/g, "<br>") }}
          />
        </BHCard>

        {!isDraft && recipients.length > 0 && (
          <BHCard variant="elevated">
            <h2 className="mb-3 text-lg font-semibold">Destinatários ({recipients.length})</h2>
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto text-sm">
              {recipients.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-muted-foreground">{r.email}</span>
                  <Badge
                    variant={
                      r.status === "delivered"
                        ? "default"
                        : ["bounced", "complained", "failed"].includes(r.status)
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {REC_LABEL[r.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </BHCard>
        )}
      </div>
    </AdminShell>
  )
}
