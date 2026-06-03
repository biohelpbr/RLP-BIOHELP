"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setNewPassword } from "./actions"

export function ChangePasswordForm() {
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    setPending(true)
    const res = await setNewPassword(password)
    if (!res.ok) {
      setError(res.error)
      setPending(false)
      return
    }
    // Flag limpa no Auth → o middleware deixa de redirecionar. Full-page navigation
    // pra garantir que o middleware reavalie com o app_metadata atualizado.
    window.location.assign("/dashboard")
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Nova senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type="password"
            placeholder="mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
            minLength={8}
            disabled={pending}
            autoComplete="new-password"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-foreground">
          Confirmar nova senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            id="confirm"
            type="password"
            placeholder="repita a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
            minLength={8}
            disabled={pending}
            autoComplete="new-password"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        disabled={pending || password.length < 8}
      >
        {pending ? "Salvando…" : "Salvar e continuar"}
      </Button>
    </form>
  )
}
