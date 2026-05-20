# Super-Prompt — Reorganização do projeto Biohelp LRP para Harness v3.2 (bridge aditivo)

> **Como usar:** copie tudo entre `▼ COPIE A PARTIR DAQUI ▼` e `▲ COPIE ATÉ AQUI ▲` e cole no início de uma sessão limpa do Claude Code CLI **dentro do diretório do projeto** (`c:\Users\edusp\Projetos_App_Desktop\RLP-bio_help`). Sessão deve estar com permissões liberadas (sem prompt-yes-no para cada Bash/Edit/Write). Não responde perguntas — executa até o final em silêncio operacional, com 1 commit no fim.
>
> **Origem das decisões (sessão anterior, 2026-05-19):** modo bridge aditivo (não move `docs/sdd/`); PRD só v2; Shopify MCP pulado nesta reorg; execução autônoma total. Manual de referência: `.claude/harness-v3.2-manual.html`.

---

## ▼ COPIE A PARTIR DAQUI ▼

Você está reorganizando o projeto **Biohelp LRP** (Next.js 14 + Supabase + Shopify, em produção, pivot v2 em execução, sprint S5 final) para o padrão **Harness v3.2** seguindo o **Cenário C (Projeto em Produção) + Cenário E (Migração v3.1→v3.2)** do manual `.claude/harness-v3.2-manual.html`.

**Modo de operação:** AUTÔNOMO TOTAL. Não pergunte nada ao usuário. Não peça confirmação. Execute as 8 fases na ordem. Pare apenas se um comando falhar de forma irrecuperável (ex.: `npm run build` quebrar com erro novo). Use Read/Edit/Write/Bash/Glob/Grep livremente. Faça commits intermediários por fase (`chore(harness): fase N — <nome>`) e PUSH ao final. NÃO abra PR (humano abre).

