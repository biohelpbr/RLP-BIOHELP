import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowRight, FileText, PlayCircle } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard } from "@/components/biohelp"
import {
  getGroupWithTrails,
  getGroupMaterials,
  isGroupUnlockedForMember,
} from "@/lib/content/groups"
import { LockedGroupCard } from "../../LockedGroupCard"

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const { groupId } = await params
  const data = await getGroupWithTrails(groupId)
  if (!data) notFound()

  const { group, trails } = data

  const back = (
    <Link
      href="/dashboard/academy"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar pra Academy
    </Link>
  )

  // F-V31: grupo travado e não ativado → card de fricção positiva, sem o conteúdo.
  const unlocked = await isGroupUnlockedForMember(group, member.id)
  if (!unlocked) {
    return (
      <PartnerShell memberName={member.name ?? "Você"} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
        <div className="space-y-6 max-w-md">
          {back}
          <LockedGroupCard group={group} />
        </div>
      </PartnerShell>
    )
  }

  const materials = await getGroupMaterials(groupId)

  return (
    <PartnerShell memberName={member.name ?? "Você"} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-6 max-w-3xl">
        {back}

        <header>
          <h1 className="text-3xl font-bold text-foreground">{group.title}</h1>
          {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        </header>

        {/* Módulos do grupo */}
        {trails.length === 0 ? (
          <BHCard variant="elevated">
            <p className="text-sm text-muted-foreground py-6 text-center">
              Este caminho ainda não tem módulos publicados.
            </p>
          </BHCard>
        ) : (
          <div className="space-y-3">
            {trails.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/academy/${t.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{t.description}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}

        {/* Materiais complementares (PDFs) */}
        {materials.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Materiais complementares</h2>
            <div className="space-y-2">
              {materials.map((m) => (
                <a
                  key={m.id}
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <FileText className="h-4 w-4 shrink-0 text-bh-coral" />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{m.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">Abrir PDF</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </PartnerShell>
  )
}
