# Module: academy

> F-V09 — CMS de Academy (trilhas + aulas). W6 (call 05/06) completou o CMS.

## Responsabilidade
- Admin cria/edita/reordena/exclui trilhas e aulas 100% pela UI (sem deploy).
- Aula por link do YouTube (`youtu.be/<id>` e `youtube.com/watch?v=<id>` → embed no player).
- Membro consome via `ModulePlayer` (`/dashboard/academy`); banner de avisos espelhado (F-V26).
- Sem gamificação / progresso por enquanto (escopo MVP); `content_views` registra visto/completo.

## Arquivos principais
- `lib/content/schema.ts` — Zod (trail/module input + update).
- `lib/content/queries.ts`, `lib/content/actions.ts` — CRUD + `moveTrail`/`moveModule` (reordenação normaliza `display_order` 0..n-1 + swap com vizinho).
- `app/admin/academy/*` — `TrailForm` (criar/editar), `TrailRowActions` (↑/↓/excluir), `ModuleRow` (↑/↓/editar inline/excluir), `ModuleManager` (adicionar no fim).
- `app/dashboard/academy/*` — lista, trilha e `ModulePlayer` (kind `pdf` com link não-.pdf mostra "Abrir conteúdo").

## SPECs relevantes
- F-V09: `docs/sdd/features/F-V09-academy-cms/SPEC.md` · W6: call 05/06 (PR #35).

## Anti-SPEC aplicável
- Nenhum item específico — feature isolada.

## Estado atual
- ✅ F-V09 Done (06/05), migration `20260506_f-v09-academy-content.sql`.
- ✅ W6 CMS completo (05/06, PR #35). Conteúdo: M1=2, M2=6, M3=15 aulas (Apêndice A call 05/06) + trilha "Aula ao vivo (gravação)" com link Drive (trocar pra YouTube pela UI quando subir).
- ✅ F-V26 banner de avisos na Academy (05/06, PR #26).
