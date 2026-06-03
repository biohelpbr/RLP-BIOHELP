"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminActivateMember } from "@/lib/admin/member-actions"

interface Props {
  memberId: string
  /** subscription_status v2: pending | paid | cancelled */
  subscriptionStatus: string | null
}

export function MemberActivateActions({ memberId, subscriptionStatus }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const isPaid = subscriptionStatus === "paid"

  function onActivate() {
    if (
      !window.confirm(
        "Ativar a assinatura manualmente? Marca como PAGA, estende o acesso e liga a renovação. Use para contas internas / turma de vendas criadas à mão.",
      )
    )
      return
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await adminActivateMember(memberId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg("Assinatura ativada. Para o login, gere uma senha provisória abaixo se necessário.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onActivate}
        disabled={pending || isPaid}
        title={isPaid ? "Assinatura já está paga/ativa" : undefined}
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {isPaid ? "Já está ativa" : "Ativar manualmente"}
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
