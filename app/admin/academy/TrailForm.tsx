"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTrail, updateTrail } from "@/lib/content/actions"
import type { ContentTrail } from "@/lib/content/queries"

type FormState = {
  title: string
  description: string
  cover_url: string
  group_label: string
  status: "draft" | "published" | "archived"
  access_mode: "open" | "locked"
  lock_cta_label: string
  lock_modal_title: string
  lock_modal_body: string
  display_order: string
}

const initialState: FormState = {
  title: "",
  description: "",
  cover_url: "",
  group_label: "",
  status: "draft",
  access_mode: "open",
  lock_cta_label: "",
  lock_modal_title: "",
  lock_modal_body: "",
  display_order: "0",
}

// F-V27: fallbacks da trava — viram placeholder no form e default no membro
// quando o admin deixa em branco. Cópia validada pelo cliente (10/06).
const LOCK_DEFAULTS = {
  cta: "Quero indicar e desenvolver",
  title: "Você escolheu um novo caminho",
  body: "A partir desse momento vamos te ensinar tudo. Você quer mesmo?",
}

/**
 * Form de trilha. Sem `trail` cria (W6: também serve pra EDITAR a trilha
 * existente no detalhe — call 05/06, CMS completo).
 * `groupSuggestions`: grupos já usados, viram sugestões no campo de grupo.
 */
export function TrailForm({
  trail,
  groupSuggestions = [],
}: {
  trail?: ContentTrail
  groupSuggestions?: string[]
}) {
  const router = useRouter()
  const [state, setState] = useState<FormState>(
    trail
      ? {
          title: trail.title,
          description: trail.description ?? "",
          cover_url: trail.cover_url ?? "",
          group_label: trail.group_label ?? "",
          status: trail.status,
          access_mode: trail.access_mode ?? "open",
          lock_cta_label: trail.lock_cta_label ?? "",
          lock_modal_title: trail.lock_modal_title ?? "",
          lock_modal_body: trail.lock_modal_body ?? "",
          display_order: String(trail.display_order),
        }
      : initialState,
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
      const payload = {
        title: state.title.trim(),
        description: state.description.trim() || null,
        cover_url: state.cover_url.trim() || null,
        group_label: state.group_label.trim() || null,
        status: state.status,
        access_mode: state.access_mode,
        // Trava só guarda texto quando travada; aberta limpa os campos.
        lock_cta_label: state.access_mode === "locked" ? state.lock_cta_label.trim() || null : null,
        lock_modal_title: state.access_mode === "locked" ? state.lock_modal_title.trim() || null : null,
        lock_modal_body: state.access_mode === "locked" ? state.lock_modal_body.trim() || null : null,
        display_order: Number(state.display_order) || 0,
      }
      if (trail) {
        const res = await updateTrail(trail.id, payload)
        if (!res.ok) {
          setError(res.error)
          return
        }
        setMsg("Trilha atualizada.")
        router.refresh()
        return
      }
      // Trilha nova entra no FIM da lista (reordenar depois pelos botões ↑/↓).
      const res = await createTrail({ ...payload, display_order: 9999 })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/admin/academy/${res.data?.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Suplementação inteligente — 5 vídeos"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={state.description}
          onChange={(e) => set("description", e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div>
        <Label htmlFor="group_label">Grande grupo</Label>
        <Input
          id="group_label"
          value={state.group_label}
          onChange={(e) => set("group_label", e.target.value)}
          placeholder="Consumo e Rotina"
          list="group-suggestions"
        />
        {groupSuggestions.length > 0 && (
          <datalist id="group-suggestions">
            {groupSuggestions.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Trilhas com o mesmo grupo aparecem juntas na Academy da parceira. Vazio = seção
          &quot;Geral&quot;.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cover_url">URL da capa</Label>
          <Input
            id="cover_url"
            value={state.cover_url}
            onChange={(e) => set("cover_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={state.status}
            onChange={(e) => set("status", e.target.value as FormState["status"])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
            <option value="archived">Arquivada</option>
          </select>
        </div>
      </div>

      {/* F-V27: acesso da trilha — aberta (entra direto) vs travada (fricção positiva). */}
      <div className="space-y-3 rounded-md border border-input p-4">
        <Label>Acesso</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="access_mode"
              value="open"
              checked={state.access_mode === "open"}
              onChange={() => set("access_mode", "open")}
            />
            Aberta — a parceira entra direto
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="access_mode"
              value="locked"
              checked={state.access_mode === "locked"}
              onChange={() => set("access_mode", "locked")}
            />
            Travada — fricção positiva (ativação por parceira)
          </label>
        </div>

        {state.access_mode === "locked" && (
          <div className="space-y-3 border-t border-input pt-3">
            <p className="text-xs text-muted-foreground">
              Cada parceira vê o card bloqueado, abre o modal e ativa pra ela mesma. Vazio = usa o
              texto padrão.
            </p>
            <div>
              <Label htmlFor="lock_cta_label">Texto do botão (card bloqueado)</Label>
              <Input
                id="lock_cta_label"
                value={state.lock_cta_label}
                onChange={(e) => set("lock_cta_label", e.target.value)}
                placeholder={LOCK_DEFAULTS.cta}
              />
            </div>
            <div>
              <Label htmlFor="lock_modal_title">Título do modal</Label>
              <Input
                id="lock_modal_title"
                value={state.lock_modal_title}
                onChange={(e) => set("lock_modal_title", e.target.value)}
                placeholder={LOCK_DEFAULTS.title}
              />
            </div>
            <div>
              <Label htmlFor="lock_modal_body">Texto do modal</Label>
              <textarea
                id="lock_modal_body"
                value={state.lock_modal_body}
                onChange={(e) => set("lock_modal_body", e.target.value)}
                placeholder={LOCK_DEFAULTS.body}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </p>
      )}
      {msg && (
        <p className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3">
          {msg}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {trail ? "Salvar trilha" : "Criar trilha"}
        </Button>
      </div>
    </form>
  )
}
