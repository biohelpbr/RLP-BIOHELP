# Module: deployment

> Vercel + crons + env vars + preview deploys.

## Responsabilidade
- Deploy de produção via push para `main` (auto).
- Preview deploy por PR.
- Crons Vercel (`vercel.json`).
- Env vars geridas no painel Vercel.

## Arquivos principais
- `vercel.json` — crons + rewrites.
- `next.config.js` — build settings.
- `.github/workflows/ci.yml` — CI N1 (lint + typecheck + build).

## Crons ativos
| Path | Schedule (UTC) | Versão | Pausável |
|---|---|---|---|
| `/api/cron/close-monthly-cv` | `0 3 1 * *` | v1 | `CRON_DISABLED_V2=true` |
| `/api/cron/network-compression` | `0 4 1 * *` | v1 | `CRON_DISABLED_V2=true` |
| `/api/cron/generate-creatine-coupons` | `0 5 2 * *` | v1 (descontinuado) | — |
| `/api/cron/auto-tags` | `0 3 * * *` | v2 (F-V18) | só roda se `LRP_V2=true` |

## Env vars críticas (prod)
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Shopify: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`.
- Flags v2: `LRP_V2`, `LRP_V2_SSO`, `LRP_V2_CASHIN_LIVE`, `CASHIN_MODE`.
- Cron: `CRON_SECRET`.
- SSO: `LRP_V2_SSO_HMAC_SECRET`.

## Estado atual
- ✅ Prod em `https://rlp-biohelp.vercel.app`.
- ✅ CI N1 ativo (após esta reorg).
- ⏳ Switch `LRP_V2=true` no go-live 11/06/2026.
