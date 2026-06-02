"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { setAnnouncementActive } from "@/lib/announcements/actions"

export function AnnouncementToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function toggle() {
    start(async () => {
      await setAnnouncementActive(id, !active)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {pending && <Loader2 className="h-3 w-3 animate-spin" />}
      {active ? "Ativo — desligar" : "Inativo — ligar"}
    </button>
  )
}
