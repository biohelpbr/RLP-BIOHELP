# PLAYBOOK — Workflow de Desenvolvimento (Biohelp LRP v2)

> Workflow operacional pós-pivot. Substitui as partes desatualizadas de `docs/WORKFLOW.md` (que ainda referencia FRs e sprints do modelo v1). Mantém o estilo SDD do projeto (`docs/sdd/features/<F-VNN-slug>/SPEC.md`) e enxerta os 4 ganchos do Harness 3.1 que pagam pelo custo em projeto em produção.
>
> **Para o Claude Code abrir uma sessão de trabalho:** leia, na ordem, `docs/sdd/PIVOT-V2.md` → `docs/STATUS_IMPLEMENTACAO.md` (seção do pivot) → este Playbook → SPEC da feature ativa.

**Data:** 2026-04-28

---

## Princípios não-negociáveis

1. Cliente em produção → adoção gradual. Nenhum refactor preventivo.
2. Cada mudança é uma feature, classificada A/B/C/D. Suba a classe se a natureza mudar; nunca desça.
3. **Anti-SPEC v2** (`PIVOT-V2.md` §3) é sagrada. Tocar exige autorização humana.
4. Sem evidência objetiva no QA → nunca aprovado.
5. Estados do agente: **CONTINUE / PAUSE / BLOQUEADO**. `BLOQUEADO` é resposta legítima, não falha.
6. Em conflito de docs, vale: `PIVOT-V2.md` > este Playbook > `SPEC_Biohelp_LRP.md` (legado v1) > `WORKFLOW.md` (legado v1) > documentos iniciais.

---

## Loop por feature (rápido, sem cerimônia)

### Passo 1 — Antes de codar
- [ ] Ler `PIVOT-V2.md` e localizar a feature `F-VNN`.
- [ ] Verificar TBDs bloqueantes da feature (`PIVOT-V2.md` §2 e §4).
  - Se houver TBD aberto → **BLOQUEADO**: relatar ao usuário e parar.
- [ ] Ler `STATUS_IMPLEMENTACAO.md` na área tocada.
- [ ] Se a feature toca regra de negócio canônica do v1: ler a seção relevante de `SPEC_Biohelp_LRP.md` apenas para entender o que **será removido/alterado** — nunca pra reusar regra v1 como verdade.

### Passo 2 — Criar SPEC da feature
Caminho: `docs/sdd/features/F-VNN-<slug>/SPEC.md`. Template:

```markdown
# F-VNN — <nome>

## Metadata
- ID: F-VNN
- Classe: A / B / C / D
- Status: Draft / Approved / Done
- Onda: 2 / 3 / 4 / 5 / 6
- Data: YYYY-MM-DD

## Contexto
1-3 frases. Qual o problema, qual o resultado esperado, qual onda do PIVOT-V2.

## Definition of Ready (preencher antes de começar)
- [ ] RFs definidos
- [ ] CAs testáveis
- [ ] Arquivos permitidos listados
- [ ] Anti-SPEC aplicável citada
- [ ] TBDs bloqueantes resolvidos

## Requisitos Funcionais
- RF-1: ...
- RF-2: ...

## Critérios de Aceite
- CA-01: ...
- CA-02: ...

## Arquivos PERMITIDOS
- lib/...
- app/...
- supabase/migrations/<data>_<slug>.sql

## Arquivos PROIBIDOS (Anti-SPEC aplicável)
- (citar itens específicos da §3 do PIVOT-V2.md)

## Plano de implementação
1. Branch `feat/F-VNN-<slug>`.
2. Migration (se houver) — idempotente, com rollback escrito.
3. Teste falhando por CA-01.
4. Implementação mínima.
5. Próximo CA.
6. ...

## Matriz de Validação (preencher no QA)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | … | unit / integration / e2e / manual | TODO | … |

## Rollback (apenas C/D)
Como reverter se der ruim:
- Revert do PR
- Migration reversa: `<arquivo>`
- Feature flag desligar: `LRP_V2=false`
```

**Classe A** (texto, layout, ajuste sem contrato): pula o SPEC. Vai direto pro código + 1 linha em `STATUS_IMPLEMENTACAO.md`.

