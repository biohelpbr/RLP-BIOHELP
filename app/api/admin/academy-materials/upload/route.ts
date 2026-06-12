/**
 * API: POST /api/admin/academy-materials/upload
 * F-V31 — Upload de material complementar (PDF) de um Grande Grupo.
 *
 * Admin-only. Sobe o PDF pro bucket público `academy-materials` e retorna a URL.
 */
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED = ["application/pdf"]

export async function POST(request: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Apenas administradores." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "Arquivo é obrigatório." }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Envie um PDF." }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 20MB." }, { status: 400 })
  }

  const supabase = createServiceClient()
  const fileName = `material_${Date.now()}_${file.size}.pdf`

  const { error: uploadError } = await supabase.storage
    .from("academy-materials")
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error("[academy-materials.upload]", uploadError)
    if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
      return NextResponse.json(
        { error: "Bucket 'academy-materials' não configurado. Rode a migration F-V31." },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: "Erro ao subir o arquivo." }, { status: 500 })
  }

  const { data } = supabase.storage.from("academy-materials").getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
