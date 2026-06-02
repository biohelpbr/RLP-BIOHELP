import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLink, Megaphone, Pencil, Plus } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listAnnouncements, type AnnouncementRow } from "@/lib/announcements/queries"
import { AnnouncementToggle } from "./AnnouncementToggle"

function formatWindow(a: AnnouncementRow): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  if (!a.starts_at && !a.ends_at) return "Sem limite de data"
  if (a.starts_at && a.ends_at) return `${fmt(a.starts_at)} → ${fmt(a.ends_at)}`
  if (a.ends_at) return `Até ${fmt(a.ends_at)}`
  return `A partir de ${fmt(a.starts_at!)}`
}

function isLive(a: AnnouncementRow): boolean {
  if (!a.active) return false
  const now = Date.now()
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false
  return true
}

export default async function AdminAnnouncementsPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const announcements = await listAnnouncements()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Avisos</h1>
            <p className="text-muted-foreground">
              Barra de aviso no topo do painel dos membros. Use pra divulgar lives, eventos e
              comunicados. Só o aviso ativo mais recente aparece pros membros.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/announcements/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo aviso
            </Link>
          </Button>
        </header>

        <BHCard variant="elevated">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8" />
              <p className="text-sm">Nenhum aviso criado ainda.</p>
              <Button asChild size="sm">
                <Link href="/admin/announcements/new">Criar o primeiro aviso</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => {
                const live = isLive(a)
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {a.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.image_url}
                          alt=""
                          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Megaphone className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{a.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatWindow(a)}</p>
                        {a.link_url && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            {a.cta_label?.trim() || "Saber mais"} → {a.link_url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {live ? (
                        <Badge className="bg-bh-coral text-white hover:bg-bh-coral">No ar</Badge>
                      ) : (
                        <Badge variant="outline">Fora do ar</Badge>
                      )}
                      <AnnouncementToggle id={a.id} active={a.active} />
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/announcements/${a.id}`} className="inline-flex items-center gap-1.5">
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
