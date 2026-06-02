import { ExternalLink, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnnouncementRow } from "@/lib/announcements/queries"

const VARIANT_STYLES: Record<AnnouncementRow["variant"], string> = {
  coral: "bg-bh-coral text-white border-bh-coral",
  primary: "bg-primary text-primary-foreground border-primary",
  accent: "bg-accent text-accent-foreground border-accent",
}

const CTA_STYLES: Record<AnnouncementRow["variant"], string> = {
  coral: "bg-white text-bh-coral hover:bg-white/90",
  primary: "bg-white text-primary hover:bg-white/90",
  accent: "bg-foreground text-background hover:bg-foreground/90",
}

/**
 * F-V22 — Aviso fixo no topo do dashboard do membro.
 *
 * Server Component (sem estado, não-fechável por decisão de produto — Matt:
 * "ao invés de popup q a pessoa fecha no instinto"). Conteúdo vem do CMS
 * (/admin/announcements).
 *
 * Dois modos:
 *  - COM imagem → banner em destaque (imagem completa, clicável) + faixa de CTA.
 *  - SEM imagem → barra de texto colorida com ícone + CTA opcional.
 */
export function AnnouncementBar({ announcement }: { announcement: AnnouncementRow }) {
  const { message, image_url, link_url, cta_label, variant } = announcement
  const hasCta = !!link_url && link_url.trim().length > 0
  const ctaText = cta_label?.trim() || "Saber mais"

  // --- Modo banner (com imagem) ---
  if (image_url) {
    // Responsivo: a imagem ocupa 100% da largura e a ALTURA segue um aspect-ratio
    // por breakpoint (mais alto no mobile → quase sem corte; mais baixo/wide no
    // desktop). object-cover + object-center mantém o título sempre visível.
    // width/height evitam layout shift (CLS).
    const banner = (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage)
      <img
        src={image_url}
        alt={message}
        width={1770}
        height={967}
        className="block w-full object-cover aspect-[2/1] sm:aspect-[12/5] lg:aspect-[7/2]"
        style={{ objectPosition: "center 58%" }}
      />
    )
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-neutral-900 bh-shadow-md">
        {hasCta ? (
          <a href={link_url!} target="_blank" rel="noopener noreferrer" className="block">
            {banner}
          </a>
        ) : (
          banner
        )}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
            VARIANT_STYLES[variant],
          )}
        >
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug sm:text-[0.95rem]">
            {message}
          </p>
          {hasCta && (
            <a
              href={link_url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                CTA_STYLES[variant],
              )}
            >
              {ctaText}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    )
  }

  // --- Modo barra de texto (sem imagem) ---
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 bh-shadow-md sm:flex-nowrap",
        VARIANT_STYLES[variant],
      )}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
        <Megaphone className="h-5 w-5" />
      </span>

      <p className="min-w-0 flex-1 text-sm font-medium leading-snug sm:text-[0.95rem]">
        {message}
      </p>

      {hasCta && (
        <a
          href={link_url!}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            CTA_STYLES[variant],
          )}
        >
          {ctaText}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}
