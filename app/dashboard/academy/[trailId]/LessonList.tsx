"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ExternalLink, FileDigit, FileText, Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { markView } from "@/lib/content/actions"
import { youtubeEmbedUrl, youtubeThumbUrl } from "@/lib/content/youtube"
import type { ContentModule } from "@/lib/content/queries"

const KIND_LABEL: Record<ContentModule["kind"], string> = {
  youtube: "Vídeo",
  pdf: "Material",
  text: "Texto",
}

function lessonMeta(m: ContentModule): string {
  const parts: string[] = [KIND_LABEL[m.kind]]
  if (m.duration_minutes) parts.unshift(`${m.duration_minutes} min`)
  return parts.join(" · ")
}

/**
 * Academy UX 05/06 — lista compacta de aulas (estilo "Comece por aqui"):
 * thumbnail + título + duração + status, com o player num modal reduzido
 * em vez de vídeos embedados em tamanho cheio na página.
 */
export function LessonList({
  modules,
  completedIds,
}: {
  modules: ContentModule[]
  completedIds: string[]
}) {
  const router = useRouter()
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedIds))
  const [openModule, setOpenModule] = useState<ContentModule | null>(null)
  const [pending, start] = useTransition()

  // Registra started_at quando a aula abre (idempotente — mesmo contrato do markView antigo).
  useEffect(() => {
    if (openModule) void markView(openModule.id, false)
  }, [openModule])

  function markComplete(moduleId: string) {
    start(async () => {
      const res = await markView(moduleId, true)
      if (res.ok) {
        setCompleted((prev) => new Set(prev).add(moduleId))
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card bh-shadow-lg divide-y divide-border overflow-hidden">
        {modules.map((m) => {
          const done = completed.has(m.id)
          const thumb = m.kind === "youtube" ? youtubeThumbUrl(m.content_url) : null
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenModule(m)}
              className="group flex w-full items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50"
            >
              <div className="relative w-24 sm:w-32 aspect-video shrink-0 overflow-hidden rounded-lg bg-muted">
                {thumb ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 transition-colors group-hover:bg-primary/90">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                    {m.kind === "pdf" ? (
                      <FileDigit className="h-6 w-6 text-primary/60" />
                    ) : (
                      <FileText className="h-6 w-6 text-primary/60" />
                    )}
                  </span>
                )}
                {done && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-bh-lime shadow-sm">
                    <Check className="h-3 w-3 text-bh-purple-deep" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-medium text-sm sm:text-base text-foreground line-clamp-2">
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground">{lessonMeta(m)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {done && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-bh-lime-soft px-2.5 py-0.5 text-xs font-medium text-bh-purple-deep">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    Assistido
                  </span>
                )}
                <span
                  className={
                    done
                      ? "inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs sm:text-sm font-medium text-foreground transition-colors group-hover:bg-accent"
                      : "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs sm:text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/90"
                  }
                >
                  {done ? "Revisar" : "Assistir"}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <Dialog open={!!openModule} onOpenChange={(open) => !open && setOpenModule(null)}>
        <DialogContent className="sm:max-w-3xl">
          {openModule && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{openModule.title}</DialogTitle>
                <DialogDescription>{lessonMeta(openModule)}</DialogDescription>
              </DialogHeader>

              {openModule.kind === "youtube" && openModule.content_url && (
                (() => {
                  const embed = youtubeEmbedUrl(openModule.content_url)
                  return embed ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                      <iframe
                        src={`${embed}?autoplay=1`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title={openModule.title}
                      />
                    </div>
                  ) : (
                    <a
                      href={openModule.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir vídeo no YouTube
                    </a>
                  )
                })()
              )}

              {openModule.kind === "pdf" && openModule.content_url && (
                <a
                  href={openModule.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {/* W6: kind "pdf" também cobre links externos (ex.: gravação no Drive). */}
                  {openModule.content_url.toLowerCase().includes(".pdf")
                    ? "Abrir PDF"
                    : "Abrir conteúdo"}
                </a>
              )}

              {openModule.kind === "text" && openModule.content_text && (
                <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground">
                  {openModule.content_text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                {completed.has(openModule.id) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-bh-lime-soft px-3 py-1 text-sm font-medium text-bh-purple-deep">
                    <Check className="h-4 w-4" strokeWidth={3} />
                    Assistido
                  </span>
                ) : (
                  <Button
                    onClick={() => markComplete(openModule.id)}
                    disabled={pending}
                    size="sm"
                  >
                    {pending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Marcar como assistido
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
