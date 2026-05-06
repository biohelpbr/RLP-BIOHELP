"use client"

import * as React from "react"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { BHCard } from "@/components/biohelp"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { deleteLead, deleteSale } from "@/lib/sales-manual/actions"
import type { MemberLead, MemberSale } from "@/lib/sales-manual/queries"

interface OrdersClientListProps {
  leads: MemberLead[]
  sales: MemberSale[]
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

const fmtDate = (s: string) => {
  const d = new Date(s)
  return d.toLocaleDateString("pt-BR")
}

export function OrdersClientList({ leads, sales }: OrdersClientListProps) {
  const [pending, startTransition] = useTransition()

  const handleDeleteLead = (id: string) => {
    if (!confirm("Remover esse lead?")) return
    startTransition(async () => {
      const res = await deleteLead(id)
      if (res.ok) toast.success("Lead removido")
      else toast.error(res.error)
    })
  }

  const handleDeleteSale = (id: string) => {
    if (!confirm("Remover essa venda?")) return
    startTransition(async () => {
      const res = await deleteSale(id)
      if (res.ok) toast.success("Venda removida")
      else toast.error(res.error)
    })
  }

  return (
    <Tabs defaultValue="vendas" className="w-full">
      <TabsList>
        <TabsTrigger value="vendas">Vendas ({sales.length})</TabsTrigger>
        <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="vendas" className="mt-4">
        <BHCard className="space-y-3">
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Você ainda não registrou vendas. Use o botão "Nova venda" no topo.
            </p>
          ) : (
            <ul className="space-y-2">
              {sales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {sale.customer_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sale.product_name ?? "Produto não informado"} · qty {sale.qty} · {fmtDate(sale.sold_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{sale.payment_method}</Badge>
                    <span className="font-semibold text-foreground">
                      {fmtBRL(Number(sale.paid_amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSale(sale.id)}
                      disabled={pending}
                      aria-label="Remover venda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </TabsContent>

      <TabsContent value="leads" className="mt-4">
        <BHCard className="space-y-3">
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Você ainda não registrou leads. Use o botão "Novo lead" no topo.
            </p>
          ) : (
            <ul className="space-y-2">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{lead.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {lead.contact}
                      {lead.target_product ? ` · ${lead.target_product}` : ""}
                    </span>
                    {lead.note ? (
                      <span className="text-xs text-muted-foreground italic mt-1">
                        “{lead.note}”
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLead(lead.id)}
                      disabled={pending}
                      aria-label="Remover lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BHCard>
      </TabsContent>
    </Tabs>
  )
}
