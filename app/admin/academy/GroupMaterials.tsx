"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addGroupMaterial, removeGroupMaterial } from "@/lib/content/group-actions"
import type { AcademyGroupMaterial } from "@/lib/content/groups"

/** F-V31 — gestão dos PDFs complementares de um Grande Grupo. */
export function GroupMaterials({
  groupId,
  materials,
}: {
  groupId: string
  materials: AcademyGroupMaterial[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, start] = useTransition()

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const file = fileRef.current?.files?.[0]
    if (!title.trim()) return setError("Informe um título.")
    if (!file) return setError("Selecione um PDF.")

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/academy-materials/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Falha no upload.")
        return
      }
      const add = await addGroupMaterial({ group_id: groupId, title: title.trim(), file_url: json.url, display_order: materials.length })
      if (!add.ok) {
        setError(add.error)
        return
      }
      setTitle("")
      if (fileRef.current) fileRef.current.value = ""
      router.refresh()
    } catch {
      setError("Erro inesperado no upload.")
    } finally {
      setUploading(false)
    }
  }

  function onRemove(id: string, t: string) {
    if (!window.confirm(`Remover o material "${t}"?`)) return
    start(async () => {
      const res = await removeGroupMaterial(id, groupId)
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {materials.length > 0 && (
        <ul className="divide-y divide-border">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <a href={m.file_url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:underline">
                <FileText className="h-4 w-4 shrink-0 text-bh-coral" />
                <span className="truncate">{m.title}</span>
              </a>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemove(m.id, m.title)} disabled={pending} aria-label="Remover material">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
        <div>
          <Label htmlFor="mat-title">Título do material</Label>
          <Input id="mat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Guia rápido de produtos (PDF)" />
        </div>
        <div>
          <Label htmlFor="mat-file">Arquivo (PDF, até 20MB)</Label>
          <Input id="mat-file" type="file" accept="application/pdf" ref={fileRef} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Adicionar PDF
          </Button>
        </div>
      </form>
    </div>
  )
}
