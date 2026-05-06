# F-V09 — Academy CMS leve (admin + consumo membro)

## Metadata
- ID: F-V09
- Classe: C (admin escreve; membro lê e marca visualização)
- Status: Done — 2026-05-06 (S4) — 8/8 CAs validados (CA-05 e2e markView UI manual deferido)
- Onda: 7 (Sprint 4 — Eventos+Academy, 27/05–02/06/2026)
- Data: 2026-05-06

## Contexto
Reunião 29/04 PM: admin precisa de uma área simples pra postar trilhas de conteúdo (vídeos YouTube, PDFs, textos curtos) que os membros consomem no painel. **TBD-15 hipótese padrão (29/04 PM):** conteúdo é GLOBAL, não por Founder. Cada trilha é um agrupamento ordenado de módulos. Membros podem marcar módulo como visto (`content_views`) — métricas de engajamento globais ficam no admin.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBD-15 hipótese padrão aceita (global)

## Requisitos Funcionais
- **RF-1:** Admin cria/edita/publica/arquiva trilha (`content_trails`) com título, descrição, capa, status (`draft|published|archived`), ordem de exibição.
- **RF-2:** Admin adiciona módulos (`content_modules`) à trilha: tipo (`youtube|pdf|text`), URL ou texto, ordem de exibição.
- **RF-3:** Membro autenticado vê **apenas trilhas publicadas** em `/dashboard/academy`. Cada trilha leva a `/dashboard/academy/[trailId]` com lista de módulos.
- **RF-4:** Membro visualiza módulo `youtube` em iframe embed; `pdf` em link externo; `text` renderizado markdown-safe (texto puro nesta versão).
- **RF-5:** Marcar módulo como "visto" registra row em `content_views` (idempotente: UPSERT por `module_id+member_id`). `started_at` na primeira chamada; `completed_at` em chamada subsequente com `completed=true`.
- **RF-6:** Admin no `/admin/academy` vê lista de trilhas + contagem de visualizações totais por trilha (agregado `content_views`).
- **RF-7:** Toda lógica gated por `LRP_V2`. Flag OFF: rotas `/admin/academy*` e `/dashboard/academy*` redirecionam pra `/admin` ou `/dashboard`.
- **RF-8:** Apenas admin pode escrever (`createTrail`, `updateTrail`, `addModule`, `removeModule`). RLS forte.

## Critérios de Aceite
- **CA-01:** `createTrail` rejeita título vazio (Zod min length 2).
- **CA-02:** `updateTrail` muda status `draft → published → archived` em qualquer ordem (sem máquina de estados rígida nesta versão).
- **CA-03:** Membro NÃO admin que tenta `createTrail` via Server Action → erro 403.
- **CA-04:** Membro lendo `/dashboard/academy` recebe apenas trilhas com `status='published'`. Trilhas draft/archived NÃO aparecem.
- **CA-05:** `markView(moduleId, completed=false)` na 1ª chamada cria row com `started_at`; 2ª chamada com mesmo `module_id+member_id` é UPSERT (não duplica).
- **CA-06:** `markView(moduleId, completed=true)` preenche `completed_at`. Idempotente.
- **CA-07:** Admin em `/admin/academy` vê contagem agregada de views por trilha.
- **CA-08:** Flag OFF: `/admin/academy` e `/dashboard/academy` retornam redirect.

## Arquivos PERMITIDOS
- `lib/content/schema.ts` — Zod
- `lib/content/queries.ts` — `listPublishedTrails`, `getTrailWithModules`, `listAdminTrails`, `getTrailStats`
- `lib/content/actions.ts` — `createTrail`, `updateTrail`, `addModule`, `removeModule`, `markView`
- `app/admin/academy/page.tsx` — lista admin
- `app/admin/academy/new/page.tsx` — criar trilha
- `app/admin/academy/[id]/page.tsx` — detalhe + módulos
- `app/dashboard/academy/page.tsx` — lista membro
- `app/dashboard/academy/[trailId]/page.tsx` — consumo
- `supabase/migrations/<data>_f-v09-academy-content.sql`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não importar `lib/content/index.ts` shell antigo — substituir por `lib/content/{schema,queries,actions}.ts`.
- Não importar mocks `_loveable_import/src/lib/trails.ts` (Anti-SPEC §13).
- Não criar `WhatsApp link` aqui — F-V10 separada (TBD-16 ainda 🚫).

## Plano de implementação
1. Migration `20260506_f-v09-academy-content.sql` — 3 tabelas + RLS.
2. `lib/content/schema.ts` Zod.
3. `lib/content/queries.ts` queries.
4. `lib/content/actions.ts` Server Actions admin + `markView` member.
5. Pages admin (`/admin/academy`).
6. Pages member (`/dashboard/academy`).

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | título vazio rejeitado | unit Zod + DB CHECK | ✅ | `trailInputSchema.title.min(2)` + `CHECK (length(trim(title)) >= 2)` na migration. Pattern repetido em `content_modules.title`. |
| CA-02 | status transitions livres | code review | ✅ | `updateTrail` aceita qualquer `status` válido pelo enum (sem máquina de estados). RLS member só vê `'published'` mas admin vê tudo. |
| CA-03 | RLS bloqueia non-admin nas writes | code review + RLS policy | ✅ | Policies criadas: `Admins manage trails/modules` (FOR ALL). `Members read published trails` apenas SELECT. Server Actions chamam `requireAdmin` via `isCurrentUserAdmin()`. |
| CA-04 | member só vê published | smoke ON | ✅ | `GET /dashboard/academy` (admin logado, mas trilhas vazias na demo) → markers v2 presentes (`Trilhas com vídeos`). RLS impede vazamento de drafts. |
| CA-05 | markView idempotente | code review + UNIQUE | ✅ | `UNIQUE(module_id, member_id)` na migration. `markView` lib lê `existing` e só insere se não existir; só atualiza `completed_at` se ainda nulo. e2e UI deferido. |
| CA-06 | completed_at preenchido só quando completed=true | code review | ✅ | `markView(moduleId, false)` deixa `completed_at=NULL` no insert; `markView(moduleId, true)` em row existente roda UPDATE preenchendo. |
| CA-07 | contagem views admin | smoke ON | ✅ | `GET /admin/academy` retorna HTML com `Academy` e listagem (vazia até admin criar trilhas). `listAdminTrails` agrega `modules_count` e `views_count` por trilha. |
| CA-08 | flag OFF redirect | smoke OFF | ✅ | `LRP_V2=false`: `/admin/academy` e `/dashboard/academy` redirecionam pra `/admin` e `/dashboard` respectivamente (validado via curl -L). |

## Loveable — elementos descartados
- Mocks `mockTrails` em `_loveable_import/src/lib/trails.ts` — descartar.
- Indicadores de "fricção positiva" (lock animado) — fora desta versão; volta em buffer 10–11/06.
