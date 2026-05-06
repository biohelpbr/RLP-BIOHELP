import * as React from "react"

/**
 * Layout do route group `(member)` — placeholder em S1.
 *
 * Em S1 não existem páginas dentro deste group, porque colocar
 * `app/(member)/dashboard/page.tsx` colidiria com `app/dashboard/page.tsx` v1
 * (Next.js rejeita duas paginas paralelas resolvendo pra mesma URL).
 *
 * As 3 telas membro v2 (Dashboard, Club, Profile) ficam em `app/dashboard/...`
 * e fazem switch interno via `isV2Enabled()`. O shell visual é aplicado
 * explicitamente nas pages através de `<PartnerShell>` (Server Component).
 *
 * Em F-V12 (cleanup, onda 6) este group pode ser usado de fato após o código
 * v1 ser removido fisicamente. Ver docs/sdd/PIVOT-V2.md §5 ONDA 6.
 */
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
