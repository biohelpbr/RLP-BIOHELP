# Matriz Completa de Esforço vs Impacto — Biohelp LRP

Este documento consolida a **Matriz Completa de Esforço vs Impacto** do projeto **Biohelp Loyalty Reward Program (LRP)**.  
Ele serve como base oficial para **priorização de funcionalidades**, **planejamento de sprints** e **controle de escopo contratual**.

---

## Metodologia

### Impacto (1–5)
Avalia o quanto a funcionalidade destrava valor de negócio:
- aquisição e ativação de membros
- crescimento e engajamento da rede
- operação confiável
- geração de receita

### Esforço (1–5)
Avalia complexidade técnica considerando:
- integrações (Shopify, webhooks)
- regras de negócio
- risco operacional
- necessidade de testes, suporte e manutenção

---

## Quadrante: Quick Wins  
**Alto impacto · Baixo esforço**

| Funcionalidade | Impacto | Esforço |
|---------------|--------|--------|
| Cadastro com link | 5 | 2 |
| Shopify Sync + tags | 5 | 2 |
| Redirect login Shopify | 4 | 1 |
| Link do membro | 5 | 2 |
| Dashboard Membro v1 | 4 | 2 |
| Admin mínimo | 4 | 2 |
| Cadastro sem link | 4 | 2 |

**Observação:**  
Essas funcionalidades compõem o **Sprint 1** e são prioritárias para colocar o programa em operação inicial.

---

## Quadrante: Big Bets  
**Alto impacto · Alto esforço**

| Funcionalidade | Impacto | Esforço |
|---------------|--------|--------|
| Webhooks Shopify | 5 | 4 |
| Cálculo de CV | 5 | 3 |
| Status ativo/inativo | 5 | 3 |
| Reset mensal de CV | 4 | 3 |
| Árvore de rede | 4 | 3 |
| Níveis | 4 | 3 |
| Comissões + ledger | 5 | 5 |
| Saldo em análise | 4 | 4 |
| Saques + fiscal | 5 | 5 |

**Observação:**  
Esses itens devem ser desenvolvidos **de forma faseada**, pois envolvem impacto financeiro, regras sensíveis e maior risco operacional.

---

## Quadrante: Fill-ins  
**Baixo impacto · Baixo esforço**

| Funcionalidade | Impacto | Esforço |
|---------------|--------|--------|
| FAQ | 2 | 1 |
| Export CSV | 2 | 1 |
| UX / copy | 2 | 2 |

**Observação:**  
Podem ser incluídos quando houver folga de sprint, sem comprometer entregas principais.

---

## Quadrante: Time Sinks  
**Baixo impacto · Alto esforço**

| Funcionalidade | Impacto | Esforço |
|---------------|--------|--------|
| Admin avançado | 3 | 4 |
| BI complexo | 3 | 4 |
| UI árvore avançada | 2 | 4 |

**Observação:**  
Itens **não recomendados nas fases iniciais**. Devem ser tratados como evolução futura ou novo contrato.

---

## Diretriz de Uso no Projeto

1. **Sprint 1:** apenas Quick Wins  
2. **Sprints intermediários:** Big Bets estruturais (CV, rede, níveis)  
3. **Sprints finais:** Big Bets financeiros (comissões e saques)  
4. Qualquer item fora desta matriz ou fora do sprint acordado caracteriza **mudança de escopo**

---

## Nota Contratual Sugerida

> Esta matriz é parte integrante do escopo do projeto.  
> Funcionalidades não previstas ou alteradas após aceite formal implicam reavaliação de prazo, custo e cronograma.
