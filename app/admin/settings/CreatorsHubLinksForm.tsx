"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateCreatorsHubLinks } from "@/lib/settings/actions"
import type { CreatorsHubLinks } from "@/lib/settings/queries"

interface Props {
  initial: CreatorsHubLinks
}

/**
 * Links dos 3 passos da página de obrigado (/obrigado) do Creators Hub.
 * Editável aqui — sem deploy e sem mexer em variável de ambiente.
 */
export function CreatorsHubLinksForm({ initial }: Props) {
  const router = useRouter()
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp_group_url)
  const [plataforma, setPlataforma] = useState(initial.plataforma_url)
  const [email, setEmail] = useState(initial.email_url)
  const [offer, setOffer] = useState(initial.checkout_offer)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSave() {
    setError(null)
    setMsg(null)
    start(async () => {
      const res = await updateCreatorsHubLinks({
        whatsapp_group_url: whatsapp,
        plataforma_url: plataforma,
        email_url: email,
        checkout_offer: offer,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setMsg("Links salvos. A página de obrigado já usa os novos (sem deploy).")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="ch-whatsapp" className="text-sm font-medium">
          Passo 2 — Grupo de WhatsApp
        </label>
        <Input
          id="ch-whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
        />
        <p className="text-xs text-muted-foreground">
          Convite do grupo. Se ficar vazio, o botão aparece desabilitado na página.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="ch-plataforma" className="text-sm font-medium">
            Passo 3 — Plataforma
          </label>
          <Input
            id="ch-plataforma"
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            placeholder="https://painel.bio-help.com/login"
          />
          <p className="text-xs text-muted-foreground">Onde a pessoa acessa as aulas.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ch-email" className="text-sm font-medium">
            Passo 1 — Verificar e-mail
          </label>
          <Input
            id="ch-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="https://mail.google.com/"
          />
          <p className="text-xs text-muted-foreground">Webmail que o botão abre.</p>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <label htmlFor="ch-offer" className="text-sm font-medium">
          Oferta do checkout
        </label>
        <Input
          id="ch-offer"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="membership-creators-hub"
        />
        <p className="text-xs text-muted-foreground">
          Só o final da URL. Quem se cadastrar pelo convite vai pra{" "}
          <span className="font-mono">
            checkout.bio-help.com/subscribe/{offer.trim() || "…"}
          </span>
        </p>
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
