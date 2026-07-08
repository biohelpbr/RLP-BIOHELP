/**
 * GET /api/members/me/affiliate
 * F-V35 fase 5 — visão do próprio afiliado (faturamento do mês + comissão estimada + vendas).
 *
 * Retorna isAffiliate=false quando o membro não tem cupom de afiliado (ref_code BH…).
 */

import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/supabase/server"
import { getAffiliateSelfSummary } from "@/lib/affiliates/self"

export const dynamic = "force-dynamic"

export async function GET() {
  const member = await getCurrentMember()
  if (!member) {
    return NextResponse.json({ error: "Não autenticado", code: "UNAUTHORIZED" }, { status: 401 })
  }
  const summary = await getAffiliateSelfSummary(member.id, (member as { ref_code?: string | null }).ref_code ?? null)
  return NextResponse.json(summary)
}
