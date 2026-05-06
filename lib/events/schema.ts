import { z } from "zod"

export const eventModeSchema = z.enum(["online", "presencial", "hibrido"])
export const eventStatusSchema = z.enum(["draft", "published", "archived"])

const slugSchema = z
  .string()
  .min(2, "Slug deve ter ao menos 2 caracteres.")
  .max(64, "Slug muito longo.")
  .regex(/^[a-z0-9][a-z0-9-]{1,63}$/, "Use apenas letras minúsculas, números e hífen.")

const eventBaseSchema = z.object({
  name: z.string().trim().min(2, "Nome do evento é obrigatório."),
  description: z.string().trim().optional().nullable(),
  slug: slugSchema,
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  mode: eventModeSchema,
  location: z.string().trim().optional().nullable(),
  redirect_url: z
    .string()
    .url("URL de redirecionamento inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  cost: z.coerce.number().min(0, "Custo não pode ser negativo.").default(0),
  status: eventStatusSchema.default("published"),
  eligible_product_ids: z.array(z.string().min(1)).default([]),
})

export const eventInputSchema = eventBaseSchema
  .refine((d) => new Date(d.end_at) > new Date(d.start_at), {
    message: "Data de término precisa ser posterior à de início.",
    path: ["end_at"],
  })
  .refine((d) => d.mode !== "presencial" || (d.location && d.location.trim().length > 0), {
    message: "Eventos presenciais precisam de localização.",
    path: ["location"],
  })

// Update permite parcial (apenas campos enviados são validados).
export const eventUpdateSchema = eventBaseSchema.partial()

export type EventInput = z.infer<typeof eventInputSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

export const eventAttendanceSchema = z.object({
  event_id: z.string().uuid(),
  member_id: z.string().uuid(),
  attended: z.boolean(),
})
export type EventAttendanceInput = z.infer<typeof eventAttendanceSchema>
