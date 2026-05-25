"use client"

import * as React from "react"
import { ArrowRight, Mail, Phone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPreRegistration } from "@/lib/subscriptions/actions"
import { CONVITE_COPY } from "@/lib/copy/convite"

/**
 * F-V19 — Formulário inline da landing `/convite/[ref_code]`.
 *
 * Máscaras client-only (cosméticas) — server recebe valores limpos:
 *   • CPF: 11 dígitos numéricos (validados via PreRegistrationSchema no server).
 *   • Telefone: 10-11 dígitos brasileiros (DDD + número).
 *
 * Em sucesso, faz `window.location.href = guru_redirect_url` (redirect externo
 * pro checkout Guru). Em erro, mostra mensagem inline e mantém os campos.
 */

interface ConviteFormProps {
  refCode: string
}

const maskCPF = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

const maskPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

const stripDigits = (raw: string): string => raw.replace(/\D/g, "")

export function ConviteForm({ refCode }: ConviteFormProps) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phoneMasked, setPhoneMasked] = React.useState("")
  const [cpfMasked, setCpfMasked] = React.useState("")
  const [acceptedTerms, setAcceptedTerms] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const phoneDigits = stripDigits(phoneMasked)
  const cpfDigits = stripDigits(cpfMasked)

  const isValid =
    name.trim().length >= 3 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    phoneDigits.length >= 10 &&
    cpfDigits.length === 11 &&
    acceptedTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid) return

    setSubmitting(true)
    try {
      const result = await createPreRegistration({
        ref_code: refCode,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneDigits,
        cpf: cpfDigits,
        accepted_terms: true,
      })

      if (!result.ok) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      window.location.href = result.guru_redirect_url
    } catch (err) {
      console.error("[ConviteForm] submit", err)
      setError("Erro de conexão. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Nome completo <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Como devemos te chamar?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
            disabled={submitting}
            autoComplete="name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          E-mail <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 rounded-xl"
            required
            disabled={submitting}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">
            WhatsApp <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={phoneMasked}
              onChange={(e) => setPhoneMasked(maskPhone(e.target.value))}
              className="pl-10 h-12 rounded-xl"
              required
              disabled={submitting}
              autoComplete="tel-national"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-foreground">
            CPF <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpfMasked}
            onChange={(e) => setCpfMasked(maskCPF(e.target.value))}
            className="h-12 rounded-xl"
            required
            disabled={submitting}
            autoComplete="off"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
          required
        />
        <span className="text-sm text-foreground">{CONVITE_COPY.termsLabel}</span>
      </label>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl bh-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity group"
        disabled={!isValid || submitting}
      >
        {submitting ? CONVITE_COPY.submittingLabel : CONVITE_COPY.submitLabel}
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  )
}
