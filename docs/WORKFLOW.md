# Workflow Diário — SDD (Uso Obrigatório)

**Última atualização:** 12/01/2026

---

## Ordem de Leitura (OBRIGATÓRIA)

1. **Regras de Negócio Canônicas:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
   - Fonte definitiva para CV, níveis, comissões, saques
   - Em caso de conflito com SPEC, este documento prevalece

2. **Escopo Formal:** `documentos_projeto_iniciais_MD/Biohelp_LRP_Escopo_Projeto_v1.md`
   - Lista completa de FRs (FR-01 a FR-38)
   - TBDs do escopo formal
   - Requisitos não funcionais

3. **SPEC Técnico:** `docs/SPEC.md`
   - Especificação técnica derivada das regras canônicas
   - Mapeamento de FRs por sprint
   - Critérios de aceite

4. **Decisões TBD:** `docs/DECISOES_TBD.md`
5. **Critérios de Aceite:** `docs/ACCEPTANCE.md`
6. **Status:** `docs/STATUS_IMPLEMENTACAO.md`

---

## Antes de qualquer implementação

### Checklist obrigatório
- [ ] Li o documento de regras de negócio canônico
- [ ] Li o documento de escopo formal (FRs)
- [ ] Li `docs/SPEC.md`
- [ ] Identifiquei o(s) FR(s) que a tarefa implementa
- [ ] Verifiquei se há TBDs bloqueantes
- [ ] A tarefa existe no SPEC?
  - [ ] SIM → continuar
  - [ ] NÃO → registrar em DECISOES_TBD ou CHANGELOG

---

## Definição da tarefa

Esta tarefa implementa:
- **FR(s):** FR-____ (ex.: FR-17, FR-28)
- **Regra de negócio (canônico):** seção __________
- **SPEC técnico:** seção __________
- **Sprint:** __________
- **Critério de aceite:** CA-____ (ex.: CA-04, CA-07)
- **TBDs bloqueantes:** TBD-____ (se houver)

---

## Matriz de FRs por Sprint (referência rápida)

### Sprint 1 (MVP)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-01 | Autenticação de membro | ✅ |
| FR-02 | Autenticação de admin | ✅ |
| FR-03 | Controle de permissões (RBAC) | ✅ |
| FR-04 | Cadastro de novo membro | ✅ |
| FR-05 | Captura de link de indicação | ✅ |
| FR-06 | Regra para cadastro sem link | ❌ TBD-001 |
| FR-07 | Geração de link único | ✅ |
| FR-08 | Ativação de preço de membro | ✅ |
| FR-09 | Persistência da rede | ✅ |

### Sprint 2 (CV + Status)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-13 | Webhooks de pedidos | ✅ |
| FR-14 | Cálculo de CV por pedido | ✅ |
| FR-15 | Status Ativo/Inativo mensal | ✅ |
| FR-16 | Reset mensal | ✅ |

### Sprint 3 (Rede + Níveis)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-10 | Visualização da rede (membro) | ✅ |
| FR-11 | Visualização da rede (admin) | ✅ |
| FR-17 | Separação de CV (próprio vs rede) | ⚠️ |
| FR-18 | Recalcular nível automaticamente | ✅ |
| FR-19 | Status 'Líder em Formação' | ✅ |
| FR-20 | Rebaixamento automático | ✅ |

### Sprint 4 (Comissões)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-21 | Ledger de comissões | ✅ |
| FR-22 | Fast-Track | ✅ |
| FR-23 | Comissão Perpétua | ✅ |
| FR-24 | Bônus 3 | ✅ |
| FR-25 | Leadership Bônus | ✅ |
| FR-26 | Royalty | ✅ |
| FR-27 | Detalhamento por tipo de comissão | ✅ |

