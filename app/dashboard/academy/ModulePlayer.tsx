"use client"

import { useEffect, useTransition } from "react"
import { Check, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markView } from "@/lib/content/actions"
import type { ContentModule } from "@/lib/content/queries"

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "")
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v")
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    return null
  } catch {
    return null
  }
}

export function ModulePlayer({
  module,
  alreadyCompleted,
}: {
  module: ContentModule
  alreadyCompleted: boolean
}) {
  const [pending, start] = useTransition()

  // Marca started_at no primeiro mount (idempotente).
  useEffect(() => {
    void markView(module.id, false)
  }, [module.id])

  function markComplete() {
    start(async () => {
      await markView(module.id, true)
    })
  }

  return (
    <div className="space-y-3">
      {module.kind === "youtube" && module.content_url && (
        <>
          {(() => {
            const embed = youtubeEmbed(module.content_url)
            return embed ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                <iframe
                  src={embed}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={module.title}
                />
              </div>
            ) : (
              <a
                href={module.content_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir vídeo no YouTube
              </a>
            )
          })()}
        </>
      )}

      {module.kind === "pdf" && module.content_url && (
        <a
          href={module.content_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {/* W6: kind "pdf" também cobre links externos (ex.: gravação no Drive). */}
          {module.content_url.toLowerCase().includes(".pdf") ? "Abrir PDF" : "Abrir conteúdo"}
        </a>
      )}

      {module.kind === "text" && module.content_text && (
        <div className="rounded-md border border-border bg-muted/30 p-3 whitespace-pre-wrap text-sm text-foreground">
          {module.content_text}
        </div>
      )}

      {!alreadyCompleted && (
        <Button onClick={markComplete} disabled={pending} variant="outline" size="sm">
          {pending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Marcar como visto
        </Button>
      )}
    </div>
  )
}
