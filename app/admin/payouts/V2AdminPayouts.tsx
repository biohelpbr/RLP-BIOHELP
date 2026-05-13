import { CreditCard, FileText, Wallet } from "lucide-react"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/layouts/AdminShell"
import { BHCard } from "@/components/biohelp"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentMember, isCurrentUserAdmin, createServiceClient } from "@/lib/supabase/server"
import { PayoutActions } from "./PayoutActions"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  awaiting_document: "secondary",
  under_review: "secondary",
  approved: "default",
  processing: "secondary",
  completed: "default",
  rejected: "destructive",
  cancelled: "outline",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  awaiting_document: "Aguard. NF",
  under_review: "Em análise",
  approved: "Aprovado",
  processing: "Processando",
  completed: "Pago",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
}

interface PayoutRow {
  id: string
  amount: number
  gross_amount: number
  net_amount: number
  payout_method: string
  status: string
  created_at: string
  members: { name: string | null; email: string } | { name: string | null; email: string }[] | null
}

function getMember(row: PayoutRow): { name: string | null; email: string } {
  if (Array.isArray(row.members)) return row.members[0] || { name: null, email: "—" }
  return row.members || { name: null, email: "—" }
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

function PayoutList({ rows, emptyMsg }: { rows: PayoutRow[]; emptyMsg: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyMsg}</p>
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((p) => {
        const m = getMember(p)
        return (
          <li
            key={p.id}
            className="py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {m.name || "(sem nome)"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {m.email} · {formatDate(p.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold">{formatBRL(Number(p.gross_amount))}</span>
              {Number(p.net_amount) !== Number(p.gross_amount) && (
                <span className="text-xs text-muted-foreground">
                  Líquido {formatBRL(Number(p.net_amount))}
                </span>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
              {STATUS_LABEL[p.status] ?? p.status}
            </Badge>
            <PayoutActions payoutId={p.id} status={p.status} />
          </li>
        )
      })}
    </ul>
  )
}

export default async function V2AdminPayouts() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")
  if (!(await isCurrentUserAdmin())) redirect("/dashboard")

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      "id, amount, gross_amount, net_amount, payout_method, status, created_at, members!member_id(name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) console.error("[V2AdminPayouts]", error)

  const rows = (data || []) as PayoutRow[]
  const pix = rows.filter((r) => r.payout_method === "pix")
  const cashin = rows.filter((r) => r.payout_method === "cashback_cashin")
  const credit = rows.filter((r) => r.payout_method === "shopify_credit")

  const counts = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending" || r.status === "under_review").length,
  }

  return (
    <AdminShell adminName={member.name ?? "Admin"}>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Resgates</h1>
          <p className="text-muted-foreground">
            Triple resgate F-V07: PIX (CNPJ + NF), Cashback Cashin e Crédito Shopify. Total{" "}
            <strong>{counts.total}</strong> · pendentes <strong>{counts.pending}</strong>.
          </p>
        </header>

        <Tabs defaultValue="pix" className="w-full">
          <TabsList>
            <TabsTrigger value="pix">
              <Wallet className="w-4 h-4 mr-2" /> PIX ({pix.length})
            </TabsTrigger>
            <TabsTrigger value="cashin">
              <CreditCard className="w-4 h-4 mr-2" /> Cashback Cashin ({cashin.length})
            </TabsTrigger>
            <TabsTrigger value="credit">
              <FileText className="w-4 h-4 mr-2" /> Crédito Shopify ({credit.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix">
            <BHCard variant="elevated">
              <PayoutList
                rows={pix}
                emptyMsg="Nenhum resgate via PIX. Apenas Founders com NF podem usar este caminho."
              />
            </BHCard>
          </TabsContent>

          <TabsContent value="cashin">
            <BHCard variant="elevated">
              <PayoutList rows={cashin} emptyMsg="Nenhum resgate via Cashback Cashin." />
            </BHCard>
          </TabsContent>

          <TabsContent value="credit">
            <BHCard variant="elevated">
              <PayoutList rows={credit} emptyMsg="Nenhum resgate convertido em crédito Shopify." />
            </BHCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  )
}
