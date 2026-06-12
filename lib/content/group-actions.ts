"use server"

import { revalidatePath } from "next/cache"
import {
  createServiceClient,
  getCurrentMember,
  isCurrentUserAdmin,
} from "@/lib/supabase/server"
import {
  academyGroupInputSchema,
  academyGroupUpdateSchema,
  groupMaterialInputSchema,
} from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

// ── CRUD do Grande Grupo (admin) ─────────────────────────────────────────────

export async function createGroup(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = academyGroupInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("academy_groups")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      access_mode: parsed.data.access_mode,
      lock_cta_label: parsed.data.lock_cta_label || null,
      lock_modal_title: parsed.data.lock_modal_title || null,
      lock_modal_body: parsed.data.lock_modal_body || null,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createGroup]", error)
    return { ok: false, error: "Não foi possível criar o grupo." }
  }
  revalidatePath("/admin/academy")
  revalidatePath("/dashboard/academy")
  return { ok: true, data: { id: data.id as string } }
}

export async function updateGroup(id: string, input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = academyGroupUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("academy_groups").update(parsed.data).eq("id", id)
  if (error) {
    console.error("[updateGroup]", error)
    return { ok: false, error: "Não foi possível atualizar o grupo." }
  }
  revalidatePath("/admin/academy")
  revalidatePath("/dashboard/academy")
  revalidatePath(`/dashboard/academy/grupo/${id}`)
  return { ok: true }
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  // Trilhas do grupo viram "sem grupo" (FK ON DELETE SET NULL cuida disso no banco).
  const { error } = await supabase.from("academy_groups").delete().eq("id", id)
  if (error) {
    console.error("[deleteGroup]", error)
    return { ok: false, error: "Não foi possível remover o grupo." }
  }
  revalidatePath("/admin/academy")
  revalidatePath("/dashboard/academy")
  return { ok: true }
}

export async function moveGroup(groupId: string, direction: "up" | "down"): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("academy_groups")
    .select("id")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error || !data) return { ok: false, error: "Não foi possível carregar os grupos." }

  const rows = data as Array<{ id: string }>
  const idx = rows.findIndex((r) => r.id === groupId)
  if (idx < 0) return { ok: false, error: "Grupo não encontrado." }
  const other = direction === "up" ? idx - 1 : idx + 1
  if (other < 0 || other >= rows.length) return { ok: true } // ponta — no-op

  const ordered = rows.map((r) => r.id)
  ;[ordered[idx], ordered[other]] = [ordered[other], ordered[idx]]
  for (let i = 0; i < ordered.length; i++) {
    const { error: e } = await supabase.from("academy_groups").update({ display_order: i }).eq("id", ordered[i])
    if (e) {
      console.error("[moveGroup]", e)
      return { ok: false, error: "Não foi possível salvar a ordem." }
    }
  }
  revalidatePath("/admin/academy")
  revalidatePath("/dashboard/academy")
  return { ok: true }
}

// ── Ativação por membro (fricção positiva, agora no grupo) ────────────────────

/**
 * F-V31 — a parceira ativa pra ela mesma um grupo travado. Idempotente pelo
 * UNIQUE(group_id, member_id). Substitui o activateTrail do F-V27.
 */
export async function activateGroup(groupId: string): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const supabase = createServiceClient()
  const { data: group } = await supabase
    .from("academy_groups")
    .select("id, access_mode")
    .eq("id", groupId)
    .maybeSingle()
  if (!group) return { ok: false, error: "Grupo não encontrado." }
  if (group.access_mode !== "locked") return { ok: false, error: "Este grupo não precisa de ativação." }

  const { error } = await supabase
    .from("member_group_activations")
    .insert({ group_id: groupId, member_id: member.id })
  if (error && error.code !== "23505") {
    console.error("[activateGroup]", error)
    return { ok: false, error: "Não foi possível ativar o grupo." }
  }
  revalidatePath("/dashboard/academy")
  revalidatePath(`/dashboard/academy/grupo/${groupId}`)
  return { ok: true }
}

// ── Material complementar (PDFs) ─────────────────────────────────────────────

export async function addGroupMaterial(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = groupMaterialInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("academy_group_materials")
    .insert({
      group_id: parsed.data.group_id,
      title: parsed.data.title,
      file_url: parsed.data.file_url,
      display_order: parsed.data.display_order,
    })
    .select("id")
    .single()
  if (error) {
    console.error("[addGroupMaterial]", error)
    return { ok: false, error: "Não foi possível adicionar o material." }
  }
  revalidatePath(`/admin/academy/grupo/${parsed.data.group_id}`)
  revalidatePath(`/dashboard/academy/grupo/${parsed.data.group_id}`)
  return { ok: true, data: { id: data.id as string } }
}

export async function removeGroupMaterial(materialId: string, groupId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase.from("academy_group_materials").delete().eq("id", materialId)
  if (error) {
    console.error("[removeGroupMaterial]", error)
    return { ok: false, error: "Não foi possível remover o material." }
  }
  revalidatePath(`/admin/academy/grupo/${groupId}`)
  revalidatePath(`/dashboard/academy/grupo/${groupId}`)
  return { ok: true }
}
