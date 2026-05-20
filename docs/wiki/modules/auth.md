# Module: auth

> Autenticação + autorização. Supabase Auth + magic link + SSO Shopify App Proxy.

## Responsabilidade
- Login membro (magic link via email).
- Sessão via `@supabase/ssr` (cookies httpOnly).
- Gate de rotas privadas via `middleware.ts`.
- SSO entrada via Shopify App Proxy (F-V17) — HMAC sobre query string.

## Arquivos principais
- `lib/supabase/server.ts`, `lib/supabase/client.ts` — clients tipados.
- `middleware.ts` — gate de rotas (`/dashboard/*`, `/admin/*`).
- `lib/sso/app-proxy.ts` — verify HMAC (F-V17).
- `app/api/auth/*` — endpoints de signup/login.
- `app/api/sso/shopify/route.ts` — endpoint SSO.

## SPECs relevantes
- F-V17: `docs/sdd/features/F-V17-sso-shopify/SPEC.md` (+ SHOPIFY-SETUP.md)

## Anti-SPEC aplicável
- Item 5: RLS policies existentes — só alterar em feature classe D com autorização.
- Item 7: `ref_code` formato `BH00001` mantém — não regenerar.

## Estado atual
- ✅ Login / magic link / RLS Done.
- ✅ F-V17 App Proxy Done (default `LRP_V2_SSO=false`).
