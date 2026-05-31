"use client"

import * as React from "react"
import { HelpCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BHCard, PayoutRulesDialog, WithdrawDialog } from "@/components/biohelp"

interface MemberBankSnapshot {
  person_type: "pf" | "pj" | null
  holder_name: string | null
  document_number: string | null
  bank_name: string | null
  bank_agency: string | null
  bank_account: string | null
  pix_key: string | null
  contact_phone: string | null
  bank_data_updated_at: string | null
}

interface FinanceClientProps {
  available: number
  bankData?: MemberBankSnapshot
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

export function FinanceClient({ available, bankData }: FinanceClientProps) {
  const [open, setOpen] = React.useState(false)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const canWithdraw = available > 0

  return (
    <>
      <BHCard variant="gradient" className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pronto para resgatar?</h2>
            <p className="text-sm text-muted-foreground">
              Crédito na loja (recomendado, sem custo) ou saque PF (RPA) / PJ (NF)
              a partir de {fmtBRL(500)}.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Disponível: {fmtBRL(available)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Regras
          </Button>
          <Button onClick={() => setOpen(true)} disabled={!canWithdraw}>
            {canWithdraw ? "Resgatar" : "Sem saldo disponível"}
          </Button>
        </div>
      </BHCard>

      <WithdrawDialog
        open={open}
        onOpenChange={setOpen}
        available={available}
        bankData={bankData}
      />

      <PayoutRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  )
}
