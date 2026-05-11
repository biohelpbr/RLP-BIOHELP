import * as React from "react"
import { PartnerSidebar } from "./PartnerSidebar"

interface PartnerShellProps {
  memberName: string
  isActive?: boolean
  /** Subtítulo dinâmico do membro (ex.: "Founder Biohelp", "Líder Biohelp", "Membro do clube"). */
  memberSubtitle?: string
  children: React.ReactNode
}

/**
 * Shell visual da área do membro (v2). Server Component — renderiza a sidebar
 * (client island) e a área principal. Não busca dados; receba props do caller.
 */
export function PartnerShell({
  memberName,
  isActive,
  memberSubtitle,
  children,
}: PartnerShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <PartnerSidebar
        memberName={memberName}
        isActive={isActive}
        memberSubtitle={memberSubtitle}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
