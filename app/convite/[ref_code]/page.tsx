import Image from "next/image"
import { notFound } from "next/navigation"
import { User } from "lucide-react"

import { createServiceClient } from "@/lib/supabase/server"
import { CONVITE_COPY } from "@/lib/copy/convite"

import { ConviteForm } from "./ConviteForm"

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

  const sponsorName = (sponsor.name as string | null) ?? "alguém especial"

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-archivo text-neutral-900">
      <div className="relative mx-auto w-full max-w-3xl px-6 md:px-10">
        {/* ===== HERO (gradiente atrás do título) ===== */}
        <section className="relative isolate">
          <Image
            src="/bg-1.jpg"
            alt=""
            aria-hidden
            width={1100}
            height={800}
            priority
            className="pointer-events-none absolute -top-28 left-1/2 -z-10 w-[min(120vw,1100px)] max-w-none -translate-x-1/2 mix-blend-multiply select-none"
          />

          {/* Header: logo + topbar */}
          <header className="flex items-center justify-between pt-8 pb-2">
            <Image
              src="/logo-oficial.png"
              alt="Biohelp Nutrition Club"
              width={140}
              height={40}
              className="h-7 w-auto"
              priority
            />
            <span className="hidden sm:block text-[11px] font-semibold tracking-[0.15em] text-neutral-800">
              {CONVITE_COPY.topBar}
            </span>
          </header>

          {/* Headline */}
          <h1 className="mt-12 text-3xl md:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight">
            {CONVITE_COPY.headlineLine1}
            <br />
            {CONVITE_COPY.headlineLine2}
            <br />
            {CONVITE_COPY.headlineLine3pre}
            <span className="text-blue-600">{CONVITE_COPY.headlineLine3accent}</span>
          </h1>

          {/* Sponsor badge */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border-[1.5px] border-neutral-900 bg-white/70 py-2.5 pl-2.5 pr-6 backdrop-blur-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700">
              <User className="h-5 w-5 text-white" />
            </span>
            <span className="text-sm text-neutral-700">
              {CONVITE_COPY.sponsorPrefix}{" "}
              <strong className="font-bold text-blue-700">{sponsorName}</strong>
            </span>
          </div>
        </section>

        {/* Form card */}
        <div className="relative z-10 mt-10 md:mt-6 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900">{CONVITE_COPY.formTitle}</h2>
          <p className="mt-1 text-sm text-blue-500">{CONVITE_COPY.formSubtitle}</p>
          <div className="mt-6">
            <ConviteForm refCode={sponsor.ref_code as string} />
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-5">
          <p className="text-xs font-bold tracking-wide text-neutral-900">
            {CONVITE_COPY.securityTitle}
          </p>
        </div>

        {/* ===== BENEFÍCIOS (gradiente atrás do headline + ícones) ===== */}
        <section className="relative isolate mt-20">
          <Image
            src="/bg-2.jpg"
            alt=""
            aria-hidden
            width={1100}
            height={800}
            className="pointer-events-none absolute -top-16 left-1/2 -z-10 w-[min(120vw,1100px)] max-w-none -translate-x-1/2 mix-blend-multiply select-none"
          />

          {/* Bottom headline */}
          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
            {CONVITE_COPY.bottomHeadline}
            <br />
            <span className="text-blue-600">{CONVITE_COPY.bottomHighlight}</span>
          </h2>

          {/* Benefits grid */}
          <div className="mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-neutral-200">
            {CONVITE_COPY.benefits.map((b) => (
              <div key={b.img} className="flex flex-col items-center px-4 text-center">
                <Image
                  src={b.img}
                  alt={b.title.replace("\n", " ")}
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                />
                <p className="mt-3 whitespace-pre-line text-base font-extrabold leading-tight text-neutral-900">
                  {b.title}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[10px] font-semibold leading-tight tracking-wide text-neutral-500">
                  {b.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tagline */}
        <p className="mt-16 text-center text-xs font-bold tracking-[0.1em] text-neutral-800">
          {CONVITE_COPY.footerTaglinePre}
          <span className="text-blue-600">{CONVITE_COPY.footerTaglineAccent}</span>
        </p>

        {/* Footer logo */}
        <div className="mt-8 flex justify-center pb-12">
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={120}
            height={34}
            className="h-6 w-auto"
          />
        </div>
      </div>
    </div>
  )
}
