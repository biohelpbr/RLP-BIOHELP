"use client"

import * as React from "react"
import { ArrowRight, User, Mail, Phone, CreditCard } from "lucide-react"

import { createPreRegistration } from "@/lib/subscriptions/actions"
import { CONVITE_COPY } from "@/lib/copy/convite"

interface ConviteFormProps {
  refCode: string
  sponsorName?: string
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300 pointer-events-none" />
        <input
          type="text"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-purple-100 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
          required
          disabled={submitting}
          autoComplete="name"
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300 pointer-events-none" />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-purple-100 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
          required
          disabled={submitting}
          autoComplete="email"
        />
      </div>

      <div className="relative">
        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300 pointer-events-none" />
        <input
          type="tel"
          inputMode="numeric"
          placeholder="WhatsApp"
          value={phoneMasked}
          onChange={(e) => setPhoneMasked(maskPhone(e.target.value))}
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-purple-100 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
          required
          disabled={submitting}
          autoComplete="tel-national"
        />
      </div>

      <div className="relative">
        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300 pointer-events-none" />
        <input
          type="text"
          inputMode="numeric"
          placeholder="CPF"
          value={cpfMasked}
          onChange={(e) => setCpfMasked(maskCPF(e.target.value))}
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-purple-100 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
          required
          disabled={submitting}
          autoComplete="off"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer pt-2 pb-1">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={submitting}
          className="mt-0.5 h-5 w-5 rounded border-purple-200 text-purple-600 focus:ring-2 focus:ring-purple-300"
          required
        />
        <span className="text-xs text-gray-600 leading-relaxed">
          Li e aceito os <a href="#" className="text-purple-600 underline">termos de uso</a> e a <a href="#" className="text-purple-600 underline">política de privacidade</a> do Club Biohelp.
        </span>
      </label>

      <button
        type="submit"
        className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        disabled={!isValid || submitting}
      >
        {submitting ? CONVITE_COPY.submittingLabel : CONVITE_COPY.submitLabel}
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  )
}
