import { z } from "zod"

export const trailStatusSchema = z.enum(["draft", "published", "archived"])
export const moduleKindSchema = z.enum(["youtube", "pdf", "text"])

export const trailInputSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório."),
  description: z.string().trim().optional().nullable(),
  cover_url: z
    .string()
    .url("URL de capa inválida.")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: trailStatusSchema.default("draft"),
  display_order: z.coerce.number().int().min(0).default(0),
})

export const moduleInputSchema = z
  .object({
    trail_id: z.string().uuid(),
    title: z.string().trim().min(2, "Título do módulo obrigatório."),
    kind: moduleKindSchema,
    content_url: z.string().url("URL inválida.").optional().nullable().or(z.literal("")),
    content_text: z.string().optional().nullable(),
    display_order: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (d) =>
      (d.kind === "text" && !!d.content_text && d.content_text.trim().length > 0) ||
      (d.kind !== "text" && !!d.content_url && d.content_url.trim().length > 0),
    {
      message:
        "Módulos de tipo youtube/pdf precisam de URL; tipo text precisa de conteúdo.",
      path: ["content_url"],
    },
  )

export type TrailInput = z.infer<typeof trailInputSchema>
export type ModuleInput = z.infer<typeof moduleInputSchema>

export const trailUpdateSchema = trailInputSchema.partial()
export type TrailUpdateInput = z.infer<typeof trailUpdateSchema>

// W6 (call 05/06): editar aula existente pelo admin (CMS completo).
export const moduleUpdateSchema = z
  .object({
    title: z.string().trim().min(2, "Título do módulo obrigatório."),
    kind: moduleKindSchema,
    content_url: z.string().url("URL inválida.").optional().nullable().or(z.literal("")),
    content_text: z.string().optional().nullable(),
  })
  .refine(
    (d) =>
      (d.kind === "text" && !!d.content_text && d.content_text.trim().length > 0) ||
      (d.kind !== "text" && !!d.content_url && d.content_url.trim().length > 0),
    {
      message:
        "Módulos de tipo youtube/pdf precisam de URL; tipo text precisa de conteúdo.",
      path: ["content_url"],
    },
  )
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>
