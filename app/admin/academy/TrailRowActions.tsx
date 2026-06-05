"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTrail, moveTrail } from "@/lib/content/actions"

interface Props {
  trailId: string
  trailTitle: string
  isFirst: boolean
  isLast: boolean
}

/**
 * W6 (call 05/06) — reordenar (↑/↓) e excluir trilha direto na lista.
 */
export function TrailRowActions({ trailId, trailTitle, isFirst, isLast }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onMove(direction: "up" | "down") {
    setError(null)
    start(async () => {
      const res = await moveTrail(trailId, direction)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (
      !window.confirm(
        `Excluir a trilha "${trailTitle}"? Todas as aulas dela somem do painel das parceiras. Essa ação não pode ser desfeita.`,
      )
    )
      return
    setError(null)
    start(async () => {
      const res = await deleteTrail(trailId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onMove("up")}
        disabled={pending || isFirst}
        aria-label="Subir trilha"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onMove("down")}
        disabled={pending || isLast}
        aria-label="Descer trilha"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onDelete}
        disabled={pending}
        aria-label="Excluir trilha"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
