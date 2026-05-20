# Contracts — Biohelp LRP

> **Fonte de verdade dos contratos:** Zod inline em `lib/*` (decisão DL-003).
> Este arquivo é um índice navegável dos schemas Zod existentes e dos shapes de webhook/API públicas.
> Migração futura para `packages/shared/types/` é gradual (feature a feature, sem big-bang).

## 1. Schemas Zod por módulo

| Módulo | Local provável | Schemas (preencher com `grep -rn "z.object" lib/<modulo>`) |
|---|---|---|
| Subscriptions | `lib/subscriptions/` | `SubscriptionStatusSchema`, payload do hook |
| Commissions v2 | `lib/commissions-v2/` | (shell — F-V04 bloqueada por TBD-1/2) |
| Credits | `lib/credits/` | payload `customer.credit` Shopify Admin |
| Founder | `lib/founder/` | `FounderPromotionEventSchema` |
| Content | `lib/content/` | `ModuleSchema`, `LessonSchema` (F-V09) |
| Events | `lib/events/` | `EventSchema`, `AttributionEventSchema` (F-V15) |
| Payouts v2 | `lib/payouts/v2/` | `PayoutRequestSchema`, `PayoutMethodSchema` (`pix` / `cashback_cashin` / `shopify_credit`) |
| Sales Manual | `lib/sales-manual/` | `LeadSchema`, `SaleSchema` (F-V14) |
| Tags | `lib/tags/` | `TagSchema`, regras de classificação (F-V18) |
| SSO | `lib/sso/` | `AppProxyQuerySchema` (F-V17) |
| Members | `lib/members/` | `SignupSchema` (com ref obrigatório — F-V01 quando entregue) |
| Shopify | `lib/shopify/` | shapes de webhook envelopes |

> Próxima ação manutenção: rodar `grep -rn "z.object" lib/ | head -50` para popular esta tabela com nomes exatos. Atualizar nesta arquivo somente quando módulo for tocado (gradual).

## 2. Endpoints públicos

### Webhooks Shopify (entrada)

| Endpoint | Método | Auth | Schema do payload |
|---|---|---|---|
| `/api/webhooks/shopify/orders/paid` | POST | HMAC SHA256 (`X-Shopify-Hmac-Sha256`) | Shopify Order (REST API 2024-10) |
| `/api/webhooks/shopify/orders/refunded` | POST | HMAC | Shopify Refund |
| `/api/webhooks/shopify/orders/cancelled` | POST | HMAC | Shopify Order cancelled |

Hooks v2 em cada um:
- `lib/subscriptions/hook-on-order-paid.ts` (F-V03).
- `lib/events/hook-on-order-paid.ts` (F-V15 attribution).
- `lib/tags/hook-on-order-paid.ts` (F-V18 invalidação).

### Webhook Cashin (entrada)

| Endpoint | Método | Auth | Schema |
|---|---|---|---|
| `/api/webhooks/cashin/status` | POST | Bearer token (sandbox) | `{ payout_id, status, ... }` (F-V07b) |

### API REST membro

Listar via Glob `app/api/members/me/**` e `app/api/dashboard/**`. Schemas em `lib/<modulo>/schema.ts`.

### API REST admin

Listar `app/api/admin/**`. Server actions com Zod input em `lib/admin/`.

### SSO Shopify App Proxy

| Endpoint | Método | Auth | Schema |
|---|---|---|---|
| `/api/sso/shopify` | GET | App Proxy HMAC sobre query | `?customer_id=<id>&shop=<domain>&signature=<hmac>&...` (F-V17) |

### Event Attribution (F-V15)

| Endpoint | Método | Auth | Comportamento |
|---|---|---|---|
| `/r/[slug]` | GET | público | redirect → `?event=<slug>&parceira=<ref>` salvo em cookie/storage para attribution. |

## 3. Migrations Supabase

Caminho: `supabase/migrations/`. Padrão de nome: `<YYYYMMDD>_<slug>.sql`. Idempotente. Rollback comentado no topo.

Comando para listar últimas: `ls -1t supabase/migrations | head -10`.

Migrations recentes (2026-05):
- `20260506_f-v03-subscription-status.sql`
- `20260506_f-v09-academy-content.sql`
- `20260506_f-v15-events.sql`
- `20260506_f-v17-auth-audit.sql`
- `20260506_f-v18-tags-and-affiliate-count.sql`
- `20260505_f-v07-payout-method.sql`
- `20260505_f-v07b-relax-bank-fields.sql`
- `20260505_f-v14-sales-manual.sql`

## 4. Feature flags

| Flag | Default | Significado |
|---|---|---|
| `LRP_V2` | `false` | Switch master v2 |
| `CRON_DISABLED_V2` | `false` | Pausa crons v1 quando v2 ativo |
| `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE` | `true` | F-V18 invalida tags ao mudar status |
| `LRP_V2_SSO` | `false` | F-V17 SSO Shopify App Proxy |
| `LRP_V2_CASHIN_LIVE` | `false` | F-V07b Cashin live |
| `CASHIN_MODE` | `mock` | mock / sandbox / live |
