"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/announcements/actions"
import type { AnnouncementRow } from "@/lib/announcements/queries"

type Variant = "coral" | "primary" | "accent"

type FormState = {
  message: string
  image_url: string
  link_url: string
  cta_label: string
  variant: Variant
  active: boolean
  starts_at: string
  ends_at: string
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  // datetime-local espera "YYYY-MM-DDTHH:mm" no fuso local
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(local: string): string {
  if (!local) return ""
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString()
}

const VARIANT_LABEL: Record<Variant, string> = {
  coral: "Coral (destaque/urgente)",
  primary: "Roxo (padrão da marca)",
  accent: "Verde-limão (leve)",
}

export function AnnouncementForm({ initial }: { initial?: AnnouncementRow }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<FormState>({
    message: initial?.message ?? "",
    image_url: initial?.image_url ?? "",
    link_url: initial?.link_url ?? "",
    cta_label: initial?.cta_label ?? "",
    variant: (initial?.variant as Variant) ?? "coral",
    active: initial?.active ?? true,
    starts_at: isoToLocalInput(initial?.starts_at ?? null),
    ends_at: isoToLocalInput(initial?.ends_at ?? null),
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, start] = useTransition()

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }))
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/announcements/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Falha no upload da imagem.")
        return
      }
      set("image_url", json.url)
    } catch {
      setError("Falha no upload da imagem.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const payload = {
      message: state.message.trim(),
      image_url: state.image_url.trim() || null,
      link_url: state.link_url.trim() || null,
      cta_label: state.cta_label.trim() || null,
      variant: state.variant,
      active: state.active,
      starts_at: localInputToIso(state.starts_at) || null,
      ends_at: localInputToIso(state.ends_at) || null,
    }

    start(async () => {
      const res = initial
        ? await updateAnnouncement(initial.id, payload)
        : await createAnnouncement(payload)
      if (!res.ok) {
        setError(res.error)
        setFieldError(res.field || null)
        return
      }
      router.push("/admin/announcements")
      router.refresh()
    })
  }

  function onDelete() {
    if (!initial) return
    if (!confirm("Excluir este aviso? Esta ação não pode ser desfeita.")) return
    start(async () => {
      const res = await deleteAnnouncement(initial.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push("/admin/announcements")
      router.refresh()
    })
  }

  const fieldHint = (name: string) => (fieldError === name ? "border-destructive" : "")

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label htmlFor="message">Mensagem do aviso</Label>
        <textarea
          id="message"
          value={state.message}
          onChange={(e) => set("message", e.target.value)}
          maxLength={280}
          className={`flex min-h-[72px] w-full rounded-md border ${fieldHint("message") || "border-input"} bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          placeholder="🔴 Live HOJE às 19h — não perca! Entre pelo botão ao lado."
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">{state.message.length}/280 caracteres</p>
      </div>

      <div>
        <Label>Imagem (opcional)</Label>
        <div className="mt-1 flex items-center gap-4">
          {state.image_url ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.image_url}
                alt="Prévia"
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => set("image_url", "")}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                aria-label="Remover imagem"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 h-4 w-4" />
              )}
              {state.image_url ? "Trocar imagem" : "Subir imagem"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF — até 5MB.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onPickImage}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="link_url">Link do botão (opcional)</Label>
          <Input
            id="link_url"
            value={state.link_url}
            onChange={(e) => set("link_url", e.target.value)}
            className={fieldHint("link_url")}
            placeholder="https://youtube.com/live/..."
          />
        </div>
        <div>
          <Label htmlFor="cta_label">Texto do botão</Label>
          <Input
            id="cta_label"
            value={state.cta_label}
            onChange={(e) => set("cta_label", e.target.value)}
            placeholder="Participar"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Só aparece se houver link. Vazio = &quot;Saber mais&quot;.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="variant">Cor / estilo</Label>
          <select
            id="variant"
            value={state.variant}
            onChange={(e) => set("variant", e.target.value as Variant)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {(Object.keys(VARIANT_LABEL) as Variant[]).map((v) => (
              <option key={v} value={v}>
                {VARIANT_LABEL[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="starts_at">Começa em (opcional)</Label>
          <Input
            id="starts_at"
            type="datetime-local"
            value={state.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ends_at">Some em (opcional)</Label>
          <Input
            id="ends_at"
            type="datetime-local"
            value={state.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className={fieldHint("ends_at")}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.active}
          onChange={(e) => set("active", e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Aviso ativo (aparece no painel dos membros)
      </label>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {initial ? (
          <Button type="button" variant="ghost" onClick={onDelete} disabled={pending} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending || uploading}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {initial ? "Salvar alterações" : "Criar aviso"}
        </Button>
      </div>
    </form>
  )
}
