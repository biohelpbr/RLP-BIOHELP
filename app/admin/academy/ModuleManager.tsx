"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addModule } from "@/lib/content/actions"

export function ModuleManager({ trailId }: { trailId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<"youtube" | "pdf" | "text">("youtube")
  const [contentUrl, setContentUrl] = useState("")
  const [contentText, setContentText] = useState("")
  const [order, setOrder] = useState("0")
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
        display_order: Number(order) || 0,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setTitle("")
      setContentUrl("")
      setContentText("")
      setOrder((n) => String((Number(n) || 0) + 1))
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="text-base font-semibold">Adicionar módulo</h3>
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
        <div>
          <Label htmlFor="m-kind">Tipo</Label>
          <select
            id="m-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "youtube" | "pdf" | "text")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="youtube">YouTube</option>
            <option value="pdf">PDF</option>
            <option value="text">Texto</option>
          </select>
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
            required
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="m-url">URL ({kind === "youtube" ? "YouTube" : "PDF"})</Label>
          <Input
            id="m-url"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder={
              kind === "youtube"
                ? "https://www.youtube.com/watch?v=..."
                : "https://.../arquivo.pdf"
            }
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="m-order">Ordem</Label>
        <Input
          id="m-order"
          type="number"
          min="0"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
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
          Adicionar módulo
        </Button>
      </div>
    </form>
  )
}
