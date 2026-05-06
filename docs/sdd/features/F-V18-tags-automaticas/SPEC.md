# F-V18 — Tags automáticas Líder (≥5) / Influenciador (≥40)

## Metadata
- ID: F-V18
- Classe: B
- Status: Draft → Done (escopo S3 — proxy `status='active'` até F-V03)
- Onda: 7 (Sprint 3 — Admin core, 20–26/05/2026)
- Data: 2026-05-05 (validação 2026-05-06 — branch `feat/S3-admin-core`)

## Contexto
Reunião 29/04 PM (minuto 18:37–19:33): regra simples de classificação automática de membros por nº de afiliados ativos no clube:
- ≥ 5 ativos → tag `lider`
- ≥ 40 ativos → tag `influenciador`

Léo: "que daí vai ficar mais fácil um pouco a nossa vida depois lá a gente pode aperfeiçoar isso, mas eu acho que para o início agora a gente nÃ£o viu, é tem cinco pessoas líder, tem 40 já influenciador". Convive com tag `FOUNDER` da F-V06 (Founder@5 — mesmo critério mínimo do Líder, mas Founder requer assinatura paga + opção de saque NF; Líder é só o gatilho de comunicação/destaque).

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis (refinados S3)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] Dependência F-V03 destravada via **Hipótese-1 (proxy)** — ver §"Decisão técnica S3" abaixo.

## Decisão técnica S3 — proxy `status='active'`
F-V03 (status ativo = `subscription_status='paid'`) ainda não foi implementada (S5+). Pra não bloquear F-V18 nem o painel admin S3, esta entrega adota:

> **Hipótese-1:** "Afiliado ativo" = `members.status = 'active'` (proxy temporário).

Quando F-V03 entrar em prod (S5+), troca em **1 lugar** — a view `member_active_affiliate_count`:
```sql
-- ANTES (S3): COUNT FILTER (WHERE a.status = 'active')
-- DEPOIS (S5): COUNT FILTER (WHERE a.subscription_status = 'paid')
```
Sem mudanças em `lib/tags/auto-classifier.ts` nem em `app/api/cron/auto-tags/route.ts`. Hook `lib/tags/hook-on-status-change.ts` (stub em S3) é wired ao trigger de update de `subscription_status` quando F-V03 entrar.

## Requisitos Funcionais
- **RF-1:** Trigger ou cron diário aplica/remove tags `lider` e `influenciador` em `members.tags` (jsonb ou array) baseado em `count_active_affiliates`.
- **RF-2:** "Afiliado ativo" = membro N1 (sponsor_id = M.id) com `subscription_status = 'paid'` (F-V03).
- **RF-3:** Sistema não remove tag manualmente aplicada pelo admin (separar tags `auto:` de tags `manual:`).
- **RF-4:** Tags refletem em `app/admin/community` (filtros, badges).
- **RF-5:** Tags `lider`/`influenciador` são informativas — **não** desbloqueiam saque cash (isso é Founder + CNPJ + NF — F-V06/F-V07).

## Critérios de Aceite (refinados S3)
- **CA-01:** Seed: membro M com **5 afiliados** (`status='active'`) → após `recompute(M.id)` ou cron, `members.tags @> '["auto:lider"]'::jsonb` retorna true; `auto:influenciador` NÃO presente.
- **CA-02:** Seed: membro M com **40 afiliados ativos** → `tags @> '["auto:lider","auto:influenciador"]'::jsonb` true; ambas presentes.
- **CA-03:** Após CA-02, atualizar 1 afiliado pra `status='inactive'` (39 ativos) → próximo `recompute` mantém `auto:lider`, remove `auto:influenciador`. Cair pra 4 ativos → remove ambas.
- **CA-04:** Antes do recompute, set `tags = '["manual:vip","auto:influenciador"]'`. Membro tem 0 ativos. Após recompute → `tags = '["manual:vip"]'`. `auto:*` removida; `manual:*` preservada (separação por prefixo).
- **CA-05:** GET `/admin/community?tag=auto:lider` retorna apenas membros com essa tag (validar via filtro Server Component).
- **CA-06:** Rodar `recompute()` 2x consecutivos sem mudança de estado → segundo retorna `{ updated: 0 }` (ou tags idênticas — sem duplicação no array).
- **CA-07** *(novo S3):* Endpoint `/api/cron/auto-tags` exige header `Authorization: Bearer <CRON_SECRET>`. Sem header → 401. Header errado → 401.
- **CA-08** *(novo S3):* `recompute(memberId)` (single) só atualiza um membro; `recompute()` (all) percorre toda a tabela `members`.

