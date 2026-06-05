"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCampaign, sendTestEmail, updateCampaign } from "@/lib/email/actions"
import { SEGMENT_LABEL, type EmailSegment } from "@/lib/email/schema"

type Counts = Record<EmailSegment, number>

const SEGMENTS: EmailSegment[] = ["all", "active", "pending", "canceled"]

/** Rascunho existente (W7): preenche o composer em modo edição. */
type DraftCampaign = { id: string; subject: string; body: string; segment: EmailSegment }

export function EmailComposer({
  counts,
  adminEmail,
  campaign,
}: {
  counts: Counts
  adminEmail: string
  campaign?: DraftCampaign
}) {
  const router = useRouter()
  const [subject, setSubject] = useState(campaign?.subject ?? "")
  const [body, setBody] = useState(campaign?.body ?? "")
  const [segment, setSegment] = useState<EmailSegment>(campaign?.segment ?? "all")
  const [testTo, setTestTo] = useState(adminEmail)
  const [error, setError] = useState<string | null>(null)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [testing, startTest] = useTransition()

  const recipients = counts[segment] ?? 0

  function onTest() {
    setError(null)
    setTestMsg(null)
    startTest(async () => {
      const res = await sendTestEmail({ subject, body, segment, to: testTo })
      if (!res.ok) setError(res.error)
      else setTestMsg(`Teste enviado para ${testTo}. Confira a caixa (e o spam).`)
    })
  }

  function onCreate() {
    setError(null)
    setTestMsg(null)
    start(async () => {
      // W7: em modo edição salva o rascunho existente em vez de criar outro.
      if (campaign) {
        const res = await updateCampaign(campaign.id, { subject, body, segment })
        if (!res.ok) {
          setError(res.error)
          return
        }
        setTestMsg("Rascunho salvo.")
        router.refresh()
        return
      }
      const res = await createCampaign({ subject, body, segment })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/admin/emails/${res.data?.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="Ex.: Live de Boas-Vindas hoje às 19h 🎥"
        />
      </div>

      <div>
        <Label htmlFor="body">Mensagem</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={"Olá!\n\nHoje às 19h tem nossa Live de Boas-Vindas...\n\nAceita HTML simples (<b>, <a href>, etc.) — quebras de linha viram parágrafos."}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Aceita HTML simples. O e-mail é embrulhado num layout com rodapé da Biohelp.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="segment">Destinatários</Label>
          <select
            id="segment"
            value={segment}
            onChange={(e) => setSegment(e.target.value as EmailSegment)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABEL[s]} ({counts[s] ?? 0})
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm font-medium text-foreground">
            {recipients} {recipients === 1 ? "destinatário" : "destinatários"} neste segmento.
          </p>
        </div>

        <div>
          <Label htmlFor="testTo">Enviar teste para</Label>
          <div className="flex gap-2">
            <Input
              id="testTo"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="voce@email.com"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onTest}
              disabled={testing || !subject || !body}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Testar"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Envie pra você antes de disparar pra base.
          </p>
        </div>
      </div>

      {testMsg && (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {testMsg}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {campaign
            ? "Salvar atualiza este rascunho — o disparo continua no botão acima."
            : "O disparo real é confirmado na próxima tela (após criar a campanha)."}
        </p>
        <Button onClick={onCreate} disabled={pending || !subject || !body}>
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {campaign ? "Salvar rascunho" : "Criar campanha"}
          {!campaign && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
