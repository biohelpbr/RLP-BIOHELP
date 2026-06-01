"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BHCard } from "@/components/biohelp"
import { cn } from "@/lib/utils"
import { createClientSupabase } from "@/lib/supabase/client"

export default function V2Login() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"partner" | "admin">("partner")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [verifying, setVerifying] = React.useState(false)

  // F-V19 follow-up (hotfix 01/06): se o login foi iniciado em /admin-login,
  // o destino correto é /admin, não /dashboard.
  const isAdminLoginPath = () =>
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin-login")

  // Se o usuário abriu /admin-login no painel.bio-help.com (URL errada),
  // redireciona pra admin.bio-help.com/admin-login ANTES do login, evitando
  // que a sessão seja criada no domínio errado. Sem efeito em localhost/preview.
  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (!isAdminLoginPath()) return
    if (window.location.hostname.startsWith("painel.")) {
      window.location.replace(
        `https://admin.bio-help.com${window.location.pathname}${window.location.search}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClientSupabase()
      const adminFlow = isAdminLoginPath()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${
            adminFlow ? "/admin" : "/dashboard"
          }`,
        },
      })
      if (otpError) {
        setError(otpError.message)
        setLoading(false)
        return
      }
      setSent(true)
      setLoading(false)
    } catch (err) {
      console.error("[V2Login] error", err)
      setError("Erro de conexão. Tente novamente.")
      setLoading(false)
    }
  }

  // Login por CÓDIGO (OTP) em vez do link clicável: imune a prefetch/scanner
  // de e-mail (que consumia o token único antes do clique → 403 no /verify) e
  // a webview de app de e-mail (sem o cookie code_verifier do PKCE).
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setVerifying(true)
    try {
      const supabase = createClientSupabase()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email",
      })
      if (verifyError) {
        setError("Código inválido ou expirado. Confira ou peça um novo.")
        setVerifying(false)
        return
      }
      // Sessão gravada em cookie pelo client @supabase/ssr. Usamos full-page
      // navigation (window.location.assign) em vez de router.replace pra
      // garantir que o middleware revê com a sessão atualizada e não race com
      // o cookie ainda não propagado.
      const destination = isAdminLoginPath() ? "/admin" : "/dashboard"
      window.location.assign(destination)
    } catch (err) {
      console.error("[V2Login] verify error", err)
      setError("Erro de conexão. Tente novamente.")
      setVerifying(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BHCard variant="elevated" className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Confira seu e-mail
            </h2>
            <p className="text-muted-foreground mb-1">
              Enviamos um código de acesso para <strong>{email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Digite o código de 6 dígitos abaixo. Não encontrou? Verifique a
              pasta de spam ou promoções.
            </p>

            <form onSubmit={handleVerify} className="space-y-4 text-left">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">
                  Código de acesso
                </Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-12 rounded-xl text-center text-2xl tracking-[0.5em]"
                  maxLength={6}
                  required
                  disabled={verifying}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                disabled={verifying || code.length < 6}
              >
                {verifying ? "Entrando…" : "Confirmar código"}
              </Button>
            </form>

            <Button
              variant="outline"
              onClick={() => { setSent(false); setCode(""); setError(null) }}
              className="w-full mt-3"
              disabled={verifying}
            >
              Usar outro e-mail
            </Button>
          </BHCard>
        </div>
      </div>
    )
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
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={200}
            height={56}
            className="h-12 w-auto mx-auto mb-4"
            priority
          />
          <p className="text-muted-foreground">Portal de Parceiras</p>
        </div>

        <BHCard variant="elevated" className="animate-scale-in">
          {/* Tab admin removida — acesso admin via URL oculta /admin-login */}

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
                  autoComplete="email"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity group"
              disabled={loading || !email.includes("@")}
            >
              {loading ? "Enviando…" : "Entrar na minha conta"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Você vai receber um código de acesso no seu e-mail. Sem senha.
          </p>
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