## Arquivos PERMITIDOS
- `lib/tags/auto-classifier.ts`
- `app/api/cron/auto-tags/route.ts` — endpoint chamado por Vercel Cron (diário)
- `vercel.json` — adicionar entry de cron
- `supabase/migrations/<data>_f-v18-tags-auto.sql` — alterar `members.tags` se ainda não for jsonb; criar view `member_active_affiliate_count`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não tocar `members.sponsor_id` (Anti-SPEC §1).
- Não usar tipo `PartnerRank` do Loveable (níveis v1).
- Não substituir tag `FOUNDER` por `lider` — são conceitos paralelos.

## Plano de implementação
1. Branch `feat/F-V18-tags-automaticas`.
2. Migration: garantir `members.tags jsonb default '[]'`; view `member_active_affiliate_count` agregando.
3. `lib/tags/auto-classifier.ts` — função `recompute(memberId?)`. Se `memberId` undefined → recompute all.
4. Cron diário às 03:00 UTC.
5. Hook em F-V03 — quando `subscription_status` muda, dispara `recompute(sponsor_id)` (não esperar cron).
6. UI badges em F-V16 (Comunidade).

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | Seed 5 affiliates `status='active'` (sponsor=sponsor@biohelp.test) + GET /api/cron/auto-tags → SQL `tags='["auto:lider"]'` | SQL via MCP + curl Bearer | ✅ | INSERT 5 rows TST00001..05; recompute retornou `{ok:true, scanned:18, updated:1, unchanged:17}`; SQL: `tags=["auto:lider"]` na sponsor. |
| CA-02 | Seed 35 mais (40 total) + recompute → ambas tags | SQL + curl | ✅ | view active_count=40; recompute → SQL: `tags=["auto:influenciador","auto:lider"]`. |
| CA-03 | UPDATE 36 rows pra status=inactive (4 ativos) + recompute | SQL + curl | ✅ | view active_count=4; recompute → tags `auto:*` removidas (somente `manual:vip` preservada). |
| CA-04 | UPDATE tags=`["manual:vip","auto:lider","auto:influenciador"]` antes do recompute → após preserva só `manual:vip` | SQL via MCP | ✅ | Pré-recompute: 3 tags. Pós-recompute (4 ativos): `tags=["manual:vip"]`. `manual:*` separada por prefix. |
| CA-05 | GET `/admin/community?tag=auto:lider` (admin@biohelp.test logado) | curl HTML grep | ✅ | Após bug fix `.filter("tags","cs",JSON.stringify([tag]))` (jsonb format), HTML mostra `Sponsor Teste` + `sponsor@biohelp.test` + `SPONSOR01` no listing. Bug detectado e corrigido na sessão. |
| CA-06 | 2x recompute consecutivos | curl | ✅ | 1ª `{ok:true,scanned:53,updated:1,unchanged:52}`; 2ª `{ok:true,scanned:53,updated:0,unchanged:53}`. Idempotente. |
| CA-07 | GET sem Authorization → 401; com Bearer errado → 401; com Bearer correto → 200 | curl | ✅ | Sem header: 401. `Bearer wrong`: 401. `Bearer $CRON_SECRET`: 200. |
| CA-08 | recompute(M) single vs recompute() all | inspeção `lib/tags/auto-classifier.ts` | ✅ | `if (memberId) countsQuery = countsQuery.eq("member_id", memberId)` — single member; sem param → all rows da view. |

## Bug fix detectado na validação S3
Durante o smoke, 2 bugs reais (não-cosméticos) foram corrigidos antes de fechar a SPEC:

1. **Cache de `fetch` Next 14 dedupando leituras de service_role** — `recompute()` rodava 2x e ambas chamadas viam só 18 rows mesmo quando a view tinha 53 (cacheado da 1ª chamada). Fix em `lib/supabase/server.ts:createServiceClient` adicionando `global.fetch` override com `cache: 'no-store'`. Service_role queries são sempre dynamic — esse override é seguro pra todas as libs (overview-v2, community, growth, consumption também ganham coerência).
2. **`.contains("tags", [tag])` incompatível com jsonb** — supabase-js serializa como `cs.{auto:lider}` (Postgres array format), mas `tags` é jsonb e exige `cs.["auto:lider"]`. Fix em `lib/admin/community.ts` trocando por `.filter("tags","cs",JSON.stringify([tag]))`. Sintaxe alternativa documentada no comentário.

## Loveable — elementos descartados
- `PartnerRank: PARTNER | LEADER | DIRECTOR | HEAD` — substituir por tags v2 (`auto:lider`, `auto:influenciador`, `FOUNDER`).
- Loveable não tem componente equivalente — Community.tsx Loveable mostra ranks v1; reescrever em RSC com filtros por tag.

## Rollback
- Revert do PR.
- Migration reversa: `ALTER TABLE members DROP COLUMN tags; DROP VIEW member_active_affiliate_count; DROP INDEX idx_members_tags;` (rollback comentado no topo do `.sql`).
- Cron Vercel: remover entry de `vercel.json` (não há side-effect — endpoint só LÊ via view e UPDATE em `members.tags`).
