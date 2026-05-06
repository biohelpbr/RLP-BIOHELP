import { redirect } from "next/navigation"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { EventForm } from "../EventForm"

export default async function NewEventPage() {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Novo evento</h1>
          <p className="text-muted-foreground">
            Defina período, modo, link de adesão e produtos elegíveis. A tag{" "}
            <code className="text-xs">evento:&lt;slug&gt;</code> é aplicada automaticamente em quem
            comprar pelo link no período.
          </p>
        </header>

        <BHCard variant="elevated">
          <EventForm />
        </BHCard>
      </div>
    </AdminShell>
  )
}
