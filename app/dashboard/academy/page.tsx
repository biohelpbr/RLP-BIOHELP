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

// F-V33 — faixa de cor no topo de cada card (rotaciona pela paleta da marca).
const BAND = [
  "hsl(256 47% 47%)", // purple-deep
  "hsl(68 75% 60%)", // lime
  "hsl(16 85% 60%)", // coral
  "hsl(268 67% 74%)", // lavender-medium
]

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
          <div className="space-y-4">
            {groups.map((g, i) => {
              // F-V31: grupo travado e ainda não ativado por esta parceira → "Bloqueada".
              if (g.access_mode === "locked" && !activatedIds.has(g.id)) {
                return <LockedGroupCard key={g.id} group={g} />
              }
              return (
                <Link
                  key={g.id}
                  href={`/dashboard/academy/grupo/${g.id}`}
                  className="group block"
                >
                  <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-lg">
                    {/* faixa de cor vertical à esquerda (pegada da marca) */}
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ background: BAND[i % BAND.length] }}
                    />
                    <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:inline-flex">
                      <GraduationCap className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-foreground">{g.title}</h3>
                      {g.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                          {g.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto hidden shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5 sm:inline-flex">
                      Acessar trilha
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    {/* mobile: seta simples */}
                    <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-primary sm:hidden" />
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
