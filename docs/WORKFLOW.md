# Workflow Diário — SDD (Uso Obrigatório)

## Ordem de Leitura (OBRIGATÓRIA)

1. **Regras de Negócio Canônicas:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
   - Fonte definitiva para CV, níveis, comissões, saques
   - Em caso de conflito com SPEC, este documento prevalece

2. **SPEC Técnico:** `docs/SPEC_Biohelp_LRP.md`
   - Especificação técnica derivada das regras canônicas
   - Nota: `docs/SPEC.md` é espelho — não editar diretamente

3. **Decisões TBD:** `docs/DECISOES_TBD.md`
4. **Critérios de Aceite:** `docs/ACCEPTANCE.md`
5. **Status:** `docs/STATUS_IMPLEMENTACAO.md`

## Antes de qualquer implementação
- [ ] Li o documento de regras de negócio canônico
- [ ] Li `docs/SPEC_Biohelp_LRP.md`
- [ ] A tarefa existe no SPEC?
  - [ ] SIM → continuar
  - [ ] NÃO → registrar em DECISOES_TBD ou CHANGELOG

## Definição da tarefa
Esta tarefa implementa:
- Regra de negócio (canônico): seção __________
- SPEC técnico: seção __________
- Sprint: __________
- Critério de aceite: __________

## Durante a implementação
- [ ] Não adicionar escopo extra
- [ ] Não inferir regras — se não está no canônico, registrar TBD
- [ ] Seguir RLS e restrições do SPEC
- [ ] Verificar se a implementação está alinhada com o documento canônico

## Finalização
- [ ] Atualizar `docs/ACCEPTANCE.md`
- [ ] Descrever teste manual
- [ ] Se algo mudou, registrar no CHANGELOG
- [ ] Verificar consistência entre implementação e documento canônico
