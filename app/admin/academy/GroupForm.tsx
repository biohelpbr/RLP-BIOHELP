"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGroup, updateGroup } from "@/lib/content/group-actions"
import type { AcademyGroup } from "@/lib/content/groups"

type FormState = {
  title: string
  description: string
  banner_url: string
  access_mode: "open" | "locked"
  lock_cta_label: string
  lock_modal_title: string
  lock_modal_body: string
}

const initial: FormState = {
  title: "",
  description: "",
  banner_url: "",
  access_mode: "open",
  lock_cta_label: "",
  lock_modal_title: "",
  lock_modal_body: "",
}

// Fallbacks da trava (placeholder no form e default no membro se vazio).
const LOCK_DEFAULTS = {
  cta: "Quero indicar e desenvolver",
  title: "Você escolheu um novo caminho",
  body: "A partir desse momento vamos te ensinar tudo. Você quer mesmo?",
}

/** F-V31 — cria/edita um Grande Grupo (camada da Academy). */
export function GroupForm({ group }: { group?: AcademyGroup }) {
  const router = useRouter()
  const [state, setState] = useState<FormState>(
    group
      ? {
          title: group.title,
          description: group.description ?? "",
          banner_url: group.banner_url ?? "",
          access_mode: group.access_mode ?? "open",
          lock_cta_label: group.lock_cta_label ?? "",
          lock_modal_title: group.lock_modal_title ?? "",
          lock_modal_body: group.lock_modal_body ?? "",
        }
      : initial,
  )
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMsg(null)
    start(async () => {
      const locked = state.access_mode === "locked"
      const payload = {
        title: state.title.trim(),
        description: state.description.trim() || null,
        banner_url: state.banner_url.trim() || null,
        access_mode: state.access_mode,
        lock_cta_label: locked ? state.lock_cta_label.trim() || null : null,
        lock_modal_title: locked ? state.lock_modal_title.trim() || null : null,
        lock_modal_body: locked ? state.lock_modal_body.trim() || null : null,
      }
      if (group) {
        const res = await updateGroup(group.id, payload)
        if (!res.ok) return setError(res.error)
        setMsg("Grupo atualizado.")
        router.refresh()
        return
      }
      const res = await createGroup({ ...payload, display_order: 9999 })
      if (!res.ok) return setError(res.error)
      router.push("/admin/academy")
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="g-title">Título</Label>
        <Input
          id="g-title"
          value={state.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Consumir e usar"
          required
        />
      </div>
      <div>
        <Label htmlFor="g-desc">Descrição</Label>
        <textarea
          id="g-desc"
          value={state.description}
          onChange={(e) => set("description", e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Tudo começa pelo consumo com consistência..."
        />
      </div>
      <div>
        <Label htmlFor="g-banner">Banner (URL da imagem) — opcional</Label>
        <Input
          id="g-banner"
          value={state.banner_url}
          onChange={(e) => set("banner_url", e.target.value)}
          placeholder="https://... (ex.: arte do calendário do mês)"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Aparece no topo do grupo. Bom pra publicar o calendário dos encontros ao vivo.
        </p>
        {state.banner_url.trim() && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.banner_url.trim()}
            alt="Prévia do banner"
            className="mt-2 max-h-40 w-full rounded-lg border border-border object-cover"
          />
        )}
      </div>

      <div className="space-y-3 rounded-md border border-input p-4">
        <Label>Acesso</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name="g-access" checked={state.access_mode === "open"} onChange={() => set("access_mode", "open")} />
            Aberto — a parceira entra direto
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="radio" name="g-access" checked={state.access_mode === "locked"} onChange={() => set("access_mode", "locked")} />
            Travado — fricção positiva (ativação por parceira)
          </label>
        </div>
        {state.access_mode === "locked" && (
          <div className="space-y-3 border-t border-input pt-3">
            <p className="text-xs text-muted-foreground">Vazio = usa o texto padrão.</p>
            <div>
              <Label htmlFor="g-cta">Texto do botão</Label>
              <Input id="g-cta" value={state.lock_cta_label} onChange={(e) => set("lock_cta_label", e.target.value)} placeholder={LOCK_DEFAULTS.cta} />
            </div>
            <div>
              <Label htmlFor="g-mtitle">Título do modal</Label>
              <Input id="g-mtitle" value={state.lock_modal_title} onChange={(e) => set("lock_modal_title", e.target.value)} placeholder={LOCK_DEFAULTS.title} />
            </div>
            <div>
              <Label htmlFor="g-mbody">Texto do modal</Label>
              <textarea
                id="g-mbody"
                value={state.lock_modal_body}
                onChange={(e) => set("lock_modal_body", e.target.value)}
                placeholder={LOCK_DEFAULTS.body}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">{error}</p>}
      {msg && <p className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3">{msg}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {group ? "Salvar grupo" : "Criar grupo"}
        </Button>
      </div>
    </form>
  )
}
