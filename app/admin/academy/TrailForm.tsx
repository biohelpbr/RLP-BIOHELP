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
  status: "draft" | "published" | "archived"
  display_order: string
}

const initialState: FormState = {
  title: "",
  description: "",
  cover_url: "",
  status: "draft",
  display_order: "0",
}

/**
 * Form de trilha. Sem `trail` cria (W6: também serve pra EDITAR a trilha
 * existente no detalhe — call 05/06, CMS completo).
 */
export function TrailForm({ trail }: { trail?: ContentTrail }) {
  const router = useRouter()
  const [state, setState] = useState<FormState>(
    trail
      ? {
          title: trail.title,
          description: trail.description ?? "",
          cover_url: trail.cover_url ?? "",
          status: trail.status,
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
        status: state.status,
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
