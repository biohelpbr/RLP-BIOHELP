"use client"

import { useState, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { lookupCustomerAffiliates, type CustomerLookupResult } from "@/lib/affiliates/actions"

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/** F-V35 fase 4 — consultar Originador + histórico (Atual) de um cliente por e-mail. */
export function CustomerLookup() {
  const [email, setEmail] = useState("")
  const [res, setRes] = useState<CustomerLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setRes(null)
    start(async () => {
      const r = await lookupCustomerAffiliates(email)
      if (!r.ok) return setError(r.error)
      setRes(r.data)
    })
  }

  const fmt = (m: { ref_code: string | null; name: string | null } | null) =>
    m ? `${m.name || "—"} (${m.ref_code || "—"})` : "—"

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e-mail do cliente"
          className="min-w-[240px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Consultar
        </Button>
      </form>

      {res && (
        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p><span className="text-muted-foreground">Originador:</span> <strong>{fmt(res.originador)}</strong></p>
          {res.sales.length === 0 ? (
            <p className="text-muted-foreground">Sem vendas registradas para este cliente.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-1 pr-2">Mês</th>
                  <th className="py-1 pr-2">Afiliado (Atual)</th>
                  <th className="py-1 pr-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {res.sales.map((s, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-1 pr-2">{s.reference_month.slice(0, 7)}</td>
                    <td className="py-1 pr-2">
                      {fmt(s.affiliate)}
                      {s.is_self_purchase && <span className="ml-1 text-xs text-muted-foreground">(autocompra)</span>}
                    </td>
                    <td className="py-1 pr-2 text-right">{brl(s.gross_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
