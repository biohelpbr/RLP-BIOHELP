import { notFound } from "next/navigation"

import { createServiceClient } from "@/lib/supabase/server"
import { isCreatorsHubRefCode } from "@/lib/settings/queries"

import { ConviteBiohelp } from "./ConviteBiohelp"
import { ConviteCreatorsHub } from "./ConviteCreatorsHub"

interface ConvitePageProps {
  params: Promise<{ ref_code: string }>
}

/**
 * Landing de convite. Dois funis convivem (cliente, 28/07):
 *   • Creators Hub — só para os códigos em `creators_hub_links.ref_codes`
 *     (hoje ADMIN002). Visual novo + oferta própria + página de obrigado.
 *   • Nutrition Club — padrão para todos os outros convites.
 * A lista é editável em /admin/settings, sem deploy.
 */
export default async function ConvitePage({ params }: ConvitePageProps) {
  const { ref_code } = await params

  const supabase = createServiceClient()
  const { data: sponsor } = await supabase
    .from("members")
    .select("ref_code, name, subscription_status")
    .eq("ref_code", ref_code)
    .maybeSingle()

  if (!sponsor || sponsor.subscription_status === "cancelled") {
    notFound()
  }

  const refCode = sponsor.ref_code as string

  if (await isCreatorsHubRefCode(refCode)) {
    return <ConviteCreatorsHub refCode={refCode} />
  }

  const sponsorName = (sponsor.name as string | null) ?? "alguém especial"
  return <ConviteBiohelp refCode={refCode} sponsorName={sponsorName} />
}
