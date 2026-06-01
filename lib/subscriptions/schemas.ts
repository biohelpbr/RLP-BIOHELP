import { z } from "zod"

/**
 * F-V19: schema de entrada do formulário de pré-cadastro `/convite/[ref_code]`.
 * CPF é coletado aqui (hotfix 01/06/2026 — Léo pediu pra voltar) e ecoado pro
 * checkout Guru via `doc` query param, pra que o pagador não precise digitar
 * de novo. `document_number` é persistido em `members` pra uso no payout.
 * Reutilizado pela server action `createPreRegistration` e pelo ConviteForm (validação client).
 */
export const PreRegistrationSchema = z.object({
  ref_code: z.string().min(4).max(20),
  name: z.string().min(3).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(10).max(20),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  accepted_terms: z.literal(true),
})

export type PreRegistrationInput = z.infer<typeof PreRegistrationSchema>

export type PreRegistrationResult =
  | { ok: true; member_id: string; transaction_token: string; guru_redirect_url: string }
  | { ok: false; error: string }
