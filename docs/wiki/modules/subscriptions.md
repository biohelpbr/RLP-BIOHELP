# Module: subscriptions

> F-V02 + F-V03 — status do membro = subscription_paid mais recente.

## Responsabilidade
- Mapear produto Shopify de assinatura → `subscription_status` por shopify_customer.
- Atualizar status do `member` quando webhook `orders/paid` for de produto-assinatura (F-V03).
- F-V02 (Guru via webhook) — ⏳ pendente em S5.

## Arquivos principais
- `lib/subscriptions/schema.ts`
- `lib/subscriptions/queries.ts`
- `lib/subscriptions/hook-on-order-paid.ts` (hook v2 dentro de webhook orders/paid).

## SPECs relevantes
- F-V03: `docs/sdd/features/F-V03-status-via-assinatura/SPEC.md`

## Anti-SPEC aplicável
- Item 4: webhook orders/paid em prod — hook v2 sempre isolado (try/catch + `if (isV2Enabled())`).

## Estado atual
- ✅ F-V03 Done (migration `20260506_f-v03-subscription-status.sql`).
- ⏳ F-V02 pendente (precisa confirmar mapeamento com Wink/Guru).
