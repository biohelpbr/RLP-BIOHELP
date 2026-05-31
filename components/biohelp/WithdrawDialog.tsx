"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  Upload,
  User,
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
import { cn } from "@/lib/utils"
import { requestPayout } from "@/lib/payouts/v2/actions"
import {
  PAYOUT_METHODS,
  PAYOUT_METHOD_LABELS,
  PAYOUT_METHOD_SUBTITLES,
  PAYOUT_FIXED_FEE_BRL,
  PAYOUT_MIN_AMOUNT_BRL,
  computePayoutBreakdown,
  type PayoutMethod,
} from "@/lib/payouts/v2/schema"
import { PayoutRulesDialog } from "./PayoutRulesDialog"

/**
 * F-V20 — Triple resgate alinhado à Política Financeira Nutrition Club + Lovable UI.
 *
 * Modalidades:
 *  - shopify_credit → "Crédito na loja" (RECOMENDADO) — sem custo, sem mínimo.
 *  - cashback_cashin → "Pessoa Física (RPA)" — R$7,50 + INSS 11% + IRRF 7,5%, mín R$500.
 *  - pix → "Pessoa Jurídica (NF)" — R$7,50, NF obrigatória, mín R$500.
 *
 * Dados bancários moram em `members` (autopreenchidos). Se vazios, dialog mostra
 * CTA pro perfil em vez de campos inline.
 */

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

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Saldo bruto disponível pra resgate (BRL). */
  available: number
  /** Dados bancários atuais do membro (vindos do server component). */
  bankData?: MemberBankSnapshot
}

const fmtBRL = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const BIOHELP_INVOICE_DATA = {
  razaoSocial: "Biohelp Nutrição e Bem-Estar Ltda.",
  cnpj: "12.345.678/0001-90",
  endereco: "Av. Paulista, 1000 — Bela Vista, São Paulo/SP",
  cep: "01310-100",
  inscricaoEstadual: "Isento",
  servico: "Comissão sobre indicação e revenda de produtos",
} as const

const METHOD_META: Record<
  PayoutMethod,
  { icon: React.ReactNode; recommended?: boolean }
> = {
  shopify_credit: {
    icon: <ShoppingBag className="w-4 h-4 text-primary" />,
    recommended: true,
  },
  cashback_cashin: { icon: <User className="w-4 h-4 text-primary" /> },
  pix: { icon: <Building2 className="w-4 h-4 text-primary" /> },
}

const ORDERED_METHODS: readonly PayoutMethod[] = [
  "shopify_credit",
  "cashback_cashin",
  "pix",
] as const
void PAYOUT_METHODS

