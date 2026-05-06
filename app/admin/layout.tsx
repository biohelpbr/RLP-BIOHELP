import * as React from "react"

/**
 * Layout admin — placeholder em S1.
 *
 * Em S1 ficamos passthrough porque as páginas admin v1 (`/admin`,
 * `/admin/products`, `/admin/payouts`, etc.) já trazem sua própria sidebar
 * embutida no `page.tsx`. Aplicar o `<AdminShell>` aqui agora duplicaria
 * sidebars enquanto a flag LRP_V2 está ON.
 *
 * S3 troca este arquivo para envolver com `<AdminShell adminName={...}>`
 * quando as 5 páginas admin v2 (Overview/Community/Growth/Consumption/Products)
 * forem implementadas. Ver docs/sdd/CRONOGRAMA-V2.md §S3.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
