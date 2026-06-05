import { redirect } from "next/navigation"
import { AlertCircle, ExternalLink, LogIn, ShoppingCart, Sparkles } from "lucide-react"
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
  // Cadastro na Shopify é AUTOMÁTICO via webhook Guru (syncCustomerToShopify),
  // então o membro só precisa LOGAR com o mesmo email do clube — não tem CTA
  // separado de "Cadastrar".
  const shopLoginUrl = process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL || "https://account.bio-help.com"
  // F-V03: assinatura paga é a fonte de verdade, não o status legado.
  const isActive = member.subscription_status === "paid"

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

        <BHCard className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/20">
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary/15 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 bh-shadow-md">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1 text-foreground">Sua loja exclusiva</h2>
                  <p className="text-sm text-foreground/80 max-w-xl">
                    Acesse a loja Biohelp com pedidos, endereços e recompra rápida.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 lg:w-64">
                <Button asChild size="lg">
                  <a href={shopLoginUrl} target="_blank" rel="noopener noreferrer">
                    <LogIn className="w-4 h-4 mr-2" />
                    Fazer login na loja
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                    Ir para a loja Biohelp
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border-2 border-bh-coral/50 bg-bh-coral-soft/60 p-4">
              <AlertCircle className="w-6 h-6 text-bh-coral flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-foreground leading-snug">
                <span className="text-bh-coral">Importante:</span> pra ver o{" "}
                <strong>preço de membro</strong>, é obrigatório fazer login na loja
                com o <strong>mesmo e-mail que você usou no clube</strong>. Sem
                isso, a loja mostra o preço cheio.
              </p>
            </div>
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
