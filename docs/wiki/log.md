# Wiki Log — Biohelp LRP

> Histórico cronológico vivo. Tipos: `[INGEST]`, `[RELEASE]`, `[BUGFIX]`, `[VALIDATION]`, `[DECISION]`, `[MVP]`, `[REORG]`.
> Manter ≤ 200 linhas. Arquivar lotes antigos em `wiki/log-archive-YYYY-QN.md` quando estourar.

## 2026-05-19

- [2026-05-19] [REORG] Adotado Harness v3.2 em modo bridge aditivo. Criados AGENTS.md / CLAUDE.md / TODO.md (raiz), docs/product/PRD.md, docs/specs/SPEC.md, docs/contracts/CONTRACTS.md, docs/plans/ (CURRENT_REALITY, DECISIONS_LOG, risk-classification, templates), docs/wiki/ (este arquivo + índice + overview + architecture + modules + runbooks), docs/decisions/adr/, docs/legacy/v1/ (com 5 docs v1 movidos), packages/shared/types/, tests/{unit,integration,contract,e2e}/, .github/workflows/ci.yml. **Zero código de produção tocado.** Branch: `chore/harness-v3.2-reorg`. Referência: `.claude/harness-v3.2-manual.html`. PR pendente de abertura humana.

## 2026-05-13

- [2026-05-13] [RELEASE] Demo cliente executada com sucesso. Roteiro em `docs/ROTEIRO_DEMONSTRACAO_RAPIDO.md` + ajuste pós-demo registrado em commit `5d9aed2` e `d8e3e91`.

## 2026-05-06

- [2026-05-06] [RELEASE] S5 entregue — F-V03 (subscription status), F-V17 (SSO App Proxy), F-V07b (Cashin live mock+sandbox), F-V07c (NFe validator). 2 migrations aplicadas via Supabase MCP (`f_v03_subscription_status`, `f_v17_auth_audit`). Branch `feat/S5-integracoes`. Detalhe: `docs/STATUS_IMPLEMENTACAO.md` §S5.
- [2026-05-06] [RELEASE] S3 entregue — F-V18 tags auto (Líder/Influenciador), 5 áreas admin v2. Migration `f_v18_tags_and_affiliate_count`. 2 bugs corrigidos no smoke (cache fetch no-store + jsonb `cs` filter).
- [2026-05-06] [RELEASE] S4 entregue — F-V15 eventos + F-V09 Academy + Finance/Payouts admin refator. 2 migrations (`f_v15_events`, `f_v09_academy_content`). F-V13 absorvida por F-V15.
- [2026-05-06] [RELEASE] S2 entregue — F-V14 vendas manuais + F-V05 saldo/créditos + F-V07 triple resgate UI. 3 migrations.

## 2026-05-05

- [2026-05-05] [RELEASE] S1 entregue — fundação Loveable (Tailwind 3 + shadcn 17 primitivos + tokens HSL + Plus Jakarta + componentes biohelp + sidebars). 3 telas membro v2 atrás de `LRP_V2`.

## 2026-04-29

- [2026-04-29] [RELEASE] F-V11 mergeada — visão restrita da rede (sponsor + N1).
- [2026-04-29] [DECISION] Reunião 29/04 PM — 5 features novas catalogadas (F-V14..F-V18). 3 TBDs resolvidos (11/14/19). 4 derivados (23/24/25/26). Cronograma esticado para 11/06/2026.

## 2026-04-28

- [2026-04-28] [DECISION] Pivot v2 declarado pelo cliente. MLM CV-based descontinuado. Modelo v2: afiliação 1-nível + Founder@5 + créditos Shopify + Cashin. Documento canônico criado: `docs/sdd/PIVOT-V2.md`.
