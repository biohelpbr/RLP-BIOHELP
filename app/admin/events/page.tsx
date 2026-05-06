import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, MapPin, Users, ExternalLink, Plus, ShoppingBag } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { listEvents, type EventWithStats } from "@/lib/events/queries"

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  hibrido: "Híbrido",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function EventList({ events, emptyMsg }: { events: EventWithStats[]; emptyMsg: string }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">{emptyMsg}</p>
    )
  }
  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li
          key={ev.id}
          className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/events/${ev.id}`}
                className="text-base font-semibold text-foreground hover:underline"
              >
                {ev.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatDate(ev.start_at)} → {formatDate(ev.end_at)}
                </span>
                {ev.location && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ev.location}
                    </span>
                  </>
                )}
              </p>
              {ev.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{ev.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ExternalLink className="w-3 h-3" />
                  /r/{ev.slug}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ShoppingBag className="w-3 h-3" />
                  {ev.eligible_product_ids.length} produto(s) elegíveis
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary">{MODE_LABEL[ev.mode]}</Badge>
              <Badge variant={ev.status === "published" ? "default" : "outline"}>
                {ev.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border text-xs">
            <Stat label="Visitas" value={ev.visits_count} />
            <Stat label="Presenças" value={ev.attendances_count} icon={<Users className="w-3 h-3" />} />
            <Stat label="Conversões" value={ev.conversions_count} />
            <Stat label="Custo" value={formatBRL(ev.cost)} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}

export default async function AdminEventsPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { current, future, past } = await listEvents()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Eventos</h1>
            <p className="text-muted-foreground">
              Lançamentos, presenciais, campanhas configuráveis (incluindo o cupom de creatina).
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/events/new" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo evento
            </Link>
          </Button>
        </header>

        <Tabs defaultValue="current" className="w-full">
          <TabsList>
            <TabsTrigger value="current">Em andamento ({current.length})</TabsTrigger>
            <TabsTrigger value="future">Futuros ({future.length})</TabsTrigger>
            <TabsTrigger value="past">Passados ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <BHCard variant="elevated">
              <EventList events={current} emptyMsg="Nenhum evento em andamento agora." />
            </BHCard>
          </TabsContent>

          <TabsContent value="future">
            <BHCard variant="elevated">
              <EventList events={future} emptyMsg="Nenhum evento futuro agendado." />
            </BHCard>
          </TabsContent>

          <TabsContent value="past">
            <BHCard variant="elevated">
              <EventList events={past} emptyMsg="Nenhum evento concluído ainda." />
            </BHCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  )
}
