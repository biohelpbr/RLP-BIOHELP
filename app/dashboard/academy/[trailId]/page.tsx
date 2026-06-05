import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard } from "@/components/biohelp"
import {
  getTrailWithModules,
  listMemberCompletedModules,
} from "@/lib/content/queries"
import { LessonList } from "./LessonList"

export default async function TrailDetailPage({
  params,
}: {
  params: Promise<{ trailId: string }>
}) {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const { trailId } = await params
  const data = await getTrailWithModules(trailId)
  if (!data) notFound()

  const { trail, modules } = data
  const completed = await listMemberCompletedModules(member.id)
  const completedInTrail = modules.filter((m) => completed.has(m.id)).length

  return (
    <PartnerShell memberName={member.name ?? "Você"} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-6 max-w-3xl">
        <Link
          href="/dashboard/academy"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pra Academy
        </Link>

        <header className="space-y-3">
          <div>
            {trail.group_label && (
              <p className="text-sm font-medium text-primary">{trail.group_label}</p>
            )}
            <h1 className="text-3xl font-bold text-foreground">{trail.title}</h1>
            {trail.description && <p className="text-muted-foreground mt-1">{trail.description}</p>}
          </div>

          {/* Academy UX 05/06: progresso da trilha no topo, no lugar dos vídeos gigantes. */}
          {modules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {completedInTrail} de {modules.length}{" "}
                {modules.length === 1 ? "aula assistida" : "aulas assistidas"}
              </p>
              <div className="h-1.5 w-full max-w-xs rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${modules.length ? Math.round((completedInTrail / modules.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {modules.length === 0 ? (
          <BHCard variant="elevated">
            <p className="text-sm text-muted-foreground py-6 text-center">
              Esta trilha ainda não tem aulas publicadas.
            </p>
          </BHCard>
        ) : (
          <LessonList modules={modules} completedIds={Array.from(completed)} />
        )}
      </div>
    </PartnerShell>
  )
}
