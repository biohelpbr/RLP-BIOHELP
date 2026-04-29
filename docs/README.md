# Docs — Biohelp LRP

Diretório oficial de documentação do projeto.

## ⚠️ PIVÔ V2 ativo desde 28/04/2026

O projeto está em transição do modelo **MLM/CV (v1)** para **afiliação 1-nível (v2)**.
**Sempre consulte os docs v2 primeiro.** Os docs v1 listados abaixo são mantidos apenas como histórico.

### 📌 Hierarquia atual (v2)

1. **Fonte de verdade do pivô:** [`sdd/PIVOT-V2.md`](sdd/PIVOT-V2.md) — delta v1→v2, backlog F-V01..F-V12 (A/B/C/D), Anti-SPEC, 18 TBDs, plano em ondas
2. **Workflow operacional:** [`sdd/PLAYBOOK.md`](sdd/PLAYBOOK.md) — loops, classes, estados CONTINUE/PAUSE/BLOQUEADO, template SPEC, CI mínimo
3. **Estado e backlog:** [`STATUS_IMPLEMENTACAO.md`](STATUS_IMPLEMENTACAO.md) — seção "PIVÔ V2" no topo
4. **Questionário ao cliente:** [`sdd/QUESTIONARIO-CLIENTE-V2.md`](sdd/QUESTIONARIO-CLIENTE-V2.md) — texto pra WhatsApp com os 18 TBDs
5. **Prompt para nova sessão CLI:** [`sdd/PROMPT-NOVA-SESSAO.md`](sdd/PROMPT-NOVA-SESSAO.md) — autocontido, basta colar
6. **SPECs por feature v2:** [`sdd/features/F-VNN-<slug>/SPEC.md`](sdd/features/)

### 📥 Insumos do cliente (v2)

- [`../documentos_escopo/Fluxograma.jpg.jpeg`](../documentos_escopo/) — fluxograma novo (28/04/2026)
- [`../documentos_escopo/Fluxo.txt`](../documentos_escopo/Fluxo.txt) — regras condensadas
- [`../documentos_escopo/Biohelp _ Loyalty Reward Program.docx`](../documentos_escopo/) — escopo v1 com comentários do cliente apontando o que muda

### 🛠 Como trabalhar (regra do time pós-pivô)

1. Antes de implementar qualquer coisa, ler `sdd/PIVOT-V2.md` + `sdd/PLAYBOOK.md`.
2. Para cada feature: criar SPEC em `sdd/features/F-VNN-<slug>/SPEC.md` com classe A/B/C/D, DoR, CAs, arquivos permitidos.
3. Em conflito de docs: **PIVOT-V2.md > PLAYBOOK.md > SPEC_Biohelp_LRP.md (v1) > WORKFLOW.md (v1) > documentos_projeto_iniciais_MD/\* (v1)**.
4. Ao concluir uma feature: marcar SPEC como Done + atualizar `STATUS_IMPLEMENTACAO.md` + atualizar tabela em `PIVOT-V2.md` §2.
5. Mudança no PIVOT-V2.md ou Anti-SPEC v2 exige autorização humana explícita.

---

## 📦 Documentos V1 (histórico — não use como fonte de verdade)

Os documentos abaixo descrevem o modelo MLM/CV descontinuado pelo pivô V2. Mantidos apenas como referência do que foi entregue até 11/02/2026 (Sprints 1-7, 98% dos FRs v1).

- [`SPEC_Biohelp_LRP.md`](SPEC_Biohelp_LRP.md) — SPEC v1 (CV, níveis Parceira/Líder/Diretora/Head, Fast-Track, comissões multinível, RPA/CPF)
- [`ACCEPTANCE.md`](ACCEPTANCE.md) — CAs do v1
- [`DECISOES_TBD.md`](DECISOES_TBD.md) — TBDs do v1 (TBDs novos do v2 estão em `sdd/PIVOT-V2.md` §4)
- [`WORKFLOW.md`](WORKFLOW.md) — workflow v1 (substituído por `sdd/PLAYBOOK.md`)
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de mudanças (entrada v5.0 = pivô)
- `../documentos_projeto_iniciais_MD/` — documentos canônicos iniciais v1

## 📊 Documentos para cliente

- [`docs para cliente/RESUMO_PARA_CLIENTE.md`](docs%20para%20cliente/RESUMO_PARA_CLIENTE.md)
- [`docs para cliente/status_projeto.html`](docs%20para%20cliente/status_projeto.html)

## 📁 Estrutura

```
docs/
├── README.md                       # Este arquivo (índice)
├── sdd/                            # Documentos V2 (atual)
│   ├── PIVOT-V2.md                 # Fonte de verdade do pivô
│   ├── PLAYBOOK.md                 # Workflow operacional
│   ├── PROMPT-NOVA-SESSAO.md       # Prompt self-contained pra CLI
│   ├── QUESTIONARIO-CLIENTE-V2.md  # 18 TBDs ao cliente
│   └── features/F-VNN-<slug>/SPEC.md
├── STATUS_IMPLEMENTACAO.md         # Estado atual + backlog v2 (no topo)
├── SPEC_Biohelp_LRP.md             # ⚠️ V1 (histórico)
├── ACCEPTANCE.md                   # ⚠️ V1 (histórico)
├── CHANGELOG.md                    # Histórico de mudanças
├── DECISOES_TBD.md                 # ⚠️ V1 (histórico)
├── WORKFLOW.md                     # ⚠️ V1 (histórico — substituído por sdd/PLAYBOOK.md)
└── docs para cliente/              # Resumos para cliente
```
