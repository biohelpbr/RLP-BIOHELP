"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { markAllAdminRead, markRead } from "@/lib/notifications/actions"
import type { NotificationRow } from "@/lib/notifications"

/**
 * F-V19 RF-10 — Sininho do admin.
 *
 * Recebe items + unreadCount via props (RSC parent faz o fetch). Dropdown
 * controlado por estado local. markRead / markAllAdminRead atualizam o
 * `read_at` no DB; refresh re-fetcha via router.refresh().
 */
interface NotificationBellProps {
  items: NotificationRow[]
  unreadCount: number
}

const fmtRelative = (iso: string): string => {
  const now = Date.now()
  const t = new Date(iso).getTime()
  const sec = Math.max(1, Math.floor((now - t) / 1000))
  if (sec < 60) return "agora"
  if (sec < 3600) return `${Math.floor(sec / 60)}min`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`
  return `${Math.floor(sec / 86400)}d`
}

export function NotificationBell({ items, unreadCount }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleMarkOne = async (id: string) => {
    setBusy(true)
    await markRead(id)
    router.refresh()
    setBusy(false)
  }

  const handleMarkAll = async () => {
    if (unreadCount === 0) return
    setBusy(true)
    await markAllAdminRead()
    router.refresh()
    setBusy(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} novas)` : ""}`}
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-bh-coral text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50">
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleMarkAll}
              disabled={busy || unreadCount === 0}
            >
              Marcar todas
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-center text-muted-foreground">
              Sem notificações por enquanto.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const unread = !n.read_at
                const Inner = (
                  <div
                    className={`px-4 py-3 hover:bg-accent/40 transition-colors ${unread ? "bg-bh-lavender-soft/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {fmtRelative(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-xs text-muted-foreground leading-snug">
                        {n.body}
                      </p>
                    )}
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => unread && handleMarkOne(n.id)}
                        className="block"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => unread && handleMarkOne(n.id)}
                        className="block w-full text-left"
                      >
                        {Inner}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
