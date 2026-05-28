import { z } from "zod"

/**
 * F-V19: schema de entrada do formulário de pré-cadastro `/convite/[ref_code]`.
 * CPF não é coletado aqui — o checkout Guru pede o documento na etapa de pagamento.
 * Reutilizado pela server action `createPreRegistration` e pelo ConviteForm (validação client).
 */
export const PreRegistrationSchema = z.object({
  ref_code: z.string().min(4).max(20),
  name: z.string().min(3).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(10).max(20),
  accepted_terms: z.literal(true),
})

export type PreRegistrationInput = z.infer<typeof PreRegistrationSchema>

export type PreRegistrationResult =
  | { ok: true; member_id: string; transaction_token: string; guru_redirect_url: string }
  | { ok: false; error: string }
