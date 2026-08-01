import Image from "next/image"
import { GraduationCap, Info, Mail, ExternalLink } from "lucide-react"

import { CONVITE_COPY } from "@/lib/copy/convite"
import { OBRIGADO_COPY } from "@/lib/copy/obrigado"
import { getCreatorsHubLinks } from "@/lib/settings/queries"

export const metadata = {
  title: "Parabéns pela compra! · Creators Hub",
}

/** Sempre lê o CMS (links editáveis no admin valem na hora). */
export const dynamic = "force-dynamic"

/** Ícone do WhatsApp (lucide não tem marca) — herda a cor via currentColor. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  )
}

const TONE = {
  orange: {
    text: "text-[#F26B22]",
    ring: "border-[#F26B22]/40",
    bubble: "bg-[#F26B22]/10 text-[#F26B22]",
    btn: "border-[#F26B22]/50 text-[#F26B22] hover:bg-[#F26B22]/5",
  },
  purple: {
    text: "text-[#5B3DF5]",
    ring: "border-[#5B3DF5]/40",
    bubble: "bg-[#5B3DF5]/10 text-[#5B3DF5]",
    btn: "border-[#5B3DF5]/50 text-[#5B3DF5] hover:bg-[#5B3DF5]/5",
  },
} as const

function StepIcon({ id, className }: { id: string; className?: string }) {
  if (id === "whatsapp") return <WhatsAppIcon className={className} />
  if (id === "plataforma") return <GraduationCap className={className} />
  return <Mail className={className} />
}

export default async function ObrigadoPage() {
  const links = await getCreatorsHubLinks()
  const hrefById: Record<string, string> = {
    email: links.email_url,
    whatsapp: links.whatsapp_group_url,
    plataforma: links.plataforma_url,
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-archivo text-neutral-900">
      <div className="relative mx-auto w-full max-w-3xl px-6 pb-16 md:px-10">
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

          {/* Marca */}
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

          <h1 className="mt-10 text-4xl md:text-[3rem] font-extrabold leading-[1.05] tracking-tight">
            {OBRIGADO_COPY.headline}
          </h1>
          <p className="mt-3 whitespace-pre-line text-lg leading-snug text-neutral-600">
            {OBRIGADO_COPY.subheadline}
          </p>

          <p className="mt-10 text-sm font-bold tracking-[0.18em] text-[#5B3DF5]">
            {OBRIGADO_COPY.stepsLabel}
          </p>
        </section>

        {/* Passos */}
        <div className="mt-6 space-y-4">
          {OBRIGADO_COPY.steps.map((step) => {
            const tone = TONE[step.tone]
            const href = hrefById[step.id] ?? ""
            return (
              <div
                key={step.id}
                className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6"
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tone.bubble}`}
                >
                  <StepIcon id={step.id} className="h-7 w-7" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className={`text-sm font-extrabold tracking-wide ${tone.text}`}>
                    {step.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{step.body}</p>
                </div>

                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-[1.5px] bg-white px-6 text-sm font-semibold transition ${tone.btn}`}
                  >
                    <StepIcon id={step.id} className="h-[18px] w-[18px]" />
                    {step.cta}
                  </a>
                ) : (
                  <span
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-[1.5px] border-neutral-200 bg-neutral-50 px-6 text-sm font-semibold text-neutral-400"
                    title="Link ainda não configurado"
                  >
                    <ExternalLink className="h-[18px] w-[18px]" />
                    {step.cta}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Nota de rodapé */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#5B3DF5]" />
          <p className="text-xs leading-relaxed text-neutral-500">{OBRIGADO_COPY.footerNote}</p>
        </div>

        {/* Clube por trás */}
        <div className="mt-12 flex justify-center">
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
