# Module: academy

> F-V09 — CMS de Academy (trilhas + aulas). W6 (call 05/06) completou o CMS. F-V29 (05/06) refez a UX do membro.

## Responsabilidade
- Admin cria/edita/reordena/exclui trilhas e aulas 100% pela UI (sem deploy), incl. grande grupo da trilha e duração da aula (F-V29).
- Aula por link do YouTube (`youtu.be/<id>` e `youtube.com/watch?v=<id>` → embed; helpers em `lib/content/youtube.ts`).
- Membro: home agrupada por `group_label` + trilha com lista compacta e player em Dialog (`LessonList`); banner de avisos espelhado (F-V26).
- Progresso: `content_views` registra visto/completo (`markView`); trilha mostra "X de Y assistidas" + badge Assistido/Revisar.

## Arquivos principais
- `lib/content/schema.ts` — Zod (trail/module input + update, incl. `group_label`/`duration_minutes`).
- `lib/content/queries.ts`, `lib/content/actions.ts` — CRUD + `moveTrail`/`moveModule` (reordenação normaliza `display_order` 0..n-1 + swap com vizinho) + `listPublishedTrailsWithMeta` (contagens + thumb fallback) + `listTrailGroupLabels`.
- `lib/content/youtube.ts` — `youtubeId`/`youtubeEmbedUrl`/`youtubeThumbUrl` derivados do `content_url`.
- `app/admin/academy/*` — `TrailForm` (criar/editar, campo grupo c/ datalist), `TrailRowActions` (↑/↓/excluir), `ModuleRow` (↑/↓/editar inline/excluir, duração), `ModuleManager` (adicionar no fim, duração).
- `app/dashboard/academy/*` — home em seções por grupo; `[trailId]/LessonList.tsx` = lista compacta + Dialog player (kind `pdf` com link não-.pdf mostra "Abrir conteúdo"; `text` no modal). `ModulePlayer` foi removido na F-V29.

## SPECs relevantes
- F-V09: `docs/sdd/features/F-V09-academy-cms/SPEC.md` · W6: call 05/06 (PR #35).

## Anti-SPEC aplicável
- Nenhum item específico — feature isolada.

## Estado atual
- ✅ F-V09 Done (06/05), migration `20260506_f-v09-academy-content.sql`.
- ✅ W6 CMS completo (05/06, PR #35). Conteúdo: M1=2, M2=6, M3=15 aulas (Apêndice A call 05/06) + trilha "Aula ao vivo (gravação)" com link Drive (trocar pra YouTube pela UI quando subir).
- ✅ F-V26 banner de avisos na Academy (05/06, PR #26).
- ✅ F-V29 UX refino do membro (05/06, PR #38): grupos na home (Módulos 1/2/3 = "Consumo e Rotina", a confirmar c/ Leo), lista compacta + modal player, `duration_minutes` no CMS. Migration `20260605_academy_group_duration`.
- ⏳ F-V27 restante: aulas/avisos programados por data ("em breve · dia X").
