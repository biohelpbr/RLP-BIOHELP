import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getTrailWithModules, listTrailGroupLabels } from "@/lib/content/queries"
import { ModuleManager } from "../ModuleManager"
import { ModuleRow } from "../ModuleRow"
import { TrailForm } from "../TrailForm"

export default async function AdminTrailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { id } = await params
  const [data, groupSuggestions] = await Promise.all([
    getTrailWithModules(id, { adminView: true }),
    listTrailGroupLabels(),
  ])
  if (!data) notFound()

  const { trail, modules } = data

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <Link
          href="/admin/academy"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pra Academy
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">{trail.title}</h1>
              <Badge variant={trail.status === "published" ? "default" : "outline"}>
                {trail.status}
              </Badge>
            </div>
            {trail.description && <p className="text-muted-foreground">{trail.description}</p>}
          </div>
        </header>

        <BHCard variant="elevated" className="space-y-2">
          <h2 className="text-lg font-semibold">Aulas ({modules.length})</h2>
          <p className="text-xs text-muted-foreground">
            Use as setas pra reordenar — a ordem aqui é a ordem que a parceira vê.
          </p>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma aula ainda. Adicione abaixo.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {modules.map((m, i) => (
                <ModuleRow
                  key={m.id}
                  module={m}
                  isFirst={i === 0}
                  isLast={i === modules.length - 1}
                />
              ))}
            </ul>
          )}
        </BHCard>

        <BHCard variant="default">
          <ModuleManager trailId={trail.id} nextOrder={modules.length} />
        </BHCard>

        <BHCard variant="default" className="space-y-3">
          <h2 className="text-lg font-semibold">Editar trilha</h2>
          <TrailForm trail={trail} groupSuggestions={groupSuggestions} />
        </BHCard>
      </div>
    </AdminShell>
  )
}
