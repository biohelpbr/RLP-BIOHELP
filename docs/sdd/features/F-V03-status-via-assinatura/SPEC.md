# F-V03 — Status ativo via subscription_paid

## Metadata
- ID: F-V03
- Classe: D (toca webhook produção-crítico Anti-SPEC §4 + altera regra global de "ativo")
- Status: Draft → S5
- Onda: 2 (Foundation v2) — destrava F-V18, F-V06, F-V08
- Data: 2026-05-06

## Contexto
PIVOT-V2 §1: "Status ativo: vinculado a ASSINATURA paga via Guru, não a CV". Hoje a view `member_active_affiliate_count` usa proxy `status='active'` (legado v1 — calculado por 200 CV mensais). F-V18 entrou em S3 funcionando, mas com **0 tags aplicadas em prod** porque nenhum membro tem `status='active'` no fluxo v2 (CV ledger está pausado pelo `CRON_DISABLED_V2` via flag).

Esta feature substitui o proxy: cria coluna `members.subscription_status` (enum `pending|paid|cancelled`), atualiza a view pra usar esse novo campo, e plugga um hook no webhook `orders/paid` que detecta produtos de clube/assinatura e marca `subscription_status='paid'` + dispara `recompute(sponsor_id)` (F-V18).

**Destrava:**
- F-V18 (tags Líder/Influenciador) — sem isto, view sempre retorna 0.
- F-V06 (promoção a Founder) — depende da mesma contagem.
- F-V08 (ranking Founders) — idem.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada (§4 webhooks, §1 sponsor_id intacto, §6 nunca dropar migration)
- [x] TBDs bloqueantes resolvidos (depende só de F-V02 que foi reduzida a "ler via Shopify" com TBD-7 ✅)

## Requisitos Funcionais
- **RF-1:** Coluna `members.subscription_status` enum `pending|paid|cancelled`, default `pending`. Coluna `members.subscription_paid_at timestamptz NULL`.
- **RF-2:** Index BTREE em `members(subscription_status)` para queries de contagem.
- **RF-3:** View `member_active_affiliate_count` recriada com `FILTER (WHERE a.subscription_status = 'paid')`.
- **RF-4:** Função `getSubscriptionStatus(memberId)` em `lib/subscriptions/queries.ts` retorna `{status, paid_at}`.
- **RF-5:** Server action `markSubscriptionPaid(memberId)` em `lib/subscriptions/actions.ts` (idempotente — se já paid, no-op + retorna sucesso). Após update bem-sucedido, lê `sponsor_id` do membro e chama hook F-V18.
- **RF-6:** Server action `cancelSubscription(memberId)` muda pra `cancelled` + recompute do sponsor (membro deixou de contar como ativo).
- **RF-7:** `lib/subscriptions/hook-on-order-paid.ts` exporta `hookOnOrderPaid({memberId, lineItems, totalAmount})`. Heurística:
  - Se algum line_item tem tag de produto contendo `assinatura` ou `clube` (case-insensitive) → marca paid.
  - Fallback (TBD-conservador): se `totalAmount > 200` BRL → marca paid (assinatura mensal Biohelp ~R$200+; produtos avulsos são mais baratos). Bom o suficiente até F-V02 vir com Guru webhook real.
  - Apenas se status atual é `pending` (não reverte cancelled).
- **RF-8:** Hook plugado no webhook `app/api/webhooks/shopify/orders/paid/route.ts` na seção de hooks v2 (entre F-V15 e o final do try) — pattern §10 (try/catch isolado, falha NUNCA derruba o webhook v1).
- **RF-9:** Variável `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE=true` em `.env.local` ativa o recompute automático em `lib/tags/hook-on-status-change.ts`.

