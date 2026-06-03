"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCampaign, sendCampaign } from "@/lib/email/actions"

export function SendCampaignButton({
  id,
  recipients,
}: {
  id: string
  recipients: number
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSend() {
    const ok = window.confirm(
      `Disparar este e-mail AGORA para ${recipients} destinatário(s)? Esta ação não pode ser desfeita.`,
    )
    if (!ok) return
    setError(null)
    start(async () => {
      const res = await sendCampaign(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (!window.confirm("Excluir esta campanha (rascunho)?")) return
    start(async () => {
      const res = await deleteCampaign(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push("/admin/emails")
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onSend} disabled={pending}>
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Disparar para {recipients} destinatário{recipients === 1 ? "" : "s"}
        </Button>
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
