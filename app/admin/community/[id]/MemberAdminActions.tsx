"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminSetAdminRole } from "@/lib/admin/member-actions"

interface Props {
  memberId: string
  isAdmin: boolean
  /** true quando o detalhe aberto é o próprio admin logado (não pode se revogar). */
  isSelf: boolean
}

/**
 * W2 (call 05/06) — conceder/revogar acesso admin pela UI, sem SQL na mão.
 */
export function MemberAdminActions({ memberId, isAdmin, isSelf }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onToggle() {
    const confirmText = isAdmin
      ? "Remover o acesso ADMIN deste membro? Ele volta a ver apenas o painel comum."
      : "Conceder acesso ADMIN a este membro? Ele passa a ver e editar TODO o painel administrativo."
    if (!window.confirm(confirmText)) return
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await adminSetAdminRole(memberId, !isAdmin)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg(isAdmin ? "Acesso admin removido." : "Acesso admin concedido.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={isAdmin ? "destructive" : "outline"}
        size="sm"
        onClick={onToggle}
        disabled={pending || (isAdmin && isSelf)}
        title={isAdmin && isSelf ? "Você não pode remover o seu próprio acesso admin" : undefined}
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isAdmin ? (
          <ShieldOff className="mr-2 h-4 w-4" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {isAdmin ? "Remover acesso admin" : "Tornar admin"}
      </Button>

      {msg && (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-2 text-sm text-primary">{msg}</p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
