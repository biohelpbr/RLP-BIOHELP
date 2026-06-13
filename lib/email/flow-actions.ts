"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createServiceClient, isCurrentUserAdmin } from "@/lib/supabase/server"
import { DEFAULT_FLOW_KEY, type FlowStep } from "./flow"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return { ok: false, error: "Apenas administradores podem executar esta ação." }
  return { ok: true }
}

const stepSchema = z.object({
  step_order: z.coerce.number().int().min(1, "Ordem mínima: 1."),
  delay_days: z.coerce.number().int().min(0, "Delay não pode ser negativo."),
  subject: z.string().trim().min(2, "Assunto obrigatório."),
  body: z.string().trim().min(2, "Corpo obrigatório."),
  enabled: z.coerce.boolean().default(true),
})

const ADMIN_PATH = "/admin/emails/fluxo"

/** Todos os passos do fluxo (inclui desabilitados) — pro CMS admin. */
export async function listAdminFlowSteps(flowKey = DEFAULT_FLOW_KEY): Promise<FlowStep[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_flow_steps")
    .select("*")
    .eq("flow_key", flowKey)
    .order("step_order", { ascending: true })
  if (error) {
    console.error("[listAdminFlowSteps]", error)
    return []
  }
  return (data || []) as FlowStep[]
}

export async function createFlowStep(input: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = stepSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("email_flow_steps")
    .insert({
      flow_key: DEFAULT_FLOW_KEY,
      step_order: parsed.data.step_order,
      delay_days: parsed.data.delay_days,
      subject: parsed.data.subject,
      body: parsed.data.body,
      enabled: parsed.data.enabled,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Já existe um passo com essa ordem.", field: "step_order" }
    console.error("[createFlowStep]", error)
    return { ok: false, error: "Não foi possível criar o passo." }
  }

  revalidatePath(ADMIN_PATH)
  return { ok: true, data: { id: data.id as string } }
}

export async function updateFlowStep(id: string, input: unknown): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const parsed = stepSchema.partial().safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("email_flow_steps")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Já existe um passo com essa ordem.", field: "step_order" }
    console.error("[updateFlowStep]", error)
    return { ok: false, error: "Não foi possível atualizar o passo." }
  }

  revalidatePath(ADMIN_PATH)
  return { ok: true }
}

export async function deleteFlowStep(id: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase.from("email_flow_steps").delete().eq("id", id)
  if (error) {
    console.error("[deleteFlowStep]", error)
    return { ok: false, error: "Não foi possível remover o passo." }
  }

  revalidatePath(ADMIN_PATH)
  return { ok: true }
}

export async function toggleFlowStep(id: string, enabled: boolean): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("email_flow_steps")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) {
    console.error("[toggleFlowStep]", error)
    return { ok: false, error: "Não foi possível alterar o passo." }
  }

  revalidatePath(ADMIN_PATH)
  return { ok: true }
}
