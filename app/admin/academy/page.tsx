import Link from "next/link"
import { redirect } from "next/navigation"
import { Layers, Plus, Lock } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listAdminGroups } from "@/lib/content/groups"
import { GroupRowActions } from "./GroupRowActions"

/**
 * F-V31 — CMS da Academy: gerencia os Grandes Grupos (camadas). Cada grupo abre
 * sua tela de edição + trilhas + materiais.
 */
export default async function AdminAcademyPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const groups = await listAdminGroups()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Academy</h1>
            <p className="text-muted-foreground">
              Grandes Grupos (camadas) → módulos → aulas. Crie os grupos e organize o conteúdo dentro deles.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/academy/grupo/new" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo grupo
            </Link>
          </Button>
        </header>

        <BHCard variant="elevated">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum Grande Grupo ainda. Crie o primeiro pra começar.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((g, i) => (
                <li key={g.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/academy/grupo/${g.id}`} className="font-semibold text-foreground hover:underline">
                      {g.title}
                    </Link>
                    {g.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{g.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {g.trails_count} módulo(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.access_mode === "locked" && (
                      <Badge variant="outline" className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Travado
                      </Badge>
                    )}
                    <GroupRowActions
                      groupId={g.id}
                      groupTitle={g.title}
                      trailsCount={g.trails_count}
                      isFirst={i === 0}
                      isLast={i === groups.length - 1}
                    />
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
