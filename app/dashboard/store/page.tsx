import { redirect } from "next/navigation"
import { ExternalLink, LogIn, ShoppingCart, Sparkles } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
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

  // `||` (não `??`) pra também aplicar fallback quando env vem como string vazia.
  // Verificado em 13/05/2026: em Vercel a env pode existir mas estar vazia.
  const shopUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || "https://bio-help.com"
  // F-V17 stub: login direto na conta Shopify do membro até SSO ficar pronto.
  const shopLoginUrl = process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL || "https://account.bio-help.com"
  const isActive = member.status === "active"

  // Cada card linka para uma coleção real da loja Biohelp (verificado em
  // 13/05/2026 — todos respondem HTTP 200 e contêm produtos). Para adicionar
  // novas categorias, basta listar o handle existente na Shopify.
  const kits = [
    { title: "Rotina manhã", desc: "Foco, cognição e disposição para começar bem", path: "/collections/cognicao" },
    { title: "Rotina noite", desc: "Sono, recuperação e bem-estar", path: "/collections/sono" },
    { title: "Performance", desc: "Suporte para treinos e disposição", path: "/collections/todos-de-performance" },
    { title: "Beleza", desc: "Pele, cabelo, colágeno e skincare", path: "/collections/todos-em-beleza" },
    { title: "Imunidade", desc: "Defesas, vitaminas e prevenção", path: "/collections/imunidade" },
    { title: "Todos os produtos", desc: "Explore o catálogo completo da Biohelp", path: "/collections/all" },
  ]

  return (
    <PartnerShell memberName={member.name} isActive={isActive} memberSubtitle={getMemberSubtitle(member)}>
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

        <BHCard className="relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/30 text-accent-foreground flex items-center justify-center flex-shrink-0">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">Login na loja</h2>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Já tem conta na loja Biohelp? Acesse sua conta para ver pedidos,
                  endereços e fazer recompra rápida.
                </p>
              </div>
            </div>
            <Button asChild size="lg" variant="outline" className="flex-shrink-0">
              <a href={shopLoginUrl} target="_blank" rel="noopener noreferrer">
                Fazer login na loja
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </BHCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <a
              key={kit.title}
              href={`${shopUrl}${kit.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <BHCard hover className="h-full transition-all hover:shadow-md cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground flex items-center gap-1">
                    {kit.title}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{kit.desc}</p>
              </BHCard>
            </a>
          ))}
        </div>
      </div>
    </PartnerShell>
  )
}
