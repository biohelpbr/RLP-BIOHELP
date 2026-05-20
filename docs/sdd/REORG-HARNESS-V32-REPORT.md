# Reorg Harness v3.2 — Relatório final

**Data:** 2026-05-19
**Branch:** `chore/harness-v3.2-reorg`
**Modo:** bridge aditivo (Cenário C + E do manual v3.2)
**Commits:** 8 (1 por fase) — `8da5bc5..adc8052`
**Código de produção tocado:** **zero**

---

## Arquivos criados (52)

### Raiz
- `AGENTS.md` — contrato comum entre agentes (Harness v3.2)
- `CLAUDE.md` — ajustes específicos do Claude Code
- `TODO.md` — estado vivo + backlog v2

### CI
- `.github/workflows/ci.yml` — job N1 ativo (lint + typecheck + build); N2/N3 comentados

### `docs/product/`
- `PRD.md` — espelho de PIVOT-V2 §1

### `docs/specs/`
- `SPEC.md` — espelho consolidado + Anti-SPEC §6 (espelha PIVOT-V2 §3)

### `docs/contracts/`
- `CONTRACTS.md` — índice navegável dos Zod inline em `lib/*`

### `docs/plans/`
- `CURRENT_REALITY.md` — estado real do repo (estrutura, stack, CI, crons, webhooks, flags, mapeamento docs/sdd/ ↔ v3.2)
- `DECISIONS_LOG.md` — 6 DLs registrados (DL-001 a DL-006)
- `risk-classification.md` — A/B/C/D detalhado + desempates + CI alvo
- `FEATURE-CONTRACT-template.md`
- `VALIDATION-MATRIX-template.md`
- `feature-contracts/.gitkeep`

### `docs/decisions/adr/`
- `.gitkeep`
- `ADR-template.md`

### `docs/wiki/`
- `index.md` — mapa principal + ordem de leitura
- `log.md` — histórico cronológico (2026-04-28 → 2026-05-19, incluindo REORG e VALIDATION)
- `overview.md` — 1 página do projeto hoje
- `architecture.md` — stack + camadas + padrões + decisões arquiteturais
- `modules/` (10): `auth.md`, `db.md`, `shopify.md`, `subscriptions.md`, `payouts.md`, `events.md`, `academy.md`, `tags.md`, `sso.md`, `deployment.md`
- `features/` (10): `F-V03.md`, `F-V05.md`, `F-V07.md`, `F-V09.md`, `F-V11.md`, `F-V14.md`, `F-V15.md`, `F-V16.md`, `F-V17.md`, `F-V18.md`
- `runbooks/` (6): `deploy.md`, `rollback.md`, `smoke-flag-on-off.md`, `webhook-shopify-debug.md`, `cron-disable-v2.md`, `migration-supabase.md`
- `context/.gitkeep`

### `docs/legacy/v1/`
- `README.md` — explica o porquê do arquivo + lista do que ainda vive fora

### `packages/shared/types/`
- `README.md` — skeleton (decisão DL-003: Zod permanece inline em `lib/*`)

### `tests/`
- `unit/README.md`, `integration/README.md`, `contract/README.md`, `e2e/README.md` — skeletons (decisão DL-004)

---

## Arquivos movidos (5)

`git mv` com preservação de histórico (100% rename):

| De | Para |
|---|---|
| `docs/WORKFLOW.md` | `docs/legacy/v1/WORKFLOW.md` |
| `docs/SPEC_Biohelp_LRP.md` | `docs/legacy/v1/SPEC_Biohelp_LRP.md` |
| `documentos_projeto_iniciais_MD/Biohelp_LRP_Escopo_Projeto_v1.md` | `docs/legacy/v1/Biohelp_LRP_Escopo_Projeto_v1.md` |
| `documentos_projeto_iniciais_MD/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md` | `docs/legacy/v1/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md` |
| `documentos_projeto_iniciais_MD/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md` | `docs/legacy/v1/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md` |

---

## Arquivos NÃO tocados (deliberadamente)

### Código de produção
- `app/**` — App Router (rotas, APIs, server actions)
- `lib/**` — módulos por domínio
- `supabase/**` — migrations + config
- `components/**` — React + shadcn + biohelp
- `middleware.ts`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `vercel.json`, `postcss.config.js`

### Fontes de verdade vivas
- `docs/sdd/**` — PIVOT-V2.md, PLAYBOOK.md, CRONOGRAMA-V2.md, LOVEABLE-IMPORT.md, RUNBOOK-GOLIVE-11062026.md, QUESTIONARIO-CLIENTE-V2.md, PROMPT-NOVA-SESSAO.md, PROMPT-HARNESS-V32-REORG.md, features/F-VNN-*/

