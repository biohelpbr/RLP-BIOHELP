"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteGroup, moveGroup } from "@/lib/content/group-actions"

interface Props {
  groupId: string
  groupTitle: string
  trailsCount: number
  isFirst: boolean
  isLast: boolean
}

/** F-V31 — reordenar (↑/↓) e excluir Grande Grupo no CMS. */
export function GroupRowActions({ groupId, groupTitle, trailsCount, isFirst, isLast }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function onMove(direction: "up" | "down") {
    start(async () => {
      const res = await moveGroup(groupId, direction)
      if (res.ok) router.refresh()
    })
  }

  function onDelete() {
    const extra = trailsCount > 0 ? ` As ${trailsCount} trilha(s) ficam sem grupo (não são apagadas).` : ""
    if (!window.confirm(`Excluir o grupo "${groupTitle}"?${extra}`)) return
    start(async () => {
      const res = await deleteGroup(groupId)
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("up")} disabled={pending || isFirst} aria-label="Subir grupo">
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("down")} disabled={pending || isLast} aria-label="Descer grupo">
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} disabled={pending} aria-label="Excluir grupo">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
