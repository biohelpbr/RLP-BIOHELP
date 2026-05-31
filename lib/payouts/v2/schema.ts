import { z } from "zod"

/**
 * F-V20 — Modalidades alinhadas com Política Financeira Nutrition Club + UI Lovable.
 *
 * IDs mantidos do v1 (`pix` / `cashback_cashin` / `shopify_credit`) por
 * compatibilidade com `payout_requests.payout_method` enum no DB.
 * Labels atualizados pra `Crédito na loja` / `Pessoa Física (RPA)` / `Pessoa Jurídica (NF)`.
 */
export const PAYOUT_METHODS = ["pix", "cashback_cashin", "shopify_credit"] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  shopify_credit: "Crédito na loja",
  cashback_cashin: "Pessoa Física (RPA)",
  pix: "Pessoa Jurídica (NF)",
}

export const PAYOUT_METHOD_SUBTITLES: Record<PayoutMethod, string> = {
  shopify_credit: "Sem impostos, sem taxas. 100% do valor vira crédito.",
  cashback_cashin: "Biohelp emite a RPA. Há retenção de impostos.",
  pix: "Você emite NF de serviço para a Biohelp.",
}

/**
 * Constantes da Política Financeira Nutrition Club (§2):
 *
 * - Crédito na loja: sem taxa, sem imposto, sem mínimo.
 * - PF (RPA): R$ 7,50 fixo + INSS 11% + IRRF estimado 7,5%; mínimo R$ 500.
 * - PJ (NF): R$ 7,50 fixo; impostos a critério do emissor; mínimo R$ 500.
 */
export const PAYOUT_FIXED_FEE_BRL = 7.5
export const PAYOUT_INSS_RATE = 0.11      // F-V20: PF apenas
export const PAYOUT_IRRF_RATE = 0.075     // F-V20: PF apenas (estimativa)
export const PAYOUT_MIN_AMOUNT_BRL = 500

/**
 * Janela de segurança após alterar dados bancários (Política §5):
 * 7 dias corridos antes de liberar novo saque.
 */
export const BANK_DATA_LOCK_DAYS = 7

export interface PayoutFeeBreakdown {
  gross: number
  inss: number      // só PF
  irrf: number      // só PF
  fee: number       // R$ 7,50 PF e PJ; 0 no crédito
  net: number
  taxLabel: string  // "Sem custos" / "INSS + IRRF" / "Custo do resgate"
}

export function computePayoutBreakdown(
  method: PayoutMethod,
  gross: number,
): PayoutFeeBreakdown {
  if (method === "shopify_credit") {
    return {
      gross,
      inss: 0,
      irrf: 0,
      fee: 0,
      net: gross,
      taxLabel: "Sem custos",
    }
  }
  if (method === "cashback_cashin") {
    // PF (RPA) — Biohelp retém INSS + IRRF antes de pagar via PIX.
    const inss = Number((gross * PAYOUT_INSS_RATE).toFixed(2))
    const irrf = Number((gross * PAYOUT_IRRF_RATE).toFixed(2))
    const fee = PAYOUT_FIXED_FEE_BRL
    const net = Number((gross - inss - irrf - fee).toFixed(2))
    return { gross, inss, irrf, fee, net, taxLabel: "INSS + IRRF" }
  }
  // PJ (NF) — só o custo de processamento; impostos ficam a cargo do emissor.
  const fee = PAYOUT_FIXED_FEE_BRL
  const net = Number((gross - fee).toFixed(2))
  return { gross, inss: 0, irrf: 0, fee, net, taxLabel: "Custo do resgate" }
}

export const requestPayoutSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Valor precisa ser maior que zero")
    .max(1_000_000, "Valor acima do permitido"),
  payout_method: z.enum(PAYOUT_METHODS),
  invoice_filename: z.string().trim().max(200).optional().or(z.literal("")),
  /** F-V07c: data URL ou base64 do arquivo de NF (PDF/XML). Validado server-side. */
  invoice_data_url: z.string().max(15_000_000).optional().or(z.literal("")),
})

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>

/** Schema dos dados bancários persistidos em `members` (F-V20). */
export const memberBankDataSchema = z.object({
  person_type: z.enum(["pf", "pj"]),
  holder_name: z.string().trim().min(2, "Informe o nome do titular").max(120),
  document_number: z
    .string()
    .trim()
    .min(11, "CPF ou CNPJ inválido")
    .max(18, "CPF ou CNPJ inválido"),
  bank_name: z.string().trim().min(2, "Informe o banco").max(80),
  bank_agency: z.string().trim().min(1, "Informe a agência").max(15),
  bank_account: z.string().trim().min(1, "Informe a conta").max(30),
  pix_key: z.string().trim().min(3, "Informe a chave PIX").max(140),
  contact_phone: z.string().trim().min(8, "Telefone inválido").max(40),
})

export type MemberBankDataInput = z.infer<typeof memberBankDataSchema>
