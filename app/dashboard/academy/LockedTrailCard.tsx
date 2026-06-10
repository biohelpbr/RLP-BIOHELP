"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BHCard } from "@/components/biohelp"
import { activateTrail } from "@/lib/content/actions"
import type { ContentTrail } from "@/lib/content/queries"

// F-V27 — fricção positiva: card "Bloqueada" + modal de escolha consciente.
// Fallbacks da cópia validada com o cliente (10/06) quando o admin deixa vazio.
const LOCK_DEFAULTS = {
  cta: "Quero indicar e desenvolver",
  title: "Você escolheu um novo caminho",
  body: "A partir desse momento vamos te ensinar tudo. Você quer mesmo?",
}

type LockTrail = Pick<
  ContentTrail,
  "id" | "title" | "description" | "lock_cta_label" | "lock_modal_title" | "lock_modal_body"
>

export function LockedTrailCard({ trail }: { trail: LockTrail }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const ctaLabel = trail.lock_cta_label?.trim() || LOCK_DEFAULTS.cta
  const modalTitle = trail.lock_modal_title?.trim() || LOCK_DEFAULTS.title
  const modalBody = trail.lock_modal_body?.trim() || LOCK_DEFAULTS.body

  function onActivate() {
    setError(null)
    start(async () => {
      const res = await activateTrail(trail.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <BHCard variant="elevated" className="flex h-full flex-col overflow-hidden p-0">
        <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-bh-purple-medium/15 to-accent/20">
          <Lock className="h-9 w-9 text-bh-purple-medium/50" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-bh-purple-medium/10 px-2 py-0.5 text-[11px] font-medium text-bh-purple-medium">
            <Lock className="h-3 w-3" />
            Bloqueada
          </span>
          <h3 className="font-semibold text-foreground line-clamp-2">{trail.title}</h3>
          {trail.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{trail.description}</p>
          )}
          <Button type="button" className="mt-3 w-full" onClick={() => setOpen(true)}>
            {ctaLabel}
          </Button>
        </div>
      </BHCard>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap pt-1 text-base">
              {modalBody}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Voltar
            </Button>
            <Button type="button" onClick={onActivate} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Quero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
