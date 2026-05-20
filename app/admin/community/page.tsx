import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, Crown, Filter, Users } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { listCommunity, type CommunityMember } from "@/lib/admin/community"

interface CommunityPageProps {
  searchParams: Promise<{
    status?: string
    tag?: string
    page?: string
  }>
}

const STATUS_CHOICES = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "pending", label: "Pendentes" },
  { value: "inactive", label: "Inativos" },
]

const TAG_CHOICES = [
  { value: "", label: "Todas as tags" },
  { value: "FOUNDER", label: "FOUNDER (≥5 ativos — F-V06)" },
  { value: "manual:influenciador", label: "manual:influenciador (admin)" },
]

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  pending: "secondary",
  inactive: "outline",
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const sp = await searchParams
  const status = (sp.status as "all" | "active" | "pending" | "inactive" | undefined) ?? "all"
  const tag = sp.tag ?? ""
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1)

  const result = await listCommunity({ status, tag: tag || undefined, page })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  const buildHref = (overrides: Partial<{ status: string; tag: string; page: number }>) => {
    const params = new URLSearchParams()
    const newStatus = overrides.status ?? status
    const newTag = overrides.tag ?? tag
    const newPage = overrides.page ?? page
    if (newStatus && newStatus !== "all") params.set("status", newStatus)
    if (newTag) params.set("tag", newTag)
    if (newPage > 1) params.set("page", String(newPage))
    const qs = params.toString()
    return qs ? `/admin/community?${qs}` : "/admin/community"
  }

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Comunidade</h1>
          <p className="text-muted-foreground">
            {result.total} {result.total === 1 ? "membro" : "membros"} no clube.
          </p>
        </header>

        <BHCard variant="default" className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Status:</span>
            {STATUS_CHOICES.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref({ status: opt.value, page: 1 })}
                className={
                  "px-3 py-1 rounded-full text-xs border transition " +
                  (status === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted text-foreground")
                }
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Tag:</span>
            {TAG_CHOICES.map((opt) => (
              <Link
                key={opt.value || "all"}
                href={buildHref({ tag: opt.value, page: 1 })}
                className={
                  "px-3 py-1 rounded-full text-xs border transition " +
                  (tag === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted text-foreground")
                }
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </BHCard>

        <BHCard variant="elevated" className="space-y-3">
          {result.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum membro encontrado com os filtros aplicados.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.rows.map((m: CommunityMember) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <Link
                      href={`/admin/community/${m.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {m.name || "(sem nome)"}
                    </Link>
                    <span className="text-xs text-muted-foreground truncate">
                      {m.email} · {m.ref_code} ·{" "}
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {m.active_count} ativos
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[m.status] ?? "outline"}>
                      {m.status}
                    </Badge>
                    {m.tags.includes("manual:influenciador") && (
                      <Badge variant="secondary">
                        <Award className="w-3 h-3 mr-1" />
                        Influenciador
                      </Badge>
                    )}
                    {(m.tags.includes("FOUNDER") || m.tags.includes("manual:founder") || m.active_count >= 5) && (
                      <Badge variant="default">
                        <Crown className="w-3 h-3 mr-1" />
                        FOUNDER
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Link
                  href={buildHref({ page: Math.max(1, page - 1) })}
                  className={
                    "px-3 py-1 rounded text-sm border " +
                    (page === 1
                      ? "pointer-events-none opacity-50 border-border"
                      : "border-border hover:bg-muted")
                  }
                  aria-disabled={page === 1}
                >
                  Anterior
                </Link>
                <Link
                  href={buildHref({ page: Math.min(totalPages, page + 1) })}
                  className={
                    "px-3 py-1 rounded text-sm border " +
                    (page >= totalPages
                      ? "pointer-events-none opacity-50 border-border"
                      : "border-border hover:bg-muted")
                  }
                  aria-disabled={page >= totalPages}
                >
                  Próxima
                </Link>
              </div>
            </div>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
