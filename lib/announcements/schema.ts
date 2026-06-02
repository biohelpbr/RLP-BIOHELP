import { z } from "zod"

export const announcementVariantSchema = z.enum(["coral", "primary", "accent"])
export type AnnouncementVariant = z.infer<typeof announcementVariantSchema>

const optionalUrl = z
  .string()
  .url("Link inválido — use uma URL completa (https://...).")
  .optional()
  .nullable()
  .or(z.literal(""))

const announcementBaseSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "A mensagem do aviso é obrigatória.")
    .max(280, "Mensagem muito longa (máx. 280 caracteres)."),
  image_url: optionalUrl,
  link_url: optionalUrl,
  cta_label: z.string().trim().max(40, "Rótulo do botão muito longo.").optional().nullable().or(z.literal("")),
  variant: announcementVariantSchema.default("coral"),
  active: z.boolean().default(true),
  // datetime-local → ISO (offset). NULL = sem limite.
  starts_at: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")),
  ends_at: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")),
})

export const announcementInputSchema = announcementBaseSchema
  .refine(
    (d) => {
      if (!d.starts_at || !d.ends_at) return true
      return new Date(d.ends_at) > new Date(d.starts_at)
    },
    { message: "A data de término precisa ser posterior à de início.", path: ["ends_at"] },
  )
  .refine((d) => !d.cta_label || (d.link_url && d.link_url.trim().length > 0), {
    message: "Para mostrar um botão (CTA) é preciso informar o link.",
    path: ["link_url"],
  })

// Update permite parcial (apenas campos enviados são validados).
export const announcementUpdateSchema = announcementBaseSchema.partial()

export type AnnouncementInput = z.infer<typeof announcementInputSchema>
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>
