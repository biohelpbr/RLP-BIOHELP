"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Building2, Loader2, ShieldCheck, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { updateMemberBankData } from "@/lib/members/profile-actions"
import { BANK_DATA_LOCK_DAYS } from "@/lib/payouts/v2/schema"

interface BankDataFormProps {
  initial: {
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
}

/**
 * F-V20 — Seção de Dados Bancários do perfil.
 *
 * Política Financeira §5: qualquer alteração ativa janela de 7 dias antes
 * de liberar novo saque. Exibimos warning quando dentro da janela.
 */
export function BankDataForm({ initial }: BankDataFormProps) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState({
    person_type: (initial.person_type ?? "pf") as "pf" | "pj",
    holder_name: initial.holder_name ?? "",
    document_number: initial.document_number ?? "",
    bank_name: initial.bank_name ?? "",
    bank_agency: initial.bank_agency ?? "",
    bank_account: initial.bank_account ?? "",
    pix_key: initial.pix_key ?? "",
    contact_phone: initial.contact_phone ?? "",
  })

  const hasData = Boolean(
    initial.bank_name &&
      initial.bank_agency &&
      initial.bank_account &&
      initial.pix_key &&
      initial.holder_name &&
      initial.document_number,
  )

  const lockedUntil = React.useMemo(() => {
    if (!initial.bank_data_updated_at) return null
    const updated = new Date(initial.bank_data_updated_at)
    const until = new Date(updated)
    until.setDate(until.getDate() + BANK_DATA_LOCK_DAYS)
    return until > new Date() ? until : null
  }, [initial.bank_data_updated_at])

  const handleCancel = () => {
    setForm({
      person_type: (initial.person_type ?? "pf") as "pf" | "pj",
      holder_name: initial.holder_name ?? "",
      document_number: initial.document_number ?? "",
      bank_name: initial.bank_name ?? "",
      bank_agency: initial.bank_agency ?? "",
      bank_account: initial.bank_account ?? "",
      pix_key: initial.pix_key ?? "",
      contact_phone: initial.contact_phone ?? "",
    })
    setEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    const res = await updateMemberBankData(form)
    setPending(false)
    if (res.ok) {
      toast.success(
        `Dados bancários salvos. Novos saques liberados após ${BANK_DATA_LOCK_DAYS} dias.`,
      )
      setEditing(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {lockedUntil ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 flex items-start gap-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-amber-900 dark:text-amber-200">
              Janela de segurança ativa após alteração recente. Novos saques
              liberados a partir de{" "}
              <span className="font-semibold">
                {lockedUntil.toLocaleDateString("pt-BR")}
              </span>
              .
            </div>
          </div>
        ) : null}

        {!hasData ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Nenhum dado bancário cadastrado. Cadastre para habilitar resgates via
            PF (RPA) ou PJ (NF).
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <Row
              icon={
                initial.person_type === "pj" ? (
                  <Building2 className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )
              }
              label="Tipo de pessoa"
              value={
                initial.person_type === "pj"
                  ? "Pessoa Jurídica"
                  : initial.person_type === "pf"
                  ? "Pessoa Física"
                  : "—"
              }
            />
            <Row label="Nome do titular" value={initial.holder_name ?? "—"} />
            <Row
              label={initial.person_type === "pj" ? "CNPJ" : "CPF"}
              value={initial.document_number ?? "—"}
            />
            <Row label="Banco" value={initial.bank_name ?? "—"} />
            <Row label="Agência" value={initial.bank_agency ?? "—"} />
            <Row label="Conta" value={initial.bank_account ?? "—"} />
            <Row label="Chave PIX" value={initial.pix_key ?? "—"} />
            <Row label="Telefone de contato" value={initial.contact_phone ?? "—"} />
          </dl>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="w-fit"
        >
          {hasData ? "Atualizar dados bancários" : "Cadastrar dados bancários"}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-border pt-4">
      <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Por segurança, após salvar você fica {BANK_DATA_LOCK_DAYS} dias sem
          poder solicitar novos saques. Pagamentos só são realizados na conta do
          próprio titular cadastrado.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Tipo de pessoa *</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["pf", "pj"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, person_type: t })}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  form.person_type === t
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {t === "pf" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                  {t === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t === "pf"
                    ? "Recebe via RPA (com retenções)."
                    : "Emite NF de serviço para a Biohelp."}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bd-holder">Nome do titular *</Label>
          <Input
            id="bd-holder"
            value={form.holder_name}
            onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-doc">
            {form.person_type === "pj" ? "CNPJ" : "CPF"} do titular *
          </Label>
          <Input
            id="bd-doc"
            value={form.document_number}
            onChange={(e) => setForm({ ...form, document_number: e.target.value })}
            disabled={pending}
            placeholder={
              form.person_type === "pj" ? "00.000.000/0000-00" : "000.000.000-00"
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-bank">Banco *</Label>
          <Input
            id="bd-bank"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            disabled={pending}
            placeholder="Ex.: 260 - Nu Pagamentos"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-agency">Agência *</Label>
          <Input
            id="bd-agency"
            value={form.bank_agency}
            onChange={(e) => setForm({ ...form, bank_agency: e.target.value })}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-account">Conta *</Label>
          <Input
            id="bd-account"
            value={form.bank_account}
            onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
            disabled={pending}
            placeholder="Ex.: 12345-6"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bd-pix">Chave PIX *</Label>
          <Input
            id="bd-pix"
            value={form.pix_key}
            onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bd-phone">Telefone de contato *</Label>
          <Input
            id="bd-phone"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            disabled={pending}
            placeholder="(11) 99999-9999"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Salvando…
            </>
          ) : (
            "Salvar dados bancários"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground break-words">{value}</dd>
    </div>
  )
}
