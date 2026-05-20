# CURRENT_REALITY — Biohelp LRP

> Espelho do estado **real** do repositório em 2026-05-19. Atualizar quando algo grande mudar (nova migration, nova feature flag, mudança de stack).

## Sumário

Biohelp LRP é o programa de afiliação 1-nível da marca Biohelp (suplementos / clube de assinatura Shopify). Stack Next.js 14 + Supabase + Shopify Admin API, em **produção** em `https://rlp-biohelp.vercel.app`. O pivot v2 (afiliação simplificada substituindo MLM CV-based) foi declarado em 28/04/2026 e está em entrega — sprints S1 a S5 já fechados, demo cliente executada em 13/05/2026, go-live previsto para 11/06/2026.

O projeto opera há meses sob um **Harness v3.1 caseiro** vivo em `docs/sdd/` (PIVOT-V2.md, PLAYBOOK.md, CRONOGRAMA-V2.md, features/F-VNN-<slug>/SPEC.md por feature). Esta reorg adiciona uma **camada Harness v3.2 padrão (bridge aditivo, Cenários C+E do manual)** que espelha/linka para os docs vivos — sem mover nada, sem tocar código.

A reorg é **puramente documental + scaffolding** (CI yml + pastas vazias de tests/packages). Zero alteração em `app/`, `lib/`, `supabase/`, `components/`, `middleware.ts`, configs de build.

## Estrutura de pastas atual (raiz)

```
.
├── AGENTS.md                          ← NOVO (fase 1)
├── CLAUDE.md                          ← NOVO (fase 1)
├── TODO.md                            ← NOVO (fase 1)
├── README.md                          ← intocado
├── app/                               ← Next.js App Router (intocado)
├── components/                        ← React + shadcn + biohelp (intocado)
├── lib/                               ← módulos por domínio (intocado)
├── supabase/migrations/               ← 15 migrations idempotentes
├── middleware.ts                      ← auth + redirects (intocado)
├── next.config.js / tailwind.config.ts / tsconfig.json / postcss.config.js / vercel.json
├── package.json / package-lock.json   ← intocados
├── docs/
│   ├── sdd/                           ← FONTE DE VERDADE V2 (intocada)
│   │   ├── PIVOT-V2.md
│   │   ├── PLAYBOOK.md
│   │   ├── CRONOGRAMA-V2.md
│   │   ├── LOVEABLE-IMPORT.md
│   │   ├── QUESTIONARIO-CLIENTE-V2.md
│   │   ├── RUNBOOK-GOLIVE-11062026.md
│   │   ├── PROMPT-NOVA-SESSAO.md
│   │   ├── PROMPT-HARNESS-V32-REORG.md  ← prompt da reorg
│   │   └── features/F-VNN-<slug>/      ← ≥18 SPECs por feature
│   ├── product/PRD.md                 ← NOVO (fase 3, espelho)
│   ├── specs/SPEC.md                  ← NOVO (fase 3, espelho)
│   ├── contracts/CONTRACTS.md         ← NOVO (fase 3, espelho)
│   ├── plans/                         ← NOVO (fase 2)
│   │   ├── CURRENT_REALITY.md         ← este arquivo
│   │   ├── DECISIONS_LOG.md
│   │   ├── risk-classification.md
│   │   ├── FEATURE-CONTRACT-template.md
│   │   ├── VALIDATION-MATRIX-template.md
│   │   └── feature-contracts/
│   ├── wiki/                          ← NOVO (fase 4)
│   │   ├── index.md / log.md / overview.md / architecture.md
│   │   ├── modules/ (10 stubs)
│   │   ├── features/ (10 stubs Done)
│   │   ├── runbooks/ (6 receitas)
│   │   └── context/ (vazio até feature ativa)
│   ├── decisions/adr/                 ← NOVO (fase 2, vazio + ADR-template.md)
│   ├── legacy/v1/                     ← NOVO (fase 6, 5 docs v1 + README)
│   ├── STATUS_IMPLEMENTACAO.md        ← fonte de progresso (intocado)
│   ├── ACCEPTANCE.md / CHANGELOG.md / DECISOES_TBD.md / README.md
│   ├── docs para cliente/
│   └── ROTEIRO_DEMONSTRACAO_RAPIDO.md
├── packages/shared/types/             ← NOVO (fase 5, skeleton vazio + README)
├── tests/                             ← NOVO (fase 5, 4 skeletons)
│   ├── unit/ integration/ contract/ e2e/
├── .github/workflows/ci.yml           ← NOVO (fase 5, N1 ativo)
├── documentos_escopo/                 ← raw cliente (intocado)
├── documentos_projeto_iniciais_MD/    ← raw + 2 docs v1 movidos pra legacy
├── _loveable_import/                  ← gitignored
├── transcript_chats_cursor/           ← histórico de sessões (intocado)
└── test-*.mjs / apply-*.mjs / create-*.mjs / reset-*.mjs / verify-data.mjs
    LOGINS_TESTE.txt / PR_TEMPLATE.md / home-novo-design.png / login-novo-design.png
                                       ← scripts/assets intocados
```

