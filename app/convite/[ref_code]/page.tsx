import { notFound } from "next/navigation"
import { Sparkles } from "lucide-react"

import { createServiceClient } from "@/lib/supabase/server"
import { BHCard } from "@/components/biohelp"
import { CONVITE_COPY, renderConviteHeadline } from "@/lib/copy/convite"

import { ConviteForm } from "./ConviteForm"

/**
 * F-V19 — Landing pré-cadastro `/convite/[ref_code]`.
 *
 * Server component. Resolve sponsor pelo ref_code (idempotente, sem cookie).
 * Sponsor com `subscription_status='cancelled'` ou inexistente → 404
 * (RF-3 da SPEC / hipótese padrão TBD-8: inativo bloqueia novos cadastros).
 *
 * Esta rota não respeita LRP_V2_GURU_FLOW — quem gateia é `/r/[slug]` que
 * é a porta de entrada. Acesso direto via URL fica disponível pra testes/links
 * já compartilhados, evitando 404 confuso quando a flag oscilar.
 */
interface ConvitePageProps {
  params: Promise<{ ref_code: string }>
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { ref_code } = await params

  const supabase = createServiceClient()
  const { data: sponsor } = await supabase
    .from("members")
    .select("ref_code, name, subscription_status")
    .eq("ref_code", ref_code)
    .maybeSingle()

  if (!sponsor || sponsor.subscription_status === "cancelled") {
    notFound()
  }

  const sponsorName = (sponsor.name as string | null) ?? null
  const headline = renderConviteHeadline(sponsorName)

  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-bh-lime/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bh-gradient-purple bh-shadow-purple-glow mb-4">
            <span className="text-primary-foreground font-bold text-2xl">B</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bh-lime/30 px-3 py-1 text-xs font-medium text-foreground mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {CONVITE_COPY.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {headline}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {CONVITE_COPY.subheadline}
          </p>
        </div>

        <BHCard variant="elevated" className="animate-scale-in mb-6">
          <ul className="space-y-2.5">
            {CONVITE_COPY.benefits.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-sm text-foreground"
              >
                <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </BHCard>

        <BHCard variant="elevated" className="animate-scale-in">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-foreground">
              {CONVITE_COPY.formTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {CONVITE_COPY.formSubtitle}
            </p>
          </div>
          <ConviteForm refCode={sponsor.ref_code as string} />
        </BHCard>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-md mx-auto">
          {CONVITE_COPY.footerNote}
        </p>
      </div>
    </div>
  )
}
