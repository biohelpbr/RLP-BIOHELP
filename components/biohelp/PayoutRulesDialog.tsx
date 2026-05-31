"use client"

import * as React from "react"
import { Building2, ShoppingBag, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * F-V20 — Modal "Regras do resgate" alinhado à Política Financeira Nutrition Club.
 *
 * Triggered via botão no header do WithdrawDialog. Explica as 3 modalidades
 * + janela de análise pós-solicitação.
 */
interface PayoutRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayoutRulesDialog({ open, onOpenChange }: PayoutRulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Regras do resgate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed">
          <section className="space-y-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Crédito na loja</h3>
            </div>
            <p className="text-muted-foreground">
              Sem impostos e sem taxas. O valor solicitado vira crédito 100% utilizável
              na loja Biohelp, vinculado ao e-mail do membro. Ao fazer login no checkout
              com o mesmo e-mail, o saldo é aplicado automaticamente.
            </p>
          </section>

          <section className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Pessoa Física (RPA)</h3>
            </div>
            <p className="text-muted-foreground">
              A Biohelp emite a RPA em nome do membro. Há retenção na fonte de INSS (11%)
              e IRRF estimado (7,5%) conforme tabela vigente, além do custo de processamento
              do resgate (R$ 7,50). O valor líquido é pago via PIX em até 5 dias úteis
              após aprovação. Valor mínimo: R$ 500.
            </p>
          </section>

          <section className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Pessoa Jurídica (NF)</h3>
            </div>
            <p className="text-muted-foreground">
              O membro emite uma NF de prestação de serviço para a Biohelp no valor
              solicitado. É descontado apenas o custo de processamento (R$ 7,50).
              Os impostos seguem o regime tributário da empresa (MEI, Simples etc.)
              e ficam a critério do emissor. Valor mínimo: R$ 500.
            </p>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Após a solicitação, o resgate passa por análise da Biohelp. Você acompanha
            o status no histórico de resgates.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
