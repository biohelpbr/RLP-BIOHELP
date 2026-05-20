# Module: shopify

> Integração Shopify Admin API GraphQL + Webhooks + Locksmith.

## Responsabilidade
- Chamadas Admin API (GraphQL 2024-10) via cliente centralizado.
- Recebimento e validação HMAC de webhooks `orders/paid|refunded|cancelled`.
- Aplicação de tags em Shopify Customer (F-V18).
- Conversão saldo → Crédito Shopify via `customer.credit` (F-V05).

## Arquivos principais
- `lib/shopify/admin.ts` — cliente GraphQL com rate limit / retry.
- `lib/shopify/webhook.ts` — HMAC validator.
- `lib/shopify/customer-tags.ts` — aplicação de tags.
- `app/api/webhooks/shopify/orders/{paid,refunded,cancelled}/route.ts`.

## SPECs relevantes
- F-V03 (subscription hook), F-V05 (credit), F-V15 (event attribution hook), F-V18 (tags hook).

## Anti-SPEC aplicável
- Item 2: tabela `shopify_customers` + tags atuais (preço de clube depende delas).
- Item 4: webhooks Shopify ativos em produção.
- Item 11: provider de pagamento agnóstico (lib/payouts/v2/).

## Estado atual
- ✅ Admin client estável.
- ✅ Webhooks orders/* com hooks v2 isolados (try/catch dentro de `if (isV2Enabled())`).
