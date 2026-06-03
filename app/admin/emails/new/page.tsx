import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { countSegment } from "@/lib/email/queries"
import type { EmailSegment } from "@/lib/email/schema"
import { EmailComposer } from "../EmailComposer"

export default async function NewEmailPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const segments: EmailSegment[] = ["all", "active", "pending", "canceled"]
  const counts = Object.fromEntries(
    await Promise.all(segments.map(async (s) => [s, await countSegment(s)] as const)),
  ) as Record<EmailSegment, number>

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/admin/emails"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para e-mails
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Nova campanha</h1>
          <p className="text-muted-foreground">
            Escreva o e-mail, envie um teste pra você e crie a campanha. O disparo pra base é
            confirmado na tela seguinte.
          </p>
        </header>

        <BHCard variant="elevated">
          <EmailComposer counts={counts} adminEmail={member.email ?? ""} />
        </BHCard>
      </div>
    </AdminShell>
  )
}
