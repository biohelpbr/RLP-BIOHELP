"use client"

import { useState, useTransition } from "react"
import { KeyRound, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminGenerateProvisionalPassword } from "@/lib/admin/member-actions"

interface Props {
  memberId: string
}

export function MemberPasswordActions({ memberId }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  function onGenerate() {
    if (
      !window.confirm(
        "Gerar uma SENHA PROVISÓRIA para este membro? A senha aparecerá aqui pra você copiar e também será enviada por e-mail. No primeiro acesso o membro será obrigado a trocar.",
      )
    )
      return
    setError(null)
    setPassword(null)
    setCopied(false)
    start(async () => {
      const res = await adminGenerateProvisionalPassword(memberId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPassword(res.password)
      setEmailSent(res.emailSent)
    })
  }

  async function onCopy() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard pode falhar em http; o admin ainda lê a senha na tela
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={onGenerate} disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="mr-2 h-4 w-4" />
        )}
        Gerar senha provisória
      </Button>

      {password && (
        <div className="space-y-2 rounded-md border border-primary/30 bg-primary/10 p-3">
          <p className="text-xs text-muted-foreground">
            Senha provisória (mostrada só agora — copie e repasse):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-base font-semibold tracking-wide">
              {password}
            </code>
            <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {emailSent
              ? "✅ Também enviada por e-mail."
              : "⚠️ Não foi possível enviar por e-mail — repasse manualmente."}{" "}
            No primeiro acesso o membro troca a senha.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
