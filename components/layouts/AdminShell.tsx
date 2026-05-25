import * as React from "react"
import { AdminSidebar } from "./AdminSidebar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import {
  countAdminUnread,
  listAdminNotifications,
} from "@/lib/notifications"

interface AdminShellProps {
  adminName: string
  children: React.ReactNode
}

/**
 * Shell visual da área admin (v2). Server Component.
 * F-V19: header com NotificationBell SSR-fetched (RF-10, CA-16).
 */
export async function AdminShell({ adminName, children }: AdminShellProps) {
  const [items, unreadCount] = await Promise.all([
    listAdminNotifications(20),
    countAdminUnread(),
  ])

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar adminName={adminName} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end gap-3 px-4 lg:px-8 py-3 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
          <NotificationBell items={items} unreadCount={unreadCount} />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
