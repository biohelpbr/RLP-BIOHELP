"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BHCard } from "@/components/biohelp"
import { cn } from "@/lib/utils"

/**
 * V2 Login (pivô V2 — visual Loveable absorvido).
 *
 * Anti-SPEC §13: NÃO importa do _loveable_import/. Inspirado em
 * `_loveable_import/src/pages/auth/Login.tsx` mas reescrito.
 *
 * Lógica de auth preservada do V1Login (signInWithPassword via
 * /api/auth/login) — não converti pra magic link porque o backend
 * não foi configurado pra OTP. Tabs Parceira/Admin Biohelp são
 * apenas UX (o redirect pós-login é decidido pelo /api/auth/login
 * baseado em roles).
 */
export default function V2Login() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"partner" | "admin">("partner")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) {
        setError(data.message ?? "Erro ao fazer login")
        setLoading(false)
        return
      }
      router.push(data.redirect ?? "/dashboard")
      router.refresh()
    } catch (err) {
      console.error("[V2Login] error", err)
      setError("Erro de conexão. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-bh-lime/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-bh-coral/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bh-gradient-purple bh-shadow-purple-glow mb-4">
            <span className="text-primary-foreground font-bold text-3xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Entre no Nutrition Club
          </h1>
          <p className="text-muted-foreground">Você no controle do seu ritmo.</p>
        </div>

        <BHCard variant="elevated" className="animate-scale-in">
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("partner")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === "partner"
                  ? "bg-background text-foreground bh-shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sou Parceira
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200",
                activeTab === "admin"
                  ? "bg-background text-foreground bh-shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sou Admin Biohelp
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Seu e-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity group"
              disabled={loading}
            >
              {loading ? "Entrando…" : "Entrar"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-bh-lime/20 border border-bh-lime/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Em breve: login por link mágico (sem senha). Por enquanto,
                use o e-mail e senha cadastrados.
              </p>
            </div>
          </div>
        </BHCard>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Ainda não tem conta?{" "}
          <Link href="/join" className="text-primary hover:underline">
            Cadastre-se aqui
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-2">
          © {new Date().getFullYear()} Biohelp Nutrition. Todos os direitos
          reservados.
        </p>
      </div>
    </div>
  )
}
