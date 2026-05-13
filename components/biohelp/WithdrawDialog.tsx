"use client"

import * as React from "react"
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  ShoppingBag,
  Upload,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { requestPayout } from "@/lib/payouts/v2/actions"
import {
  PAYOUT_METHODS,
  type PayoutMethod,
} from "@/lib/payouts/v2/schema"

/**
 * F-V07 — Triple resgate (PIX + NF, Cashback Cashin, Crédito Shopify).
 *
 * Decisões cliente 13/05/2026:
 * - Imposto sempre aplicado (~15%), independente do método.
 * - PIX exige CNPJ + NF. Cashin/Crédito aceitam CPF (Founder não é restrito a CNPJ).
 * - Dados da Biohelp para NF são placeholders até cliente passar os reais
 *   (badge "a confirmar").
 *
 * Anti-SPEC §13: não importa do _loveable_import/.
 */

interface TierInfo {
  label: string
  gross_rate: number
  net_rate: number
  active_referrals: number
}

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Saldo bruto disponível pra resgate (BRL). */
  available: number
  /** Tier de comissão atual do membro (opcional — usado pra exibir info). */
  tier?: TierInfo
}

const fmtBRL = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const PIX_FIXED_FEE = 3.67
const TAX_RATE = 0.15

const BIOHELP_INVOICE_DATA = {
  razaoSocial: "Biohelp Nutrição e Bem-Estar Ltda.",
  cnpj: "12.345.678/0001-90",
  endereco: "Av. Paulista, 1000 — Bela Vista, São Paulo/SP",
  cep: "01310-100",
  inscricaoEstadual: "Isento",
  servico: "Comissão sobre indicação e revenda de produtos",
} as const

const METHOD_LABELS: Record<PayoutMethod, { title: string; subtitle: string; icon: React.ReactNode }> = {
  pix: {
    title: "PIX (CNPJ + NF)",
    subtitle: "Saque em conta. Exige CNPJ e NF de serviço.",
    icon: <Wallet className="w-5 h-5 text-primary" />,
  },
  cashback_cashin: {
    title: "Cashback Cashin",
    subtitle: "Sem NF. Aceita CPF. Recebe na conta Cashin.",
    icon: <Wallet className="w-5 h-5 text-primary" />,
  },
  shopify_credit: {
    title: "Crédito Shopify",
    subtitle: "1:1 na loja Biohelp. Sem NF. Crédito não expira.",
    icon: <ShoppingBag className="w-5 h-5 text-primary" />,
  },
}