### Sprint 5 (Saques)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-28 | Saldo em análise (trava) | ⏳ TBD-021 |
| FR-29 | Solicitação de saque | ⏳ |
| FR-30 | Upload e validação de NF-e | ⏳ |
| FR-31 | Emissão de RPA (CPF) | ⏳ TBD-015 |
| FR-32 | Workflow de aprovação | ⏳ |
| FR-33 | Integração de pagamento | ⏳ TBD-018 |

### Sprint 6 (Admin Avançado)
| FR | Descrição | Status |
|----|-----------|--------|
| FR-12 | Regra de saída após 6 meses | ⏳ |
| FR-34 | Gestão de admins | ⏳ |
| FR-35 | Dashboard global | ⚠️ |
| FR-36 | Filtros por modo de comissionamento | ⏳ |
| FR-37 | Gestão de membro | ⚠️ |
| FR-38 | Gestão de tags | ⏳ |

**Legenda:** ✅ Implementado | ⚠️ Parcial | ⏳ Pendente | ❌ Bloqueado

---

## Durante a implementação

- [ ] Não adicionar escopo extra
- [ ] Não inferir regras — se não está no canônico, registrar TBD
- [ ] Seguir RLS e restrições do SPEC
- [ ] Verificar se a implementação está alinhada com o documento canônico
- [ ] Verificar se todos os critérios de aceite do FR serão atendidos

---

## Finalização (Definition of Done)

### Obrigatório em TODA tarefa:

1. **FR(s) implementado(s):** FR-____ (listar)

2. **Seção do SPEC implementada:** seção ____ (ex.: 5.7, 6.3)

3. **Arquivos alterados/criados:**
   - [ ] Listar todos os arquivos

4. **Critérios de aceite atendidos:**
   - [ ] Marcar em `docs/ACCEPTANCE.md`

5. **Como testar manualmente:**
   - Passo 1: ____
   - Passo 2: ____
   - Resultado esperado: ____

6. **Evidências esperadas:**
   - No Shopify Admin: ____
   - No Supabase: ____
   - No Dashboard: ____

7. **Edge cases e riscos:**
   - [ ] Listar cenários de borda testados

8. **Plano de rollback:**
   - Como desfazer: ____

9. **Atualizações de documentação:**
   - [ ] `docs/ACCEPTANCE.md` atualizado
   - [ ] `docs/STATUS_IMPLEMENTACAO.md` atualizado
   - [ ] `docs/CHANGELOG.md` atualizado (se mudança de escopo)

---

## Regras de Progressão de Sprint

### Para avançar de sprint, TODOS os FRs do sprint atual devem estar:
- ✅ Implementados e testados, OU
- ❌ Bloqueados por TBD documentado (com justificativa)

### Critérios para considerar um FR como "Implementado":
1. Código implementado e funcionando
2. Critérios de aceite atendidos
3. Testes manuais realizados
4. Documentação atualizada

### Critérios para considerar um FR como "Bloqueado":
1. TBD documentado em `docs/DECISOES_TBD.md`
2. Cliente notificado sobre pendência
3. Comportamento padrão definido (se aplicável)

---

## Ferramentas MCP Obrigatórias

### Para tarefas de banco de dados:
- Use o **Supabase MCP** para:
  - Verificar schema antes de escrever SQL
  - Validar migrations
  - Confirmar RLS policies

### Para tarefas de Shopify:
- Use o **Shopify Dev MCP** para:
  - Consultar documentação oficial
  - Validar queries/mutations GraphQL
  - Verificar campos disponíveis

### Definition of Done (prova de uso):
Ao final da tarefa, incluir:
- Quais ferramentas MCP foram usadas
- O que foi verificado nelas
- Evidências verificáveis

---

## Checklist de Qualidade

### Antes de marcar como concluído:
- [ ] Código segue padrões do projeto
- [ ] RLS está ativo e testado
- [ ] Não há dados sensíveis expostos no client
- [ ] Logs estruturados implementados
- [ ] Idempotência garantida (se aplicável)
- [ ] Performance aceitável (< 3s para operações de rede)
