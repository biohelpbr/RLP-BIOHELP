# Architecture — Biohelp LRP

> Arquitetura técnica viva. Resumo do SPEC + reflexo do código real. Manter ≤ 150 linhas.

## Stack

- **Frontend + Backend:** Next.js 14 App Router (Server Components, Server Actions, Route Handlers).
- **DB + Auth:** Supabase (Postgres + Auth + RLS).
- **Pagamento Shopify:** Admin API GraphQL (`2024-10`) + Webhooks HMAC.
- **Pagamento membro:** Cashin (PIX cash) + Crédito Shopify (`customer.credit`) + PIX manual + NF.
- **SSO:** Shopify App Proxy HMAC (não Multipass — loja sem Plus).
- **Crons:** Vercel Cron.
- **Style:** Tailwind 3 + shadcn/ui.
- **Tipos:** TypeScript estrito + Zod inline em `lib/*`.

## Camadas

```
app/                    ← App Router
  (member)/             ← rotas membro v2 (gated por LRP_V2)
  dashboard/            ← rotas membro v1 + switch interno v1/v2
  admin/                ← rotas admin v1+v2 (switch RSC)
  api/
    auth/               ← login / signup
    members/me/         ← dashboard membro
    admin/              ← painel admin
    webhooks/
      shopify/          ← orders/paid|refunded|cancelled (HMAC)
      cashin/status     ← Cashin webhook
    cron/               ← Vercel crons
    sso/shopify         ← F-V17 App Proxy
    r/[slug]            ← F-V15 attribution redirect
lib/
  shopify/              ← Admin API + Webhooks
  supabase/             ← clients (server + anon)
  members/              ← cadastro + sync
  network/              ← visão restrita (F-V11) + compression (v1 congelado)
  commissions/          ← v1 congelado
  commissions-v2/       ← shell (F-V04 pendente)
  payouts/v2/           ← Cashin/Crédito Shopify/PIX + NFe validator
  subscriptions/        ← F-V03 + hook webhook
  credits/              ← F-V05 Crédito Shopify
  founder/              ← F-V06 promoção
  content/              ← F-V09 Academy
  events/               ← F-V15 eventos + funil
  tags/                 ← F-V18 auto-classifier
  sso/                  ← F-V17 App Proxy verify
  sales-manual/         ← F-V14 CRM leve
  cv/                   ← v1 congelado
  levels/               ← v1 congelado
  utils/                ← feature flags, helpers
supabase/migrations/    ← migrations idempotentes YYYYMMDD_slug.sql
components/             ← React + shadcn/ui + biohelp/ + layouts/
middleware.ts           ← auth gate + redirects
```

## Padrões

- **Idempotência:** todo webhook + cron + UPSERT.
- **HMAC:** todo webhook valida antes de ler body.
- **RLS:** ativo em todas as tabelas com PII de membro / payout / NF.
- **Feature flag:** `if (isV2Enabled())` em qualquer hook v2 dentro de fluxo v1.
- **Try/catch isolado:** hook v2 nunca derruba 200 do webhook v1 (Anti-SPEC §4).
- **Anti-SPEC v2:** ver `docs/sdd/PIVOT-V2.md` §3 itens 1-13.

## Decisões arquiteturais relevantes

- **`packages/shared/types/` skeleton apenas** — Zod inline em `lib/*` permanece padrão (DL-003).
- **Tests:** scripts standalone `test-*.mjs` na raiz — sem framework formal (DL-004).
- **SSO via App Proxy** (não Multipass) — loja sem Plus (registrado em `docs/sdd/features/F-V17-sso-shopify/SHOPIFY-SETUP.md`).
- **Triple resgate:** 3 abas `Tabs` (não Select único) — registrado em `STATUS_IMPLEMENTACAO.md`.
- **Cashin:** interface agnóstica `CashinClient` com 3 implementações (mock/sandbox/live), factory por env `CASHIN_MODE`.
- **CV / níveis / Fast-Track / Bônus / Royalty (v1):** congelados em `lib/cv/`, `lib/levels/`, `lib/commissions/`. Cleanup só na onda 6 (F-V12).
