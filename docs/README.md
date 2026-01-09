# Docs — Biohelp LRP (SDD)

Este diretório contém os documentos oficiais do projeto no modelo **Spec-Driven Development (SDD)**.

## 📌 Hierarquia de Documentos (ordem de precedência)

1. **Regras de Negócio Canônicas:** `../documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
   - Fonte definitiva para regras de negócio (CV, níveis, comissões, saques)
   - Em caso de conflito, este documento prevalece

2. **SPEC Técnico Canônico:** `SPEC_Biohelp_LRP.md`
   - Especificação técnica de implementação
   - Derivado das regras de negócio canônicas
   - `SPEC.md` é espelho/não editar diretamente

3. **Decisões pendentes (assináveis):** `DECISOES_TBD.md`
4. **Critérios de aceite e roteiros de teste:** `ACCEPTANCE.md`
5. **Histórico de mudanças aprovadas:** `CHANGELOG.md`
6. **Status de implementação:** `STATUS_IMPLEMENTACAO.md`

## 📚 Materiais de origem (referência)
- **Regra de Negócio (CANÔNICO):** `../documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
- Escopo do Projeto: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Escopo_Projeto_v1.md`
- Matriz Esforço x Impacto: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md`
- Cronograma: `../documentos_projeto_iniciais_MD/Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md`

## Como trabalhar (regra do time)
1. Antes de implementar qualquer coisa, **ler o documento de regras de negócio canônico**.
2. Em seguida, **ler o SPEC técnico** (`SPEC_Biohelp_LRP.md`).
3. Se algo não estiver no SPEC, registrar em **DECISOES_TBD** ou abrir **Mudança de Escopo**.
4. Ao concluir itens, marcar **ACCEPTANCE** e anexar evidências.
5. Toda mudança aprovada entra no **CHANGELOG** e atualiza o SPEC quando necessário.

## ⚠️ Nota sobre SPEC.md
O arquivo `SPEC.md` é um **espelho** de `SPEC_Biohelp_LRP.md` para compatibilidade.
**Não editar diretamente** — sempre editar `SPEC_Biohelp_LRP.md` e sincronizar.
