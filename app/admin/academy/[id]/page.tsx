import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, PlayCircle, FileDigit } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { getTrailWithModules } from "@/lib/content/queries"
import { ModuleManager } from "../ModuleManager"

const KIND_ICON = {
  youtube: <PlayCircle className="w-4 h-4 text-bh-coral" />,
  pdf: <FileDigit className="w-4 h-4 text-bh-blue" />,
  text: <FileText className="w-4 h-4 text-bh-purple-medium" />,
}

const KIND_LABEL: Record<string, string> = {
  youtube: "YouTube",
  pdf: "PDF",
  text: "Texto",
}

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
  const data = await getTrailWithModules(id, { adminView: true })
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
          <h2 className="text-lg font-semibold">Módulos ({modules.length})</h2>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum módulo ainda. Adicione abaixo.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {modules.map((m) => (
                <li key={m.id} className="py-3 flex items-center gap-3">
                  <span>{KIND_ICON[m.kind]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {KIND_LABEL[m.kind]} ·{" "}
                      {m.kind === "text" ? (m.content_text ?? "").slice(0, 80) : m.content_url}
                    </p>
                  </div>
                  <Badge variant="outline">#{m.display_order}</Badge>
                </li>
              ))}
            </ul>
          )}
        </BHCard>

        <BHCard variant="default">
          <ModuleManager trailId={trail.id} />
        </BHCard>
      </div>
    </AdminShell>
  )
}
