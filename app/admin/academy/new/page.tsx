import { redirect } from "next/navigation"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { TrailForm } from "../TrailForm"

export default async function NewTrailPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Nova trilha</h1>
          <p className="text-muted-foreground">
            Crie a trilha em rascunho e adicione módulos. Publique quando estiver pronta.
          </p>
        </header>
        <BHCard variant="elevated">
          <TrailForm />
        </BHCard>
      </div>
    </AdminShell>
  )
}
