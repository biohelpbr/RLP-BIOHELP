# AGENTS.md — Biohelp LRP (Harness v3.2)

> Contrato comum entre Claude Code (gerador principal), Codex (continuidade), Cursor Agent (infra/MCP — opcional, classe D), CI (avaliador). Documento curto. Em conflito com `docs/sdd/PLAYBOOK.md` ou `docs/sdd/PIVOT-V2.md`, **estes prevalecem** (são as fontes de verdade vivas do projeto).

**Versão:** Harness v3.2 (bridge aditivo sobre Harness v3.1 caseiro existente em `docs/sdd/`).
**Última atualização:** 2026-05-19.

---

## 1. Time

| Papel | Quem | Quando |
|---|---|---|
| Gerador | Claude Code (sessões locais via VSCode/CLI) | sempre |
| Continuidade | Codex / Cursor (após `/wiki context F-NNN`) | quando Claude esgota tokens |
| Infra/MCP | Cursor Agent (apenas classe D — migration, deploy, env) | sob `docs/plans/cursor-brief.md` |
| Avaliador | CI (`.github/workflows/ci.yml`) + revisão humana sugerida | toda PR B/C/D |

## 2. Princípios não-negociáveis (do manual v3.2 + adaptados a este projeto em produção)

1. Adoção gradual. **Nenhum refactor preventivo. Nenhuma migration preventiva.** (Cenário C, §17 do manual).
2. Anti-SPEC v2 (`docs/sdd/PIVOT-V2.md` §3 itens 1-13) é **sagrada** — alteração exige autorização humana explícita.
3. CI verde no nível da classe = condição de merge. Sem exceção.
4. Produção exige staging + rollback + smoke (classe D).
5. Estado vivo = `TODO.md` (raiz) + `git log` + `docs/STATUS_IMPLEMENTACAO.md`. Sem `state/`, sem `handoffs/`, sem `progress.jsonl`.
6. Feature é a unidade. Nunca task atômica.
7. Toda feature B/C/D termina com 1 linha em `docs/wiki/log.md`.
8. Wiki é memória sintetizada, NUNCA fonte de verdade.
9. Fast Fix é exceção justificada, não norma. Em dúvida, escale.
10. Em conflito de docs: `PIVOT-V2.md` > `PLAYBOOK.md` > docs/specs/SPEC.md (espelho) > docs/wiki/* > qualquer outro.

## 3. Classificação de risco A/B/C/D

| Classe | Exemplos | Modo | CI alvo |
|---|---|---|---|
| **A** | typo, layout, ajuste sem contrato | Standard ou Fast Fix | N1 (lint + typecheck + build) |
| **B** | CRUD simples, endpoint não crítico, UI nova | Standard | N1 + 1 teste do CA principal |
| **C** | auth, payout, permissões, dados sensíveis (RLS, members, tags) | Deep Work | N2 (N1 + integration + contract) |
| **D** | migration, deploy real, env nova, webhook financeiro, RLS policy | Production | N3 (N2 + e2e + smoke + migration validation) + cursor-brief + rollback + feature flag |

Desempates → ver `docs/plans/risk-classification.md`. Em dúvida, **suba a classe, nunca desça**.

Auto-reclassificação obrigatória: se uma feature B vira D no meio (ex.: começou CRUD, virou migration), **PARE, atualize SPEC, peça aprovação humana**.

## 4. Autonomia / Pausa / Bloqueado

Estados do agente (espelha `docs/sdd/PLAYBOOK.md`):

| Estado | Quando | Ação |
|---|---|---|
| **CONTINUE** | DoR ok + arquivos permitidos + sem risco novo | Seguir |
| **PAUSE** | mudar Anti-SPEC v2 / tocar produção real / nova dep externa / escopo crescendo | Parar e perguntar ao humano |
| **BLOQUEADO — DoR INCOMPLETA** | Feature C/D sem CAs claros ou sem arquivos permitidos | Parar, voltar ao Passo 2 do PLAYBOOK |
| **BLOQUEADO — ARQUIVO FORA DO FEATURE CONTRACT** | Mexer em arquivo proibido sem justificativa | Parar e relatar |
| **BLOQUEADO — TBD PENDENTE** | Regra ainda não decidida pelo cliente (TBD aberto em PIVOT-V2.md §4) | Parar e relatar |
| **BLOQUEADO — RECLASSIFICAÇÃO** | Virou D no meio sem atualizar contrato | Parar, atualizar SPEC, retomar |
| **BLOQUEADO — ANTI-SPEC VIOLADA** | Tentativa de mexer em item da §3 do PIVOT-V2.md sem autorização | Parar |

## 5. Os 4 prompts do dia a dia

Referência canônica: `.claude/harness-v3.2-manual.html` §6 + skills `/agents-protocol` (template em `.claude/skills/agents-protocol/`).

- **Prompt 0 — Fast Fix:** bug urgente A/B sem auth/payment/dados sensíveis, <30 min. `/fast-fix`.
- **Prompt 1 — Início de sessão:** lê `docs/wiki/index.md` + `docs/wiki/context/<atual>.md` (se houver) + `TODO.md` + `AGENTS.md` + Feature Contract ativo + `docs/wiki/log.md` recente + `git status`. Reporta fase, classe, DoR, autonomia.
- **Prompt 2 — Implementar feature:** valida DoR → cria Feature Contract para B/C/D → atualiza Zod primeiro → branch → teste falhando → implementação → CI no nível da classe → matriz de validação → docs → PR. Pós-merge: linha em `docs/wiki/log.md`, resumo em `docs/wiki/features/F-NNN.md` se C/D.
- **Prompt 3 — QA do PR (Validation Mode):** lê Feature Contract → `git diff` → arquivos alterados vs permitidos → contratos → Anti-SPEC → matriz CA→teste→tipo→status→evidência → tenta quebrar → CI → produção (D). Retorna APROVADO | MUDANÇAS_SOLICITADAS | BLOQUEADO. Nunca APROVADO sem evidência.

## 6. Definition of Ready (B/C/D)

Antes de codar (inline no item do `TODO.md`):
- [ ] RFs vinculados ou justificativa
- [ ] CAs claros e testáveis
- [ ] Classe A/B/C/D confirmada
- [ ] Arquivos prováveis listados (permitidos)
- [ ] Arquivos PROIBIDOS listados (Anti-SPEC aplicável)
- [ ] Testes esperados (unit / integration / contract / e2e / smoke)
- [ ] Contratos Zod necessários (ou decisão "não precisa")
- [ ] Dependências externas
- [ ] Impacto em banco
- [ ] Impacto em produção (staging, rollback, feature flag)
- [ ] TBDs bloqueantes resolvidos

DoR incompleta em domínio sensível → `BLOQUEADO — DEFINITION OF READY INCOMPLETA`.

## 7. Feature Contract

Obrigatório para B/C/D. Vive **inline no `TODO.md`** ou em `docs/plans/feature-contracts/F-NNN.md` se passar de ~40 linhas (típico C/D). Template: `docs/plans/FEATURE-CONTRACT-template.md`.

Para SPECs já existentes em `docs/sdd/features/F-VNN-<slug>/SPEC.md`, **essas SPECs ATUAM como Feature Contract** — não duplicar. Apenas adicionar referência no item do TODO.

## 8. Matriz de Validação

Obrigatória no Prompt 3 (QA) para B/C/D. Template: `docs/plans/VALIDATION-MATRIX-template.md`.

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|

Sem evidência objetiva → MUDANÇAS_SOLICITADAS. Nunca APROVADO. Teste fake (`expect(true).toBe(true)`) não conta.

## 9. CI por níveis

Mapeamento atual (`.github/workflows/ci.yml`):

| Nível | Contém | Obrigatório para |
|---|---|---|
| **N1** | `npm run lint` + `npx tsc --noEmit` + `npm run build` | A, B, Fast Fix |
| **N2** | N1 + scripts `test-*.mjs` relevantes + smoke HTTP via dev server | B relevante, C |
| **N3** | N2 + Playwright e2e (manual hoje) + migration validation Supabase + Vercel preview deploy | C crítica, D |

N1 está ativo no workflow. N2/N3 ficam comentados como referência até o projeto adotar test runner formal.

## 10. Wiki (Project Wiki — memória sintetizada)

Vive em `docs/wiki/`. Modos da skill `/wiki`:

| Modo | Quando |
|---|---|
| `/wiki ingest` | usuário cola print/log/erro/decisão |
| `/wiki context F-NNN` | antes de feature significativa OU handoff entre agentes |
| `/wiki lint` | início de projeto bagunçado / antes de refactor grande / antes de produção (≤ a cada 2-4 semanas) |
| `/wiki repair` | após lint, para aplicar correções |

Toda feature B/C/D **fecha com**:
1. Linha em `docs/wiki/log.md` (`[YYYY-MM-DD] [RELEASE] F-NNN — ...`).
2. Resumo ≤5 linhas em `docs/wiki/features/F-NNN.md` se C/D.
3. Atualização de `docs/wiki/modules/<mod>.md` se módulo afetado.
4. Deleção do Context Pack consumido (`docs/wiki/context/F-NNN.md`) se houve.

## 11. Fast Fix

Skill: `/fast-fix`. Quando: bug confirmado, classe A/B, **sem** auth/payment/dados sensíveis/banco/env/deploy, < 30 min. Gates duros: diff > 50 linhas → SAIR; tempo > 30 min → SAIR; ≥ 2 ocorrências passadas → SAIR (Deep Work).

Fluxo: SCREEN (`docs/wiki/runbooks/` + `docs/wiki/log.md` 30d) → GATE de classe → REPRO (1 teste falha) → FIX (diff mínimo) → VALIDAÇÃO (CI N1) → WIKI MEMORY (linha + runbook se recorrente) → PR/COMMIT.

## 12. Anti-SPEC v2 (resumo — fonte: `docs/sdd/PIVOT-V2.md` §3)

NÃO mexer sem autorização explícita do humano:

1. Tabela `members.sponsor_id`.
2. Tabela `shopify_customers` e tags atuais.
3. Tabelas `orders` e `order_items`.
4. Webhooks Shopify ativos em produção (`/api/webhooks/shopify/orders/*`).
5. RLS policies existentes.
6. Migrations já aplicadas.
7. `ref_code` de membros existentes (formato `BH00001` mantém).
8. House Account (descontinuada, mas código até onda 6 / F-V12).
9. Cupom mensal de creatina v1 (escopo alterado — vira F-V15 evento online).
10. Código RPA/CPF (descontinuado v2, removido em F-V12).
11. Provider de pagamento — interface agnóstica em `lib/payouts/v2/`.
12. Tipos e mocks v1 do Loveable (`_loveable_import/src/types/`, `lib/fake-api.ts`).
13. Pasta `_loveable_import/` — gitignored, referência visual apenas.

## 13. Estrutura padrão (alinhamento com manual v3.2)

```
projeto/
├── AGENTS.md                       ← este arquivo
├── CLAUDE.md                       ← ajustes específicos do Claude Code
├── TODO.md                         ← estado vivo + Feature Contract inline (B/C/D)
├── README.md                       ← intocado
├── docs/
│   ├── product/PRD.md              ← v2 (espelho de PIVOT-V2 §1)
│   ├── specs/SPEC.md               ← v2 + Anti-SPEC (espelho de PIVOT-V2 §3)
│   ├── contracts/CONTRACTS.md      ← espelho dos Zod inline em lib/
│   ├── plans/
│   │   ├── CURRENT_REALITY.md      ← estado real do repo (Cenário C/E)
│   │   ├── DECISIONS_LOG.md        ← decisões operacionais (volta ao debate)
│   │   ├── risk-classification.md  ← A/B/C/D detalhado
│   │   ├── FEATURE-CONTRACT-template.md
│   │   ├── VALIDATION-MATRIX-template.md
│   │   └── feature-contracts/      ← Feature Contracts extensos (C/D)
│   ├── wiki/                       ← Project Wiki v3.2
│   │   ├── index.md
│   │   ├── log.md
│   │   ├── overview.md
│   │   ├── architecture.md
│   │   ├── modules/
│   │   ├── features/
│   │   ├── runbooks/
│   │   └── context/
│   ├── decisions/adr/              ← ADRs
│   ├── legacy/v1/                  ← docs v1 deprecated arquivados
│   ├── sdd/                        ← FONTE DE VERDADE V2 (PIVOT-V2, PLAYBOOK, features/)
│   ├── STATUS_IMPLEMENTACAO.md     ← estado de execução das features
│   ├── ACCEPTANCE.md / CHANGELOG.md / DECISOES_TBD.md / README.md / docs para cliente/
│   └── ROTEIRO_DEMONSTRACAO_RAPIDO.md
├── app/ lib/ supabase/ components/ ← código intocado
├── packages/shared/types/          ← skeleton para futuras adições (Zod migrando aos poucos)
├── tests/                          ← skeleton (unit/integration/contract/e2e)
└── .github/workflows/ci.yml        ← N1 ativo, N2/N3 comentados
```

## 14. Onde fica cada artefato

Mesma tabela da §28 do manual, adaptada ao projeto:

| Preciso de... | Vai em... |
|---|---|
| Mapa da memória sintetizada | `docs/wiki/index.md` |
| Histórico cronológico | `docs/wiki/log.md` |
| Contexto reusável entre agentes | `docs/wiki/context/F-NNN.md` |
| Receita operacional / bug recorrente | `docs/wiki/runbooks/<slug>.md` |
| Resumo da feature após merge | `docs/wiki/features/F-NNN.md` |
| Estado atual + Feature Contract inline | `TODO.md` |
| O quê e por quê (v2) | `docs/product/PRD.md` |
| O que o sistema faz (v2 + Anti-SPEC) | `docs/specs/SPEC.md` (espelha `docs/sdd/PIVOT-V2.md`) |
| Contratos legíveis | `docs/contracts/CONTRACTS.md` |
| Contratos executáveis | Zod inline em `lib/*` (migração futura para `packages/shared/types/`) |
| Estado real do repo | `docs/plans/CURRENT_REALITY.md` |
| Decisão arquitetural | `docs/decisions/adr/ADR-NNN-*.md` |
| Decisão operacional recorrente | `docs/plans/DECISIONS_LOG.md` |
| Regras para agentes | Este `AGENTS.md` |
| Ajustes do Claude Code | `CLAUDE.md` |
| Workflow operacional vivo | `docs/sdd/PLAYBOOK.md` (FONTE DE VERDADE) |
| Pivot v2 + Anti-SPEC + Backlog | `docs/sdd/PIVOT-V2.md` (FONTE DE VERDADE) |
| SPEC por feature v2 | `docs/sdd/features/F-VNN-<slug>/SPEC.md` |
