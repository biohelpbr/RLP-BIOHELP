# Runbook — Deploy (Vercel)

## Pré-requisitos
- Branch mergeada em `main`.
- CI N1 verde.
- Feature C/D: matriz de validação preenchida com evidências.

## Passos
1. `git checkout main && git pull --ff-only`.
2. Vercel auto-deploy on push to `main` (preview deploy on PR branch).
3. Confirmar deploy em https://vercel.com/<org>/rlp-biohelp.
4. Smoke: `curl https://rlp-biohelp.vercel.app` retorna 200.
5. Se feature D: validar 1 fluxo crítico em prod (login, webhook receive, etc.).

## Variáveis de ambiente em prod (referência)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`
- `LRP_V2` (default false em prod)
- `CRON_SECRET`
- `CASHIN_MODE`, `CASHIN_API_KEY` (quando live)
- `LRP_V2_SSO_HMAC_SECRET` (App Proxy)

## Rollback
Ver `runbooks/rollback.md`.