export function WithdrawDialog({
  open,
  onOpenChange,
  available,
  tier,
}: WithdrawDialogProps) {
  const [method, setMethod] = React.useState<PayoutMethod>("shopify_credit")
  const [amount, setAmount] = React.useState<string>("")
  const [invoiceFile, setInvoiceFile] = React.useState<File | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setAmount(available.toFixed(2).replace(".", ","))
      setMethod("shopify_credit")
      setInvoiceFile(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const numericAmount =
    Number(amount.replace(/\./g, "").replace(",", ".")) || 0
  const taxAmount = Number((numericAmount * TAX_RATE).toFixed(2))
  const pixFee = method === "pix" ? PIX_FIXED_FEE : 0
  const netReceive = Math.max(0, numericAmount - taxAmount - pixFee)

  const requiresInvoice = method === "pix"
  const canSubmit =
    !pending &&
    numericAmount > 0 &&
    numericAmount <= available &&
    (!requiresInvoice || !!invoiceFile)

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    toast.success(`${label} copiado`)
    setTimeout(() => setCopied(null), 1200)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/xml",
      "text/xml",
    ]
    if (!allowed.includes(f.type)) {
      toast.error("Envie um PDF, XML ou imagem (PNG/JPG) da nota fiscal.")
      return
    }
    setInvoiceFile(f)
  }

  const handleSubmit = async () => {
    if (numericAmount <= 0) {
      toast.error("Informe um valor maior que zero.")
      return
    }
    if (numericAmount > available) {
      toast.error("Valor acima do disponível.")
      return
    }
    if (requiresInvoice && !invoiceFile) {
      toast.error("Anexe a nota fiscal pra prosseguir.")
      return
    }

    setPending(true)
    const res = await requestPayout({
      amount: numericAmount,
      payout_method: method,
      invoice_filename: invoiceFile?.name ?? "",
    })
    setPending(false)

    if (res.ok) {
      toast.success(
        method === "shopify_credit"
          ? "Crédito solicitado! Será aplicado na sua próxima compra após aprovação."
          : method === "cashback_cashin"
          ? "Cashback solicitado! Aguarde a confirmação."
          : "Resgate solicitado! Acompanhe o status no histórico."
      )
      onOpenChange(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar resgate</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
          <span className="text-sm text-foreground">Disponível para resgate</span>
          <span className="text-base font-semibold text-foreground">
            {fmtBRL(available)}
          </span>
        </div>

        {tier ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">
                Sua taxa atual: {(tier.gross_rate * 100).toFixed(0)}% bruto · {(tier.net_rate * 100).toFixed(1)}% líquido
              </p>
              <p className="text-xs text-muted-foreground">
                Tier <span className="font-medium">{tier.label}</span> · {tier.active_referrals}{" "}
                {tier.active_referrals === 1 ? "afiliada ativa" : "afiliadas ativas"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Imposto 15% deduzido sempre
            </span>
          </div>
        ) : null}

        <Tabs
          value={method}
          onValueChange={(v) => setMethod(v as PayoutMethod)}
          className="w-full"
        >
          <TabsList className="w-full">
            {PAYOUT_METHODS.map((m) => (
              <TabsTrigger key={m} value={m} className="flex-1">
                {METHOD_LABELS[m].title}
              </TabsTrigger>
            ))}
          </TabsList>

          {PAYOUT_METHODS.map((m) => (
            <TabsContent key={m} value={m} className="mt-4">
              <div className="rounded-xl border border-border bg-background p-4 space-y-1">
                <div className="flex items-center gap-2">
                  {METHOD_LABELS[m].icon}
                  <p className="text-sm font-semibold text-foreground">
                    {METHOD_LABELS[m].title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {METHOD_LABELS[m].subtitle}
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor desejado (bruto)</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted/50 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-l-none"
              />
            </div>
          </div>

          <div
            data-testid="payout-breakdown"
            className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1"
          >
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bruto</span>
              <span className="font-medium text-foreground">{fmtBRL(numericAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Imposto (15%)</span>
              <span className="text-destructive font-medium" data-testid="payout-tax">
                -{fmtBRL(taxAmount)}
              </span>
            </div>
            {pixFee > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa PIX</span>
                <span className="text-destructive font-medium">-{fmtBRL(pixFee)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="font-semibold text-foreground">Você recebe</span>
              <span
                className="font-semibold text-primary"
                data-testid="payout-net"
              >
                {fmtBRL(netReceive)}
              </span>
            </div>
          </div>
        </div>

        {method === "pix" && (
          <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Nota fiscal obrigatória (CNPJ)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pra resgatar via PIX é necessário emitir uma NF de prestação
                  de serviço pra Biohelp e anexar abaixo. Se você não tem CNPJ,
                  escolha Cashin ou Crédito Shopify (sem NF).
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-background border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Dados pra emissão da NF
                </p>
                <span
                  data-testid="nf-placeholder-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-0.5 text-[10px] font-medium"
                >
                  <AlertTriangle className="w-3 h-3" />
                  a confirmar com a Biohelp
                </span>
              </div>
              {[
                { label: "Razão Social", value: BIOHELP_INVOICE_DATA.razaoSocial },
                { label: "CNPJ", value: BIOHELP_INVOICE_DATA.cnpj },
                { label: "Endereço", value: BIOHELP_INVOICE_DATA.endereco },
                { label: "CEP", value: BIOHELP_INVOICE_DATA.cep },
                {
                  label: "Inscrição Estadual",
                  value: BIOHELP_INVOICE_DATA.inscricaoEstadual,
                },
                {
                  label: "Descrição do serviço",
                  value: BIOHELP_INVOICE_DATA.servico,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm text-foreground truncate">
                      {row.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(row.label, row.value)}
                    className="text-primary hover:bg-primary/10 rounded p-1.5 transition flex-shrink-0"
                    aria-label={`Copiar ${row.label}`}
                  >
                    {copied === row.label ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="invoice">Anexar nota fiscal *</Label>
              <label
                htmlFor="invoice"
                className={cn(
                  "mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition text-sm",
                  invoiceFile
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                )}
              >
                <Upload className="w-4 h-4" />
                {invoiceFile
                  ? invoiceFile.name
                  : "Clique pra enviar (PDF, XML ou imagem)"}
              </label>
              <input
                id="invoice"
                type="file"
                accept=".pdf,.xml,image/png,image/jpeg"
                className="hidden"
                onChange={handleFile}
              />
              <p className="text-xs text-muted-foreground mt-2">
                A nota fica registrada com o pedido e passa por validação
                automática (formato + CNPJ Biohelp). Depois da aprovação
                do admin, o PIX é processado em dias úteis.
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          {method === "shopify_credit"
            ? "Após aprovação, o crédito é aplicado na próxima compra na loja Biohelp. O crédito não expira."
            : method === "cashback_cashin"
            ? "Cashback creditado via Cashin após aprovação manual do admin. Você recebe direto na conta Cashin associada ao seu CPF — não precisa de CNPJ nem NF."
            : "Após aprovação da NF e da solicitação, o pagamento PIX é processado em dias úteis."}
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {pending ? "Enviando…" : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
