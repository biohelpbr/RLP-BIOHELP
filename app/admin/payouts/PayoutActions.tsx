"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, CircleDollarSign, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  approvePayout,
  markPayoutPaid,
  rejectPayout,
} from "@/lib/payouts/v2/admin-actions"

interface PayoutActionsProps {
  payoutId: string
  status: string
}

/**
 * F-V07 admin — botões inline pra moderação de payouts.
 *
 * Estados → ações disponíveis:
 *   pending/under_review/awaiting_document → Aprovar OR Rejeitar
 *   approved                                → Marcar pago OR Rejeitar
 *   processing                              → Marcar pago
 *   completed/rejected/cancelled            → (nenhuma — terminal)
 */
export function PayoutActions({ payoutId, status }: PayoutActionsProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState<"approve" | "reject" | "paid" | null>(null)

  const canApprove = ["pending", "under_review", "awaiting_document"].includes(status)
  const canMarkPaid = ["approved", "processing"].includes(status)
  const canReject = canApprove || status === "approved"

  if (!canApprove && !canMarkPaid && !canReject) {
    return null
  }

  const runAction = async (
    label: "approve" | "reject" | "paid",
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string,
  ) => {
    setPending(label)
    const res = await action()
    setPending(null)
    if (res.ok) {
      toast.success(successMsg)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {canApprove && (
        <Button
          size="sm"
          variant="default"
          disabled={pending !== null}
          onClick={() =>
            runAction("approve", () => approvePayout(payoutId), "Resgate aprovado.")
          }
        >
          {pending === "approve" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              Aprovar
            </>
          )}
        </Button>
      )}
      {canMarkPaid && (
        <Button
          size="sm"
          variant="default"
          disabled={pending !== null}
          onClick={() =>
            runAction("paid", () => markPayoutPaid(payoutId), "Marcado como pago.")
          }
        >
          {pending === "paid" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <CircleDollarSign className="w-3.5 h-3.5 mr-1" />
              Marcar pago
            </>
          )}
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => {
            if (!confirm("Confirma rejeição deste resgate?")) return
            runAction(
              "reject",
              () => rejectPayout(payoutId),
              "Resgate rejeitado.",
            )
          }}
        >
          {pending === "reject" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <X className="w-3.5 h-3.5 mr-1" />
              Rejeitar
            </>
          )}
        </Button>
      )}
    </div>
  )
}
