import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, ShoppingBag, Users } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getEventById } from "@/lib/events/queries"

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  hibrido: "Híbrido",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { id } = await params
  const data = await getEventById(id)
  if (!data) notFound()

  const { event, visits, unique_visitors, attendances, conversions, eligible_product_ids } = data

  const conversionRate =
    visits > 0 ? `${((conversions / visits) * 100).toFixed(1)}%` : "—"

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar pra Eventos
          </Link>
        </div>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
            <Badge variant="secondary">{MODE_LABEL[event.mode]}</Badge>
            <Badge variant={event.status === "published" ? "default" : "outline"}>
              {event.status}
            </Badge>
          </div>
          {event.description && <p className="text-muted-foreground">{event.description}</p>}
          <p className="text-sm text-muted-foreground inline-flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(event.start_at)} → {formatDate(event.end_at)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <code>/r/{event.slug}</code>
            </span>
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BHCard variant="elevated" className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Visitas</p>
            <p className="text-2xl font-semibold">{visits}</p>
            <p className="text-xs text-muted-foreground">{unique_visitors} membros únicos</p>
          </BHCard>
          <BHCard variant="elevated" className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> Presenças
            </p>
            <p className="text-2xl font-semibold">{attendances}</p>
            <p className="text-xs text-muted-foreground">marcadas pelo admin</p>
          </BHCard>
          <BHCard variant="elevated" className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversões</p>
            <p className="text-2xl font-semibold">{conversions}</p>
            <p className="text-xs text-muted-foreground">tag <code>evento:{event.slug}</code></p>
          </BHCard>
          <BHCard variant="elevated" className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversão / Visita</p>
            <p className="text-2xl font-semibold">{conversionRate}</p>
            <p className="text-xs text-muted-foreground">
              Custo {formatBRL(event.cost)} · ROI fica liberado quando F-V04 (comissão real)
              destravar.
            </p>
          </BHCard>
        </div>

        <BHCard variant="default" className="space-y-2">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Produtos elegíveis ({eligible_product_ids.length})
          </h2>
          {eligible_product_ids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto vinculado. Edite o evento pra adicionar IDs Shopify de produtos elegíveis ao bônus.
            </p>
          ) : (
            <ul className="text-sm font-mono text-muted-foreground space-y-1">
              {eligible_product_ids.map((pid) => (
                <li key={pid}>· {pid}</li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
