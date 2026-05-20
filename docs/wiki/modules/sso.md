# Module: sso

> F-V17 — SSO Shopify → Painel via App Proxy (HMAC).

## Responsabilidade
- Receber entrada do Shopify via App Proxy (URL `/api/sso/shopify?signature=…`).
- Verificar HMAC sobre query string com `LRP_V2_SSO_HMAC_SECRET`.
- Match `customer_id` Shopify → `member` → criar sessão Supabase Auth (sem senha).

## Arquivos principais
- `lib/sso/app-proxy.ts` — verify HMAC.
- `app/api/sso/shopify/route.ts` — endpoint.

## SPECs relevantes
- F-V17: `docs/sdd/features/F-V17-sso-shopify/SPEC.md` + `SHOPIFY-SETUP.md`.

## Anti-SPEC aplicável
- Item 5: RLS policies — App Proxy não bypassa RLS, só cria sessão válida.

## Decisão arquitetural
- **App Proxy** escolhido em vez de Multipass — loja Biohelp não é Shopify Plus.

## Estado atual
- ✅ Done (06/05, default OFF — `LRP_V2_SSO=false`). Auditoria em migration `20260506_f-v17-auth-audit.sql`.
