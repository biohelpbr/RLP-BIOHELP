# Runbook — Smoke v1 ↔ v2 (toggle `LRP_V2`)

## Quando usar
- Antes de cada release v2.
- Antes de mudar default da flag em prod.
- Após qualquer mudança em `middleware.ts` ou `lib/utils/featureFlags.ts`.

## Smoke local — `LRP_V2=true`
1. `.env.local`: `LRP_V2=true`.
2. `npm run dev`.
3. As 7 rotas v2 abaixo devem retornar 200 logado:
   - `/dashboard` (membro v2)
   - `/dashboard/store` (loja Shopify v2)
   - `/dashboard/network` (visão restrita F-V11)
   - `/dashboard/withdraw` (triple resgate F-V07)
   - `/dashboard/academy` (F-V09)
   - `/admin` (admin v2 home)
   - `/admin/events` (F-V15)
4. Login mostra UI v2.

## Smoke local — `LRP_V2=false`
1. `.env.local`: `LRP_V2=false`.
2. `npm run dev`.
3. Rotas v2 puras (`/admin/events`, `/admin/academy`) **redirecionam** ou retornam 404.
4. Rotas v1 (`/dashboard`, `/admin`) retornam 200 com UI v1.
5. Login mostra UI v1.

## Referência
- `docs/STATUS_IMPLEMENTACAO.md` §S2 e §S3 — smoke validado em entrega original.

## Webhooks (sem mudar flag)
- Webhook Shopify orders/paid SEMPRE retorna 200, independente da flag — hooks v2 isolados em try/catch.
- Validar via `node test-webhook-local.mjs` em ambos os modos.
