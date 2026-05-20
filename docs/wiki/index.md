# Project Wiki — Biohelp LRP

> Memória sintetizada viva entre fontes brutas e agentes. NUNCA fonte de verdade.
> Fonte de verdade fica em: `docs/sdd/PIVOT-V2.md` (v2), `docs/sdd/features/F-VNN-*/SPEC.md` (por feature), `lib/*` (Zod inline), `supabase/migrations/*` (schema).

## Leitura inicial obrigatória (toda sessão do Claude Code)

1. **Este arquivo (`docs/wiki/index.md`).**
2. `docs/wiki/context/<F-NNN-atual>.md` se houver feature ativa.
3. `TODO.md` (raiz).
4. `AGENTS.md` (raiz).
5. `docs/sdd/PIVOT-V2.md` §3 (Anti-SPEC v2).
6. `docs/sdd/PLAYBOOK.md`.
7. `docs/wiki/log.md` últimas 30 linhas.
8. `git status`.

## Mapa

| Camada | Arquivo / Diretório | Conteúdo |
|---|---|---|
| Produto | `docs/product/PRD.md` | PRD v2 (espelho de PIVOT-V2) |
| Spec + Anti-SPEC | `docs/specs/SPEC.md` | espelho consolidado |
| Spec v2 (FONTE) | `docs/sdd/PIVOT-V2.md` | pivot canônico |
| Workflow (FONTE) | `docs/sdd/PLAYBOOK.md` | loop por feature |
| Cronograma | `docs/sdd/CRONOGRAMA-V2.md` | sprints S1-S5 + buffer |
| Loveable import | `docs/sdd/LOVEABLE-IMPORT.md` | design system + Anti-SPEC do import |
| SPECs por feature | `docs/sdd/features/F-VNN-<slug>/` | ≥18 SPECs |
| Contratos | `docs/contracts/CONTRACTS.md` | índice navegável dos Zod |
| Plano operacional | `docs/plans/` | CURRENT_REALITY, DECISIONS_LOG, risk-classification, templates |
| Wiki | `docs/wiki/` | este diretório |
| Decisões arquiteturais | `docs/decisions/adr/` | ADRs |
| Legacy v1 | `docs/legacy/v1/` | docs v1 deprecated (banner + READ-ONLY) |
| Estado vivo | `TODO.md` | features em andamento + bugs §5 |
| Estado histórico | `docs/STATUS_IMPLEMENTACAO.md` | snapshots por sprint |
| Insumos cliente | `documentos_escopo/`, `documentos_projeto_iniciais_MD/` | raw |

## Módulos (`docs/wiki/modules/`)

| Módulo | Arquivo | Resumo curto |
|---|---|---|
| auth | `modules/auth.md` | Supabase Auth + magic link + SSO Shopify App Proxy |
| db | `modules/db.md` | Supabase Postgres + RLS + migrations idempotentes |
| shopify | `modules/shopify.md` | Admin API GraphQL + Webhooks + Locksmith |
| subscriptions | `modules/subscriptions.md` | F-V02 + F-V03 (Guru → Shopify → subscription_status) |
| payouts | `modules/payouts.md` | F-V05 + F-V07 (triple resgate: Cashin / Crédito Shopify / PIX+NF) |
| events | `modules/events.md` | F-V15 (eventos admin + funil + tag por link) |
| academy | `modules/academy.md` | F-V09 (CMS leve + ModulePlayer) |
| tags | `modules/tags.md` | F-V18 (Líder ≥5 / Influenciador ≥40 + cron diário) |
| sso | `modules/sso.md` | F-V17 (App Proxy — Multipass descartado) |
| deployment | `modules/deployment.md` | Vercel + crons + env vars + preview deploys |

## Features (`docs/wiki/features/`)

Resumo curto pós-merge para C/D. Lista preenchida automaticamente após feature B/C/D fechar. Estado inicial: 1 entrada por feature já Done.

## Runbooks (`docs/wiki/runbooks/`)

| Runbook | Quando |
|---|---|
| `runbooks/deploy.md` | Antes de cada deploy (Vercel) |
| `runbooks/rollback.md` | Quando feature D quebra prod |
| `runbooks/smoke-flag-on-off.md` | Validar v1/v2 switch sem regressão |
| `runbooks/webhook-shopify-debug.md` | Quando webhook orders/paid falha |
| `runbooks/cron-disable-v2.md` | Como pausar/reativar crons v1/v2 |
| `runbooks/migration-supabase.md` | Aplicar migration via MCP |

## Context Packs (`docs/wiki/context/`)

Diretório vazio quando não há feature ativa. Cada feature B/C/D significativa ganha `context/F-NNN.md` antes de iniciar (criado via `/wiki context F-NNN`).
