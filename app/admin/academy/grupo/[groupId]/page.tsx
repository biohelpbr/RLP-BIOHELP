import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Plus, PlayCircle } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Button } from "@/components/ui/button"
import { getAdminGroup, getGroupWithTrails, getGroupMaterials } from "@/lib/content/groups"
import { GroupForm } from "../../GroupForm"
import { GroupMaterials } from "../../GroupMaterials"

export default async function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { groupId } = await params
  const group = await getAdminGroup(groupId)
  if (!group) notFound()

  const data = await getGroupWithTrails(groupId, { adminView: true })
  const trails = data?.trails ?? []
  const materials = await getGroupMaterials(groupId)

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6 max-w-3xl">
        <Link href="/admin/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Voltar pros grupos
        </Link>

        <section className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Editar grupo</h1>
          <BHCard variant="elevated">
            <GroupForm group={group} />
          </BHCard>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Módulos deste grupo</h2>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/academy/new?group=${groupId}`} className="inline-flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Nova trilha
              </Link>
            </Button>
          </div>
          <BHCard variant="elevated">
            {trails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum módulo neste grupo ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {trails.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <Link href={`/admin/academy/${t.id}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                      <PlayCircle className="w-4 h-4 text-primary" />
                      {t.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </BHCard>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Materiais complementares (PDF)</h2>
          <BHCard variant="elevated">
            <GroupMaterials groupId={groupId} materials={materials} />
          </BHCard>
        </section>
      </div>
    </AdminShell>
  )
}
