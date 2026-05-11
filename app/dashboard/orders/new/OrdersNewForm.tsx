"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { BHCard } from "@/components/biohelp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createLead, createSale } from "@/lib/sales-manual/actions"
import { PAYMENT_METHODS } from "@/lib/sales-manual/schema"

interface OrdersNewFormProps {
  initialTipo: "lead" | "venda"
}

const TODAY_ISO = () => new Date().toISOString().slice(0, 10)

export function OrdersNewForm({ initialTipo }: OrdersNewFormProps) {
  const router = useRouter()
  const [tipo, setTipo] = React.useState<"lead" | "venda">(initialTipo)
  const [pending, setPending] = React.useState(false)

  // Lead state
  const [leadName, setLeadName] = React.useState("")
  const [leadContact, setLeadContact] = React.useState("")
  const [leadProduct, setLeadProduct] = React.useState("")
  const [leadNote, setLeadNote] = React.useState("")

  // Sale state
  const [saleCustomer, setSaleCustomer] = React.useState("")
  const [saleProduct, setSaleProduct] = React.useState("")
  const [saleQty, setSaleQty] = React.useState("1")
  const [saleAmount, setSaleAmount] = React.useState("")
  const [salePaymentMethod, setSalePaymentMethod] =
    React.useState<(typeof PAYMENT_METHODS)[number]>("pix")
  const [saleSoldAt, setSaleSoldAt] = React.useState(TODAY_ISO())
  const [saleNote, setSaleNote] = React.useState("")

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    const res = await createLead({
      name: leadName,
      contact: leadContact,
      target_product: leadProduct,
      note: leadNote,
    })
    setPending(false)
    if (res.ok) {
      toast.success("Lead registrado")
      router.push("/dashboard/orders")
    } else {
      toast.error(res.error)
    }
  }

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    // saleSoldAt vem do <input type="date"> como "YYYY-MM-DD" — se passar
    // direto pra new Date() vira meia-noite UTC, o que no BRT (UTC-3) vira o
    // dia anterior. Forçar meio-dia local pra cair no dia certo independente
    // do timezone do servidor.
    const soldAtLocalNoon = saleSoldAt ? `${saleSoldAt}T12:00:00` : saleSoldAt
    const res = await createSale({
      customer_name: saleCustomer,
      product_name: saleProduct,
      qty: saleQty,
      paid_amount: saleAmount.replace(",", "."),
      payment_method: salePaymentMethod,
      sold_at: soldAtLocalNoon,
      note: saleNote,
    })
    setPending(false)
    if (res.ok) {
      toast.success("Venda registrada")
      router.push("/dashboard/orders")
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/orders")}
          className="-ml-2 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Novo registro</h1>
        <p className="text-muted-foreground">
          Anote um lead ou registre uma venda concretizada.
        </p>
      </div>

      <Tabs
        value={tipo}
        onValueChange={(v) => setTipo(v as "lead" | "venda")}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="venda">Venda concretizada</TabsTrigger>
          <TabsTrigger value="lead">Lead</TabsTrigger>
        </TabsList>

        <TabsContent value="venda">
          <BHCard variant="elevated" className="mt-4">
            <form onSubmit={handleSubmitSale} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Nome do cliente *</Label>
                <Input
                  id="customer_name"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_name">Produto</Label>
                <Input
                  id="product_name"
                  value={saleProduct}
                  onChange={(e) => setSaleProduct(e.target.value)}
                  placeholder="Ex.: Whey 1kg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantidade *</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    value={saleQty}
                    onChange={(e) => setSaleQty(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid_amount">Valor pago (R$) *</Label>
                  <Input
                    id="paid_amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de pagamento *</Label>
                  <Select
                    value={salePaymentMethod}
                    onValueChange={(v) =>
                      setSalePaymentMethod(v as typeof salePaymentMethod)
                    }
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sold_at">Data da venda *</Label>
                  <Input
                    id="sold_at"
                    type="date"
                    value={saleSoldAt}
                    max={TODAY_ISO()}
                    onChange={(e) => setSaleSoldAt(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_note">Observação</Label>
                <textarea
                  id="sale_note"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  maxLength={500}
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Salvando…" : "Registrar venda"}
              </Button>
            </form>
          </BHCard>
        </TabsContent>

        <TabsContent value="lead">
          <BHCard variant="elevated" className="mt-4">
            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_name">Nome do lead *</Label>
                <Input
                  id="lead_name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_contact">Contato (telefone/e-mail/@) *</Label>
                <Input
                  id="lead_contact"
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_product">Produto-alvo</Label>
                <Input
                  id="lead_product"
                  value={leadProduct}
                  onChange={(e) => setLeadProduct(e.target.value)}
                  placeholder="Ex.: Whey, Multivitamínico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_note">Observação</Label>
                <textarea
                  id="lead_note"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={leadNote}
                  onChange={(e) => setLeadNote(e.target.value)}
                  maxLength={500}
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Salvando…" : "Registrar lead"}
              </Button>
            </form>
          </BHCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