### Documentação operacional preservada
- `docs/STATUS_IMPLEMENTACAO.md`
- `docs/ACCEPTANCE.md`, `docs/CHANGELOG.md`, `docs/DECISOES_TBD.md`, `docs/README.md`
- `docs/docs para cliente/**`
- `docs/ROTEIRO_DEMONSTRACAO_RAPIDO.md`

### Insumos brutos cliente
- `documentos_escopo/**`
- `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` (regras canônicas v1 — ainda referenciadas em PIVOT-V2)
- `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.docx`
- `documentos_projeto_iniciais_MD/*.png` (NotebookLM Mind Map, core)

### Scripts e assets
- `test-*.mjs`, `apply-*.mjs`, `create-sponsor.mjs`, `reset-admin-password.mjs`
- `LOGINS_TESTE.txt`, `PR_TEMPLATE.md`
- `home-novo-design.png`, `login-novo-design.png`
- `transcript_chats_cursor/`
- `_loveable_import/` (gitignored)

### `.claude/`
- `skills/`, `settings.local.json`, `harness-v3.2-manual.html`, `harness-v3.2-manual.txt`

---

## Validação CI N1 local (Fase 7)

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ — apenas warnings preexistentes (exhaustive-deps em V1*; no-img-element em V1AdminProducts). **Nenhum erro novo.** |
| `npx tsc --noEmit` | ✅ — `EXIT=0`, 0 erros de tipo |
| `npm run build` | ✅ — Next.js 14 build completo, todas as rotas geradas (rotas v1 + v2 + APIs + crons + webhooks) |

---

## Próximos passos (humano)

1. **Revisar PR:** `git diff main..chore/harness-v3.2-reorg`.
2. **Abrir PR** no GitHub (não foi aberto automaticamente — regra de ouro 8).
3. **Mergear PR** (squash ou merge commit, escolha do humano).
4. **Próxima feature B/C/D nova** já nasce v3.2:
   - Lê `docs/wiki/index.md` no início.
   - Cria SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` (caminho existente preservado).
   - Atualiza `TODO.md` (raiz) com Feature Contract inline.
   - QA via Prompt 3 (Validation Mode) + matriz preenchida.
   - Pós-merge: linha em `docs/wiki/log.md`, resumo em `docs/wiki/features/F-VNN.md` se C/D.
5. **Bug urgente A/B:** usar `/fast-fix` (Prompt 0).
6. **Antes de release / a cada 2-4 semanas:** rodar `/wiki lint`.

---

## O que esta reorg NÃO resolveu (e quando reabrir)

| Item | Quando reabrir | Onde está registrado |
|---|---|---|
| Test framework formal | Primeira feature C/D que exigir ≥3 testes amarrados → instalar Vitest e mover `test-*.mjs` para `tests/integration/` | DL-004 |
| `packages/shared/types/` populado | Primeira feature que exigir tipo compartilhado entre módulos | DL-003 |
| Shopify MCP custom | ≥3 pedidos "consulta loja real" em 1 semana | DL-002 |
| N2/N3 no CI | Quando test framework for adotado | DL-005 |
| `PR_TEMPLATE.md` Harness v3.2 | Próxima PR B/C/D que abrir | — |

---

## Memory: linha em `docs/wiki/log.md`

Já registrada em 2026-05-19 (2 linhas):
- `[VALIDATION]` resultado do CI N1 pós-reorg.
- `[REORG]` resumo desta reorganização.

---

## Commits desta branch (ordem cronológica)

```
8da5bc5 chore(harness): fase 1 - espinha (AGENTS/CLAUDE/TODO)
7f1b97e chore(harness): fase 2 - docs/plans templates + CURRENT_REALITY + DECISIONS_LOG
484e67a chore(harness): fase 3 - PRD + SPEC + CONTRACTS (bridge para docs/sdd/)
5371525 chore(harness): fase 4 - Project Wiki completo (index/log/overview/architecture + 10 modulos + 10 features Done + 6 runbooks)
8339a72 chore(harness): fase 5 - packages/shared/types skeleton + tests skeleton + ci.yml N1
39eb947 chore(harness): fase 6 - arquiva 5 docs v1 deprecated em docs/legacy/v1/
adc8052 chore(harness): fase 7 - validacao CI N1 local (lint+typecheck+build verde)
<fase 8 commit>  chore(harness): fase 8 - relatorio final da reorg v3.2
```
