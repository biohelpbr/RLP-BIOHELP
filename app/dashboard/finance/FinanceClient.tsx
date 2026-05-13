"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BHCard, WithdrawDialog } from "@/components/biohelp"

interface TierInfo {
  label: string
  gross_rate: number
  net_rate: number
  active_referrals: number
}

interface FinanceClientProps {
  available: number
  tier?: TierInfo
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

export function FinanceClient({ available, tier }: FinanceClientProps) {
  const [open, setOpen] = React.useState(false)
  const canWithdraw = available > 0

  return (
    <>
      <BHCard variant="gradient" className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pronto pra resgatar?</h2>
            <p className="text-sm text-muted-foreground">
              Escolha PIX (CNPJ + NF), Cashback Cashin (sem NF) ou crédito 1:1
              na loja Biohelp.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Disponível: {fmtBRL(available)}
              {tier ? (
                <>
                  {" · "}
                  Taxa atual {(tier.gross_rate * 100).toFixed(0)}% bruto (
                  {(tier.net_rate * 100).toFixed(1)}% líquido após imposto)
                </>
              ) : null}
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!canWithdraw}>
          {canWithdraw ? "Solicitar resgate" : "Sem saldo disponível"}
        </Button>
      </BHCard>

      <WithdrawDialog
        open={open}
        onOpenChange={setOpen}
        available={available}
        tier={tier}
      />
    </>
  )
}
