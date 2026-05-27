import { notFound } from "next/navigation"
import { Gift, Users, Star, TrendingUp, Shield, User } from "lucide-react"

import { createServiceClient } from "@/lib/supabase/server"
import { CONVITE_COPY, renderSponsorBadge } from "@/lib/copy/convite"

import { ConviteForm } from "./ConviteForm"

interface ConvitePageProps {
  params: Promise<{ ref_code: string }>
}

const BENEFIT_ICONS = {
  gift: Gift,
  users: Users,
  star: Star,
  "trending-up": TrendingUp,
} as const

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
  const sponsorBadge = renderSponsorBadge(sponsorName)

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      {/* Top bar */}
      <div className="text-center py-4">
        <p className="text-xs tracking-[0.3em] text-purple-400 font-medium">
          {CONVITE_COPY.topBar}
        </p>
      </div>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex flex-col items-center">
          <svg className="w-12 h-12 text-purple-700 mb-2" viewBox="0 0 48 48" fill="none">
            <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M24 12c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M16 28c0-2 4-4 8-4s8 2 8 4v2c0 1-1 2-2 2H18c-1 0-2-1-2-2v-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M12 18l4-2M36 18l-4-2M24 8v4M18 34l-2 4M30 34l2 4" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          </svg>
          <span className="text-xl font-bold tracking-wider text-purple-900">{CONVITE_COPY.brandName}</span>
          <span className="text-[10px] tracking-[0.25em] text-purple-500 font-medium">{CONVITE_COPY.brandSub}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-6">
        {/* Headline */}
        <h1 className="text-center text-3xl md:text-4xl font-bold text-purple-900 leading-tight mb-8 whitespace-pre-line">
          O primeiro clube onde{"\n"}
          <span className="text-purple-500">consumo inteligente</span>{"\n"}
          se transforma em{"\n"}
          <span className="text-purple-500">comunidade e crescimento.</span>
        </h1>

        <div className="w-12 h-0.5 bg-purple-400 mx-auto mb-8" />

        {/* Sponsor badge */}
        <div className="flex items-center justify-center gap-3 bg-purple-50 border border-purple-100 rounded-2xl py-3 px-5 mb-8">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-purple-900">
            Seu acesso foi liberado por{" "}
            <strong className="font-semibold">{sponsorName ?? "alguém especial"}</strong>
          </p>
        </div>

        {/* Form intro */}
        <p className="text-center text-sm text-gray-600 mb-6">
          Complete seus dados para <strong className="font-semibold">ativar seu acesso</strong> ao Nutrition Club.
        </p>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-lg shadow-purple-100/50 border border-purple-50 p-6 mb-8">
          <ConviteForm refCode={sponsor.ref_code as string} sponsorName={sponsorName ?? "alguém especial"} />
        </div>

        {/* Security badge */}
        <div className="flex items-start gap-3 justify-center mb-12">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{CONVITE_COPY.securityBadge}</p>
            <p className="text-xs text-gray-500 whitespace-pre-line">{CONVITE_COPY.securitySub}</p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="text-center mb-10">
          <p className="text-2xl font-bold text-purple-900 whitespace-pre-line mb-1">
            {CONVITE_COPY.bottomHeadline}
          </p>
          <p className="text-2xl font-bold text-purple-500">
            {CONVITE_COPY.bottomHighlight}
          </p>
          <div className="w-8 h-0.5 bg-purple-400 mx-auto mt-4" />
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {CONVITE_COPY.benefits.map((b) => {
            const Icon = BENEFIT_ICONS[b.icon as keyof typeof BENEFIT_ICONS]
            return (
              <div key={b.icon} className="text-center">
                <div className="w-14 h-14 rounded-2xl border-2 border-purple-200 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-[10px] font-bold tracking-wider text-purple-900 whitespace-pre-line leading-tight">
                  {b.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Tagline */}
        <p className="text-center text-xs font-semibold tracking-wider text-gray-700 mb-8">
          MAIS ACESSO. &nbsp; MAIS CONEXÃO. &nbsp;{" "}
          <span className="text-purple-500">MAIS POSSIBILIDADES.</span>
        </p>

        {/* Footer logo */}
        <div className="text-center pb-10">
          <div className="inline-flex items-center gap-2">
            <svg className="w-8 h-8 text-purple-700" viewBox="0 0 48 48" fill="none">
              <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M24 12c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <div>
              <span className="text-sm font-bold tracking-wider text-purple-900">BIOHELP</span>
              <br />
              <span className="text-[8px] tracking-[0.2em] text-purple-500">NUTRITION CLUB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
