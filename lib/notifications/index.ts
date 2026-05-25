/**
 * F-V19 / A5+U6 — Notificações in-app.
 *
 * Queries server-side. Use `createServiceClient` (bypassa RLS — chamadas
 * sempre de RSC ou server actions verificando admin antes).
 *
 * Schema: `notifications` (migration 20260522_f-v19-pre-cadastro-guru.sql).
 *   recipient_role: 'admin' | 'member'
 *   recipient_member_id: NULL pra admin, UUID pro member.
 */

import { createServiceClient } from "@/lib/supabase/server"

export type NotificationKind =
  | "pre_registration_created"
  | "subscription_paid"
  | "subscription_refunded"
  | string

export interface NotificationRow {
  id: string
  recipient_role: "admin" | "member"
  recipient_member_id: string | null
  kind: NotificationKind
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

/** Últimas N notificações de admin (lidas + não lidas). */
export async function listAdminNotifications(limit: number = 20): Promise<NotificationRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("id, recipient_role, recipient_member_id, kind, title, body, href, read_at, created_at")
    .eq("recipient_role", "admin")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[notifications.listAdminNotifications]", error)
    return []
  }
  return (data as NotificationRow[] | null) ?? []
}

/** Conta de não-lidas (cheap query pra badge). */
export async function countAdminUnread(): Promise<number> {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_role", "admin")
    .is("read_at", null)

  if (error) {
    console.error("[notifications.countAdminUnread]", error)
    return 0
  }
  return count ?? 0
}
