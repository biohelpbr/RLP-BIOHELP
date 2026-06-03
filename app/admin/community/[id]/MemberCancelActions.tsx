"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarX, Loader2, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminCancelImmediate, adminCancelRenewal } from "@/lib/admin/member-actions"

interface Props {
  memberId: string
  /** status legado: active | pending | inactive */
  status: string
  autoRenew: boolean | null
  expiresAt: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

export function MemberCancelActions({ memberId, status, autoRenew, expiresAt }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const isActive = status === "active"
  const renewalAlreadyOff = autoRenew === false

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string) {
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await action()
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg(okMsg)
      router.refresh()
    })
  }

  function onCancelRenewal() {
    if (!window.confirm("Cancelar a RENOVAÇÃO? O membro mantém o acesso até o fim do ciclo atual.")) return
    run(() => adminCancelRenewal(memberId), "Renovação cancelada. Acesso mantido até o fim do ciclo.")
  }

  function onCancelImmediate() {
    if (
      !window.confirm(
        "Cancelamento IMEDIATO (com estorno)? Isso corta o acesso AGORA e remove o preço de clube na Shopify. Use quando já estornou no Guru.",
      )
    )
      return
    run(() => adminCancelImmediate(memberId), "Assinatura cancelada e acesso revogado.")
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Renovação automática:{" "}
        <span className="font-medium">
          {autoRenew === false ? "Desligada" : autoRenew ? "Ligada" : "—"}
        </span>
        {" · "}Expira em: <span className="font-medium">{fmtDate(expiresAt)}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancelRenewal}
          disabled={pending || renewalAlreadyOff || !isActive}
          title={
            renewalAlreadyOff
              ? "Renovação já está desligada"
              : !isActive
              ? "Membro não está ativo"
              : undefined
          }
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarX className="mr-2 h-4 w-4" />
          )}
          Cancelar renovação
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancelImmediate}
          disabled={pending || !isActive}
          className="text-destructive hover:text-destructive"
          title={!isActive ? "Membro não está ativo" : undefined}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Ban className="mr-2 h-4 w-4" />
          )}
          Cancelar imediato (estorno)
        </Button>
      </div>

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
