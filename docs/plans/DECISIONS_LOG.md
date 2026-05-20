# Decisions Log — Biohelp LRP

> Decisões operacionais (volta ao debate). ADRs vão em `docs/decisions/adr/`. Decisões grandes pivôs de produto vão em `docs/sdd/PIVOT-V2.md`.

| Data | ID | Decisão | Contexto | Reaberto em |
|---|---|---|---|---|
| 2026-05-19 | DL-001 | Harness v3.2 adotado em modo bridge aditivo (não move docs/sdd/) | Cenário C+E do manual v3.2. Risco zero para fontes de verdade vivas. | — |
| 2026-05-19 | DL-002 | Shopify MCP custom NÃO criado nesta reorg | Existe MCP Shopify Dev oficial. `lib/shopify/` estável. Custo > benefício hoje. Reavaliar se aparecer ≥3 pedidos repetidos de "consulta loja real" em uma semana. | — |
| 2026-05-19 | DL-003 | `packages/shared/types/` criado vazio; Zod permanece inline em `lib/*` | Migração big-bang violaria Cenário C ("nenhum refactor preventivo"). Adoção feature a feature. | — |
| 2026-05-19 | DL-004 | `tests/{unit,integration,contract,e2e}/` criado vazio; test runner formal não instalado | Padrão atual `test-*.mjs` na raiz funciona. Adotar Vitest/Jest quando aparecer feature C/D que exija ≥3 testes amarrados. | — |
| 2026-05-19 | DL-005 | CI Github Actions com N1 ativo (lint + typecheck + build). N2/N3 comentados | Projeto sem test framework. N2/N3 ficam como referência até adoção. | — |
| 2026-05-19 | DL-006 | v1 docs deprecated movidos para `docs/legacy/v1/` (WORKFLOW.md, SPEC_Biohelp_LRP.md, Biohelp_LRP_Escopo_Projeto_v1.md, Biohelp_LRP_Matriz_*, Biohelp_LRP_Cronograma_Completo_*) | Reduzir ruído. Banners DEPRECATED preservados + README explicativo. v1 code intocado (cleanup só na onda 6 / F-V12). | — |
