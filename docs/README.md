# Docs — Biohelp LRP (SDD)

Este diretório contém os documentos oficiais do projeto no modelo **Spec-Driven Development (SDD)**.

## 📌 Hierarquia de Documentos (ordem de precedência)

1. **Regras de Negócio Canônicas:** `../documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
   - Fonte definitiva para regras de negócio (CV, níveis, comissões, saques)
   - Em caso de conflito, este documento prevalece

2. **SPEC Técnico Canônico:** `SPEC_Biohelp_LRP.md`
   - Especificação técnica de implementação
   - Derivado das regras de negócio canônicas

3. **Decisões pendentes (assináveis):** `DECISOES_TBD.md`
4. **Critérios de aceite e roteiros de teste:** `ACCEPTANCE.md`
5. **Histórico de mudanças aprovadas:** `CHANGELOG.md`
6. **Status de implementação:** `STATUS_IMPLEMENTACAO.md`
7. **Guia de trabalho diário:** `WORKFLOW.md`

## 📚 Materiais de origem (referência)
- **Regra de Negócio (CANÔNICO):** `../documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
- Escopo do Projeto: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Escopo_Projeto_v1.md`
- Matriz Esforço x Impacto: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md`
- Cronograma: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md`

## 📊 Documentos para Cliente
- **Resumo Executivo:** `RESUMO_PARA_CLIENTE.md` / `RESUMO_PARA_CLIENTE.html`
  - Visão consolidada do progresso do projeto
  - Diagramas e fluxos visuais
  - Status de cada sprint

## Como trabalhar (regra do time)
1. Antes de implementar qualquer coisa, **ler o documento de regras de negócio canônico**.
2. Em seguida, **ler o SPEC técnico** (`SPEC_Biohelp_LRP.md`).
3. Consultar o **WORKFLOW.md** para o processo de implementação.
4. Se algo não estiver no SPEC, registrar em **DECISOES_TBD** ou abrir **Mudança de Escopo**.
5. Ao concluir itens, marcar **ACCEPTANCE** e anexar evidências.
6. Toda mudança aprovada entra no **CHANGELOG** e atualiza o SPEC quando necessário.

## 📁 Estrutura da Pasta

```
docs/
├── README.md                    # Este arquivo (índice)
├── SPEC_Biohelp_LRP.md         # SPEC técnico canônico
├── ACCEPTANCE.md               # Critérios de aceite
├── CHANGELOG.md                # Histórico de mudanças
├── DECISOES_TBD.md             # Decisões pendentes
├── STATUS_IMPLEMENTACAO.md     # Status por sprint
├── WORKFLOW.md                 # Guia de trabalho diário
├── RESUMO_PARA_CLIENTE.md      # Resumo executivo (Markdown)
└── RESUMO_PARA_CLIENTE.html    # Resumo executivo (HTML visual)
```
