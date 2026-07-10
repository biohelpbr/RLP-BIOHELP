"use client"

import * as React from "react"
import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Ticket,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BHCard } from "@/components/biohelp"

/**
 * `/join` v2 — Cadastro com design Biohelp (Loveable absorvido).
 *
 * Anti-SPEC §13: NÃO importa de _loveable_import/. Refator visual aplicando
 * mesmo pattern de V2Login (Tailwind + shadcn + gradients Biohelp).
 *
 * Funcional:
 * - Campo "Código de quem te convidou" SEMPRE visível (não só via ?ref=).
 * - Pre-popula quando ?ref vier na URL + mostra confirmação verde.
 * - Telefone opcional (TBD com cliente em 13/05 — pode virar obrigatório).
 * - Validação: senha mínima 6, senha = confirmação, código obrigatório.
 * - Lógica POST mantida em /api/members/join.
 */

function JoinForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const refFromUrl = searchParams.get("ref")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    inviteCode: refFromUrl ?? "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    const inviteCode = formData.inviteCode.trim().toUpperCase()
    if (!inviteCode) {
      setError("Informe o código ou link de quem te convidou.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/members/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          ref: inviteCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === "EMAIL_EXISTS") {
          setError("Este e-mail já está cadastrado. Faça login.")
        } else if (data.code === "INVALID_REF") {
          setError("Código de convite inválido. Confira com quem te indicou.")
        } else {
          setError(data.message || "Erro ao criar conta. Tente novamente.")
        }
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("[JoinPage] error", err)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password &&
    formData.confirmPassword &&
    formData.inviteCode.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-bh-lime/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-bh-coral/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 animate-fade-in">
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={200}
            height={56}
            className="h-12 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar conta</h1>
          <p className="text-muted-foreground">Preencha seus dados para começar.</p>
        </div>

        <BHCard variant="elevated" className="animate-scale-in">
          {!refFromUrl && (
            <div className="flex items-start gap-3 rounded-xl border border-bh-coral/30 bg-bh-coral-soft/40 p-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-bh-coral flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <strong className="block">Como te convidaram?</strong>
                <p className="text-muted-foreground">
                  Cole o código que a parceira te passou no campo abaixo, ou peça
                  o link de convite e clique nele.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Como devemos te chamar?"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                Telefone
                <span className="text-xs text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-foreground">
                Código de quem te convidou{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="Ex.: BH00001 ou SPONSOR01"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl uppercase"
                  required
                  disabled={isLoading || !!refFromUrl}
                  autoCapitalize="characters"
                />
              </div>
              {refFromUrl && (
                <p className="flex items-center gap-1 text-xs text-success">
                  <Check className="w-3.5 h-3.5" />
                  Código preenchido automaticamente pelo link de convite
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-12 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity group"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Criando conta…" : "Criar minha conta"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {formData.inviteCode.trim() && (
            <div className="mt-6 p-3 rounded-xl bg-bh-lime/20 border border-bh-lime/30 text-sm flex items-center gap-2 text-foreground">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
              <span>
                Convidado por:{" "}
                <strong>{formData.inviteCode.trim().toUpperCase()}</strong>
              </span>
            </div>
          )}
        </BHCard>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Fazer login
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

function JoinLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="/logo-oficial.png"
          alt="Biohelp Nutrition Club"
          width={200}
          height={56}
          className="h-12 w-auto mx-auto mb-4"
          priority
        />
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoading />}>
      <JoinForm />
    </Suspense>
  )
}
