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
          <p className="font-medium text-foreground">{module.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {KIND_LABEL[module.kind]} ·{" "}
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
