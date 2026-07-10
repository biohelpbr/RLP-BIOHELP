import Link from "next/link"
import { redirect } from "next/navigation"
import { Mail, MessageCircle } from "lucide-react"

import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getFlowDeliveries, type ChannelCounts, type DeliveryRow } from "@/lib/email/deliveries"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  failed: "Falhou",
  skipped: "Pulado",
  dryrun: "Ensaio",
}

function statusVariant(s: string) {
  if (s === "sent") return "default" as const
  if (s === "failed") return "destructive" as const
  return "outline" as const
}

function fmtDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ChannelCard({
  icon,
  title,
  counts,
}: {
  icon: React.ReactNode
  title: string
  counts: ChannelCounts
}) {
  return (
    <BHCard variant="elevated">
      <div className="space-y-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
          {icon}
          {title}
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Enviados" value={counts.sent} tone="text-primary" />
          <Stat label="Falhas" value={counts.failed} tone="text-destructive" />
          <Stat label="Pulados" value={counts.skipped} tone="text-muted-foreground" />
          <Stat label="Ensaio" value={counts.dryrun} tone="text-muted-foreground" />
        </div>
      </div>
    </BHCard>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function EntregasPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { email, whatsapp, recent } = await getFlowDeliveries(150)

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Entregas do fluxo</h1>
            <p className="text-muted-foreground">
              O que o fluxo de boas-vindas enviou por <strong>e-mail</strong> e{" "}
              <strong>WhatsApp</strong>, por passo. &quot;Ensaio&quot; = registrado em modo dryrun
              (não enviou de verdade).
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/emails/fluxo">Editar fluxo</Link>
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <ChannelCard icon={<Mail className="h-5 w-5 text-primary" />} title="E-mail" counts={email} />
          <ChannelCard
            icon={<MessageCircle className="h-5 w-5 text-primary" />}
            title="WhatsApp"
            counts={whatsapp}
          />
        </div>

        <BHCard variant="elevated">
          <h2 className="mb-3 text-lg font-bold text-foreground">Envios recentes</h2>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum envio registrado ainda. Aparece aqui conforme o fluxo dispara (por assinante que
              entra na régua).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Membro</th>
                    <th className="py-2 pr-3">Canal</th>
                    <th className="py-2 pr-3 text-center">Passo</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r: DeliveryRow) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.sent_at)}</td>
                      <td className="py-2 pr-3">
                        <span className="font-medium text-foreground">{r.member_name || "—"}</span>
                        {r.email && <span className="ml-1 text-xs text-muted-foreground">{r.email}</span>}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {r.channel === "whatsapp" ? (
                            <MessageCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          {r.channel === "whatsapp" ? "WhatsApp" : "E-mail"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-center">{r.step_order}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status] || r.status}</Badge>
                      </td>
                      <td className="py-2 text-xs text-destructive">{r.error || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
