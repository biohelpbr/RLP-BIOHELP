import { redirect } from "next/navigation"
import Link from "next/link"
import {
  CalendarHeart,
  ExternalLink,
  Link2,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberNetworkV2 } from "@/lib/network/v2"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { getNextPublishedEvent } from "@/lib/events/queries"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHCard, BHStat, CopyButton } from "@/components/biohelp"
import { Button } from "@/components/ui/button"

function formatEventWindow(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  if (start.toDateString() === end.toDateString()) return fmt(start)
  return `${fmt(start)} → ${fmt(end)}`
}

function buildInviteUrl(refCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  // Path-only é suficiente (browser resolve com origem atual no clipboard).
  // Mas pra compartilhamento WhatsApp, melhor URL absoluta quando temos.
  return base ? `${base}/join?ref=${refCode}` : `/join?ref=${refCode}`
}

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

  const [network, nextEvent] = await Promise.all([
    getMemberNetworkV2(member.id),
    getNextPublishedEvent(),
  ])
  const directReportsCount = network?.direct_reports.length ?? 0
  const isActive = member.status === "active"
  const shopUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL ?? "#"

  return (
    <PartnerShell memberName={member.name} isActive={isActive} memberSubtitle={getMemberSubtitle(member)}>
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
                <h2 className="text-lg font-semibold">
                  {nextEvent ? nextEvent.name : "Próximo evento"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {nextEvent ? (
                    <>
                      {formatEventWindow(nextEvent.start_at, nextEvent.end_at)}
                      {" · "}
                      {nextEvent.mode === "online"
                        ? "Online"
                        : nextEvent.mode === "presencial"
                        ? "Presencial"
                        : "Híbrido"}
                      {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                    </>
                  ) : (
                    "Em breve — eventos serão publicados pela admin."
                  )}
                </p>
              </div>
            </div>
            {nextEvent ? (
              <Button asChild variant="outline" className="w-full">
                <a
                  href={`/r/${nextEvent.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Saber mais
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full">
                Aguardando publicação
              </Button>
            )}
          </BHCard>
        </div>

        <BHCard variant="gradient" className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Link de convite</h2>
              <p className="text-sm text-muted-foreground">
                Compartilhe seu código <span className="font-medium">{member.ref_code}</span>{" "}
                ou o link completo abaixo pra trazer novas pessoas.
              </p>
              <code className="mt-2 inline-block text-xs bg-background/60 px-2 py-1 rounded border border-border break-all">
                {buildInviteUrl(member.ref_code)}
              </code>
            </div>
            <div className="flex flex-col gap-2 self-start">
              <CopyButton
                value={buildInviteUrl(member.ref_code)}
                label="Copiar link"
                copiedLabel="Link copiado!"
              />
              <CopyButton
                value={member.ref_code}
                label="Copiar código"
                variant="outline"
                copiedLabel="Código copiado!"
              />
            </div>
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
