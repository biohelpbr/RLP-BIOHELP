"use client"

import { useState, useTransition } from "react"
import { Calculator, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  previewAffiliateCommissions,
  closeAffiliateCommissions,
} from "@/lib/affiliates/actions"
import type { AffiliateCommissionSummary } from "@/lib/affiliates/commission"

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

/**
 * F-V35 fase 3 — fechar comissão do mês (dry-run → confirmar).
 * `referenceMonth` = mês a fechar (YYYY-MM-01), normalmente o mês anterior.
 */
export function CloseCommissionsButton({
  referenceMonth,
  monthLabel,
}: {
  referenceMonth: string
  monthLabel: string
}) {
  const [preview, setPreview] = useState<AffiliateCommissionSummary | null>(null)
  const [done, setDone] = useState<AffiliateCommissionSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onPreview() {
    setError(null); setDone(null)
    start(async () => {
      const r = await previewAffiliateCommissions(referenceMonth)
      if (!r.ok) return setError(r.error)
      setPreview(r.data)
    })
  }

  function onClose() {
    if (!window.confirm(`Lançar as comissões de ${monthLabel}? Isso grava no extrato dos afiliados.`)) return
    setError(null)
    start(async () => {
      const r = await closeAffiliateCommissions(referenceMonth)
      if (!r.ok) return setError(r.error)
      setDone(r.data); setPreview(null)
    })
  }

  const total = preview ? preview.saleCommissionTotal + preview.perpetualTotal : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPreview} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
          Simular fechamento de {monthLabel}
        </Button>
        {preview && !preview.alreadyClosed && preview.rows > 0 && (
          <Button type="button" size="sm" onClick={onClose} disabled={pending}>
            Confirmar e lançar ({brl(total)})
          </Button>
        )}
      </div>

      {preview && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          {preview.alreadyClosed ? (
            <p className="text-muted-foreground">Este mês já foi fechado (comissões já lançadas).</p>
          ) : preview.rows === 0 ? (
            <p className="text-muted-foreground">Nenhuma comissão a lançar neste mês.</p>
          ) : (
            <ul className="space-y-1">
              <li>Afiliados: <strong>{preview.affiliates}</strong> · vendas: <strong>{preview.salesConsidered}</strong></li>
              <li>Comissão de venda: <strong>{brl(preview.saleCommissionTotal)}</strong></li>
              <li>Perpétua: <strong>{brl(preview.perpetualTotal)}</strong></li>
              <li>Total a lançar: <strong>{brl(total)}</strong> ({preview.rows} lançamentos)</li>
            </ul>
          )}
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>
            Lançado: {brl(done.saleCommissionTotal + done.perpetualTotal)} em {done.rows} lançamentos.
          </span>
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
