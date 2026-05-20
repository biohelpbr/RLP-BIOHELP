# Module: tags

> F-V18 — tags automáticas Líder (≥5 ativos) / Influenciador (≥40 acumulado).

## Responsabilidade
- Recalcular tags na invalidação:
  - Webhook orders/paid muda status → invalida tags do member afetado + sponsor.
  - Cron diário às 03:00 UTC consolida.
- Aplicar tag no Shopify Customer (via `lib/shopify/customer-tags.ts`).
- Coluna `members.affiliate_count` mantida em sync via migration `20260506_f-v18-tags-and-affiliate-count.sql`.

## Arquivos principais
- `lib/tags/auto-classifier.ts` — regra Líder/Influenciador.
- `lib/tags/hook-on-order-paid.ts` — invalidação em webhook.
- `app/api/cron/auto-tags/route.ts` — cron diário.

## SPECs relevantes
- F-V18: `docs/sdd/features/F-V18-tags-automaticas/SPEC.md`

## Anti-SPEC aplicável
- Item 2: tabela `shopify_customers` + tags atuais — tag de classificação é separada das tags de clube.
- Item 4: webhook orders/paid — hook v2 isolado.

## Estado atual
- ✅ Done (06/05). Cron `auto-tags` em `vercel.json` (03:00 UTC diário).
- Flag `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE=true` por default.