export function WithdrawDialog({
  open,
  onOpenChange,
  available,
  bankData,
}: WithdrawDialogProps) {
  const [method, setMethod] = React.useState<PayoutMethod>("shopify_credit")
  const [amount, setAmount] = React.useState<string>("")
  const [invoiceFile, setInvoiceFile] = React.useState<File | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [breakdownOpen, setBreakdownOpen] = React.useState(true)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setAmount(available.toFixed(2).replace(".", ","))
      setMethod("shopify_credit")
      setInvoiceFile(null)
      setSuccessMsg(null)
    }
  }, [open, available])

  const numericAmount =
    Number(amount.replace(/\./g, "").replace(",", ".")) || 0
  const breakdown = computePayoutBreakdown(method, numericAmount)

  const isCredit = method === "shopify_credit"
  const isPJ = method === "pix"
  const isPF = method === "cashback_cashin"

  const minAmount = isCredit ? 0 : PAYOUT_MIN_AMOUNT_BRL
  const belowMin = numericAmount > 0 && numericAmount < minAmount

  const hasBankData = Boolean(
    bankData?.bank_name &&
      bankData?.bank_agency &&
      bankData?.bank_account &&
      bankData?.pix_key &&
      bankData?.holder_name &&
      bankData?.document_number,
  )
  const personTypeMatches =
    isCredit ||
    (isPF && bankData?.person_type === "pf") ||
    (isPJ && bankData?.person_type === "pj")

  const needsBankSetup = !isCredit && (!hasBankData || !personTypeMatches)

  const canSubmit =
    !pending &&
    numericAmount > 0 &&
    numericAmount <= available &&
    !belowMin &&
    (isCredit ? true : !needsBankSetup) &&
    (!isPJ || !!invoiceFile)

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
    if (belowMin) {
      toast.error(`Valor mínimo: ${fmtBRL(minAmount)}.`)
      return
    }
    if (numericAmount > available) {
      toast.error("Valor acima do disponível.")
      return
    }
    if (isPJ && !invoiceFile) {
      toast.error("Anexe a Nota Fiscal pra prosseguir.")
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
      if (isCredit) {
        // Mensagem persistente (não toast efêmero) — decisão call 29/05.
        setSuccessMsg(
          "Crédito gerado e disponível na loja Biohelp vinculada ao seu e-mail. Aplicado automaticamente no checkout.",
        )
      } else {
        toast.success(
          "Resgate solicitado! Acompanhe o status no histórico de resgates.",
        )
        onOpenChange(false)
      }
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-3">
            <DialogTitle>Resgate</DialogTitle>
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Regras do resgate
            </button>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
            <span className="text-sm text-foreground">Disponível para resgate</span>
            <span className="text-base font-semibold text-foreground">
              {fmtBRL(available)}
            </span>
          </div>

          {successMsg ? (
            <div
              data-testid="credit-success-msg"
              className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 p-4 flex items-start gap-3"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-900 dark:text-emerald-200">
                {successMsg}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Como deseja resgatar?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ORDERED_METHODS.map((m) => {
                const meta = METHOD_META[m]
                const selected = method === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "relative rounded-xl border p-3 text-left transition",
                      selected
                        ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/40 bg-background",
                    )}
                  >
                    {meta.recommended ? (
                      <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-lime-200 text-lime-900 px-2 py-0.5 text-[10px] font-semibold">
                        <Sparkles className="w-3 h-3" />
                        Recomendado
                      </span>
                    ) : null}
                    <div className="flex items-start gap-2">
                      {meta.icon}
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {PAYOUT_METHOD_LABELS[m]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {PAYOUT_METHOD_SUBTITLES[m]}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Valor a resgatar{isPF ? " (bruto)" : ""}
              </Label>
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
                  data-testid="amount-input"
                />
              </div>
              {belowMin ? (
                <p
                  data-testid="min-warning"
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Valor mínimo para esta modalidade: {fmtBRL(minAmount)}.
                </p>
              ) : null}
            </div>

            <div
              data-testid="payout-breakdown"
              className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1"
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor solicitado</span>
                <span className="font-medium text-foreground">
                  {fmtBRL(numericAmount)}
                </span>
              </div>

              {isCredit ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxas e impostos</span>
                  <span className="text-emerald-600 font-medium">Sem custos</span>
                </div>
              ) : (
                <>
                  {isPF ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Taxas e impostos (INSS + IRRF)
                      </span>
                      <span
                        className="text-destructive font-medium"
                        data-testid="payout-tax"
                      >
                        -{fmtBRL(breakdown.inss + breakdown.irrf)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo do resgate</span>
                    <span className="text-destructive font-medium">
                      -{fmtBRL(PAYOUT_FIXED_FEE_BRL)}
                    </span>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setBreakdownOpen((v) => !v)}
                className="w-full flex justify-between pt-2 mt-1 border-t border-border items-center"
              >
                <span className="font-semibold text-foreground">
                  {isCredit ? "Crédito gerado" : "Valor líquido a receber"}
                </span>
                <span className="font-semibold text-primary inline-flex items-center gap-1">
                  <span data-testid="payout-net">{fmtBRL(breakdown.net)}</span>
                  {breakdownOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {isCredit ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">
                  Como funciona o crédito na loja
                </p>
                <p className="text-muted-foreground">
                  Seu saldo é convertido em crédito vinculado ao seu e-mail. Ao
                  finalizar uma compra na Biohelp, basta utilizar a opção
                  &quot;Crédito na Loja&quot; no checkout. Sem taxas, sem retenções e sem
                  valor mínimo de resgate.
                </p>
              </div>
            </div>
          ) : isPF ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3">
              <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">
                  Resgate como Pessoa Física (RPA)
                </p>
                <p className="text-muted-foreground">
                  A Biohelp realiza o pagamento mediante emissão de RPA em seu nome.
                  Os impostos e retenções exigidos pela legislação são descontados
                  na fonte, e o valor líquido é transferido para a conta bancária
                  cadastrada após a aprovação da solicitação.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Resgate como Pessoa Jurídica (NF)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Solicite o saque e emita uma Nota Fiscal conforme as orientações
                    disponibilizadas pela Biohelp. Tributos e obrigações fiscais são
                    de responsabilidade da pessoa jurídica.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-background border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Dados para emissão da NF
                </p>
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
                      <p className="text-sm text-foreground truncate">{row.value}</p>
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
                      : "border-border hover:border-primary/40 text-muted-foreground",
                  )}
                >
                  <Upload className="w-4 h-4" />
                  {invoiceFile
                    ? invoiceFile.name
                    : "Clique para enviar (PDF, XML ou imagem)"}
                </label>
                <input
                  id="invoice"
                  type="file"
                  accept=".pdf,.xml,image/png,image/jpeg"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>
          )}

          {needsBankSetup ? (
            <div
              data-testid="bank-setup-prompt"
              className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="text-sm flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  {!hasBankData
                    ? "Dados bancários ainda não cadastrados"
                    : `Cadastro atual é ${bankData?.person_type === "pf" ? "Pessoa Física" : bankData?.person_type === "pj" ? "Pessoa Jurídica" : "indefinido"}`}
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  {!hasBankData
                    ? "Para receber via PF ou PJ é preciso cadastrar nome do titular, CPF/CNPJ, banco, agência, conta, chave PIX e telefone no seu perfil."
                    : "A modalidade selecionada exige outro tipo de pessoa. Ajuste no perfil ou escolha outra modalidade."}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link href="/dashboard/profile#dados-bancarios">
                    Ir para Meu Perfil
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {successMsg ? "Fechar" : "Cancelar"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || !!successMsg}
              data-testid="submit-payout"
            >
              {pending
                ? "Enviando…"
                : isCredit
                ? "Gerar crédito"
                : "Solicitar resgate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PayoutRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  )
}
