"use client"

import { useState, useTransition } from "react"
import { Loader2, Wrench, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { applyAffiliateCollectionAction } from "@/lib/affiliates/actions"
import type { FixPriceRuleResult } from "@/lib/shopify/affiliate-coupons"

/**
 * F-V35 — corrige a price rule existente "Afiliados — 10%" pra Desconto de
 * produto na coleção Loja Biohelp (conserta todos os cupons de uma vez).
 */
export function ApplyCollectionButton() {
  const [res, setRes] = useState<FixPriceRuleResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function run() {
    if (!window.confirm(
      "Atualizar a price rule 'Afiliados — 10%' de produção para Desconto de produto (coleção Loja Biohelp)? Afeta todos os cupons existentes.",
    )) return
    setError(null)
    setRes(null)
    start(async () => {
      const r = await applyAffiliateCollectionAction()
      if (!r.ok) return setError(r.error)
      setRes(r.data)
    })
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="sm" onClick={run} disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
        Aplicar coleção Loja Biohelp na price rule
      </Button>

      {res && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Price rule <span className="font-mono text-xs">{res.priceRuleId}</span> atualizada:{" "}
            target = <strong>{res.targetSelection}</strong> · coleções ={" "}
            <span className="font-mono text-xs">{(res.entitledCollectionIds ?? []).join(", ") || "—"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Esperado: target <strong>entitled</strong> e coleção <strong>282660405338</strong> (Loja Biohelp).
          </p>
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
