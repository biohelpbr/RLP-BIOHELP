"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"

import { BHCard } from "@/components/biohelp"
import { Button } from "@/components/ui/button"

import { claimPreRegistration } from "./actions"

/**
 * F-V19 RF-5 — Página pós-checkout Guru.
 *
 * URL esperada (preenchida pelo redirect Guru):
 *   /welcome?email=<>&cpf=<>&phone=<>&name=<>&tx=<transaction_id>&external_id=<pre_registration_token>
 *
 * Client-side por necessidade: claimPreRegistration precisa rodar como
 * Server Action (Mutation context) pra conseguir setar cookies de sessão.
 * Renderizar a action durante RSC silenciosamente perderia o set-cookie
 * do verifyOtp (cookies só podem ser escritas em Server Actions / Route Handlers).
 */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bh-lavender-soft via-background to-bh-blue-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

function WelcomeInner() {
  const params = useSearchParams()
  const router = useRouter()
  const externalId = params.get("external_id")
  const tx = params.get("tx")
  const email = params.get("email")

  const [status, setStatus] = React.useState<"loading" | "error">("loading")
  const [errorMsg, setErrorMsg] = React.useState<string>("")

  React.useEffect(() => {
    if (!externalId) {
      setStatus("error")
      setErrorMsg(
        "A URL não tem o identificador da transação. Procure o suporte com seu comprovante.",
      )
      return
    }

    let cancelled = false
    ;(async () => {
      const result = await claimPreRegistration({
        external_id: externalId,
        transaction_id: tx ?? null,
        email: email ?? null,
      })
      if (cancelled) return
      if (result.ok) {
        router.replace(result.redirect_to)
        router.refresh()
      } else {
        setStatus("error")
        setErrorMsg(result.error)
      }
    })()
    return () => {
      cancelled = true
    }
    // intencionalmente sem deps: roda apenas no mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === "loading") {
    return (
      <Shell>
        <BHCard variant="elevated" className="text-center">
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Confirmando seu acesso…
          </h1>
          <p className="text-sm text-muted-foreground">
            Estamos ativando sua assinatura e preparando o dashboard.
          </p>
        </BHCard>
      </Shell>
    )
  }

  // status === "error"
  const retryHref = externalId
    ? `/welcome?external_id=${encodeURIComponent(externalId)}${tx ? `&tx=${encodeURIComponent(tx)}` : ""}${email ? `&email=${encodeURIComponent(email)}` : ""}`
    : "/login"

  return (
    <Shell>
      <BHCard variant="elevated" className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bh-coral/20 mb-4">
          <AlertTriangle className="w-7 h-7 text-bh-coral" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
        <p className="text-muted-foreground mb-6">{errorMsg}</p>
        <div className="flex flex-col gap-2">
          {externalId && (
            <Button
              asChild
              className="w-full bh-gradient-purple text-primary-foreground"
            >
              <a href={retryHref}>Tentar novamente</a>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir para login manual</Link>
          </Button>
        </div>
      </BHCard>
    </Shell>
  )
}

function WelcomeFallback() {
  return (
    <Shell>
      <BHCard variant="elevated" className="text-center">
        <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </BHCard>
    </Shell>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeFallback />}>
      <WelcomeInner />
    </Suspense>
  )
}
