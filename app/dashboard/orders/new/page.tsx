import { redirect } from "next/navigation"
import { isV2Enabled } from "@/lib/utils/featureFlags"
import { getCurrentMember } from "@/lib/supabase/server"
import { getMemberSubtitle } from "@/lib/members/subtitle"
import { PartnerShell } from "@/components/layouts/PartnerShell"
import { OrdersNewForm } from "./OrdersNewForm"

interface OrdersNewPageProps {
  searchParams: Promise<{ tipo?: string }>
}

/**
 * `/dashboard/orders/new?tipo=lead|venda` — F-V14 (formulário).
 *
 * Server Component que gate por flag e busca member; delega o form a um
 * client component (`OrdersNewForm`) que chama as Server Actions.
 */
export default async function OrdersNewPage({ searchParams }: OrdersNewPageProps) {
  if (!isV2Enabled()) redirect("/dashboard")

  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const sp = await searchParams
  const tipo = sp.tipo === "lead" ? "lead" : "venda"

  return (
    <PartnerShell memberName={member.name} isActive={member.subscription_status === "paid"} memberSubtitle={getMemberSubtitle(member)}>
      <OrdersNewForm initialTipo={tipo} />
    </PartnerShell>
  )
}