## Critérios de Aceite
- **CA-01:** Migration aplica idempotente (re-rodar não erra). View retorna `active_count=0` quando todos membros estão `pending`.
- **CA-02:** `markSubscriptionPaid(memberId)` atualiza `subscription_status='paid'` + `subscription_paid_at=now()`. Re-chamar é no-op (sem 2º update, sem 2º recompute).
- **CA-03:** Após `markSubscriptionPaid`, view `member_active_affiliate_count` para o sponsor mostra `active_count` incrementado em 1.
- **CA-04:** Após 5 chamadas de `markSubscriptionPaid` em afiliados de um sponsor → tags do sponsor passam a incluir `auto:lider` (validação cruza com F-V18).
- **CA-05:** Hook em webhook detecta produto com tag `assinatura` no payload Shopify → marca paid.
- **CA-06:** Hook em webhook com falha (ex.: sponsor_id null, recompute lança) → webhook v1 ainda retorna 200 (Anti-SPEC §4 preservada).
- **CA-07:** Smoke OFF (`LRP_V2=false`): hook não roda, status fica `pending` mesmo com produto-clube.
- **CA-08:** `cancelSubscription` muda status pra `cancelled` + sponsor perde 1 contagem na view.

## Arquivos PERMITIDOS
- `supabase/migrations/20260506_f-v03-subscription-status.sql` (nova)
- `lib/subscriptions/queries.ts` (novo)
- `lib/subscriptions/actions.ts` (novo)
- `lib/subscriptions/hook-on-order-paid.ts` (novo)
- `lib/subscriptions/index.ts` (atualiza para re-exportar)
- `app/api/webhooks/shopify/orders/paid/route.ts` (composição mínima §10)
- `.env.local` (descomentar `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE`)

## Arquivos PROIBIDOS (Anti-SPEC)
- `members.sponsor_id`, vínculo de patrocínio (Anti-SPEC §1) — nunca alterar.
- `lib/cv/*` (Anti-SPEC §10/§12) — não tocar.
- `lib/commissions/*` (legado v1) — não tocar.
- Reverter migration anterior (Anti-SPEC §6) — só CREATE OR REPLACE VIEW + ALTER ADD COLUMN IF NOT EXISTS.
- Webhook v1 lógica (Anti-SPEC §4) — apenas append no fim do try, dentro de try/catch isolado.

## Plano de implementação
1. Branch `feat/S5-integracoes` (já criada).
2. Migration `20260506_f-v03-subscription-status.sql` — idempotente, com rollback comentado.
3. `lib/subscriptions/queries.ts` + `actions.ts` + `hook-on-order-paid.ts`.
4. Compor no webhook `orders/paid` (pattern §10).
5. Setar `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE=true` em `.env.local`.
6. e2e SQL: insert ordem fake → status muda → recompute aciona F-V18.

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | apply_migration MCP retorna success; view query OK | migration | TODO | … |
| CA-02 | `markSubscriptionPaid` 2x → 1 update + 1 noop | unit | TODO | … |
| CA-03 | Insert paid em afiliado → view sponsor.active_count++ | integration SQL | TODO | … |
| CA-04 | 5 paid → recompute → tags inclui `auto:lider` | integration | TODO | … |
| CA-05 | Webhook payload com tag `assinatura` → marca paid | unit fixture | TODO | … |
| CA-06 | Hook lança → webhook 200 | unit | TODO | … |
| CA-07 | Smoke OFF → status pending | smoke | TODO | … |
| CA-08 | `cancelSubscription` → active_count-- | integration | TODO | … |

## Rollback
- Revert do PR.
- Migration reversa:
  ```sql
  CREATE OR REPLACE VIEW member_active_affiliate_count AS
  SELECT m.id AS member_id,
         count(a.id) FILTER (WHERE a.status = 'active') AS active_count
  FROM members m LEFT JOIN members a ON a.sponsor_id = m.id GROUP BY m.id;
  DROP INDEX IF EXISTS idx_members_subscription_status;
  ALTER TABLE members DROP COLUMN IF EXISTS subscription_paid_at;
  ALTER TABLE members DROP COLUMN IF EXISTS subscription_status;
  -- Type ENUM mantido (pode haver outras migrations dependentes futuras)
  ```
- Feature flag: `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE=false` desliga o recompute automático.
