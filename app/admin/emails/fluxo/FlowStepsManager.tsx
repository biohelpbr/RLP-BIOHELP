"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Save, Send, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BHCard } from "@/components/biohelp"
import {
  createFlowStep,
  updateFlowStep,
  deleteFlowStep,
  toggleFlowStep,
  sendFlowStepTest,
} from "@/lib/email/flow-actions"
import type { FlowStep } from "@/lib/email/flow"

type Draft = { step_order: string; delay_days: string; subject: string; body: string }

const emptyDraft = (nextOrder: number): Draft => ({
  step_order: String(nextOrder),
  delay_days: "",
  subject: "",
  body: "",
})

function delayLabel(d: number): string {
  if (d === 0) return "D+0 (na entrada)"
  return `D+${d} (${d} ${d === 1 ? "dia" : "dias"} depois)`
}

export function FlowStepsManager({ steps }: { steps: FlowStep[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft(1))
  const [error, setError] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState("")
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const nextOrder = (steps.reduce((max, s) => Math.max(max, s.step_order), 0) || 0) + 1

  function sendTest(s: FlowStep) {
    setTestMsg(null)
    if (!testEmail.trim()) {
      setTestMsg("Digite um e-mail pra receber o teste.")
      return
    }
    setTestingId(s.id)
    startTransition(async () => {
      const res = await sendFlowStepTest({ stepId: s.id, to: testEmail.trim() })
      setTestingId(null)
      setTestMsg(res.ok ? `✅ Passo ${s.step_order} enviado pra ${testEmail.trim()}.` : `❌ ${res.error}`)
    })
  }

  function openAdd() {
    setDraft(emptyDraft(nextOrder))
    setError(null)
    setAdding(true)
    setEditingId(null)
  }

  function openEdit(s: FlowStep) {
    setDraft({
      step_order: String(s.step_order),
      delay_days: String(s.delay_days),
      subject: s.subject,
      body: s.body,
    })
    setError(null)
    setEditingId(s.id)
    setAdding(false)
  }

  function close() {
    setAdding(false)
    setEditingId(null)
    setError(null)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const payload = {
        step_order: draft.step_order,
        delay_days: draft.delay_days === "" ? 0 : draft.delay_days,
        subject: draft.subject,
        body: draft.body,
      }
      const res = editingId
        ? await updateFlowStep(editingId, payload)
        : await createFlowStep(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      close()
      router.refresh()
    })
  }

  function remove(id: string) {
    if (!confirm("Remover este passo do fluxo? O conteúdo será perdido.")) return
    startTransition(async () => {
      const res = await deleteFlowStep(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function toggle(s: FlowStep) {
    startTransition(async () => {
      const res = await toggleFlowStep(s.id, !s.enabled)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const editor = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="step_order">Ordem</Label>
          <Input
            id="step_order"
            type="number"
            min={1}
            value={draft.step_order}
            onChange={(e) => setDraft((d) => ({ ...d, step_order: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="delay_days">Delay (dias após virar assinante)</Label>
          <Input
            id="delay_days"
            type="number"
            min={0}
            placeholder="0 = na entrada"
            value={draft.delay_days}
            onChange={(e) => setDraft((d) => ({ ...d, delay_days: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={draft.subject}
          onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="body">Corpo do e-mail</Label>
        <textarea
          id="body"
          rows={10}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Texto simples ou HTML. Quebras de linha viram <br>. Use {{unsubscribe}} pra inserir o link de descadastro onde quiser (senão ele vai no rodapé)."
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending} className="inline-flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar passo
        </Button>
        <Button variant="outline" onClick={close} disabled={pending}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Barra de teste: digite um e-mail e clique "Testar" em qualquer passo. */}
      {steps.length > 0 && (
        <BHCard variant="elevated">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="test-email">Testar os e-mails</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="seu@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite um e-mail e clique em <strong>Testar</strong> em cada passo abaixo — ele chega
              na hora, sem afetar nenhum assinante.
            </p>
          </div>
          {testMsg && <p className="mt-2 text-sm text-foreground">{testMsg}</p>}
        </BHCard>
      )}

      {steps.length === 0 && !adding && (
        <BHCard variant="elevated">
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum passo ainda. Adicione o primeiro (D+0 = boas-vindas na entrada).
          </p>
        </BHCard>
      )}

      {steps.map((s) =>
        editingId === s.id ? (
          <BHCard key={s.id} variant="elevated">
            {editor}
          </BHCard>
        ) : (
          <BHCard key={s.id} variant="elevated">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Passo {s.step_order}</Badge>
                  <Badge variant={s.delay_days === 0 ? "default" : "outline"}>
                    {delayLabel(s.delay_days)}
                  </Badge>
                  {!s.enabled && <Badge variant="destructive">Desativado</Badge>}
                </div>
                <p className="mt-2 font-medium text-foreground">{s.subject}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {s.body.replace(/<[^>]+>/g, " ").slice(0, 160)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendTest(s)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5"
                >
                  {testingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Testar
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggle(s)} disabled={pending}>
                  {s.enabled ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(s)} disabled={pending}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(s.id)}
                  disabled={pending}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </BHCard>
        ),
      )}

      {adding ? (
        <BHCard variant="elevated">{editor}</BHCard>
      ) : (
        <Button variant="outline" onClick={openAdd} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar passo
        </Button>
      )}
    </div>
  )
}
