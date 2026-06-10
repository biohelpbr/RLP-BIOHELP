import { z } from "zod"

export const trailStatusSchema = z.enum(["draft", "published", "archived"])
export const trailAccessModeSchema = z.enum(["open", "locked"])
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
  // Academy UX 05/06: grande grupo temático da trilha (ex.: "Consumo e Rotina").
  group_label: z.string().trim().max(80, "Grupo muito longo.").optional().nullable(),
  status: trailStatusSchema.default("draft"),
  // F-V27: open (hoje) vs locked (fricção positiva, ativação por membro).
  access_mode: trailAccessModeSchema.default("open"),
  // F-V27: textos editáveis da trava (só usados quando locked). Vazio = fallback padrão.
  lock_cta_label: z.string().trim().max(80, "Texto do botão muito longo.").optional().nullable(),
  lock_modal_title: z.string().trim().max(120, "Título do modal muito longo.").optional().nullable(),
  lock_modal_body: z.string().trim().max(600, "Texto do modal muito longo.").optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
})

// F-V27: data de liberação opcional. Aceita ISO ou datetime-local ("2026-06-20T14:00");
// vazio = sem data. Validamos só que é parseável como data quando preenchido.
const availableAtSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Data de liberação inválida.")
  .transform((v) => (v === "" ? null : new Date(v).toISOString()))
  .optional()
  .nullable()

export const moduleInputSchema = z
  .object({
    trail_id: z.string().uuid(),
    title: z.string().trim().min(2, "Título do módulo obrigatório."),
    kind: moduleKindSchema,
    content_url: z.string().url("URL inválida.").optional().nullable().or(z.literal("")),
    content_text: z.string().optional().nullable(),
    // Academy UX 05/06: duração manual da aula em minutos (mostra "X min" pro membro).
    duration_minutes: z.coerce.number().int().min(1, "Duração mínima: 1 minuto.").optional().nullable(),
    // F-V27: aula "em breve" — trava manual e/ou data de liberação.
    is_coming_soon: z.coerce.boolean().default(false),
    available_at: availableAtSchema,
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
    duration_minutes: z.coerce.number().int().min(1, "Duração mínima: 1 minuto.").optional().nullable(),
    // F-V27: edição da aula também ajusta "em breve" + data de liberação.
    is_coming_soon: z.coerce.boolean().default(false),
    available_at: availableAtSchema,
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
