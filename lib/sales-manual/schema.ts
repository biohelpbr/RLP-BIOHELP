import { z } from "zod"

export const PAYMENT_METHODS = [
  "pix",
  "cartao",
  "dinheiro",
  "transferencia",
  "outro",
] as const

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa de ao menos 2 caracteres"),
  contact: z
    .string()
    .trim()
    .min(3, "Informe um telefone, e-mail ou @ de contato"),
  target_product: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
})

export type LeadInput = z.infer<typeof leadInputSchema>

export const saleInputSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Nome do cliente precisa de ao menos 2 caracteres"),
  product_name: z.string().trim().max(120).optional().or(z.literal("")),
  qty: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  paid_amount: z.coerce.number().positive("Valor precisa ser maior que zero"),
  payment_method: z.enum(PAYMENT_METHODS),
  sold_at: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Data inválida")
    .refine((s) => Date.parse(s) <= Date.now() + 86_400_000, "Data não pode ser futura"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
})

export type SaleInput = z.infer<typeof saleInputSchema>