## Camadas de código importantes

- **`app/`** — App Router com **switch interno v1/v2 atrás de `LRP_V2`**. Páginas membro `(member)/` (v2), `dashboard/` (v1 + sub-rotas com gate v2 RSC), `admin/` (admin v1+v2). APIs em `app/api/` cobrindo auth, members/me, dashboard, admin, webhooks (Shopify orders, Cashin), cron, sso/shopify (App Proxy), `r/[slug]` (event attribution).

- **`lib/`** — módulos por domínio. Zod inline:
  - `shopify/` — Admin API GraphQL + webhooks + Locksmith.
  - `supabase/` — clients (server + anon).
  - `members/` — cadastro + sync sponsor.
  - `network/` — visão restrita F-V11 + `compression*` v1 congelado.
  - `commissions/` — v1 congelado (CV/níveis/fast-track/bônus/royalty).
  - `commissions-v2/` — shell para F-V04 (bloqueada por TBD-1/2).
  - `payouts/v2/` — interface agnóstica Cashin/Crédito Shopify/PIX + NFe validator (F-V07/F-V07b/F-V07c).
  - `subscriptions/` — F-V03 status + hook webhook.
  - `credits/` — F-V05 Crédito Shopify.
  - `founder/` — F-V06 promoção ≥5 ativos.
  - `content/` — F-V09 Academy CMS.
  - `events/` — F-V15 eventos + funil + attribution.
  - `tags/` — F-V18 auto-classifier Líder/Influenciador + cron diário.
  - `sso/` — F-V17 App Proxy verify (HMAC).
  - `sales-manual/` — F-V14 CRM leve.
  - `cv/`, `levels/` — v1 congelados (cleanup só em F-V12 / onda 6).
  - `utils/` — feature flags (`featureFlags.ts`), helpers.
  - `admin/` — server actions + queries do painel admin.

- **`supabase/migrations/`** — 15 arquivos `YYYYMMDD_<slug>.sql`. Idempotentes, com rollback comentado. Últimas 5 (de S5):
  - `20260506_f-v03-subscription-status.sql`
  - `20260506_f-v09-academy-content.sql`
  - `20260506_f-v15-events.sql`
  - `20260506_f-v17-auth-audit.sql`
  - `20260506_f-v18-tags-and-affiliate-count.sql`

- **`components/`** — primitivos shadcn em `components/ui/`, componentes Biohelp em `components/biohelp/` (KPI tiles, WithdrawDialog, ModulePlayer, EventCard, ...), layouts em `components/layouts/`.

- **`test-*.mjs` raiz** — scripts standalone (sem framework formal):
  - `test-customer-set.mjs`, `test-f-v03-subscription.mjs`, `test-f-v07b-cashin-mock.mjs`, `test-f-v07c-nfe-validator.mjs`, `test-f-v17-app-proxy.mjs`, `test-resync.mjs`, `test-shopify-token.mjs`, `test-sprint2.mjs`, `test-webhook-demo.mjs`, `test-webhook-local.mjs`.
  - Scripts de migração/utilitários: `apply-sprint2-migrations.mjs`, `create-sponsor.mjs`, `reset-admin-password.mjs`.

## Stack

- **Next.js** 14.2 (App Router) — React 18.3.
- **Supabase** JS 2.47 + `@supabase/ssr` 0.5.
- **Zod** 3.25 (inline em `lib/*`).
- **Tailwind** 3 + **shadcn/ui** (17 primitivos).
- **Tanstack Query** 5, **react-hook-form**, **sonner**, **recharts**, **lucide**.
- **TypeScript** 5.7 (estrito).
- **Sem test framework instalado** (Vitest/Jest). Padrão: `test-*.mjs` standalone.

## CI atual

- **Antes desta reorg:** nenhum `.github/workflows/`. Apenas `npm run lint` + `next build` rodam localmente / no Vercel.
- **Após esta reorg:** `.github/workflows/ci.yml` com job N1 (lint + typecheck + build) ativo em PR e push para `main`. N2/N3 ficam comentados no yml como referência.

## Cron Vercel (`vercel.json`)

| Path | Schedule (UTC) | Versão | Pausável |
|---|---|---|---|
| `/api/cron/close-monthly-cv` | `0 3 1 * *` (dia 1, 03:00) | v1 | `CRON_DISABLED_V2=true` |
| `/api/cron/network-compression` | `0 4 1 * *` (dia 1, 04:00) | v1 | `CRON_DISABLED_V2=true` |
| `/api/cron/generate-creatine-coupons` | `0 5 2 * *` (dia 2, 05:00) | v1 (descontinuado, vira F-V15) | — |
| `/api/cron/auto-tags` | `0 3 * * *` (diário 03:00) | v2 (F-V18) | só roda se `LRP_V2=true` |

