import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember, isCurrentUserAdmin } from "@/lib/supabase/server"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { getAnnouncementById } from "@/lib/announcements/queries"
import { AnnouncementForm } from "../AnnouncementForm"

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isV2Enabled()) redirect("/admin")

  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const { id } = await params
  const announcement = await getAnnouncementById(id)
  if (!announcement) notFound()

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/admin/announcements"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para avisos
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Editar aviso</h1>
        </header>

        <BHCard variant="elevated">
          <AnnouncementForm initial={announcement} />
        </BHCard>
      </div>
    </AdminShell>
  )
}
