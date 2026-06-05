import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import {
  getTrailWithModules,
  listMemberCompletedModules,
  type ContentModule,
} from "@/lib/content/queries"
import { ModulePlayer } from "../ModulePlayer"

const KIND_LABEL: Record<string, string> = {
  youtube: "Vídeo",
  pdf: "PDF",
  text: "Texto",
}

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

  return (
    <PartnerShell memberName={member.name ?? "Você"} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-6">
        <Link
          href="/dashboard/academy"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pra Academy
        </Link>

        <header>
          <h1 className="text-3xl font-bold text-foreground">{trail.title}</h1>
          {trail.description && <p className="text-muted-foreground">{trail.description}</p>}
        </header>

        {modules.length === 0 ? (
          <BHCard variant="elevated">
            <p className="text-sm text-muted-foreground py-6 text-center">
              Esta trilha ainda não tem módulos publicados.
            </p>
          </BHCard>
        ) : (
          <div className="space-y-3">
            {modules.map((m: ContentModule) => (
              <BHCard key={m.id} variant="elevated" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{m.title}</h2>
                    <p className="text-xs text-muted-foreground">{KIND_LABEL[m.kind]}</p>
                  </div>
                  {completed.has(m.id) && (
                    <Badge variant="default">✓ visto</Badge>
                  )}
                </div>
                <ModulePlayer module={m} alreadyCompleted={completed.has(m.id)} />
              </BHCard>
            ))}
          </div>
        )}
      </div>
    </PartnerShell>
  )
}
