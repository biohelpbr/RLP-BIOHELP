import Image from "next/image"

import { CONVITE_COPY, CREATORS_HUB_COPY } from "@/lib/copy/convite"

import { ConviteForm } from "./ConviteForm"

/**
 * Landing de convite no visual Creators Hub (funil de renda).
 * Só é usada pelos códigos listados em `creators_hub_links.ref_codes`
 * (decisão do cliente, 28/07) — os demais convites seguem no ConviteBiohelp.
 */
export function ConviteCreatorsHub({ refCode }: { refCode: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-archivo text-neutral-900">
      <div className="relative mx-auto w-full max-w-3xl px-6 md:px-10">
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

          {/* Marca Creators Hub */}
          <header className="flex items-center gap-2.5 pt-8 pb-2">
            <Image
              src="/creators-hub-mark.svg"
              alt=""
              aria-hidden
              width={44}
              height={44}
              className="h-10 w-10"
              priority
            />
            <span className="text-[1.5rem] leading-none tracking-tight text-[#26262A]">
              <span className="font-bold">{CREATORS_HUB_COPY.brandBold}</span>
              <span className="font-light"> {CREATORS_HUB_COPY.brandLight}</span>
            </span>
          </header>

          <h1 className="mt-12 text-3xl md:text-[2.6rem] font-extrabold leading-[1.1] tracking-tight">
            {CREATORS_HUB_COPY.headlineLine1}
            <br />
            <span className="text-[#5B3DF5]">{CREATORS_HUB_COPY.headlineAccent}</span>
            <br />
            {CREATORS_HUB_COPY.headlineLine3}
          </h1>
        </section>

        {/* Form */}
        <div className="relative z-10 mt-10 md:mt-6 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
          <h2 className="text-xl font-bold text-neutral-900">{CONVITE_COPY.formTitle}</h2>
          <p className="mt-1 text-sm text-[#5B3DF5]">{CONVITE_COPY.formSubtitle}</p>
          <div className="mt-6">
            <ConviteForm refCode={refCode} />
          </div>
        </div>

        <div className="mt-5 pb-16">
          <p className="text-xs font-bold tracking-wide text-neutral-900">
            {CONVITE_COPY.securityTitle}
          </p>
        </div>
      </div>
    </div>
  )
}
