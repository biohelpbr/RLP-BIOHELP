"use client"

import { useState, useTransition } from "react"
import { Loader2, Ticket, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { bulkAffiliateCouponsAction } from "@/lib/affiliates/actions"
import type { BulkCouponResult } from "@/lib/shopify/affiliate-coupons"

/**
 * F-V35 — cria os cupons de afiliado no Shopify em massa (dry-run → executar).
 * Cada cupom = ref_code do afiliado, 10%, sob a price rule "Afiliados — 10%".
 */
export function BulkCouponsButton() {
  const [scope, setScope] = useState<"active" | "all">("active")
  const [limit, setLimit] = useState<string>("")
  const [res, setRes] = useState<BulkCouponResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function run(execute: boolean) {
    if (execute && !window.confirm(
      `Criar os cupons no Shopify de VERDADE (${scope === "all" ? "todos" : "ativos"}${limit ? `, limite ${limit}` : ""})? Isso escreve na loja de produção.`,
    )) return
    setError(null)
    if (!execute) setRes(null)
    start(async () => {
      const r = await bulkAffiliateCouponsAction({
        scope,
        execute,
        limit: limit ? Math.max(0, Number(limit)) : undefined,
      })
      if (!r.ok) return setError(r.error)
      setRes(r.data)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          {(["active", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 text-sm font-medium ${
                scope === s ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {s === "active" ? "Só ativos" : "Todos"}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={0}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="limite (opcional)"
          className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => run(false)} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
          Simular
        </Button>
        {res && !res.executed && res.totalAffiliates > 0 && (
          <Button type="button" size="sm" onClick={() => run(true)} disabled={pending}>
            Criar {res.totalAffiliates} cupons no Shopify
          </Button>
        )}
      </div>

      {res && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          {res.alreadyExists ? (
            <p className="text-muted-foreground">Parece que já rodou: o cupom {res.sample[0]} já existe no Shopify.</p>
          ) : res.executed ? (
            <p className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Enviados {res.batchesSent} lote(s) · {res.codesQueued} cupons na fila (price rule {res.priceRuleId}).
            </p>
          ) : (
            <p>
              <strong>{res.totalAffiliates}</strong> afiliados ({scope === "all" ? "todos" : "ativos"}). Ex.:{" "}
              <span className="font-mono text-xs">{res.sample.join(", ")}</span>
            </p>
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
