import Link from "next/link"
import { redirect } from "next/navigation"
import { Eye, Plus, Layers } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listAdminTrails } from "@/lib/content/queries"

export default async function AdminAcademyPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const trails = await listAdminTrails()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Academy</h1>
            <p className="text-muted-foreground">
              Trilhas de conteúdo (vídeos YouTube, PDFs, textos) entregues globalmente aos membros.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/academy/new" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova trilha
            </Link>
          </Button>
        </header>

        <BHCard variant="elevated">
          {trails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma trilha cadastrada ainda. Crie a primeira pra começar.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {trails.map((t) => (
                <li
                  key={t.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/academy/${t.id}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {t.title}
                    </Link>
                    {t.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {t.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {t.modules_count} módulo(s)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {t.views_count} visualização(ões)
                      </span>
                    </p>
                  </div>
                  <Badge variant={t.status === "published" ? "default" : "outline"}>
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </AdminShell>
  )
}
