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
  moduleUpdateSchema,
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
  revalidatePath("/dashboard/academy")
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
  revalidatePath(`/dashboard/academy/${parsed.data.trail_id}`)
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
  revalidatePath(`/dashboard/academy/${trailId}`)
  return { ok: true }
}

/**
 * W6 (call 05/06) — editar aula existente (título / tipo / URL / texto)
 * pelo admin, sem mexer na ordem.
 */
export async function updateModule(
  moduleId: string,
  trailId: string,
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = moduleUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("content_modules")
    .update({
      title: parsed.data.title,
      kind: parsed.data.kind,
      content_url: parsed.data.content_url || null,
      content_text: parsed.data.content_text || null,
    })
    .eq("id", moduleId)

  if (error) {
    console.error("[updateModule]", error)
    return { ok: false, error: "Não foi possível atualizar a aula." }
  }

  revalidatePath(`/admin/academy/${trailId}`)
  revalidatePath(`/dashboard/academy/${trailId}`)
  return { ok: true }
}

/**
 * W6 (call 05/06) — reordenação por subir/descer gravando display_order.
 * Normaliza a sequência (0..n-1) e troca a posição com o vizinho — robusto
 * mesmo quando há display_order duplicado/esparso de cadastros antigos.
 */
async function swapOrder(
  table: "content_trails" | "content_modules",
  rows: Array<{ id: string }>,
  targetId: string,
  direction: "up" | "down",
): Promise<string | null> {
  const idx = rows.findIndex((r) => r.id === targetId)
  if (idx < 0) return "Item não encontrado."
  const otherIdx = direction === "up" ? idx - 1 : idx + 1
  if (otherIdx < 0 || otherIdx >= rows.length) return null // já está na ponta — no-op

  const ordered = rows.map((r) => r.id)
  ;[ordered[idx], ordered[otherIdx]] = [ordered[otherIdx], ordered[idx]]

  const supabase = createServiceClient()
  for (let i = 0; i < ordered.length; i++) {
    const { error } = await supabase
      .from(table)
      .update({ display_order: i })
      .eq("id", ordered[i])
    if (error) {
      console.error(`[swapOrder.${table}]`, error)
      return "Não foi possível salvar a nova ordem."
    }
  }
  return null
}

export async function moveTrail(
  trailId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_trails")
    .select("id")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (error || !data) return { ok: false, error: "Não foi possível carregar as trilhas." }

  const err = await swapOrder("content_trails", data, trailId, direction)
  if (err) return { ok: false, error: err }

  revalidatePath("/admin/academy")
  revalidatePath("/dashboard/academy")
  return { ok: true }
}

export async function moveModule(
  moduleId: string,
  trailId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("content_modules")
    .select("id")
    .eq("trail_id", trailId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error || !data) return { ok: false, error: "Não foi possível carregar as aulas." }

  const err = await swapOrder("content_modules", data, moduleId, direction)
  if (err) return { ok: false, error: err }

  revalidatePath(`/admin/academy/${trailId}`)
  revalidatePath(`/dashboard/academy/${trailId}`)
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
