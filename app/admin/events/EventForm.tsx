"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEvent } from "@/lib/events/actions"

type FormState = {
  name: string
  description: string
  slug: string
  start_at: string
  end_at: string
  mode: "online" | "presencial" | "hibrido"
  location: string
  redirect_url: string
  cost: string
  status: "draft" | "published" | "archived"
  eligible_products_csv: string
}

const initialState: FormState = {
  name: "",
  description: "",
  slug: "",
  start_at: "",
  end_at: "",
  mode: "online",
  location: "",
  redirect_url: "",
  cost: "0",
  status: "published",
  eligible_products_csv: "",
}

function toIsoOrEmpty(local: string): string {
  if (!local) return ""
  // datetime-local fornece "YYYY-MM-DDTHH:mm" sem timezone — assume local
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

export function EventForm() {
  const router = useRouter()
  const [state, setState] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const payload = {
      name: state.name.trim(),
      description: state.description.trim() || null,
      slug: state.slug.trim().toLowerCase(),
      start_at: toIsoOrEmpty(state.start_at),
      end_at: toIsoOrEmpty(state.end_at),
      mode: state.mode,
      location: state.location.trim() || null,
      redirect_url: state.redirect_url.trim() || null,
      cost: Number(state.cost) || 0,
      status: state.status,
      eligible_product_ids: state.eligible_products_csv
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    }

    start(async () => {
      const res = await createEvent(payload)
      if (!res.ok) {
        setError(res.error)
        setFieldError(res.field || null)
        return
      }
      router.push(`/admin/events/${res.data?.id}`)
      router.refresh()
    })
  }

  const fieldHint = (name: keyof FormState) =>
    fieldError === name ? "border-destructive" : ""

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do evento</Label>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            className={fieldHint("name")}
            placeholder="Lançamento Creatina Maio"
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug do link (/r/&lt;slug&gt;)</Label>
          <Input
            id="slug"
            value={state.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={fieldHint("slug")}
            placeholder="creatina-2026-05"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={state.description}
          onChange={(e) => set("description", e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Cupom mensal de creatina – maio/2026"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_at">Início</Label>
          <Input
            id="start_at"
            type="datetime-local"
            value={state.start_at}
            onChange={(e) => set("start_at", e.target.value)}
            className={fieldHint("start_at")}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_at">Fim</Label>
          <Input
            id="end_at"
            type="datetime-local"
            value={state.end_at}
            onChange={(e) => set("end_at", e.target.value)}
            className={fieldHint("end_at")}
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="mode">Modo</Label>
          <select
            id="mode"
            value={state.mode}
            onChange={(e) => set("mode", e.target.value as FormState["mode"])}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
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
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div>
          <Label htmlFor="cost">Custo (R$)</Label>
          <Input
            id="cost"
            type="number"
            min="0"
            step="0.01"
            value={state.cost}
            onChange={(e) => set("cost", e.target.value)}
            className={fieldHint("cost")}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Local (apenas presencial/híbrido)</Label>
          <Input
            id="location"
            value={state.location}
            onChange={(e) => set("location", e.target.value)}
            className={fieldHint("location")}
            placeholder="Av. Paulista, 1000"
          />
        </div>
        <div>
          <Label htmlFor="redirect_url">URL de redirecionamento</Label>
          <Input
            id="redirect_url"
            value={state.redirect_url}
            onChange={(e) => set("redirect_url", e.target.value)}
            className={fieldHint("redirect_url")}
            placeholder="https://shop.biohelp.com.br/products/creatina"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="eligible">Produtos elegíveis (IDs Shopify, separados por vírgula)</Label>
        <Input
          id="eligible"
          value={state.eligible_products_csv}
          onChange={(e) => set("eligible_products_csv", e.target.value)}
          placeholder="9876543210,1234567890"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Quem comprar um destes produtos no período recebe a tag{" "}
          <code>evento:{state.slug || "<slug>"}</code>.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Criar evento
        </Button>
      </div>
    </form>
  )
}
