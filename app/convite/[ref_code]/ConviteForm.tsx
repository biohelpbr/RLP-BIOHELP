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

      <div>
        <label htmlFor="conv-name" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 pointer-events-none" />
          <input
            id="conv-name"
            type="text"
            placeholder="Como devemos te chamar?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
            disabled={submitting}
            autoComplete="name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="conv-email" className="block text-sm font-medium text-neutral-800 mb-1.5">
          E-mail <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 pointer-events-none" />
          <input
            id="conv-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
            disabled={submitting}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="conv-phone" className="block text-sm font-medium text-neutral-800 mb-1.5">
            WhatsApp <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 pointer-events-none" />
            <input
              id="conv-phone"
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={phoneMasked}
              onChange={(e) => setPhoneMasked(maskPhone(e.target.value))}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              required
              disabled={submitting}
              autoComplete="tel-national"
            />
          </div>
        </div>

        <div>
          <label htmlFor="conv-cpf" className="block text-sm font-medium text-neutral-800 mb-1.5">
            CPF <span className="text-red-500">*</span>
          </label>
          <input
            id="conv-cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpfMasked}
            onChange={(e) => setCpfMasked(maskCPF(e.target.value))}
            className="w-full h-12 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            required
            disabled={submitting}
            autoComplete="off"
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={submitting}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-400"
          required
        />
        <span className="text-sm text-neutral-700 leading-relaxed">
          {CONVITE_COPY.termsLabel}
        </span>
      </label>

      <button
        type="submit"
        className="w-full h-12 rounded-xl bg-violet-400 enabled:hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        disabled={!isValid || submitting}
      >
        {submitting ? CONVITE_COPY.submittingLabel : CONVITE_COPY.submitLabel}
        <ArrowRight className="w-4 h-4 group-enabled:group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  )
}
