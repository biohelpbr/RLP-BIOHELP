"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient, getCurrentMember } from "@/lib/supabase/server"
import { leadInputSchema, saleInputSchema } from "./schema"

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export async function createLead(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const parsed = leadInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("member_leads")
    .insert({
      member_id: member.id,
      name: parsed.data.name,
      contact: parsed.data.contact,
      target_product: parsed.data.target_product || null,
      note: parsed.data.note || null,
      last_contact_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createLead]", error)
    return { ok: false, error: "Não foi possível registrar o lead." }
  }

  revalidatePath("/dashboard/orders")
  return { ok: true, data: { id: data.id as string } }
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada." }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("member_leads")
    .delete()
    .eq("id", leadId)
    .eq("member_id", member.id)

  if (error) {
    console.error("[deleteLead]", error)
    return { ok: false, error: "Não foi possível remover o lead." }
  }

  revalidatePath("/dashboard/orders")
  return { ok: true }
}

export async function createSale(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada. Faça login novamente." }

  const parsed = saleInputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path.join(".") }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("member_sales")
    .insert({
      member_id: member.id,
      customer_name: parsed.data.customer_name,
      product_name: parsed.data.product_name || null,
      qty: parsed.data.qty,
      paid_amount: parsed.data.paid_amount,
      payment_method: parsed.data.payment_method,
      sold_at: parsed.data.sold_at,
      note: parsed.data.note || null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createSale]", error)
    return { ok: false, error: "Não foi possível registrar a venda." }
  }

  revalidatePath("/dashboard/orders")
  return { ok: true, data: { id: data.id as string } }
}

export async function deleteSale(saleId: string): Promise<ActionResult> {
  const member = await getCurrentMember()
  if (!member) return { ok: false, error: "Sessão expirada." }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("member_sales")
    .delete()
    .eq("id", saleId)
    .eq("member_id", member.id)

  if (error) {
    console.error("[deleteSale]", error)
    return { ok: false, error: "Não foi possível remover a venda." }
  }

  revalidatePath("/dashboard/orders")
  return { ok: true }
}
