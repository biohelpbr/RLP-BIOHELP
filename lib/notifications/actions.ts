"use server"

import { createServiceClient } from "@/lib/supabase/server"

/**
 * F-V19 / A5+U6 — Server Actions de notificações.
 *
 * Use estas para escrever (createNotification) e marcar como lida
 * (markRead, markAllRead). Reads ficam em lib/notifications/index.ts.
 *
 * Auth: estas actions confiam que o caller (RSC ou outra server action)
 * já validou o role. O bell client chama markRead/markAllRead apenas
 * quando renderizado dentro do AdminShell (RSC verifica admin antes).
 */

interface CreateInput {
  recipient_role: "admin" | "member"
  recipient_member_id?: string | null
  kind: string
  title: string
  body?: string | null
  href?: string | null
}

type ActionResult = { ok: true } | { ok: false; error: string }

export async function createNotification(input: CreateInput): Promise<ActionResult> {
  const supabase = createServiceClient()
  const { error } = await supabase.from("notifications").insert({
    recipient_role: input.recipient_role,
    recipient_member_id: input.recipient_member_id ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  })
  if (error) {
    console.error("[notifications.createNotification]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function markRead(notificationId: string): Promise<ActionResult> {
  if (!notificationId) return { ok: false, error: "notificationId obrigatório" }
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null)
  if (error) {
    console.error("[notifications.markRead]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function markAllAdminRead(): Promise<ActionResult> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_role", "admin")
    .is("read_at", null)
  if (error) {
    console.error("[notifications.markAllAdminRead]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
