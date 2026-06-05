"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateSupportContact } from "@/lib/settings/actions"
import type { SupportContact } from "@/lib/settings/queries"

interface Props {
  initial: SupportContact
}

/**
 * W4 (call 05/06) — formulário do contato de suporte (telefone + horário).
 * O card "Comunidade & Atendimento" da home do membro lê esses valores.
 */
export function SupportContactForm({ initial }: Props) {
  const router = useRouter()
  const [phone, setPhone] = useState(initial.phone)
  const [digits, setDigits] = useState(initial.whatsapp_digits)
  const [hours, setHours] = useState(initial.hours)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSave() {
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await updateSupportContact({
        phone,
        whatsapp_digits: digits,
        hours,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg("Configuração salva. Os membros já veem o novo contato (sem deploy).")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="support-phone" className="text-sm font-medium">
            Telefone (exibição)
          </label>
          <Input
            id="support-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="51 98101-9332"
          />
          <p className="text-xs text-muted-foreground">Como aparece pro membro.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="support-digits" className="text-sm font-medium">
            WhatsApp (DDI+DDD+número, só dígitos)
          </label>
          <Input
            id="support-digits"
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            placeholder="5551981019332"
          />
          <p className="text-xs text-muted-foreground">
            Vira o link wa.me — ex.: 5551981019332.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="support-hours" className="text-sm font-medium">
          Horário de atendimento
        </label>
        <Input
          id="support-hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Segunda a sexta, 9h às 18h"
        />
      </div>

      <Button type="button" onClick={onSave} disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar
      </Button>

      {msg && (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-2 text-sm text-primary">{msg}</p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
