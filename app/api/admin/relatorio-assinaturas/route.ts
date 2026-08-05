/**
 * GET /api/admin/relatorio-assinaturas?de=YYYY-MM-DD&ate=YYYY-MM-DD
 * CSV das assinaturas confirmadas no período (datas no fuso de Brasília).
 * Fonte: nossa base, alimentada em tempo real pelos webhooks da Guru.
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const DIA = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Apenas administradores." }, { status: 403 })
  }

  const sp = request.nextUrl.searchParams
  const de = sp.get("de") ?? ""
  const ate = sp.get("ate") ?? ""
  if (!DIA.test(de) || !DIA.test(ate)) {
    return NextResponse.json({ error: "Parâmetros de/ate no formato YYYY-MM-DD." }, { status: 400 })
  }

  // tipo=pendentes → quem se cadastrou no período e não comprou (recorte por
  // data de cadastro). Default → assinaturas confirmadas (por data de pagamento).
  const pendentes = sp.get("tipo") === "pendentes"
  const campoData = pendentes ? "created_at" : "subscription_paid_at"

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("members")
    .select(`name, email, phone, ${campoData}, sponsor:members!sponsor_id(name, ref_code)`)
    .eq("subscription_status", pendentes ? "pending" : "paid")
    .gte(campoData, `${de}T00:00:00-03:00`)
    .lte(campoData, `${ate}T23:59:59.999-03:00`)
    .order(campoData, { ascending: false })
    .limit(5000)

  if (error) {
    console.error("[relatorio-assinaturas]", error)
    return NextResponse.json({ error: "Erro ao consultar." }, { status: 500 })
  }

  const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`
  const cabecalhoData = pendentes ? "Data do cadastro (Brasília)" : "Data do pagamento (Brasília)"
  const linhas = [`Nome;E-mail;Telefone;Indicado por;Código;${cabecalhoData}`]
  for (const r of (data || []) as Array<Record<string, unknown>>) {
    const s0 = r.sponsor as { name?: string; ref_code?: string } | { name?: string; ref_code?: string }[] | null
    const s = Array.isArray(s0) ? s0[0] : s0
    const dt = new Date(String(r[campoData])).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })
    linhas.push(
      [
        esc(String(r.name ?? "")),
        esc(String(r.email ?? "")),
        esc(String(r.phone ?? "")),
        esc(String(s?.name ?? "")),
        esc(String(s?.ref_code ?? "")),
        esc(dt),
      ].join(";"),
    )
  }

  // BOM pro Excel abrir acentuação certa; ; como separador (padrão BR).
  const csv = "﻿" + linhas.join("\r\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${pendentes ? "nao-compraram" : "assinaturas"}-${de}-a-${ate}.csv"`,
    },
  })
}
