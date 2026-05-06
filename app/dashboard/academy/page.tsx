import Link from "next/link"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard } from "@/components/biohelp"
import { listPublishedTrails } from "@/lib/content/queries"

export default async function AcademyMemberPage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const trails = await listPublishedTrails()

  return (
    <PartnerShell memberName={member.name ?? "Você"} isActive={member.status === "active"}>
      <div className="space-y-6">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trails.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/academy/${t.id}`}
                className="group block"
              >
                <BHCard
                  variant="elevated"
                  className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:shadow-lg space-y-3 overflow-hidden p-0"
                >
                  {t.cover_url ? (
                    <div className="relative h-32 w-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.cover_url}
                        alt={t.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-primary/50" />
                    </div>
                  )}
                  <div className="p-4 pt-2 space-y-1.5">
                    <h2 className="font-semibold text-foreground line-clamp-2">{t.title}</h2>
                    {t.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {t.description}
                      </p>
                    )}
                  </div>
                </BHCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PartnerShell>
  )
}
