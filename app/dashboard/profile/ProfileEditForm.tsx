"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMemberProfile } from "@/lib/members/profile-actions"

interface ProfileEditFormProps {
  initialName: string
  initialPhone: string
}

/**
 * Form de edição inline do perfil (nome + telefone). Email continua read-only
 * porque exige sync com Supabase Auth (admin scope).
 */
export function ProfileEditForm({ initialName, initialPhone }: ProfileEditFormProps) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(initialName)
  const [phone, setPhone] = React.useState(initialPhone)
  const [pending, setPending] = React.useState(false)

  const handleCancel = () => {
    setName(initialName)
    setPhone(initialPhone)
    setEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    const res = await updateMemberProfile({ name, phone })
    setPending(false)
    if (res.ok) {
      toast.success("Perfil atualizado")
      setEditing(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
        className="w-fit"
      >
        <Pencil className="w-3.5 h-3.5 mr-2" />
        Editar nome e telefone
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-border pt-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Nome completo</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-phone" className="flex items-center gap-2">
          Telefone
          <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="edit-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Salvando…
            </>
          ) : (
            "Salvar"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={pending}
        >
          <X className="w-3.5 h-3.5 mr-2" />
          Cancelar
        </Button>
        <p className="text-xs text-muted-foreground ml-auto">
          Pra trocar e-mail, fale com a admin Biohelp.
        </p>
      </div>
    </form>
  )
}
