# Module: events

> F-V15 — eventos admin com funil + tag por link de atribuição.

## Responsabilidade
- Admin cria/edita eventos.
- Link curto `/r/[slug]` → redirect com attribution (cookie/storage).
- Funil: views → cadastros → vendas atribuídas ao evento.
- F-V13 (cupom creatina) foi absorvida por F-V15.

## Arquivos principais
- `lib/events/schema.ts`, `lib/events/queries.ts`, `lib/events/actions.ts`.
- `lib/events/hook-on-order-paid.ts` — attribution hook em webhook Shopify.
- `app/r/[slug]/route.ts` — redirect com attribution.
- `app/admin/(v2)/events/*` — UI admin.

## SPECs relevantes
- F-V15: `docs/sdd/features/F-V15-eventos-admin/SPEC.md`

## Anti-SPEC aplicável
- Item 4: webhook orders/paid — hook v2 isolado.
- Item 9: cupom creatina v1 absorvido — não recriar cron mensal.

## Estado atual
- ✅ Done (06/05). Migration `20260506_f-v15-events.sql`.
