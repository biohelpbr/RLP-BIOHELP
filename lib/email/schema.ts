import { z } from "zod"

export const emailSegmentSchema = z.enum(["all", "active", "pending", "canceled"])
export type EmailSegment = z.infer<typeof emailSegmentSchema>

export const SEGMENT_LABEL: Record<EmailSegment, string> = {
  all: "Todos os membros",
  active: "Ativos (assinatura paga)",
  pending: "Pendentes (aguardando ativação)",
  canceled: "Cancelados / não-renovados",
}

export const emailCampaignInputSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2, "Assunto é obrigatório.")
    .max(200, "Assunto muito longo (máx. 200)."),
  body: z.string().trim().min(2, "O corpo do e-mail é obrigatório."),
  segment: emailSegmentSchema.default("all"),
})
export type EmailCampaignInput = z.infer<typeof emailCampaignInputSchema>

export const testEmailSchema = emailCampaignInputSchema.extend({
  to: z.string().email("E-mail de teste inválido."),
})
export type TestEmailInput = z.infer<typeof testEmailSchema>
