/**
 * API: POST /api/admin/announcements/upload
 * F-V22 — Upload de imagem do aviso (announcement bar).
 *
 * Admin-only. Sobe a imagem pro bucket público `announcements` e retorna a URL
 * pública. Upload via service client (admin-gated aqui no app).
 */
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

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
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP ou GIF." },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Imagem muito grande. Máximo 5MB." }, { status: 400 })
  }

  const supabase = createServiceClient()
  // Nome único sem depender de Math.random (que é proibido em alguns contextos):
  // timestamp + tamanho do arquivo é suficiente pra evitar colisão prática.
  const fileName = `aviso_${Date.now()}_${file.size}.${EXT[file.type]}`

  const { error: uploadError } = await supabase.storage
    .from("announcements")
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error("[announcements.upload]", uploadError)
    if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
      return NextResponse.json(
        { error: "Bucket de imagens não configurado. Rode a migration F-V22." },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: "Erro ao subir a imagem." }, { status: 500 })
  }

  const { data } = supabase.storage.from("announcements").getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
