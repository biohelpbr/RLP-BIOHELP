"use server"

import { revalidatePath } from "next/cache"
import {
  createServiceClient,
  getCurrentMember,
  isCurrentUserAdmin,
} from "@/lib/supabase/server"
import {
  trailInputSchema,
  trailUpdateSchema,
  moduleInputSchema,
} from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

export async function createTrail(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = trailInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_trails")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      cover_url: parsed.data.cover_url || null,
      status: parsed.data.status,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createTrail]", error)
    return { ok: false, error: "Não foi possível criar a trilha." }
  }

  revalidatePath("/admin/academy")
  return { ok: true, data: { id: data.id as string } }
}

export async function updateTrail(id: string, input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = trailUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("content_trails").update(parsed.data).eq("id", id)

  if (error) {
    console.error("[updateTrail]", error)
    return { ok: false, error: "Não foi possível atualizar a trilha." }
  }

  revalidatePath("/admin/academy")
  revalidatePath(`/admin/academy/${id}`)
  revalidatePath("/dashboard/academy")
  revalidatePath(`/dashboard/academy/${id}`)
  return { ok: true }
}

export async function deleteTrail(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase.from("content_trails").delete().eq("id", id)

  if (error) {
    console.error("[deleteTrail]", error)
    return { ok: false, error: "Não foi possível remover a trilha." }
  }

  revalidatePath("/admin/academy")
  return { ok: true }
}

export async function addModule(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = moduleInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_modules")
    .insert({
      trail_id: parsed.data.trail_id,
      title: parsed.data.title,
      kind: parsed.data.kind,
      content_url: parsed.data.content_url || null,
      content_text: parsed.data.content_text || null,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[addModule]", error)
    return { ok: false, error: "Não foi possível adicionar o módulo." }
  }

  revalidatePath(`/admin/academy/${parsed.data.trail_id}`)
  return { ok: true, data: { id: data.id as string } }
}

export async function removeModule(moduleId: string, trailId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase.from("content_modules").delete().eq("id", moduleId)

  if (error) {
    console.error("[removeModule]", error)
    return { ok: false, error: "Não foi possível remover o módulo." }
  }

  revalidatePath(`/admin/academy/${trailId}`)
  return { ok: true }
}

export async function markView(
  moduleId: string,
  completed: boolean = false,
): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from("content_views")
    .select("id, started_at, completed_at")
    .eq("module_id", moduleId)
    .eq("member_id", member.id)
    .maybeSingle()

  const nowIso = new Date().toISOString()
  if (!existing) {
    const { error } = await supabase.from("content_views").insert({
      module_id: moduleId,
      member_id: member.id,
      started_at: nowIso,
      completed_at: completed ? nowIso : null,
    })
    if (error) {
      console.error("[markView.insert]", error)
      return { ok: false, error: "Não foi possível registrar a visualização." }
    }
  } else if (completed && !existing.completed_at) {
    const { error } = await supabase
      .from("content_views")
      .update({ completed_at: nowIso })
      .eq("id", existing.id)
    if (error) {
      console.error("[markView.update]", error)
      return { ok: false, error: "Não foi possível atualizar a visualização." }
    }
  }

  revalidatePath("/dashboard/academy")
  return { ok: true }
}
