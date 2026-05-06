import { z } from "zod"

export const PAYOUT_METHODS = ["pix", "cashback_cashin", "shopify_credit"] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  pix: "PIX (Founder + NF)",
  cashback_cashin: "Cashback Cashin",
  shopify_credit: "Crédito na loja",
}

export const requestPayoutSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Valor precisa ser maior que zero")
    .max(1_000_000, "Valor acima do permitido"),
  payout_method: z.enum(PAYOUT_METHODS),
  invoice_filename: z.string().trim().max(200).optional().or(z.literal("")),
})

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>
