# Module: academy

> F-V09 — CMS leve de Academy (módulos + aulas).

## Responsabilidade
- Admin cria módulos e aulas (vídeo + texto).
- Membro consome via `ModulePlayer`.
- Sem gamificação / progresso por enquanto (escopo MVP).

## Arquivos principais
- `lib/content/schema.ts` — `ModuleSchema`, `LessonSchema`.
- `lib/content/queries.ts`, `lib/content/actions.ts`.
- `components/biohelp/ModulePlayer.tsx`.
- `app/admin/(v2)/academy/*`, `app/(member)/academy/*`.

## SPECs relevantes
- F-V09: `docs/sdd/features/F-V09-academy-cms/SPEC.md`

## Anti-SPEC aplicável
- Nenhum item específico — feature isolada.

## Estado atual
- ✅ Done (06/05). Migration `20260506_f-v09-academy-content.sql`.
