import Link from "next/link"
import { redirect } from "next/navigation"
import { GraduationCap, PlayCircle } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { AnnouncementBar, BHCard } from "@/components/biohelp"
import { listPublishedTrailsWithMeta, type TrailWithMeta } from "@/lib/content/queries"
import { getActiveAnnouncement } from "@/lib/announcements/queries"

/**
 * Academy UX 05/06 — agrupa as trilhas pelos "grandes grupos" definidos no CMS
 * (`group_label`). Grupos aparecem na ordem da primeira trilha de cada um;
 * trilhas sem grupo caem na seção "Geral", no fim.
 */
function groupTrails(trails: TrailWithMeta[]): Array<{ label: string | null; trails: TrailWithMeta[] }> {
  const sections = new Map<string, TrailWithMeta[]>()
  const ungrouped: TrailWithMeta[] = []
  for (const t of trails) {
    const label = t.group_label?.trim()
    if (!label) {
      ungrouped.push(t)
      continue
    }
    const list = sections.get(label) ?? []
    list.push(t)
    sections.set(label, list)
  }
  const out: Array<{ label: string | null; trails: TrailWithMeta[] }> = []
  sections.forEach((list, label) => out.push({ label, trails: list }))
  if (ungrouped.length > 0) out.push({ label: out.length > 0 ? "Geral" : null, trails: ungrouped })
  return out
}

function trailMeta(t: TrailWithMeta): string | null {
  const parts: string[] = []
  if (t.modules_count > 0) parts.push(`${t.modules_count} ${t.modules_count === 1 ? "aula" : "aulas"}`)
  if (t.total_minutes > 0) parts.push(`${t.total_minutes} min`)
  return parts.length > 0 ? parts.join(" · ") : null
}

export default async function AcademyMemberPage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  // F-V26: espelha o banner de avisos (F-V22) também na Academy, igual ao V2Dashboard.
  const [trails, announcement] = await Promise.all([
    listPublishedTrailsWithMeta(),
    getActiveAnnouncement(),
  ])

  const sections = groupTrails(trails)

  return (
    <PartnerShell memberName={member.name ?? "Você"} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-8">
        {announcement && <AnnouncementBar announcement={announcement} />}

        <header>
          <h1 className="text-3xl font-bold text-foreground inline-flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Academy
          </h1>
          <p className="text-muted-foreground">
            Trilhas com vídeos, PDFs e textos curtos preparados pra você.
          </p>
        </header>

        {trails.length === 0 ? (
          <BHCard variant="elevated">
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma trilha publicada ainda. Volte em breve!
            </p>
          </BHCard>
        ) : (
          sections.map((section, idx) => (
            <section key={section.label ?? `section-${idx}`} className="space-y-4">
              {section.label && (
                <h2 className="text-xl font-semibold text-foreground">{section.label}</h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.trails.map((t) => (
                  <Link key={t.id} href={`/dashboard/academy/${t.id}`} className="group block">
                    <BHCard
                      variant="elevated"
                      className="h-full transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg overflow-hidden p-0"
                    >
                      {t.cover_url || t.fallback_thumb ? (
                        <div className="relative h-36 w-full bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.cover_url ?? t.fallback_thumb ?? ""}
                            alt={t.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-36 w-full bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center">
                          <PlayCircle className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      <div className="p-4 space-y-1.5">
                        <h3 className="font-semibold text-foreground line-clamp-2">{t.title}</h3>
                        {t.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        {trailMeta(t) && (
                          <p className="text-xs text-muted-foreground pt-1">{trailMeta(t)}</p>
                        )}
                      </div>
                    </BHCard>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PartnerShell>
  )
}