**Regras de ouro (não negociáveis):**
1. **NÃO TOQUE em `app/`, `lib/`, `supabase/`, `components/`, `middleware.ts`, `next.config.js`, `vercel.json`, `tailwind.config.ts`, `tsconfig.json`, `package.json`, `_loveable_import/`.** Esta reorg é puramente de documentação + estrutura de pastas vazias + CI yml.
2. **NÃO MOVA nem RENOMEIE nada em `docs/sdd/`** (PIVOT-V2.md, PLAYBOOK.md, CRONOGRAMA-V2.md, LOVEABLE-IMPORT.md, RUNBOOK-GOLIVE-11062026.md, QUESTIONARIO-CLIENTE-V2.md, PROMPT-NOVA-SESSAO.md, features/F-VNN/*). São fontes de verdade vivas — a reorg adiciona uma **camada Harness v3.2 que LINKA** para esses docs.
3. **NÃO MOVA `documentos_escopo/` nem `documentos_projeto_iniciais_MD/`** — são insumos brutos do cliente.
4. **NÃO REMOVA arquivos** de teste (`test-*.mjs`), de migração (`apply-*.mjs`, `create-*.mjs`, `reset-*.mjs`, `verify-data.mjs`, `LOGINS_TESTE.txt`, `PR_TEMPLATE.md`).
5. **Anti-SPEC v2** (`docs/sdd/PIVOT-V2.md` §3 itens 1-13) é sagrada — só está sendo espelhada na nova `docs/specs/SPEC.md`, não alterada.
6. **Conflito de docs:** PIVOT-V2.md > PLAYBOOK.md > qualquer novo doc Harness criado nesta reorg. A camada nova é **espelho/índice**, não fonte de verdade.
7. **Commits sem `--amend`. Sem `--no-verify`. Sem `--force`. Sem `git config`.**
8. **Branch obrigatória:** `chore/harness-v3.2-reorg` a partir de `main`. Não mergeie sozinho.

---

## Estado atual conhecido (já mapeado — não precisa re-explorar)

- **Stack:** Next.js 14 (`app/`), Supabase (Postgres + Auth + RLS), Shopify Admin API. TypeScript estrito. Zod inline em `lib/*` (não tem `packages/shared/types/`).
- **Branch:** `main` está limpa. Último commit: `d8e3e91 docs(demo): roteiro aponta para produção`.
- **Sprints v2 entregues:** S1 (fundação Loveable), S2 (membro), S3 (admin core), S4 (eventos+academy), S5 (integrações — Cashin/SSO/NFe). 06/05/2026 em diante.
- **Demo:** 13/05/2026 executada — `docs/sdd/features/decisoes-reuniao-fev2026/` registra decisões.
- **Features v2:** F-V01..F-V18, classes A/B/C/D. SPECs em `docs/sdd/features/F-VNN-<slug>/SPEC.md`.
- **TBDs abertos:** 8 originais (1, 2, 8, 9, 12, 15, 16, 20, 21) + derivados (23, 24, 25, 26, 27). Detalhe em `PIVOT-V2.md` §4.
- **v1 (CV/MLM):** congelado em `lib/cv/`, `lib/levels/`, `lib/commissions/`, `lib/network/compression*`. Banner DEPRECATED em 5 docs v1 + 6 arquivos de código. Cleanup físico só na onda 6 / F-V12.
- **Feature flag:** `LRP_V2` em `lib/utils/featureFlags.ts`. Default `false` em prod.
- **Shopify MCP custom:** decisão = não criar nesta reorg (vai pra DECISIONS_LOG). Existe MCP Shopify Dev oficial referenciado em `docs/WORKFLOW.md` (que vai virar legacy).

---

## FASE 0 — Setup

```bash
git status                                  # confirma working tree limpa
git checkout main && git pull --ff-only     # ok se já tá em main
git checkout -b chore/harness-v3.2-reorg
mkdir -p docs/product docs/specs docs/contracts docs/plans/feature-contracts \
         docs/wiki/modules docs/wiki/features docs/wiki/runbooks docs/wiki/context \
         docs/decisions/adr docs/legacy/v1 \
         packages/shared/types \
         tests/unit tests/integration tests/contract tests/e2e \
         .github/workflows
```

Se algum diretório já existir, `mkdir -p` é idempotente — segue.

**Checkpoint:** rode `ls docs/` e confirme presença das pastas novas (`product`, `specs`, `contracts`, `plans`, `wiki`, `decisions`, `legacy`) e da pasta `docs/sdd/` **intocada**.

---

## FASE 1 — Espinha Harness v3.2 (raiz)

Crie os 3 arquivos abaixo na **raiz do projeto**. Conteúdo COMPLETO inline (não invente, copie exatamente; ajuste apenas datas dinâmicas com a data de hoje).

### 1.1 `AGENTS.md` (≤ 360 linhas)

Conteúdo:

```markdown
# AGENTS.md — Biohelp LRP (Harness v3.2)

> Contrato comum entre Claude Code (gerador principal), Codex (continuidade), Cursor Agent (infra/MCP — opcional, classe D), CI (avaliador). Documento curto. Em conflito com `docs/sdd/PLAYBOOK.md` ou `docs/sdd/PIVOT-V2.md`, **estes prevalecem** (são as fontes de verdade vivas do projeto).

**Versão:** Harness v3.2 (bridge aditivo sobre Harness v3.1 caseiro existente em `docs/sdd/`).
**Última atualização:** {{DATA_DE_HOJE_YYYY-MM-DD}}.

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
```

### 1.2 `CLAUDE.md` (≤ 140 linhas)

```markdown
# CLAUDE.md — ajustes específicos do Claude Code (Biohelp LRP)

> Documento curto. Regras universais para agentes ficam em `AGENTS.md`. Aqui só o que é específico do Claude Code rodando neste repo.

## Leitura inicial obrigatória (toda sessão)

Em ordem:
1. `docs/wiki/index.md` — mapa principal.
2. `docs/wiki/context/<F-NNN-atual>.md` se houver feature ativa.
3. `TODO.md` — estado vivo.
4. `AGENTS.md` — contrato comum (Anti-SPEC, classes, autonomia).
5. `docs/sdd/PIVOT-V2.md` §3 — Anti-SPEC v2 (sagrada).
6. `docs/sdd/PLAYBOOK.md` — workflow operacional.
7. `docs/wiki/log.md` últimas 30 linhas.
8. `git status`.

## Stack e atalhos

- **Next.js 14** (`app/` directory). Server Components + Server Actions + Route Handlers em `app/api/*`.
- **DB:** Supabase. Service client em `lib/supabase/server.ts`. Anon em `lib/supabase/client.ts`.
- **Shopify:** Admin API GraphQL + Webhooks. Cliente em `lib/shopify/`.
- **Tipos:** TypeScript estrito + Zod inline em `lib/*`. `packages/shared/types/` ainda vazio (migração lenta).
- **Testes:** scripts `test-*.mjs` na raiz. Sem framework formal. Para feature B/C/D, **evidência** via curl/screenshot/log do Supabase + 1 script test-*.mjs do CA principal.
- **CI:** `.github/workflows/ci.yml` N1 (lint + typecheck + build). N2/N3 manuais hoje.
- **Cron:** Vercel Cron via `vercel.json`. Pausáveis via `CRON_DISABLED_V2=true`.

## Feature flag

Todo código v2 atrás de `LRP_V2`. Helper em `lib/utils/featureFlags.ts` (`isV2Enabled()`).

Default em produção: `LRP_V2=false`. Toggle por env var.

## Migrations Supabase

Em `supabase/migrations/<YYYYMMDD>_<slug>.sql`. **Sempre idempotente** (CREATE IF NOT EXISTS, ALTER … IF NOT EXISTS, etc.). **Sempre com rollback comentado no topo**. Aplicar via Supabase MCP (`mcp__supabase__apply_migration`) — projeto `rlp-biohelp` ref `ikvwzfbkbwpiewhkumrj`.

## Webhooks Shopify

Em `app/api/webhooks/shopify/*`. Validação HMAC obrigatória (`lib/shopify/webhook.ts`). Hook v2 sempre dentro de `if (isV2Enabled())` + try/catch isolado — falha NUNCA derruba 200 (Anti-SPEC §4 PIVOT-V2).

## Comportamento esperado

- Use `Read`/`Glob`/`Grep` antes de modificar — sempre confirme estado atual.
- Use `Edit` para arquivos existentes; `Write` só para novos.
- Reporte progresso a cada CA validado.
- **Arquivo fora da lista permitida da SPEC → PARE.** Estado `BLOQUEADO — ARQUIVO FORA DO FEATURE CONTRACT`.
- **TBD novo (decisão do cliente que ninguém perguntou) → PARE.** Registre em `PIVOT-V2.md` §4 e relate.
- **Feature crescendo de classe → PARE.** Atualize SPEC, peça aprovação. Suba a classe, nunca desça.
- **Rodar comando do shell em produção / Vercel / Supabase remoto → CONFIRME antes.**
- **Anti-SPEC v2 violada → PARE.**

## Convenções

- Branch: `feat/F-VNN-<slug>` ou `fix/F-VNN-<slug>` ou `chore/<slug>`.
- Commit: `feat(F-VNN): <descrição>`, `fix:`, `chore:`, `docs:`.
- PR: linkar SPEC + listar CAs cobertos + anexar evidências da Matriz de Validação.

## Para fechar a sessão de uma feature

1. ✅ Atualizar `TODO.md` (mover feature de Em Andamento → Done).
2. ✅ Atualizar `docs/sdd/PIVOT-V2.md` §2 (status na tabela).
3. ✅ Atualizar `docs/STATUS_IMPLEMENTACAO.md` (snapshot do progresso).
4. ✅ Marcar SPEC do feature como `Status: Done` + data.
5. ✅ Linha em `docs/wiki/log.md` tipo `[RELEASE] F-VNN — ...`.
6. ✅ Se C/D: resumo ≤5 linhas em `docs/wiki/features/F-VNN.md`.
7. ✅ Se módulo afetado: atualizar `docs/wiki/modules/<mod>.md`.
8. ✅ Deletar `docs/wiki/context/F-VNN.md` se foi consumido.

## Para HANDOFF entre agentes (Claude → Codex / Cursor)

Antes de fechar: `/wiki context F-NNN` → cria/atualiza `docs/wiki/context/F-NNN.md` com:
- Estado atual (o que está feito, o que falta).
- Arquivos relevantes.
- Restrições da tarefa.
- Próximos passos concretos.
- Decisões abertas.
- Handoff explícito: "última ação", "o que NÃO fiz e o próximo deveria evitar".

Próximo agente lê: `docs/wiki/index.md` → `docs/wiki/context/F-NNN.md` → `AGENTS.md` → `TODO.md` → SPEC.
```

### 1.3 `TODO.md` (raiz)

```markdown
# TODO.md — Biohelp LRP (Harness v3.2)

> Estado vivo. Toda feature B/C/D precisa de Feature Contract inline (ou SPEC dedicada em `docs/sdd/features/F-VNN-<slug>/SPEC.md`).
> **Fonte de progresso histórica:** `docs/STATUS_IMPLEMENTACAO.md` (snapshot por sprint).
> **Tabela de status das features v2:** `docs/sdd/PIVOT-V2.md` §2.

**Última atualização:** {{DATA_DE_HOJE}}.

---

## 1. Backlog priorizado (v2 — fonte: `docs/sdd/PIVOT-V2.md` §2)

| ID | Feature | Classe | Sprint | Status | Bloqueio |
|---|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | S2 | ⏳ Pendente | — |
| F-V02 | Integração Guru via webhook Shopify | D | S5 | ⏳ Pendente (precisa confirmar com Wink) | — |
| F-V03 | Status ativo = `subscription_paid` | C | S5 | ✅ Done (06/05) | — |
| F-V04 | Comissão 50% por assinatura de convidado | D | TBD | 🚫 Bloqueada | TBD-1, TBD-2 |
| F-V05 | Saldo + crédito Shopify 1:1 | C | S2 | ✅ UI Done; chamada `customer.credit` real pendente | — |
| F-V06 | Promoção a Founder ≥5 ativos | B | TBD | 🟡 Parcial | TBD-12 (hipótese padrão: definitivo) |
| F-V07 | Saque Founder Cashin + NF + triple resgate | D | S2/S5 | ✅ UI Done; Cashin live + NFe auto em S5 | — |
| F-V08 | Ranking de Founders | B | TBD | ✅ Destravada | — |
| F-V09 | Academy CMS | B | S4 | ✅ Done | — |
| F-V10 | Link WhatsApp Founder | A | TBD | 🚫 Bloqueada | TBD-16 |
| F-V11 | Visão restrita da rede | B | S1 | ✅ Done (29/04) | — |
| F-V12 | Cleanup v1 (CV, níveis, RPA) | D | Onda 6 | ⏳ Aguarda v2 estável | — |
| F-V13 | ~~Cupom creatina campanha~~ | — | — | ✅ Absorvida por F-V15 | — |
| F-V14 | Vendas manuais membro (CRM leve) | C | S2 | ✅ Done (06/05) | — |
| F-V15 | Eventos admin (criação + funil) | C | S4 | ✅ Done (06/05) | — |
| F-V16 | Painel admin completo (9 áreas) | B | S3-S4 | ✅ Done | — |
| F-V17 | SSO Shopify → Painel (App Proxy) | D | S5 | ✅ Done (06/05, default OFF) | — |
| F-V18 | Tags automáticas Líder/Influenciador | B | S3 | ✅ Done (06/05) | — |

**Próximas ações (snapshot {{DATA_DE_HOJE}}):**
- Roteiro de demo de 13/05 já apresentado ao cliente — `docs/sdd/features/decisoes-reuniao-fev2026/` registra retornos.
- Aguardando: respostas aos TBDs ainda abertos (1, 2, 8, 9, 12, 15, 16, 20, 21, 23-27).
- Próximo trabalho: pontos novos do cliente pós-demo (ver §2).

---

## 2. Em andamento

(vazio por enquanto — preencher ao iniciar próximas features pós-demo).

### Template de item

```
### F-VNN — <nome>
- **Classe:** A | B | C | D
- **SPEC:** `docs/sdd/features/F-VNN-<slug>/SPEC.md`
- **Status:** Em DoR | Em Implementação | Em QA | Em PR
- **Branch:** `feat/F-VNN-<slug>`
- **Próximo passo concreto:** ...
- **DoR (checklist):** ver SPEC §DoR
- **Feature Contract:** ver SPEC ou `docs/plans/feature-contracts/F-VNN.md` se >40 linhas
```

---

## 3. Backlog não priorizado / ideias

(vazio).

---

## 4. Pendentes técnicos (não-feature)

- Aplicar `LRP_V2=true` em produção quando todas as features S5 forem validadas pelo cliente.
- Onboarding Cashin live com Léo (TBD-19 ✅, mas credenciais sandbox/live ainda pendentes).
- Decidir prazo de validade do crédito Shopify (TBD-23).
- Dados reais de NF da Biohelp (CNPJ, razão social, endereço) — mover de hardcoded em `components/biohelp/WithdrawDialog.tsx` para env ou `system_config` (TBD-27).

---

## 5. Bugs

(vazio — usar `/triage-bugs` quando aparecer ≥2 bugs do cliente).

### Template de linha
| ID | Descrição | Repro | Classe | Domínio | Urgência | Impacto | Esforço | Modo | Status | Notas |
|---|---|---|---|---|---|---|---|---|---|---|
| BUG-NNN | ... | ... | A/B/C/D | auth/payouts/etc | P0/P1/P2 | crítico/médio | < 30min | fast-fix/standard | TRIADO/EM FIX/EM QA/RESOLVIDO | runbook? |

---

## 6. Decisões abertas / TBDs ao cliente

Fonte: `docs/sdd/PIVOT-V2.md` §4.1 (10 TBDs abertos).

Curtos prazos:
- TBD-23 (validade crédito Shopify), TBD-24 (eventos entry-fee?), TBD-25 (preço sugerido vendas manuais), TBD-26 (critério ranking Founder), TBD-27 (NF Biohelp dados).
- TBD-1/2 destravam F-V04 (comissão 50%) e parte de F-V07.
```

Após criar os 3 arquivos: `git add AGENTS.md CLAUDE.md TODO.md && git commit -m "chore(harness): fase 1 — espinha (AGENTS/CLAUDE/TODO)"`.

---

## FASE 2 — `docs/plans/` (templates + CURRENT_REALITY + DECISIONS_LOG + risk-classification)

Crie:

### 2.1 `docs/plans/CURRENT_REALITY.md`

Documento de **espelho real do que existe hoje no repo**. Conteúdo deve descrever:

- **Sumário (2-3 parágrafos):** projeto em produção Shopify+Supabase, pivot v2 em S5 final (delivery 11/06/2026), Harness v3.1 caseiro vivo em `docs/sdd/`, esta reorg adiciona camada Harness v3.2 padrão sobre o que já existe.
- **Estrutura de pastas atual** (rode `ls` na raiz e em `docs/`, `lib/`, `app/` e cole os outputs literalmente).
- **Camadas de código importantes:**
  - `app/` — App Router com switch interno v1/v2 atrás de `LRP_V2`. Páginas membro `(member)/` + admin `admin/` + APIs `api/`.
  - `lib/` — módulos por domínio: shopify, supabase, members, network, commissions (v1 congelado), commissions-v2, payouts/v2, subscriptions, credits, founder, content, events, tags, sso, sales-manual, levels (v1), cv (v1), utils. Zod inline.
  - `supabase/migrations/` — migrations idempotentes versionadas YYYYMMDD_slug.sql.
  - `components/` — componentes React + shadcn/ui em components/ui/ + biohelp/ + layouts/.
  - `test-*.mjs` raiz — scripts manuais de smoke (cashin, NFe, F-V03, app-proxy, sprint2, webhook).
- **Stack:** Next.js 14.2, React 18.3, Supabase JS 2.47, @supabase/ssr 0.5, Zod 3.25, Tailwind 3, shadcn, Tanstack Query 5, react-hook-form, sonner, recharts, lucide. TypeScript 5.7. **Sem test framework instalado.**
- **CI atual:** apenas `npm run lint`, `next build` — não há `.github/workflows/`. Esta reorg adiciona `ci.yml` N1.
- **Cron Vercel:** `vercel.json` define crons para `close-monthly-cv` (v1 — pausável via env), `network-compression` (v1 — pausável), `auto-tags` (v2 F-V18 03:00 UTC).
- **Webhooks Shopify ativos:** `/api/webhooks/shopify/orders/{paid,refunded,cancelled}` com HMAC. Hooks v2 (F-V03 subscription, F-V15 event-attribution, F-V18 tags) compostos dentro de `if (isV2Enabled())`.
- **Feature flags:** `LRP_V2` (master switch), `CRON_DISABLED_V2`, `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE`, `LRP_V2_SSO`, `LRP_V2_CASHIN_LIVE`, `CASHIN_MODE` (mock/sandbox/live).
- **Anti-patterns observados que ESTA reorg NÃO corrige** (registrar para futuro):
  - Zod inline em `lib/*` em vez de `packages/shared/types/`. Decisão consciente — `packages/shared/types/` skeleton fica vazio para adoção gradual.
  - Sem test runner instalado (Vitest/Jest). Usa `test-*.mjs` standalone. Decisão consciente — adoção quando aparecer dor.
  - `docs/STATUS_IMPLEMENTACAO.md` e `docs/sdd/PIVOT-V2.md` §2 mantêm 2 tabelas redundantes de status — preservado para não quebrar refs.
  - Front Loveable em `_loveable_import/` — gitignored, referência visual.
- **Mapeamento docs/sdd/ ↔ Harness v3.2:**
  - `docs/sdd/PIVOT-V2.md` ⇄ `docs/specs/SPEC.md` (espelho lê PIVOT-V2 §3 como Anti-SPEC).
  - `docs/sdd/PLAYBOOK.md` ⇄ `AGENTS.md` §3-7 (espelho do workflow).
  - `docs/sdd/CRONOGRAMA-V2.md` — fonte de prazos (sem espelho — referenciado).
  - `docs/sdd/LOVEABLE-IMPORT.md` — fonte do design system (sem espelho — referenciado).
  - `docs/sdd/features/F-VNN-<slug>/SPEC.md` ⇄ Feature Contract (espelhado em `docs/wiki/features/F-VNN.md` resumo curto após merge para C/D).
  - `docs/STATUS_IMPLEMENTACAO.md` — fonte de progresso (sem espelho — referenciado por `TODO.md` §1).
- **Restrições de produção (espelha Anti-SPEC v2):** lista os 13 itens da PIVOT-V2 §3.

### 2.2 `docs/plans/DECISIONS_LOG.md`

```markdown
# Decisions Log — Biohelp LRP

> Decisões operacionais (volta ao debate). ADRs vão em `docs/decisions/adr/`. Decisões grandes pivôs de produto vão em `docs/sdd/PIVOT-V2.md`.

| Data | ID | Decisão | Contexto | Reaberto em |
|---|---|---|---|---|
| {{DATA_DE_HOJE}} | DL-001 | Harness v3.2 adotado em modo bridge aditivo (não move docs/sdd/) | Cenário C+E do manual v3.2. Risco zero para fontes de verdade vivas. | — |
| {{DATA_DE_HOJE}} | DL-002 | Shopify MCP custom NÃO criado nesta reorg | Existe MCP Shopify Dev oficial. `lib/shopify/` estável. Custo > benefício hoje. Reavaliar se aparecer ≥3 pedidos repetidos de "consulta loja real" em uma semana. | — |
| {{DATA_DE_HOJE}} | DL-003 | `packages/shared/types/` criado vazio; Zod permanece inline em `lib/*` | Migração big-bang violaria Cenário C ("nenhum refactor preventivo"). Adoção feature a feature. | — |
| {{DATA_DE_HOJE}} | DL-004 | `tests/{unit,integration,contract,e2e}/` criado vazio; test runner formal não instalado | Padrão atual `test-*.mjs` na raiz funciona. Adotar Vitest/Jest quando aparecer feature C/D que exija ≥3 testes amarrados. | — |
| {{DATA_DE_HOJE}} | DL-005 | CI Github Actions com N1 ativo (lint + typecheck + build). N2/N3 comentados | Projeto sem test framework. N2/N3 ficam como referência até adoção. | — |
| {{DATA_DE_HOJE}} | DL-006 | v1 docs deprecated movidos para `docs/legacy/v1/` (WORKFLOW.md, SPEC_Biohelp_LRP.md, Biohelp_LRP_Escopo_Projeto_v1.md, Biohelp_LRP_Matriz_*, Biohelp_LRP_Cronograma_Completo_*) | Reduzir ruído. Banners DEPRECATED preservados + README explicativo. v1 code intocado (cleanup só na onda 6 / F-V12). | — |
```

### 2.3 `docs/plans/risk-classification.md`

```markdown
# Risk Classification — Biohelp LRP

> Espelho dos critérios do manual `.claude/harness-v3.2-manual.html` §7, adaptado ao projeto.

## Classes

### A — Trivial
- Typo, layout, ajuste sem contrato.
- Sem teste obrigatório. Merge direto em main permitido.
- Modo: Fast Fix ou Standard.

### B — Normal
- CRUD simples, endpoint não crítico, UI nova, refactor isolado sem impacto em contrato público.
- Feature Contract inline no `TODO.md`. CI N1. Branch `feat/F-VNN-<slug>` obrigatória.
- Modo: Standard.

### C — Crítico
- Auth (Supabase Auth, magic link, SSO).
- Payout / Comissão / Saldo / Crédito Shopify.
- Permissões / RLS policies.
- Dados sensíveis (members, payouts, NF, dados fiscais).
- Modo: Deep Work. Feature Contract detalhado. CI N2 (N1 + integration test do CA + revisão humana sugerida).

### D — Produção
- Migration Supabase aplicada em prod.
- Deploy real (Vercel push).
- Env var nova em prod.
- Webhook financeiro (Cashin, Shopify orders/paid, Asaas legado).
- RLS policy alterada.
- Mudança de feature flag default em prod.
- Modo: Production. Feature Contract + `docs/plans/cursor-brief.md` (se Cursor Agent for usado) + rollback escrito + feature flag + staging via Vercel preview deploy + smoke test.
- CI N3.

## Desempates

1. Toca produção / banco real / envs → **D**.
2. Envolve auth / dinheiro / permissões / dados sensíveis → **C**.
3. Cria/altera contrato público (API, schema Zod, webhook payload) → **mínimo B**.
4. Código isolado sem contrato → **A**.
5. Em dúvida, escolha a classe **mais alta**.

## Auto-reclassificação

Feature B virou C/D no meio (ex.: começou CRUD, virou migration; começou UI, virou hook de webhook) → **PARE, atualize SPEC, peça aprovação humana**. Suba a classe, nunca desça.

## CI alvo por classe

| Classe | CI alvo | Comandos atuais |
|---|---|---|
| A | N1 | `npm run lint` |
| B | N1 + 1 teste do CA principal | `npm run lint && npx tsc --noEmit && node test-*-relevante.mjs` |
| C | N2 (N1 + integration + contract) | acima + integration manual com curl/supabase MCP + screenshot |
| D | N3 (N2 + e2e + smoke + migration validation + Vercel preview check) | acima + Playwright manual + Vercel preview + smoke HTTP |
```

### 2.4 `docs/plans/FEATURE-CONTRACT-template.md`

```markdown
# Feature Contract — F-NNN <nome>

> Template canônico do Harness v3.2. Use **inline no TODO.md** se < 40 linhas; copie para `docs/plans/feature-contracts/F-NNN.md` se passar de 40 linhas (típico C/D).
> Para features v2 com SPEC dedicada em `docs/sdd/features/F-VNN-<slug>/SPEC.md`, a SPEC **é** o Feature Contract — não duplicar. Apenas referenciar.

## Metadata
- ID: F-NNN
- Classe: A | B | C | D
- Branch: `feat/F-NNN-<slug>`
- CI alvo: N1 | N2 | N3
- RFs cobertos: ...
- SPEC: `docs/sdd/features/F-NNN-<slug>/SPEC.md` (se aplicável)

## Objetivo
1-3 frases. Qual o problema, qual o resultado esperado, qual onda do PIVOT-V2.

## Definition of Ready
- [ ] RFs vinculados
- [ ] CAs claros e testáveis
- [ ] Classe confirmada
- [ ] Arquivos permitidos listados
- [ ] Arquivos PROIBIDOS listados (Anti-SPEC)
- [ ] Testes esperados (unit / integration / contract / e2e / smoke)
- [ ] Zod necessário (ou decisão "não")
- [ ] Dependências externas
- [ ] Impacto em banco
- [ ] Impacto em produção (staging, rollback, feature flag)
- [ ] TBDs bloqueantes resolvidos

## Critérios de Aceite
- CA-01: ...
- CA-02: ...

## Escopo incluído
...

## Escopo excluído (Anti-SPEC aplicável)
- Item X da PIVOT-V2.md §3 ...
- ...

## Arquivos que PODEM ser alterados
- `lib/...`
- `app/...`
- `supabase/migrations/<data>_<slug>.sql`

## Arquivos que NÃO podem ser alterados
- (qualquer alteração exige pausa)

## Contratos Zod (a usar/criar)
- ...

## Testes obrigatórios (matriz)
| Teste | Tipo | CA | Arquivo |
|---|---|---|---|
| ... | unit | CA-01 | ... |

## Comandos obrigatórios (CI no nível alvo)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- (testes adicionais)

## Infra/Produção (só C/D)
- **Migration:** `<arquivo>` (idempotente, rollback comentado)
- **Env:** `<vars>`
- **Staging:** Vercel preview branch
- **Feature flag:** `LRP_V2_<nome>=false` default
- **Rollback plan:** ...

## Anti-SPEC relevante
- Item N da `PIVOT-V2.md` §3 ...

## Matriz de Validação (preencher no QA)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | ... | ... | TODO | ... |

## Gate de autonomia
- CONTINUE | PAUSE | BLOQUEADO (preencher conforme execução)
```

### 2.5 `docs/plans/VALIDATION-MATRIX-template.md`

```markdown
# Validation Matrix — F-NNN <nome>

> Template para o Prompt 3 (QA). Obrigatória para B/C/D.

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | `<arquivo>::<nome do teste>` | unit / integration / contract / e2e / manual / smoke | passou / falhou / não coberto / N/A | `npm test -- ...` log / Playwright report / curl output / screenshot / Supabase MCP query / CI log com ✔ |

## O que conta como evidência
- Saída de `npm test` com teste nomeado e `✔ passed`.
- Playwright report.
- CI log com `✔ passed`.
- Migration aplicada em staging com `select` que comprova.
- Script de smoke com exit code 0.
- Screenshot com timestamp + URL.

## O que NÃO conta
- Afirmação do agente ("parece correto").
- Teste com `.skip` / `.only`.
- Cobertura genérica sem amarração ao CA.
- `expect(true).toBe(true)`.

## Resultado final do QA
- [ ] APROVADO — todos os CAs cobertos com evidência objetiva.
- [ ] MUDANÇAS_SOLICITADAS — CA(s) sem evidência: ...
- [ ] BLOQUEADO — motivo: ...
```

### 2.6 `docs/plans/feature-contracts/.gitkeep`

Arquivo vazio para preservar o diretório.

### 2.7 `docs/decisions/adr/.gitkeep`

Idem.

### 2.8 `docs/decisions/adr/ADR-template.md`

```markdown
# ADR-NNN — <título>

**Data:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by ADR-MMM | Deprecated
**Contexto da decisão:** F-VNN | refactor | infra | outro

## Contexto
...

## Decisão
...

## Alternativas consideradas
- Alt A: ... — descartada porque ...
- Alt B: ... — descartada porque ...

## Consequências
- Positivas: ...
- Negativas / trade-offs: ...

## Referências
- PRD: ...
- SPEC: ...
- Issue / PR: ...
```

Após criar fase 2: `git add docs/plans docs/decisions && git commit -m "chore(harness): fase 2 — docs/plans templates + CURRENT_REALITY + DECISIONS_LOG"`.

---

## FASE 3 — `docs/product/PRD.md` + `docs/specs/SPEC.md` + `docs/contracts/CONTRACTS.md`

### 3.1 `docs/product/PRD.md`

Este PRD é **só v2** (decisão confirmada). É um **espelho** consolidado de `docs/sdd/PIVOT-V2.md`. NÃO duplicar; LINKAR para a fonte.

Conteúdo (esqueleto):

- **Sumário executivo** (3 parágrafos):
  - Produto: Biohelp LRP — programa de afiliação 1-nível com promoção a Founder ao atingir 5 membros ativos no clube.
  - Modelo: comissão 50% direta por assinatura paga do convidado (1 nível), saldo conversível 1:1 em crédito Shopify, Founder destrava saque cash via Cashin/PIX com NF de serviço (CNPJ) ou Cashin direto (CPF — TBD-20).
  - Stack/produção: Next.js 14 + Supabase + Shopify Admin API. Pivot v2 declarado 28/04/2026, S5 final em entrega para 11/06/2026.

- **Histórico (1 parágrafo):** Modelo v1 era MLM CV-based (5 sprints entregues 98% FRs até 02/2026). Em 28/04/2026 cliente realinhou para afiliação simplificada. v1 deprecated mas código congelado (cleanup só em F-V12, onda 6 — pós v2 estável).

- **Usuários:**
  - **Parceira (membro):** entra via ref obrigatório (link OU código manual), pode registrar leads/vendas manuais (CRM leve F-V14), vê saldo + sponsor + indicados diretos, resgata via 3 opções (Cashin / Crédito Shopify / PIX+NF). Vira Founder ao atingir 5 ativos. Tags automáticas Líder (≥5) / Influenciador (≥40).
  - **Founder:** Parceira promovida; destrava saque cash via Cashin/PIX. CNPJ pode emitir NF. Ranking entre Founders (critério inicial = nº de pessoas no clube — TBD-26 confirma).
  - **Admin Biohelp:** Painel completo 9 áreas (Visão Geral, Comunidade com tags, Crescimento, Consumo, Produtos, Eventos F-V15, Financeiro, Resgates triplos, Academy F-V09). Aprovação manual de saques + validação automática de NF.

- **Features (v2):** Tabela curta — ver `docs/sdd/PIVOT-V2.md` §2 para detalhe completo + classes + bloqueios.

- **TBDs abertos:** ver `docs/sdd/PIVOT-V2.md` §4.

- **Não-objetivos:**
  - Foto-comida (calorias).
  - Registro de treino + Apple Watch / Google Fit.
  - Gamificação "Iron Man".
  - `admin/Alerts` e `admin/Settings` (gestão de admins via UI).
  - Modelo MLM CV-based (v1 — descontinuado).

- **Restrições de produção:** ver Anti-SPEC v2 em `docs/sdd/PIVOT-V2.md` §3 e espelho em `docs/specs/SPEC.md` §6.

- **Métrica de sucesso:** entrega v2 completa em produção 11/06/2026, demo cliente 13/05/2026 ✅ feita, switch `LRP_V2=true` em prod sem incidente.

- **Referências canônicas:**
  - `docs/sdd/PIVOT-V2.md` — fonte de verdade v2.
  - `docs/sdd/PLAYBOOK.md` — workflow operacional.
  - `docs/sdd/CRONOGRAMA-V2.md` — sprints e entregas.
  - `docs/sdd/LOVEABLE-IMPORT.md` — design system import.
  - `docs/sdd/features/F-VNN-*/SPEC.md` — SPECs por feature (>= 18).

### 3.2 `docs/specs/SPEC.md`

Documento curto que **espelha** PIVOT-V2 + PLAYBOOK. Estrutura:

- **§1 Objetivo do SPEC v2:** "Este SPEC é um espelho consolidado da especificação técnica de Biohelp LRP v2. Fonte de verdade efetiva: `docs/sdd/PIVOT-V2.md` + `docs/sdd/features/F-VNN-<slug>/SPEC.md`. Este arquivo serve para conformidade com Harness v3.2 §4 (estrutura padrão)."
- **§2 RFs (Requisitos Funcionais)** — lista curta consolidando RFs das 18 SPECs em `docs/sdd/features/`. Linka cada um pra sua SPEC.
- **§3 CAs (Critérios de Aceite)** — agregados das SPECs. Linka.
- **§4 Restrições não-funcionais:**
  - RLS ativo em todas as tabelas com dado de membro.
  - Webhook validação HMAC obrigatória.
  - Idempotência em todos os webhooks e crons.
  - Migrations idempotentes com rollback comentado.
  - Performance: < 3s para operações de rede.
  - Feature flag `LRP_V2` como switch master.
- **§5 Stack:** Next.js 14 + Supabase + Shopify Admin API GraphQL. Cashin sandbox/live. App Proxy Shopify para SSO.
- **§6 Anti-SPEC v2 (sagrada — espelho de PIVOT-V2 §3 itens 1-13):**
  - Reproduzir os 13 itens literais.
  - Nota: "Em conflito entre este arquivo e `docs/sdd/PIVOT-V2.md` §3, **PIVOT-V2.md prevalece** (fonte canônica)."
- **§7 Decisões de TBD:** linka `docs/sdd/PIVOT-V2.md` §4 (resolvidos + abertos).
- **§8 Cronograma:** linka `docs/sdd/CRONOGRAMA-V2.md`.

### 3.3 `docs/contracts/CONTRACTS.md`

```markdown
# Contracts — Biohelp LRP

> **Fonte de verdade dos contratos:** Zod inline em `lib/*` (decisão DL-003).
> Este arquivo é um índice navegável dos schemas Zod existentes e dos shapes de webhook/API públicas.
> Migração futura para `packages/shared/types/` é gradual (feature a feature, sem big-bang).

## 1. Schemas Zod por módulo

| Módulo | Arquivo | Schemas |
|---|---|---|
| Subscriptions | `lib/subscriptions/schema.ts` | `SubscriptionStatusSchema`, ... |
| Commissions v2 | `lib/commissions-v2/schema.ts` | ... |
| Credits | `lib/credits/schema.ts` | ... |
| Founder | `lib/founder/schema.ts` | ... |
| Content | `lib/content/schema.ts` | ... |
| Events | `lib/events/schema.ts` | ... |
| Payouts v2 | `lib/payouts/v2/schema.ts` | `PayoutRequestSchema`, `PayoutMethodSchema` (pix/cashback_cashin/shopify_credit) |
| Sales Manual | `lib/sales-manual/schema.ts` | `LeadSchema`, `SaleSchema` |
| Tags | `lib/tags/auto-classifier.ts` | `TagSchema` |
| SSO | `lib/sso/app-proxy.ts` | `AppProxyQuerySchema` |

(Próxima sessão: rodar `grep -rn "z.object" lib/ | head -50` para gerar a lista real e popular esta tabela com os nomes exatos.)

## 2. Endpoints públicos

### Webhooks Shopify (entrada)

| Endpoint | Método | Auth | Schema do payload |
|---|---|---|---|
| `/api/webhooks/shopify/orders/paid` | POST | HMAC SHA256 (X-Shopify-Hmac-Sha256) | Shopify Order (REST API 2024-10) |
| `/api/webhooks/shopify/orders/refunded` | POST | HMAC | Shopify Refund |
| `/api/webhooks/shopify/orders/cancelled` | POST | HMAC | Shopify Order cancelled |

### Webhook Cashin (entrada)

| Endpoint | Método | Auth | Schema |
|---|---|---|---|
| `/api/webhooks/cashin/status` | POST | Bearer token (sandbox) | `{ payout_id, status, ... }` |

### API REST membro

Listar endpoints atuais em `app/api/members/me/**` e `app/api/dashboard/**`.

### API REST admin

Listar `app/api/admin/**`.

### SSO Shopify App Proxy

| Endpoint | Método | Auth | Schema |
|---|---|---|---|
| `/api/sso/shopify` | GET | App Proxy HMAC sobre query | `?customer_id=<id>&shop=<domain>&signature=<hmac>&...` |

## 3. Migrations Supabase

Caminho: `supabase/migrations/`. Padrão de nome: `<YYYYMMDD>_<slug>.sql`. Idempotente. Rollback comentado no topo.

Listar últimas 10 migrations com `ls -1t supabase/migrations | head -10` (não embute aqui — referência viva).

## 4. Feature flags

| Flag | Default | Significado |
|---|---|---|
| `LRP_V2` | `false` | Switch master v2 |
| `CRON_DISABLED_V2` | `false` | Pausa crons v1 quando v2 ativo |
| `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE` | `true` | F-V18 invalida tags ao mudar status |
| `LRP_V2_SSO` | `false` | F-V17 SSO Shopify App Proxy |
| `LRP_V2_CASHIN_LIVE` | `false` | F-V07b Cashin live |
| `CASHIN_MODE` | `mock` | mock / sandbox / live |
```

Após Fase 3: `git add docs/product docs/specs docs/contracts && git commit -m "chore(harness): fase 3 — PRD + SPEC + CONTRACTS (bridge para docs/sdd/)"`.

---

## FASE 4 — `docs/wiki/` completo

### 4.1 `docs/wiki/index.md`

```markdown
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
```

### 4.2 `docs/wiki/log.md`

```markdown
# Wiki Log — Biohelp LRP

> Histórico cronológico vivo. Tipos: `[INGEST]`, `[RELEASE]`, `[BUGFIX]`, `[VALIDATION]`, `[DECISION]`, `[MVP]`, `[REORG]`.
> Manter ≤ 200 linhas. Arquivar lotes antigos em `wiki/log-archive-YYYY-QN.md` quando estourar.

## {{DATA_DE_HOJE}}

- [{{DATA_DE_HOJE}}] [REORG] Adotado Harness v3.2 em modo bridge aditivo. Criados AGENTS.md / CLAUDE.md / TODO.md (raiz), docs/product/PRD.md, docs/specs/SPEC.md, docs/contracts/CONTRACTS.md, docs/plans/ (CURRENT_REALITY, DECISIONS_LOG, risk-classification, templates), docs/wiki/ (este arquivo + índice + overview + architecture + modules + runbooks), docs/decisions/adr/, docs/legacy/v1/ (com 5 docs v1 movidos), packages/shared/types/, tests/{unit,integration,contract,e2e}/, .github/workflows/ci.yml. **Zero código de produção tocado.** Branch: `chore/harness-v3.2-reorg`. Referência: `.claude/harness-v3.2-manual.html`. PR pendente de abertura humana.

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
```

### 4.3 `docs/wiki/overview.md`

```markdown
# Overview — Biohelp LRP

> 1 página com o projeto hoje. Espelho do PRD. Sem detalhes técnicos — pra detalhe técnico, ler `architecture.md`.

## O que é

Programa de fidelidade/afiliação para a marca **Biohelp** (suplementos / clube de assinatura na Shopify).

Modelo v2 (vigente desde 28/04/2026): afiliação **1 nível**, comissão 50% por assinatura de convidado, promoção a **Founder** ao atingir 5 ativos no clube, **triple resgate** (Cashin / Crédito Shopify 1:1 / PIX+NF), tags automáticas Líder (≥5) / Influenciador (≥40).

## Estado hoje ({{DATA_DE_HOJE}})

- **Sprints v2:** S1 a S5 entregues. Buffer 10-11/06. Go-live 11/06/2026.
- **Demo cliente:** 13/05/2026 ✅.
- **Switch v2 em prod:** `LRP_V2=false` (ainda OFF — aguarda validação cliente pós-demo).
- **Features Done:** F-V03, F-V05 (UI), F-V07 (UI + Cashin mock), F-V09, F-V11, F-V14, F-V15, F-V16, F-V17 (App Proxy, default OFF), F-V18.
- **Features pendentes:** F-V01 (cadastro com ref obrigatório), F-V02 (Guru via webhook Shopify), F-V04 (comissão 50% — bloqueada TBD-1/2), F-V06 (parcial — TBD-12), F-V07b live, F-V08 ranking, F-V10 WhatsApp (bloqueada TBD-16), F-V12 cleanup v1 (Onda 6).
- **TBDs abertos com cliente:** 10 (lista em `docs/sdd/PIVOT-V2.md` §4.1).

## Usuários

- **Parceira** (membro): cadastro via ref obrigatório, registra leads/vendas manuais, vê sponsor + indicados, resgata via 3 métodos.
- **Founder:** Parceira promovida; destrava cash via Cashin/PIX. Ranking entre Founders.
- **Admin Biohelp:** painel 9 áreas (Visão Geral, Comunidade, Crescimento, Consumo, Produtos, Eventos, Financeiro, Resgates, Academy). Aprovação manual saque + validação automática NF.

## Não-objetivos (pós-MVP)

- Foto-comida → calorias.
- Registro de treino + integrações Apple Watch / Google Fit.
- Gamificação "Iron Man".
- `admin/Alerts` e `admin/Settings`.

## Referências canônicas

- `docs/sdd/PIVOT-V2.md` — fonte v2.
- `docs/sdd/PLAYBOOK.md` — workflow.
- `docs/sdd/features/F-VNN-*/SPEC.md` — por feature.
- `docs/STATUS_IMPLEMENTACAO.md` — progresso.
```

### 4.4 `docs/wiki/architecture.md`

```markdown
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
```

### 4.5 `docs/wiki/modules/*.md`

Crie 10 stubs curtos (≤ 30 linhas cada) — um por módulo. Conteúdo mínimo:

```markdown
# Module: <nome>

> Resumo do módulo. Detalhes em `lib/<nome>/*` e SPECs relevantes.

## Responsabilidade
...

## Arquivos principais
- `lib/<nome>/schema.ts`
- `lib/<nome>/queries.ts`
- `lib/<nome>/actions.ts`
- `lib/<nome>/hook-on-*.ts` (se aplicável)

## SPECs relevantes
- F-VNN: `docs/sdd/features/F-VNN-<slug>/SPEC.md`

## Anti-SPEC aplicável
- Item N de `docs/sdd/PIVOT-V2.md` §3 ...

## Estado atual
- ✅ Done | 🟡 Parcial | 🚫 Bloqueado
```

Crie os 10 arquivos: `auth.md`, `db.md`, `shopify.md`, `subscriptions.md`, `payouts.md`, `events.md`, `academy.md`, `tags.md`, `sso.md`, `deployment.md`.

Para cada um, popule os campos lendo `lib/<nome>/*` (Glob + Read) e `docs/sdd/features/F-VNN-*/SPEC.md` relevante. Mantenha ≤ 30 linhas por módulo.

### 4.6 `docs/wiki/features/*.md`

Para cada feature Done (F-V03, F-V05, F-V07, F-V09, F-V11, F-V14, F-V15, F-V16, F-V17, F-V18) — 10 arquivos — gere stub de ≤ 5 linhas:

```markdown
# F-VNN — <nome curto>

**Classe:** B/C/D
**Status:** Done — YYYY-MM-DD (sprint Sn)
**SPEC:** `docs/sdd/features/F-VNN-<slug>/SPEC.md`
**Migration aplicada:** `supabase/migrations/<data>_<slug>.sql` (se houver)
**Resumo:** 1-2 linhas do que entregou.
```

(Leia `docs/STATUS_IMPLEMENTACAO.md` para puxar datas e migrations exatas. Não invente.)

### 4.7 `docs/wiki/runbooks/*.md`

Crie 6 runbooks com conteúdo real (≤ 150 linhas cada):

#### `runbooks/deploy.md`
```markdown
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
```

#### `runbooks/rollback.md`
Conteúdo: como reverter via Vercel "Promote to Production" do deploy anterior + (se migration) script SQL de rollback comentado no topo da migration.

#### `runbooks/smoke-flag-on-off.md`
Como validar `LRP_V2=true` vs `LRP_V2=false` localmente:
- `npm run dev` com `.env.local` `LRP_V2=true` → 7 rotas v2 retornam 200.
- `LRP_V2=false` → rotas v2 redirecionam, v1 retorna 200, login mostra V1.
- Referência: `docs/STATUS_IMPLEMENTACAO.md` §S2 e §S3 (smoke validado).

#### `runbooks/webhook-shopify-debug.md`
- Como reenviar webhook via Shopify Admin > Notifications > Webhooks.
- Como reproduzir localmente via ngrok + `test-webhook-local.mjs`.
- Onde olhar logs (Vercel Logs do route handler).

#### `runbooks/cron-disable-v2.md`
- `CRON_DISABLED_V2=true` em prod desativa crons v1 (`close-monthly-cv`, `network-compression`).
- Cron v2 `auto-tags` (03:00 UTC) só roda se `LRP_V2=true` E `CRON_SECRET` válido.

#### `runbooks/migration-supabase.md`
- Projeto: `rlp-biohelp`, ref `ikvwzfbkbwpiewhkumrj`.
- Aplicar via Supabase MCP `mcp__supabase__apply_migration(project_id, name, query)`.
- Sempre testar SELECT na branch staging antes.
- Rollback: criar nova migration reversa (não usar `supabase db reset`).

### 4.8 `docs/wiki/context/.gitkeep`

Arquivo vazio.

Após Fase 4: `git add docs/wiki && git commit -m "chore(harness): fase 4 — Project Wiki completo"`.

---

## FASE 5 — Estrutura técnica complementar

### 5.1 `packages/shared/types/README.md`

```markdown
# packages/shared/types

> Skeleton para tipos compartilhados (Zod). Atualmente VAZIO por decisão DL-003.
>
> Padrão atual: Zod inline em `lib/*`. Migração para esta pasta é gradual, feature a feature, sem big-bang.
>
> Quando criar um schema aqui:
> 1. Mova o Zod de `lib/<modulo>/schema.ts` para `packages/shared/types/<modulo>.ts`.
> 2. Atualize imports.
> 3. Atualize `docs/contracts/CONTRACTS.md` §1.
> 4. Adicione 1 linha em `docs/wiki/log.md`.
```

### 5.2 `tests/{unit,integration,contract,e2e}/README.md` (mesmo conteúdo nos 4)

```markdown
# tests/<tipo>/

> Diretório skeleton. Decisão DL-004: sem test framework formal instalado hoje. Padrão atual: scripts `test-*.mjs` na raiz.
>
> Quando instalar Vitest/Jest, mover testes pra cá conforme tipo:
> - `unit/` — lógica pura
> - `integration/` — Supabase + chamadas externas mockadas
> - `contract/` — validação de Zod contra fixture
> - `e2e/` — Playwright fluxos completos
```

### 5.3 `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  n1-lint-typecheck-build:
    name: N1 (lint + typecheck + build)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SHOPIFY_STORE_DOMAIN: ${{ secrets.SHOPIFY_STORE_DOMAIN }}
          SHOPIFY_ADMIN_API_TOKEN: ${{ secrets.SHOPIFY_ADMIN_API_TOKEN }}
          SHOPIFY_WEBHOOK_SECRET: ${{ secrets.SHOPIFY_WEBHOOK_SECRET }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}

  # N2 (integration + contract + db validation) — comentado até adoção de test runner
  # n2-integration:
  #   name: N2 (integration + contract)
  #   needs: n1-lint-typecheck-build
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with: { node-version: '20', cache: 'npm' }
  #     - run: npm ci
  #     - run: npm run test:integration
  #     - run: npm run test:contract

  # N3 (e2e + smoke + migration validation + preview deploy check) — comentado
  # n3-e2e-smoke:
  #   name: N3 (e2e + smoke + migration validation)
  #   needs: n2-integration
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with: { node-version: '20', cache: 'npm' }
  #     - run: npm ci
  #     - run: npm run test:e2e
  #     - run: npm run test:smoke
  #     - run: npm run test:migration
```

Após Fase 5: `git add packages tests .github && git commit -m "chore(harness): fase 5 — packages/shared/types skeleton + tests skeleton + ci.yml N1"`.

---

## FASE 6 — Arquivar legacy v1

Mover (não copiar) os 5 docs v1 deprecated para `docs/legacy/v1/`:

```bash
git mv docs/WORKFLOW.md docs/legacy/v1/WORKFLOW.md
git mv docs/SPEC_Biohelp_LRP.md docs/legacy/v1/SPEC_Biohelp_LRP.md
git mv documentos_projeto_iniciais_MD/Biohelp_LRP_Escopo_Projeto_v1.md docs/legacy/v1/Biohelp_LRP_Escopo_Projeto_v1.md
git mv documentos_projeto_iniciais_MD/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md docs/legacy/v1/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md
git mv documentos_projeto_iniciais_MD/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md docs/legacy/v1/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md
```

**ATENÇÃO:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` (regras de negócio canônicas v1) **NÃO MOVE** — ele é a fonte para auditoria do código v1 congelado, ainda referenciada em `docs/sdd/PIVOT-V2.md` para entender o que está sendo descontinuado. Mantém onde está com banner DEPRECATED já presente.

Após mover, criar `docs/legacy/v1/README.md`:

```markdown
# docs/legacy/v1/ — Snapshot pré-pivot v2 (28/04/2026)

> Arquivos aqui são **somente leitura**. Banners `DEPRECATED V2` já estão no topo de cada arquivo.
> Fonte de verdade vigente: `docs/sdd/PIVOT-V2.md` + `docs/sdd/PLAYBOOK.md`.

## Conteúdo

| Arquivo | Descrição | Data congelado |
|---|---|---|
| `WORKFLOW.md` | Workflow v1 (FRs por sprint, MLM CV-based) | 28/04/2026 |
| `SPEC_Biohelp_LRP.md` | SPEC técnica v1 | 28/04/2026 |
| `Biohelp_LRP_Escopo_Projeto_v1.md` | Escopo formal v1 (FR-01..FR-38) | 28/04/2026 |
| `Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md` | Matriz esforço × impacto v1 | 28/04/2026 |
| `Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md` | Cronograma v1 | 28/04/2026 |

## Por que ainda existem

- Código v1 (`lib/cv/`, `lib/levels/`, `lib/commissions/`, `lib/network/compression*`) ainda vive em prod atrás do flag `LRP_V2=false`. Cleanup físico só na onda 6 / F-V12 (`docs/sdd/PIVOT-V2.md` §5).
- Auditoria / compliance fiscal pode precisar consultar regras v1 originais.

## Por que NÃO removemos

Manual Harness v3.2 §17 (Cenário C): "Adoção gradual, sem tocar no que funciona. Nenhum refactor preventivo." Remover docs v1 quebraria links em código deprecated e em `STATUS_IMPLEMENTACAO.md` (histórico).
```

Após Fase 6: `git add docs/legacy && git commit -m "chore(harness): fase 6 — arquiva 5 docs v1 deprecated em docs/legacy/v1/"`.

---

## FASE 7 — Validação técnica

Execute em sequência:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Se algum falhar com erro novo (não preexistente — compare com último commit antes da reorg), pause e relate. Como esta reorg **não toca código**, qualquer falha aqui é diagnóstica de algo preexistente que não foi reorg.

Atualize `docs/wiki/log.md` adicionando 1 linha após "REORG":

```
- [{{DATA_DE_HOJE}}] [VALIDATION] CI N1 local executado: `npm run lint` ✅, `npx tsc --noEmit` ✅, `npm run build` ✅. Nenhuma regressão.
```

(Se algo falhou, registrar exato output.)

`git add docs/wiki/log.md && git commit -m "chore(harness): fase 7 — validação CI N1 local"`.

---

## FASE 8 — Relatório final + push

### 8.1 Gerar relatório `docs/sdd/REORG-HARNESS-V32-REPORT.md`

```markdown
# Reorg Harness v3.2 — Relatório final

**Data:** {{DATA_DE_HOJE}}
**Branch:** `chore/harness-v3.2-reorg`
**Modo:** bridge aditivo (Cenário C + E do manual v3.2)

## Arquivos criados

(listar todos os arquivos novos via `git diff --name-status main..HEAD | grep ^A`)

## Arquivos movidos

(via `git diff --name-status main..HEAD | grep ^R`)

## Arquivos NÃO tocados (deliberadamente)

- `app/**`, `lib/**`, `supabase/**`, `components/**`, `middleware.ts`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `vercel.json`, `postcss.config.js`
- `_loveable_import/**` (gitignored)
- `docs/sdd/**` (fonte de verdade v2 intacta)
- `docs/STATUS_IMPLEMENTACAO.md`, `docs/ACCEPTANCE.md`, `docs/CHANGELOG.md`, `docs/DECISOES_TBD.md`, `docs/README.md`, `docs/ROTEIRO_DEMONSTRACAO_RAPIDO.md`
- `docs/docs para cliente/**`
- `documentos_escopo/**`
- `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` (regras canônicas v1 ainda referenciadas)
- `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.docx`, `.png`, `core.png`, `NotebookLM Mind Map (1).png`
- Scripts `test-*.mjs`, `apply-*.mjs`, `create-*.mjs`, `reset-*.mjs`, `verify-data.mjs`, `LOGINS_TESTE.txt`, `PR_TEMPLATE.md`, screenshots `home-novo-design.png`, `login-novo-design.png`
- `transcript_chats_cursor/`
- `.claude/skills/**`, `.claude/settings.local.json`, `.claude/harness-v3.2-manual.html`, `.claude/harness-v3.2-manual.txt`

## Validação

- `npm run lint`: ✅ / ❌ (output exato se ❌)
- `npx tsc --noEmit`: ✅ / ❌
- `npm run build`: ✅ / ❌

## Próximos passos (humano)

1. Revisar PR: `git diff main..chore/harness-v3.2-reorg`.
2. Mergear PR.
3. Próxima feature B/C/D nova **já nasce v3.2**:
   - Lê `docs/wiki/index.md` no início.
   - Cria SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` (caminho existente preservado).
   - Atualiza `TODO.md` (raiz) com Feature Contract inline.
   - QA via Prompt 3 (Validation Mode) + matriz preenchida.
   - Pós-merge: linha em `docs/wiki/log.md`, resumo em `docs/wiki/features/F-VNN.md` se C/D.
4. Quando aparecer bug urgente A/B: usar `/fast-fix` (Prompt 0).
5. Antes de release / a cada 2-4 semanas: rodar `/wiki lint`.

## O que esta reorg NÃO resolveu (e quando reabrir)

- **Test framework formal:** quando primeira feature C/D exigir ≥3 testes amarrados → instalar Vitest, mover `test-*.mjs` para `tests/integration/`. Atualizar DL-004.
- **`packages/shared/types/` populado:** quando primeira feature exigir tipo compartilhado entre módulos. Atualizar DL-003.
- **Shopify MCP custom:** quando ≥3 pedidos "consulta loja real" em 1 semana. Atualizar DL-002.
- **N2/N3 no CI:** quando test framework adotado.
- **PR template Harness v3.2:** `PR_TEMPLATE.md` legado preservado; trocar quando próxima PR B/C/D for aberta.

## Memory: linha em wiki/log.md

`- [{{DATA_DE_HOJE}}] [REORG] Reorg Harness v3.2 — bridge aditivo. AGENTS/CLAUDE/TODO criados na raiz. docs/{product,specs,contracts,plans,wiki,decisions,legacy/v1} populados. 5 docs v1 movidos pra docs/legacy/v1/. Zero código de produção tocado. CI N1 verde. Branch chore/harness-v3.2-reorg pronta pra revisão humana.`
```

### 8.2 Commit final + push

```bash
git add docs/sdd/REORG-HARNESS-V32-REPORT.md
git commit -m "chore(harness): fase 8 — relatório final da reorg v3.2"
git push -u origin chore/harness-v3.2-reorg
```

NÃO abra PR via `gh pr create`. O humano abre quando revisar.

### 8.3 Resumo na saída da sessão

Imprima ao final:

```
✅ Reorg Harness v3.2 concluída.

📊 Resumo:
- Fases executadas: 8/8
- Arquivos criados: N (ver relatório)
- Arquivos movidos: 5 (docs/legacy/v1/)
- Código de produção tocado: 0
- Commits: 8 (1 por fase)
- Branch: chore/harness-v3.2-reorg (pushed)
- CI N1 local: ✅
- Próximo passo: humano revisa diff e abre PR.

📄 Relatório completo: docs/sdd/REORG-HARNESS-V32-REPORT.md
```

---

## Comportamento ao encontrar imprevistos

| Cenário | Ação |
|---|---|
| `npm run lint` falha com erro novo (não preexistente) | PARE. Reporte stderr completo. Não tente "consertar" código de produção. |
| `npx tsc --noEmit` falha em arquivo de prod | Idem. |
| `npm run build` falha por env var faltando | OK — apenas registre em REORG-REPORT §Validação como "build local sem env completo, validar em Vercel preview". Não bloqueie. |
| Diretório `docs/legacy/v1/` já existe com conteúdo | Pause e relate — não sobrescreva. |
| Arquivo em FASE 1/2/3/4/5 já existe com conteúdo diferente | Pause, mostre diff, relate. NÃO sobrescreva. |
| `git mv` falha em FASE 6 | Pause — não use `mv` direto (perde histórico). Reporte. |
| Conflito em rebase / merge | Não há rebase nesta reorg. Se aparecer, PARE. |

## Limites de tempo

Esta reorg deve completar em **≤ 90 minutos de relógio** se nada falhar. Se passar de 120 min, **PARE** e reporte onde travou.

## ▲ COPIE ATÉ AQUI ▲

---

## Notas para humano (não copiar pra sessão)

**Sobre o Shopify MCP:** decisão registrada em DL-002. Reavaliar se aparecer ≥3 pedidos repetidos de "consultar pedido X / cliente Y da loja Biohelp" em uma semana de trabalho. Quando reabrir, usar skill `/mcp-builder` (`.claude/skills/mcp-builder/SKILL.md`) — escopo recomendado: 4 ferramentas (`shopify_get_order`, `shopify_get_customer`, `shopify_list_customer_orders`, `shopify_get_product_metafield`) sobre Admin API GraphQL `2024-10`, transporte stdio, creds via `.env`.

**Sobre o switch v2 em produção:** esta reorg NÃO mexe em `LRP_V2`. Decisão de virar a chave em prod cabe ao humano após validação da demo de 13/05/2026 com o cliente.

**Sobre os pontos novos do cliente pós-demo:** quando aparecerem, trabalhar **dentro do fluxo Harness v3.2 novo**. Para cada ponto: 1) classificar A/B/C/D, 2) criar SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` (caminho existente), 3) item no `TODO.md` §2 com Feature Contract inline, 4) executar com Prompt 2 da `/agents-protocol`.

*Arquivo gerado em 2026-05-19 pela sessão Claude Code que leu o manual `.claude/harness-v3.2-manual.html`, os docs em `docs/sdd/`, `docs/STATUS_IMPLEMENTACAO.md`, e validou decisões com o usuário.*