## Webhooks Shopify ativos (em produção)

- `POST /api/webhooks/shopify/orders/paid` — HMAC obrigatório. Hook v2 (subscription, attribution, tags) dentro de `if (isV2Enabled())` + try/catch isolado.
- `POST /api/webhooks/shopify/orders/refunded` — idem.
- `POST /api/webhooks/shopify/orders/cancelled` — idem.

Hooks v2 isolados em `lib/subscriptions/hook-on-order-paid.ts`, `lib/events/hook-on-order-paid.ts`, `lib/tags/hook-on-order-paid.ts`. Falha NUNCA derruba 200.

## Feature flags

| Flag | Default | Significado |
|---|---|---|
| `LRP_V2` | `false` | Switch master v2 |
| `CRON_DISABLED_V2` | `false` | Pausa crons v1 quando v2 ativo |
| `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE` | `true` | F-V18 invalida tags ao mudar status |
| `LRP_V2_SSO` | `false` | F-V17 SSO Shopify App Proxy |
| `LRP_V2_CASHIN_LIVE` | `false` | F-V07b Cashin live |
| `CASHIN_MODE` | `mock` | mock / sandbox / live |

## Anti-patterns observados que ESTA reorg NÃO corrige

Registrados aqui para futuro reabrir:

1. **Zod inline em `lib/*`** em vez de `packages/shared/types/`. Decisão consciente — DL-003 (`packages/shared/types/` skeleton fica vazio para adoção gradual feature a feature).
2. **Sem test runner instalado** (Vitest/Jest). Usa `test-*.mjs` standalone. Decisão consciente — DL-004 (adoção quando aparecer dor).
3. **`docs/STATUS_IMPLEMENTACAO.md` e `docs/sdd/PIVOT-V2.md` §2 mantêm 2 tabelas redundantes de status** — preservado para não quebrar refs cruzados.
4. **Front Loveable em `_loveable_import/`** — gitignored, referência visual apenas (Anti-SPEC §13).
5. **`PR_TEMPLATE.md` legado** — preservado até próxima PR Harness v3.2 abrir.
6. **Scripts de teste/utilidade na raiz** (`test-*.mjs`, `apply-*.mjs`, `create-sponsor.mjs`, `reset-admin-password.mjs`) — preservados (regra de ouro 4).

## Mapeamento docs/sdd/ ↔ Harness v3.2 (espelho/índice)

| docs/sdd/ (FONTE) | Camada v3.2 (espelho) | Notas |
|---|---|---|
| `PIVOT-V2.md` §1 (visão) | `docs/product/PRD.md` | espelha visão + features |
| `PIVOT-V2.md` §2 (tabela features) | `TODO.md` §1 + `docs/specs/SPEC.md` §2 | espelho redundante |
| `PIVOT-V2.md` §3 (Anti-SPEC) | `docs/specs/SPEC.md` §6 + `AGENTS.md` §12 | espelho exato — fonte prevalece em conflito |
| `PIVOT-V2.md` §4 (TBDs) | `TODO.md` §6 | referencia |
| `PLAYBOOK.md` (workflow) | `AGENTS.md` §3-7 + `CLAUDE.md` | espelho do workflow operacional |
| `CRONOGRAMA-V2.md` | nenhum espelho — referenciado em PRD §Cronograma e SPEC §8 |
| `LOVEABLE-IMPORT.md` | nenhum espelho — referenciado em PRD |
| `features/F-VNN-<slug>/SPEC.md` | atua como Feature Contract (não duplicar). Resumo curto em `docs/wiki/features/F-VNN.md` para Done C/D |
| `STATUS_IMPLEMENTACAO.md` | nenhum espelho — fonte canônica de progresso por sprint, referenciado em `TODO.md` §1 e `docs/wiki/log.md` |

## Restrições de produção (espelha Anti-SPEC v2 — fonte `docs/sdd/PIVOT-V2.md` §3)

NÃO mexer sem autorização explícita:

1. Tabela `members.sponsor_id`.
2. Tabela `shopify_customers` e tags atuais.
3. Tabelas `orders` e `order_items`.
4. Webhooks Shopify ativos em produção.
5. RLS policies existentes.
6. Migrations já aplicadas.
7. `ref_code` de membros existentes (formato `BH00001`).
8. House Account (descontinuada, código até onda 6 / F-V12).
9. Cupom mensal de creatina v1 (escopo alterado — vira F-V15).
10. Código RPA/CPF (descontinuado, removido em F-V12).
11. Provider de pagamento — interface agnóstica em `lib/payouts/v2/`.
12. Tipos e mocks v1 do Loveable (`_loveable_import/src/types/`, `lib/fake-api.ts`).
13. Pasta `_loveable_import/` — gitignored.

Em conflito entre este arquivo e `docs/sdd/PIVOT-V2.md` §3 → **PIVOT-V2.md prevalece** (fonte canônica).
