import { redirect } from "next/navigation"
import Link from "next/link"
import {
  CalendarHeart,
  Copy,
  ExternalLink,
  Link2,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberNetworkV2 } from "@/lib/network/v2"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard, BHStat } from "@/components/biohelp"
import { Button } from "@/components/ui/button"

/**
 * Dashboard do Membro v2 (Pivô — afiliação 1-nível).
 *
 * Server Component. Carrega membro logado, contagem de afiliados N1 (F-V11),
 * ref_code e atalho pra loja. "Próximo evento" é placeholder até F-V15.
 *
 * Anti-SPEC §12-13: nenhum import de _loveable_import/. Modelo v1 (CV/níveis)
 * descartado — apenas dados v2 (ref_code, sponsor, N1, status).
 */
export default async function V2Dashboard() {
  const member = await getCurrentMember()
  if (!member) {
    redirect("/login")
  }

  const network = await getMemberNetworkV2(member.id)
  const directReportsCount = network?.direct_reports.length ?? 0
  const isActive = member.status === "active"
  const shopUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL ?? "#"

  return (
    <PartnerShell memberName={member.name} isActive={isActive}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Oi, {member.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Visão geral da sua comunidade Biohelp.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BHStat
            label="Meu código"
            value={member.ref_code}
            subtitle="Use no convite ou link"
            icon={<Link2 className="w-5 h-5" />}
            variant="primary"
          />
          <BHStat
            label="Afiliados diretos"
            value={directReportsCount}
            subtitle="Pessoas que você trouxe"
            icon={<Users className="w-5 h-5" />}
            variant="accent"
          />
          <BHStat
            label="Status"
            value={
              isActive
                ? "Ativa"
                : member.status === "pending"
                ? "Pendente"
                : "Inativa"
            }
            subtitle={
              isActive
                ? "Assinatura paga"
                : "Aguardando ativação da assinatura"
            }
            icon={<Sparkles className="w-5 h-5" />}
            variant={isActive ? "success" : "warning"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BHCard variant="elevated" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Acesso à loja</h2>
                <p className="text-sm text-muted-foreground">
                  Compre produtos com preço de clube.
                </p>
              </div>
            </div>
            <Button asChild className="w-full">
              <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                Ir para a loja
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </BHCard>

          <BHCard variant="elevated" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/30 text-accent-foreground">
                <CalendarHeart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Próximo evento</h2>
                <p className="text-sm text-muted-foreground">
                  Em breve — eventos serão publicados pela admin (F-V15).
                </p>
              </div>
            </div>
            <Button variant="outline" disabled className="w-full">
              Aguardando publicação
            </Button>
          </BHCard>
        </div>

        <BHCard variant="gradient" className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Link de convite</h2>
              <p className="text-sm text-muted-foreground">
                Compartilhe seu código <span className="font-medium">{member.ref_code}</span>{" "}
                pra trazer novas pessoas.
              </p>
            </div>
            <Button variant="secondary" disabled className="self-start">
              <Copy className="w-4 h-4 mr-2" />
              Copiar (em breve)
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/club"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Users className="w-4 h-4" />
              Ver minha comunidade
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Meu perfil
            </Link>
          </div>
        </BHCard>
      </div>
    </PartnerShell>
  )
}