### Passo 3 — Implementar
- Branch `feat/F-VNN-<slug>` ou `fix/F-VNN-<slug>`.
- Migration primeiro, com numeração e idempotência.
- **Teste falhando ANTES da implementação** (B/C/D).
- Edits só nos arquivos permitidos. Tocar fora → **PAUSE** + atualizar SPEC ou abrir nova feature.
- Reclassificar se virar D no meio (ex.: começou B, virou migration). Nunca desça.

### Passo 4 — QA em Validation Mode (B/C/D)
**Tente quebrar antes de aprovar.** Categorias mínimas:
- Inputs inválidos / no limite (string vazia, null, números negativos).
- Ausência de dados / estado vazio (membro sem indicados, sem assinatura).
- Permissões erradas (RLS — member tentando ler dados de outro).
- Idempotência (chamar 2x: webhook duplicado, retry).
- Concorrência básica (2 cadastros simultâneos com mesmo ref).
- Diff fora do escopo do SPEC.
- UI: estado vazio / loading / erro.

Preencher matriz com **evidência real** (saída de `npm test`, screenshot, log de webhook). Sem evidência = `MUDANÇAS_SOLICITADAS`. Nunca aprovar com `expect(true).toBe(true)`.

### Passo 5 — Merge e atualização
- PR aprovado → merge.
- Atualizar `STATUS_IMPLEMENTACAO.md` na seção PIVÔ V2 (1 linha por feature).
- Marcar SPEC como `Status: Done` + data.
- Marcar feature em `PIVOT-V2.md §2` como entregue.

---

## Estados do agente

| Estado | Quando | Ação |
|---|---|---|
| **CONTINUE** | DoR ok + arquivos permitidos + sem risco novo | Seguir |
| **PAUSE** | Precisa mudar Anti-SPEC v2 / tocar produção real / nova dep externa / escopo crescendo | Parar e perguntar ao humano |
| **BLOQUEADO — DoR INCOMPLETA** | Feature C/D sem CAs claros ou sem arquivos permitidos | Parar, voltar ao Passo 2 |
| **BLOQUEADO — ARQUIVO FORA DO CONTRATO** | Mexer em arquivo proibido sem justificativa | Parar e relatar |
| **BLOQUEADO — TBD PENDENTE** | Regra ainda não decidida pelo cliente (TBD aberto em PIVOT-V2.md §4) | Parar e relatar |
| **BLOQUEADO — RECLASSIFICAÇÃO** | Virou D no meio sem atualizar contrato | Parar, atualizar SPEC, retomar |
| **BLOQUEADO — ANTI-SPEC VIOLADA** | Tentativa de mexer em item da §3 do PIVOT-V2.md sem autorização | Parar |

---

## CI mínimo por classe (sem cerimônia, mas com rede de segurança)

| Classe | Antes do merge |
|---|---|
| **A** | `npm run lint` |
| **B** | lint + typecheck + 1 teste do CA principal (manual ou unit) |
| **C** | lint + typecheck + integration test do CA + revisão humana sugerida |
| **D** | tudo de C + staging + smoke + plano de rollback escrito + feature flag |

Conforme o projeto crescer, formalizar `npm run ci:n1/n2/n3` no `package.json`. Por enquanto: rodar manualmente os scripts equivalentes (`npm run lint`, `npm run build`, testes existentes em `test-*.mjs`).

---

## Convenções

- **Commit:** `feat(F-VNN): <descrição>` ou `fix:`, `chore:`, `docs:`.
- **Branch:** `feat/F-VNN-<slug>` ou `fix/F-VNN-<slug>`.
- **PR:** linkar SPEC, listar CAs cobertos, anexar evidências da Matriz de Validação.
- **Slug:** kebab-case curto. Ex.: `F-V01-cadastro-com-ref`.

---

## O que NÃO fazer (lições do v1)

- ❌ Implementar regra que toca CV, níveis, Fast-Track, bônus, royalty, RPA. Tudo isso saiu.
- ❌ Big-bang refactor. Mesmo que tenha código v1 morto, **só remove na onda 6**.
- ❌ Aprovar PR sem matriz preenchida pra B/C/D.
- ❌ Editar `PIVOT-V2.md §3` (Anti-SPEC) sem o humano pedir.
- ❌ Inferir regra que o cliente não decidiu — abre TBD em `PIVOT-V2.md §4` ao invés.
- ❌ Confiar em SPEC_Biohelp_LRP.md como verdade — é legado v1.

---

*Última atualização: 2026-04-28.*
