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
  group_id: string
  status: "draft" | "published" | "archived"
  display_order: string
}

/**
 * F-V31 — Form de "Módulo" (trilha). Pertence a um Grande Grupo (select).
 * Sem capa e sem trava aqui — capa não existe em módulo e a trava (fricção
 * positiva) mora no Grande Grupo. Sem `trail` cria; com `trail` edita.
 */
export function TrailForm({
  trail,
  groups,
  defaultGroupId,
}: {
  trail?: ContentTrail
  groups: Array<{ id: string; title: string }>
  defaultGroupId?: string
}) {
  const router = useRouter()
  const [state, setState] = useState<FormState>({
    title: trail?.title ?? "",
    description: trail?.description ?? "",
    group_id: trail?.group_id ?? defaultGroupId ?? "",
    status: trail?.status ?? "draft",
    display_order: trail ? String(trail.display_order) : "0",
  })
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
        group_id: state.group_id || null,
        status: state.status,
        display_order: Number(state.display_order) || 0,
      }
      if (trail) {
        const res = await updateTrail(trail.id, payload)
        if (!res.ok) return setError(res.error)
        setMsg("Módulo atualizado.")
        router.refresh()
        return
      }
      const res = await createTrail({ ...payload, display_order: 9999 })
      if (!res.ok) return setError(res.error)
      router.push(`/admin/academy/${res.data?.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título do módulo</Label>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Módulo 1 — Boas-vindas (ou FEEL)"
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
          <Label htmlFor="group_id">Grande Grupo</Label>
          <select
            id="group_id"
            value={state.group_id}
            onChange={(e) => set("group_id", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— sem grupo —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
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
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">{error}</p>
      )}
      {msg && (
        <p className="text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3">{msg}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {trail ? "Salvar módulo" : "Criar módulo"}
        </Button>
      </div>
    </form>
  )
}
