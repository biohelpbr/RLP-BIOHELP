import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { GroupForm } from "../../GroupForm"

export default async function NewGroupPage() {
  if (!isV2Enabled()) redirect("/admin")
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6 max-w-2xl">
        <Link href="/admin/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Novo Grande Grupo</h1>
        <BHCard variant="elevated">
          <GroupForm />
        </BHCard>
      </div>
    </AdminShell>
  )
}
