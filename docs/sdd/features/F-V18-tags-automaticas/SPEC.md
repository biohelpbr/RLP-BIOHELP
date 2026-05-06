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

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | Seed 5 ativos + recompute(M) → SQL `tags @> '["auto:lider"]'` | SQL via MCP | ⏳ | preencher pós-smoke |
| CA-02 | Seed 40 ativos + recompute(M) → ambas tags | SQL via MCP | ⏳ | preencher pós-smoke |
| CA-03 | Reduzir 40→39→4 + recompute → remoções corretas | SQL sequencial | ⏳ | preencher pós-smoke |
| CA-04 | Set `manual:vip` + recompute → `manual:*` preservada | SQL via MCP | ⏳ | preencher pós-smoke |
| CA-05 | GET `/admin/community?tag=auto:lider` → lista correta | curl HTML grep | ⏳ | preencher pós-smoke |
| CA-06 | recompute() 2x consecutivos → segunda chamada `{updated: 0}` | endpoint cron | ⏳ | preencher pós-smoke |
| CA-07 | curl POST sem `Authorization` → 401 | curl | ⏳ | preencher pós-smoke |
| CA-08 | recompute(M) single vs recompute() all | inspeção lib | ⏳ | preencher pós-smoke |

## Loveable — elementos descartados
- `PartnerRank: PARTNER | LEADER | DIRECTOR | HEAD` — substituir por tags v2 (`auto:lider`, `auto:influenciador`, `FOUNDER`).
- Loveable não tem componente equivalente — Community.tsx Loveable mostra ranks v1; reescrever em RSC com filtros por tag.

## Rollback
- Revert do PR.
- Migration reversa: `ALTER TABLE members DROP COLUMN tags; DROP VIEW member_active_affiliate_count; DROP INDEX idx_members_tags;` (rollback comentado no topo do `.sql`).
- Cron Vercel: remover entry de `vercel.json` (não há side-effect — endpoint só LÊ via view e UPDATE em `members.tags`).
