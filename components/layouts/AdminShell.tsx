import * as React from "react"
import { AdminSidebar } from "./AdminSidebar"

interface AdminShellProps {
  adminName: string
  children: React.ReactNode
}

/**
 * Shell visual da área admin (v2). Server Component. Em S1 ainda não há
 * páginas admin v2 — será plugado em S3 quando Overview/Community/etc. existirem.
 */
export function AdminShell({ adminName, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar adminName={adminName} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
