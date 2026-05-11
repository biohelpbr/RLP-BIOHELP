import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Crown, UserPlus, Users } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberNetworkV2 } from "@/lib/network/v2"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHAvatar, BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * `/dashboard/club` — Minha Comunidade (visão restrita F-V11).
 *
 * Mostra sponsor + lista N1 do membro logado. Sem árvore multinível, sem CV,
 * sem ranks. Anti-SPEC §12-13 respeitada — modelo v2 puro.
 *
 * Quando LRP_V2 OFF, redireciona pra /dashboard (rota v1) já que esta tela
 * só existe no v2.
 */
export default async function ClubPage() {
  if (!isV2Enabled()) {
    redirect("/dashboard")
  }

  const member = await getCurrentMember()
  if (!member) {
    redirect("/login")
  }

  const network = await getMemberNetworkV2(member.id)
  const sponsor = network?.sponsor ?? null
  const directReports = network?.direct_reports ?? []
  const isActive = member.status === "active"

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  return (
    <PartnerShell memberName={member.name} isActive={isActive} memberSubtitle={getMemberSubtitle(member)}>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Minha comunidade</h1>
          <p className="text-muted-foreground">
            Quem te trouxe e quem você trouxe pro Biohelp.
          </p>
        </div>

        <BHCard variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quem te trouxe (sponsor)
            </h2>
          </div>
          {sponsor ? (
            <div className="flex items-center gap-4">
              <BHAvatar name={sponsor.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{sponsor.name}</p>
                <p className="text-sm text-muted-foreground">
                  Código: <span className="font-medium">{sponsor.ref_code}</span>
                  {sponsor.is_house_account && " · House account"}
                </p>
              </div>
              <Badge variant={sponsor.status === "active" ? "default" : "secondary"}>
                {sponsor.status === "active"
                  ? "Ativa"
                  : sponsor.status === "pending"
                  ? "Pendente"
                  : "Inativa"}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Você foi cadastrada direto pela admin — sem sponsor associado.
            </p>
          )}
        </BHCard>

        <BHCard variant="elevated" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pessoas que você trouxe ({directReports.length})
              </h2>
            </div>
            <Button size="sm" variant="outline" disabled>
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar
            </Button>
          </div>

          {directReports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-foreground font-medium">Você ainda não trouxe ninguém.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Compartilhe seu código <span className="font-medium">{member.ref_code}</span> e
                veja sua comunidade crescer aqui.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {directReports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <BHAvatar name={report.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.ref_code} · entrou em {formatDate(report.created_at)}
                    </p>
                  </div>
                  <Badge variant={report.status === "active" ? "default" : "secondary"}>
                    {report.status === "active"
                      ? "Ativa"
                      : report.status === "pending"
                      ? "Pendente"
                      : "Inativa"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </div>
    </PartnerShell>
  )
}
