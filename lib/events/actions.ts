"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import { eventInputSchema, eventUpdateSchema, eventAttendanceSchema } from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

export async function createEvent(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = eventInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      slug: parsed.data.slug,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      mode: parsed.data.mode,
      location: parsed.data.location || null,
      redirect_url: parsed.data.redirect_url || null,
      cost: parsed.data.cost,
      status: parsed.data.status,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createEvent]", error)
    if (error.code === "23505") {
      return { ok: false, error: "Já existe um evento com este slug.", field: "slug" }
    }
    return { ok: false, error: "Não foi possível criar o evento." }
  }

  if (parsed.data.eligible_product_ids.length > 0) {
    const rows = parsed.data.eligible_product_ids.map((pid) => ({
      event_id: data.id as string,
      shopify_product_id: pid,
    }))
    const { error: prodError } = await supabase.from("event_eligible_products").insert(rows)
    if (prodError) {
      console.error("[createEvent.products]", prodError)
    }
  }

  revalidatePath("/admin/events")
  return { ok: true, data: { id: data.id as string } }
}

export async function updateEvent(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = eventUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const { eligible_product_ids, ...rest } = parsed.data as Record<string, unknown> & {
    eligible_product_ids?: string[]
  }

  const supabase = createServiceClient()
  if (Object.keys(rest).length > 0) {
    const { error } = await supabase.from("events").update(rest).eq("id", id)
    if (error) {
      console.error("[updateEvent]", error)
      return { ok: false, error: "Não foi possível atualizar o evento." }
    }
  }

  if (Array.isArray(eligible_product_ids)) {
    await supabase.from("event_eligible_products").delete().eq("event_id", id)
    if (eligible_product_ids.length > 0) {
      const rows = eligible_product_ids.map((pid) => ({
        event_id: id,
        shopify_product_id: pid,
      }))
      await supabase.from("event_eligible_products").insert(rows)
    }
  }

  revalidatePath("/admin/events")
  revalidatePath(`/admin/events/${id}`)
  return { ok: true }
}

export async function markAttendance(input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = eventAttendanceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("event_attendances").upsert(
    {
      event_id: parsed.data.event_id,
      member_id: parsed.data.member_id,
      attended: parsed.data.attended,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "event_id,member_id" },
  )

  if (error) {
    console.error("[markAttendance]", error)
    return { ok: false, error: "Não foi possível registrar a presença." }
  }

  revalidatePath(`/admin/events/${parsed.data.event_id}`)
  return { ok: true }
}
