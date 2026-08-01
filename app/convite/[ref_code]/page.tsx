import Image from "next/image"
import { notFound } from "next/navigation"

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

          {/* Header: marca Creators Hub */}
          <header className="flex items-center gap-3 pt-8 pb-2">
            <Image
              src="/creators-hub-mark.svg"
              alt=""
              aria-hidden
              width={44}
              height={44}
              className="h-11 w-11"
              priority
            />
            <span className="whitespace-pre-line text-[1.35rem] font-extrabold leading-[1.05] tracking-tight text-neutral-900">
              {CONVITE_COPY.brandName}
            </span>
          </header>

          {/* Headline */}
          <h1 className="mt-12 text-3xl md:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight">
            {CONVITE_COPY.headlineLine1}
            <br />
            <span className="text-[#5B3DF5]">{CONVITE_COPY.headlineAccent}</span>
            <br />
            {CONVITE_COPY.headlineLine3}
          </h1>
        </section>

        {/* Form card */}
        <div className="relative z-10 mt-10 md:mt-6 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900">{CONVITE_COPY.formTitle}</h2>
          <p className="mt-1 text-sm text-[#5B3DF5]">{CONVITE_COPY.formSubtitle}</p>
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

        {/* Footer logo — o clube por trás do Creators Hub */}
        <div className="mt-14 flex justify-center pb-12">
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={120}
            height={34}
            className="h-6 w-auto opacity-70"
          />
        </div>
      </div>
    </div>
  )
}
