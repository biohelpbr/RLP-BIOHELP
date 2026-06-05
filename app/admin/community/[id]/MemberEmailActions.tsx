"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminUpdateMemberEmail } from "@/lib/admin/member-actions"

interface Props {
  memberId: string
  currentEmail: string
}

/**
 * W3 (call 05/06, pedido Gabriel) — alterar o e-mail do membro pelo admin.
 * Caso típico: parceira assinou no Guru com e-mail digitado errado e não
 * consegue logar (ex.: Elaine Violini, resolvida via SQL em 03/06).
 */
export function MemberEmailActions({ memberId, currentEmail }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSave() {
    const next = email.toLowerCase().trim()
    if (!next) return
    if (
      !window.confirm(
        `Alterar o e-mail de ${currentEmail} para ${next}? O membro passa a logar (código ou senha) com o NOVO e-mail.`,
      )
    )
      return
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await adminUpdateMemberEmail(memberId, next)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg(`E-mail alterado para ${next}.`)
      setEmail("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="novo@email.com"
          className="sm:max-w-xs"
          aria-label="Novo e-mail"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={pending || !email.trim()}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Alterar e-mail
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
