import { redirect } from "next/navigation"
import { ExternalLink, ShoppingCart, Sparkles } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard } from "@/components/biohelp"
import { Button } from "@/components/ui/button"

/**
 * `/dashboard/store` — atalho pra loja Shopify (v2).
 *
 * Server Component. Rota nova v2-only. Flag `LRP_V2=false` redireciona pro
 * dashboard. Em S5 vira F-V17 (SSO Shopify). Por enquanto só link externo.
 *
 * Anti-SPEC §13: NÃO importa de _loveable_import/. Inspirado no visual de
 * `_loveable_import/src/pages/partner/Store.tsx` mas reescrito em RSC.
 */
export default async function StorePage() {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const shopUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL ?? "#"
  const isActive = member.status === "active"

  const kits = [
    { title: "Rotina manhã", desc: "Energia e foco para começar bem o dia" },
    { title: "Rotina noite", desc: "Recuperação, sono e bem-estar" },
    { title: "Performance", desc: "Suporte para treinos e disposição" },
    { title: "Beleza", desc: "Pele, cabelo e colágeno" },
    { title: "Recompra rápida", desc: "Seus produtos favoritos em 1 clique" },
    { title: "Mais comprados", desc: "Os queridinhos do clube esse mês" },
  ]

  return (
    <PartnerShell memberName={member.name} isActive={isActive}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Acesso à loja</h1>
          <p className="text-muted-foreground">
            Compre com preço de membro e construa sua rotina de consumo.
          </p>
        </header>

        <BHCard variant="gradient" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Sua loja exclusiva</h2>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Em breve você poderá comprar produtos com preço de membro,
                  montar suas rotinas de consumo e fazer recompra rápida
                  diretamente por aqui (F-V17 — SSO Shopify).
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="flex-shrink-0">
              <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                Ir para a loja Biohelp
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </BHCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <BHCard key={kit.title} hover>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{kit.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{kit.desc}</p>
            </BHCard>
          ))}
        </div>
      </div>
    </PartnerShell>
  )
}
