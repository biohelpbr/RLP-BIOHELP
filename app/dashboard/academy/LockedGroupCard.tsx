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
import { activateGroup } from "@/lib/content/group-actions"
import type { AcademyGroup } from "@/lib/content/groups"

// F-V31 — fricção positiva no nível do Grande Grupo. Fallbacks da cópia validada
// com o cliente quando o admin deixa os textos vazios.
const LOCK_DEFAULTS = {
  cta: "Quero indicar e desenvolver",
  title: "Você escolheu um novo caminho",
  body: "A partir desse momento vamos te ensinar tudo. Você quer mesmo?",
}

type LockGroup = Pick<
  AcademyGroup,
  "id" | "title" | "description" | "lock_cta_label" | "lock_modal_title" | "lock_modal_body"
>

export function LockedGroupCard({ group }: { group: LockGroup }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const ctaLabel = group.lock_cta_label?.trim() || LOCK_DEFAULTS.cta
  const modalTitle = group.lock_modal_title?.trim() || LOCK_DEFAULTS.title
  const modalBody = group.lock_modal_body?.trim() || LOCK_DEFAULTS.body

  function onActivate() {
    setError(null)
    start(async () => {
      const res = await activateGroup(group.id)
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
      <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-bh-purple-medium/10 px-2 py-0.5 text-[11px] font-medium text-bh-purple-medium">
          <Lock className="h-3 w-3" />
          Bloqueada
        </span>
        <h3 className="mt-2 font-semibold text-foreground">{group.title}</h3>
        {group.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{group.description}</p>
        )}
        <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => setOpen(true)}>
          {ctaLabel}
        </Button>
      </div>

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
