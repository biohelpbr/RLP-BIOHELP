import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AtSign, Crown, Hash, Phone, User as UserIcon } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberNetworkV2 } from "@/lib/network/v2"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { BHAvatar, BHCard } from "@/components/biohelp"

/**
 * `/dashboard/profile` — Meu Perfil v2 (read-only em S1).
 *
 * Edição entra em S2. Anti-SPEC §12-13 respeitada — modelo v2 puro
 * (sem CV/ranks/Triple3). Quando LRP_V2 OFF, redireciona pra /dashboard.
 */
export default async function ProfilePage() {
  if (!isV2Enabled()) {
    redirect("/dashboard")
  }

  const member = await getCurrentMember()
  if (!member) {
    redirect("/login")
  }

  const network = await getMemberNetworkV2(member.id)
  const sponsor = network?.sponsor ?? null
  const isActive = member.status === "active"

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

  return (
    <PartnerShell memberName={member.name} isActive={isActive}>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Meu perfil</h1>
          <p className="text-muted-foreground">
            Seus dados de cadastro. A edição chega na próxima sprint.
          </p>
        </div>

        <BHCard variant="elevated" className="space-y-6">
          <div className="flex items-center gap-4">
            <BHAvatar name={member.name} size="xl" showStatus isActive={isActive} />
            <div>
              <p className="text-2xl font-bold text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">
                Membro desde {formatDate(member.created_at)}
              </p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              icon={<AtSign className="w-4 h-4" />}
              label="E-mail"
              value={member.email}
            />
            <ProfileField
              icon={<Phone className="w-4 h-4" />}
              label="Telefone"
              value={member.phone ?? "—"}
            />
            <ProfileField
              icon={<Hash className="w-4 h-4" />}
              label="Meu código"
              value={member.ref_code}
            />
            <ProfileField
              icon={<UserIcon className="w-4 h-4" />}
              label="Status"
              value={
                isActive
                  ? "Ativa"
                  : member.status === "pending"
                  ? "Pendente"
                  : "Inativa"
              }
            />
          </dl>
        </BHCard>

        <BHCard variant="default" className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quem te trouxe
            </h2>
          </div>
          {sponsor ? (
            <div className="flex items-center gap-4">
              <BHAvatar name={sponsor.name} size="md" />
              <div>
                <p className="font-medium text-foreground">{sponsor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sponsor.ref_code}
                  {sponsor.is_house_account && " · House account"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cadastro direto pela admin — sem sponsor.
            </p>
          )}
        </BHCard>
      </div>
    </PartnerShell>
  )
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
    </div>
  )
}
