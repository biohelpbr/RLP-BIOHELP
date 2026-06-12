import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, GraduationCap } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { AnnouncementBar, BHCard } from "@/components/biohelp"
import { listPublishedGroups, listMemberActivatedGroupIds } from "@/lib/content/groups"
import { getActiveAnnouncement } from "@/lib/announcements/queries"
import { LockedGroupCard } from "./LockedGroupCard"

/**
 * F-V31 — Home da Academy por "camadas" (Grandes Grupos). Mostra os grupos como
 * cards; clicar abre os módulos. Grupo travado e não ativado → card "Bloqueada".
 */
export default async function AcademyMemberPage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const [groups, announcement, activatedIds] = await Promise.all([
    listPublishedGroups(),
    getActiveAnnouncement(),
    listMemberActivatedGroupIds(member.id),
  ])

  return (
    <PartnerShell
      memberName={member.name ?? "Você"}
      isActive={member.subscription_status === "paid"}
      memberSubtitle={getMemberSubtitle(member)}
    >
      <div className="space-y-8">
        {announcement && <AnnouncementBar announcement={announcement} />}

        <header>
          <h1 className="text-3xl font-bold text-foreground inline-flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Academy
          </h1>
          <p className="text-muted-foreground">
            Escolha por onde começar. Cada caminho tem vídeos, materiais e passos pra você evoluir.
          </p>
        </header>

        {groups.length === 0 ? (
          <BHCard variant="elevated">
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum conteúdo publicado ainda. Volte em breve!
            </p>
          </BHCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              // F-V31: grupo travado e ainda não ativado por esta parceira → "Bloqueada".
              if (g.access_mode === "locked" && !activatedIds.has(g.id)) {
                return <LockedGroupCard key={g.id} group={g} />
              }
              return (
                <Link key={g.id} href={`/dashboard/academy/grupo/${g.id}`} className="group block h-full">
                  <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                    <h3 className="font-semibold text-foreground">{g.title}</h3>
                    {g.description && (
                      <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-3">
                        {g.description}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Acessar
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PartnerShell>
  )
}
