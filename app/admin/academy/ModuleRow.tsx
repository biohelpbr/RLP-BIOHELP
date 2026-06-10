"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  FileDigit,
  FileText,
  Loader2,
  Pencil,
  PlayCircle,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { moveModule, removeModule, updateModule } from "@/lib/content/actions"
import type { ContentModule } from "@/lib/content/queries"

const KIND_ICON: Record<ContentModule["kind"], React.ReactNode> = {
  youtube: <PlayCircle className="w-4 h-4 text-bh-coral" />,
  pdf: <FileDigit className="w-4 h-4 text-bh-blue" />,
  text: <FileText className="w-4 h-4 text-bh-purple-medium" />,
}

const KIND_LABEL: Record<string, string> = {
  youtube: "YouTube",
  pdf: "PDF / Link",
  text: "Texto",
}

// F-V27 — ISO (UTC) → valor de <input type="datetime-local"> (hora local).
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

interface Props {
  module: ContentModule
  isFirst: boolean
  isLast: boolean
}

/**
 * W6 (call 05/06) — linha de aula no admin com reordenar (↑/↓),
 * editar inline e excluir. CMS completo sem código.
 */
export function ModuleRow({ module, isFirst, isLast }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(module.title)
  const [kind, setKind] = useState<ContentModule["kind"]>(module.kind)
  const [contentUrl, setContentUrl] = useState(module.content_url ?? "")
  const [contentText, setContentText] = useState(module.content_text ?? "")
  const [duration, setDuration] = useState(
    module.duration_minutes ? String(module.duration_minutes) : "",
  )
  const [comingSoon, setComingSoon] = useState(module.is_coming_soon)
  const [availableAt, setAvailableAt] = useState(toLocalInput(module.available_at))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onMove(direction: "up" | "down") {
    setError(null)
    start(async () => {
      const res = await moveModule(module.id, module.trail_id, direction)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (!window.confirm(`Excluir a aula "${module.title}"?`)) return
    setError(null)
    start(async () => {
      const res = await removeModule(module.id, module.trail_id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function onSave() {
    setError(null)
    start(async () => {
      const res = await updateModule(module.id, module.trail_id, {
        title: title.trim(),
        kind,
        content_url: kind === "text" ? null : contentUrl.trim() || null,
        content_text: kind === "text" ? contentText : null,
        duration_minutes: duration.trim() ? Number(duration) : null,
        is_coming_soon: comingSoon,
        available_at: availableAt.trim() || null,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <li className="py-3 space-y-3">
      <div className="flex items-center gap-3">
        <span>{KIND_ICON[module.kind]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground inline-flex items-center gap-2">
            {module.title}
            {module.is_coming_soon || module.available_at ? (
              <span className="rounded-full bg-bh-purple-medium/15 px-2 py-0.5 text-[10px] font-medium text-bh-purple-medium">
                Em breve{module.available_at ? ` · ${formatDate(module.available_at)}` : ""}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {KIND_LABEL[module.kind]}
            {module.duration_minutes ? ` · ${module.duration_minutes} min` : ""} ·{" "}
            {module.kind === "text"
              ? (module.content_text ?? "").slice(0, 80)
              : module.content_url}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMove("up")}
            disabled={pending || isFirst}
            aria-label="Subir aula"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMove("down")}
            disabled={pending || isLast}
            aria-label="Descer aula"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditing((v) => !v)}
            disabled={pending}
            aria-label="Editar aula"
          >
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={pending}
            aria-label="Excluir aula"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="ml-7 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`e-title-${module.id}`}>Título</Label>
              <Input
                id={`e-title-${module.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <Label htmlFor={`e-kind-${module.id}`}>Tipo</Label>
                <select
                  id={`e-kind-${module.id}`}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ContentModule["kind"])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF / Link externo</option>
                  <option value="text">Texto</option>
                </select>
              </div>
              <div>
                <Label htmlFor={`e-duration-${module.id}`}>Duração (min)</Label>
                <Input
                  id={`e-duration-${module.id}`}
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3"
                  className="w-24"
                />
              </div>
            </div>
          </div>
          {kind === "text" ? (
            <div>
              <Label htmlFor={`e-text-${module.id}`}>Conteúdo</Label>
              <textarea
                id={`e-text-${module.id}`}
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor={`e-url-${module.id}`}>
                URL ({kind === "youtube" ? "cole o link do YouTube" : "PDF ou link externo"})
              </Label>
              <Input
                id={`e-url-${module.id}`}
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder={
                  kind === "youtube"
                    ? "https://youtu.be/... ou https://www.youtube.com/watch?v=..."
                    : "https://..."
                }
              />
            </div>
          )}
          {/* F-V27: aula "em breve" — trava manual e/ou data de liberação automática. */}
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={comingSoon}
                onChange={(e) => setComingSoon(e.target.checked)}
              />
              Marcar como &quot;Em breve&quot; (trava manual até desmarcar)
            </label>
            <div>
              <Label htmlFor={`e-available-${module.id}`}>
                Liberar automaticamente em (opcional)
              </Label>
              <Input
                id={`e-available-${module.id}`}
                type="datetime-local"
                value={availableAt}
                onChange={(e) => setAvailableAt(e.target.value)}
                className="w-full sm:w-64"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Com data, a aula abre sozinha quando chega o horário. Sem data, fica travada só
                pelo checkbox acima.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={onSave} disabled={pending}>
              {pending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar aula
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="ml-7 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  )
}
