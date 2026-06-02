"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import { announcementInputSchema, announcementUpdateSchema } from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

// "" → null pra colunas opcionais (datas e link).
function emptyToNull(v: string | null | undefined): string | null {
  if (v === undefined || v === null) return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

export async function createAnnouncement(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = announcementInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      message: parsed.data.message,
      image_url: emptyToNull(parsed.data.image_url),
      link_url: emptyToNull(parsed.data.link_url),
      cta_label: emptyToNull(parsed.data.cta_label),
      variant: parsed.data.variant,
      active: parsed.data.active,
      starts_at: emptyToNull(parsed.data.starts_at),
      ends_at: emptyToNull(parsed.data.ends_at),
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createAnnouncement]", error)
    return { ok: false, error: "Não foi possível criar o aviso." }
  }

  revalidatePath("/admin/announcements")
  revalidatePath("/dashboard")
  return { ok: true, data: { id: data.id as string } }
}

export async function updateAnnouncement(id: string, input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = announcementUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const d = parsed.data
  if (d.message !== undefined) patch.message = d.message
  if (d.image_url !== undefined) patch.image_url = emptyToNull(d.image_url)
  if (d.link_url !== undefined) patch.link_url = emptyToNull(d.link_url)
  if (d.cta_label !== undefined) patch.cta_label = emptyToNull(d.cta_label)
  if (d.variant !== undefined) patch.variant = d.variant
  if (d.active !== undefined) patch.active = d.active
  if (d.starts_at !== undefined) patch.starts_at = emptyToNull(d.starts_at)
  if (d.ends_at !== undefined) patch.ends_at = emptyToNull(d.ends_at)

  const supabase = createServiceClient()
  const { error } = await supabase.from("announcements").update(patch).eq("id", id)
  if (error) {
    console.error("[updateAnnouncement]", error)
    return { ok: false, error: "Não foi possível atualizar o aviso." }
  }

  revalidatePath("/admin/announcements")
  revalidatePath(`/admin/announcements/${id}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

/** Liga/desliga rápido o aviso sem abrir o form. */
export async function setAnnouncementActive(id: string, active: boolean): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("announcements")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[setAnnouncementActive]", error)
    return { ok: false, error: "Não foi possível alterar o status do aviso." }
  }

  revalidatePath("/admin/announcements")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase.from("announcements").delete().eq("id", id)
  if (error) {
    console.error("[deleteAnnouncement]", error)
    return { ok: false, error: "Não foi possível excluir o aviso." }
  }

  revalidatePath("/admin/announcements")
  revalidatePath("/dashboard")
  return { ok: true }
}
