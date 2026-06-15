"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addModule } from "@/lib/content/actions"

/**
 * Adiciona aula no FIM da trilha (W6: ordem agora é pelas setas ↑/↓ da lista —
 * o campo manual de ordem saiu pra simplificar o uso pelo admin).
 * Aula de YouTube: basta colar o link (youtu.be/... ou youtube.com/watch?v=...).
 */
export function ModuleManager({ trailId, nextOrder }: { trailId: string; nextOrder: number }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<"youtube" | "pdf" | "text">("youtube")
  const [contentUrl, setContentUrl] = useState("")
  const [contentText, setContentText] = useState("")
  const [duration, setDuration] = useState("")
  const [comingSoon, setComingSoon] = useState(false)
  const [availableAt, setAvailableAt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await addModule({
        trail_id: trailId,
        title: title.trim(),
        kind,
        content_url: kind === "text" ? null : contentUrl.trim() || null,
        content_text: kind === "text" ? contentText : null,
        duration_minutes: duration.trim() ? Number(duration) : null,
        is_coming_soon: comingSoon,
        available_at: availableAt.trim() || null,
        display_order: nextOrder,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setTitle("")
      setContentUrl("")
      setContentText("")
      setDuration("")
      setComingSoon(false)
      setAvailableAt("")
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="text-base font-semibold">Adicionar aula</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="m-title">Título</Label>
          <Input
            id="m-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <Label htmlFor="m-kind">Tipo</Label>
            <select
              id="m-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as "youtube" | "pdf" | "text")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="youtube">YouTube</option>
              <option value="pdf">PDF / Link externo</option>
              <option value="text">Texto</option>
            </select>
          </div>
          <div>
            <Label htmlFor="m-duration">Duração (min)</Label>
            <Input
              id="m-duration"
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
          <Label htmlFor="m-text">Conteúdo</Label>
          <textarea
            id="m-text"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required={!comingSoon}
            disabled={comingSoon}
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="m-url">
            {kind === "youtube" ? "Link do YouTube" : "URL (PDF ou link externo)"}
          </Label>
          <Input
            id="m-url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder={
              comingSoon
                ? "Aula em breve — pode deixar vazio e colar o link depois"
                : kind === "youtube"
                  ? "https://youtu.be/... ou https://www.youtube.com/watch?v=..."
                  : "https://..."
            }
            required={!comingSoon}
            disabled={comingSoon}
          />
          {kind === "youtube" && !comingSoon && (
            <p className="mt-1 text-xs text-muted-foreground">
              Cole o link do vídeo — ele vira aula com o player embutido.
            </p>
          )}
        </div>
      )}

      {/* F-V33: lançar aula futura como "Em breve" (só com título; link entra depois). */}
      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={comingSoon}
            onChange={(e) => setComingSoon(e.target.checked)}
          />
          Marcar como &quot;Em breve&quot; (aula futura — pode salvar só com o título)
        </label>
        {comingSoon && (
          <div>
            <Label htmlFor="m-available">Liberar automaticamente em (opcional)</Label>
            <Input
              id="m-available"
              type="datetime-local"
              value={availableAt}
              onChange={(e) => setAvailableAt(e.target.value)}
              className="w-full sm:w-64"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Com data, a aula abre sozinha no horário. Sem data, fica como &quot;Em breve&quot; até
              você desmarcar.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Adicionar aula
        </Button>
      </div>
    </form>
  )
}
