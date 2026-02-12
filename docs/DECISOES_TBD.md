# DECISÕES TBD — Biohelp LRP
**Objetivo:** registrar decisões obrigatórias (pendentes) que afetam regra de negócio, escopo, banco e integração.  
**Regra:** nada marcado como **TBD** deve ser implementado sem aprovação formal do cliente (assinatura/ok por escrito).  
**Última atualização:** 11/02/2026

---

## Como usar este documento
1. Cada item TBD deve ter: **opções**, **decisão escolhida**, **responsável**, **data**, **evidência** (print, e-mail, ata).
2. Ao decidir, mova para **"Decididos"** e atualize:
   - `docs/CHANGELOG.md` (nova versão)
   - `docs/SPEC.md` (se a decisão mudar regras, campos, endpoints)

---

## Resumo de TBDs

### Por Status
| Status | Quantidade |
|--------|------------|
| ⏳ Pendente | 1 |
| ✅ Resolvido | 21 |
| **Total** | **22** |

### Por Sprint
| Sprint | Pendentes | Resolvidos |
|--------|-----------|------------|
| Sprint 1 | 1 | 6 |
| Sprint 2 | 0 | 4 |
| Sprint 3 | 0 | 4 |
| Sprint 4 | 0 | 2 |
| Sprint 5 | 0 | 4 |
| Sprint 7 | 0 | 1 |

---

## TBD — Pendentes (Sprint 1)

### TBD-004 — Domínios e URLs oficiais (staging/prod)
**Por que importa:** redirects e webhooks dependem disso.

- URL da loja Shopify (prod): ________
- URL da loja Shopify (staging/test): ________
- URL do app (staging): ________
- URL do app (prod): ________

**Responsável:** ________  
**Data:** ________

---

## Decididos (histórico)

### TBD-002 — Como o **preço de membro** é liberado na Shopify ✅
**Decisão:** ✅ **Configuração feita pelo próprio cliente dentro da loja Shopify**  
O cliente informou que a configuração de preço de membro (regras de preço, segmentação, scripts) será gerenciada diretamente por eles no Shopify Admin. O sistema LRP apenas garante que o Customer tenha as tags corretas (`lrp_member`, `nivel:<nivel>`, etc.) para que a loja aplique as regras de preço.  
**FR relacionado:** FR-08  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Comunicação direta com o cliente

---

### TBD-005 — "Resync Shopify" (o que exatamente reaplicar?) ✅
**Decisão:** ✅ **Somente atualizar se divergente**  
O resync compara os dados do Supabase com o estado no Shopify e só atualiza se houver divergência (tags diferentes, customer inexistente, etc.).  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Comunicação direta com o cliente

---

### TBD-001 — Regra de cadastro **sem link** (sem `ref`) ✅
**Decisão:** ✅ **Opção A — House Account**  
**Regra:** Cadastro sem link → sponsor = conta da empresa (House Account) → comissão vai para a Biohelp.  
**FR desbloqueado:** FR-06  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (TBD-01)  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Implementação necessária:**
- Criar membro "House Account" no sistema (conta raiz da empresa)
- Alterar fluxo de cadastro: se `ref` ausente ou inválido → `sponsor_id = house_account.id`
- Comissões de membros sem link vão para a House Account (empresa)
- Remover bloqueio atual "cadastro indisponível sem convite"

---

### TBD-003 — Lista final de **tags** e **metacampos** ✅
**Decisão:** ✅ Manter tags atuais + adicionar nova tag obrigatória de nível  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (premissa 4.3)  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Tags finais (lista fechada):**
- `lrp_member` — identifica como membro do programa
- `lrp_ref:<ref_code>` — código de referência do membro
- `lrp_sponsor:<sponsor_ref_code|none>` — código de quem indicou
- `lrp_status:pending|active|inactive` — status atual
- `nivel:<nivel>` — **NOVA** — nível do membro (parceiro/diretor/head/etc.)

**Exemplos de tag de nível:**
- `nivel:membro`
- `nivel:parceiro`
- `nivel:lider`
- `nivel:diretor`
- `nivel:head`

**Impacto:**
- Regras de comissão podem referenciar tag de nível
- Hierarquia visível na Shopify
- Relatórios podem filtrar por nível via tags
- Sync Shopify deve aplicar/atualizar tag de nível quando nível muda

**Metacampos:** Mantidos como opcionais (podem ser adicionados conforme necessidade)

---

### TBD-006 — Formato do `ref_code` (geração) ✅
**Decisão:** ✅ **Padrão sequencial + customização pelo admin**  
**Origem:** SPEC 3.2 diz que é único e imutável, mas não definia formato.  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Formato padrão:** Código alfanumérico sequencial  
- Prefixo: `BH` + número sequencial de 5 dígitos
- Exemplo: `BH00001`, `BH00002`, `BH00003`

**Override pelo admin:**
- Admin pode customizar manualmente o ref_code de qualquer membro
- Exemplo customizado: `MARIA2026`, `JOANA2025`
- Validação de unicidade obrigatória (rejeita duplicatas)
- Após customização, o código permanece imutável

**Implementação necessária:**
- Alterar geração de `ref_code` para formato sequencial (`BH00001`)
- Criar sequência no banco (`ref_code_seq`)
- Adicionar endpoint admin para customizar `ref_code`
- Validar unicidade antes de salvar
- Membros existentes: manter códigos atuais (UUID) ou migrar (a definir)

---

### TBD-007 — Comportamento da landing page (`/`) ✅
**Decisão:** ✅ **Opção B — Redirect direto para `/login`** (manter como está)  
**Origem:** SPEC 6.1  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Comportamento:**
- `GET /` → redirect 302 para `/login`
- Foco em membros existentes
- Novos cadastros acessam via link de convite (`/join?ref=...`)

**Implementação:** ✅ Já implementado (sem alterações necessárias)

---

### TBD-014 — Nome exato do metafield CV no Shopify ✅
**Decisão:** ✅ Manter leitura via metafield `custom.cv` | ❌ Remover fallback para preço | ✅ Se não encontrar CV → usar ZERO  
**Origem:** Documento canônico  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (TBD-05)  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Regra final:**
- Ler metafield `custom.cv` do produto
- Se metafield não existir → **CV = 0** (zero)
- ❌ **Removido:** fallback para preço do item
- Logar warning `missing_cv_metafield` quando CV for zero por ausência de metafield

**Motivo:** Evita distorção de comissão. Se o produto não tem CV configurado, não deve gerar comissão.

**Implementação necessária:**
- Alterar `lib/cv/calculator.ts` — remover fallback para preço
- Se `custom.cv` não existir: `cv_value = 0`
- Manter log warning para produtos sem metafield configurado

---

### TBD-008 — Regra de cálculo de CV por produto ✅
**Decisão:** CV do pedido = soma do CV dos itens (metacampo por produto).  
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` — "Cada produto da Biohelp vai gerar um CV diferente, exemplo, o Lemon Dreams que venderemos a R$159,00, será gerado um CV de 77."  
**Data:** 07/01/2026 (atualizado 09/01/2026)  
**Implementação:** 
- Ler metafield/metacampo do produto (ex.: `custom.cv` ou `lrp.cv`)
- `lib/cv/calculator.ts` - Função `calculateCVForItem()` prioriza metafield
**Fallback (ATUALIZADO 11/02/2026):** ~~Se não houver metacampo, usar preço do item como fallback~~ → **CV = 0** se metafield não existir. Logar warning `missing_cv_metafield`.  
**Observação:** CV ≠ preço do produto. Ex: Lemon Dreams (R$159) → CV 77

---

### TBD-009 — Comportamento de refund/cancel ✅
**Decisão:** Reverter CV completamente  
**Data:** 07/01/2026  
**Implementação:** Webhooks de refund e cancel criam entradas negativas no cv_ledger  
**Observação:** CV é revertido integralmente, recalculando o CV mensal

---

### TBD-010 — Job de fechamento mensal ✅
**Decisão:**
- Executar: 1º dia do mês às 03:00 UTC (00:00 BRT)
- Timezone: America/Sao_Paulo
- Pedidos do último dia: Considerados até 23:59:59 do mês anterior

**Data:** 07/01/2026  
**Implementação:** `app/api/cron/close-monthly-cv/route.ts` + `vercel.json`

---

### TBD-011 — Regras de progressão de nível ✅
**Por que importa:** define como membros sobem de Parceira → Líder → Diretora → Head.  
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`

**Critérios definidos (canônico):**
| Nível | Requisito |
|-------|-----------|
| Membro | Cliente cadastrada |
| Parceira | Membro Ativo + CV_rede >= 500 (inclui próprio membro) |
| Líder em Formação | Parceira + primeira Parceira em N1 (janela 90 dias) |
| Líder | Parceira Ativa (N0) + 4 Parceiras Ativas em N1 |
| Diretora | 3 Líderes Ativas em N1 + 80.000 CV na rede |
| Head | 3 Diretoras Ativas em N1 + 200.000 CV na rede |

**Regras de perda de nível:**
- Se requisitos deixam de ser atendidos, a Parceira desce de cargo
- Líder perde status se não mantiver 4 Parceiras ativas em N1
- Após 6 meses sem se ativar, perde totalmente o status e sai da rede

**Data:** 09/01/2026  
**Evidência:** Documento canônico de regras de negócio

---

### TBD-012 — Profundidade da rede visível ✅
**Por que importa:** define o que o membro pode ver de sua rede.  
**Origem:** SPEC 1.3 diz "visualização da rede (simples)" — não define profundidade.

**Decisão escolhida:** ✅ D — Toda a rede abaixo (ilimitado)  
**Observação:** Implementar com lazy loading e paginação para evitar lag em redes grandes. Limite técnico de 20 níveis.  
**Responsável:** Cliente  
**Data:** 09/01/2026  
**Evidência:** Aprovação via chat

---

### TBD-013 — Informações visíveis dos indicados ✅
**Por que importa:** define privacidade e o que o membro vê sobre sua rede.

**Campos visíveis para TODOS os níveis da rede:**
- ✅ Nome completo
- ✅ Email
- ✅ CV do indicado
- ✅ Status (ativo/inativo)
- ✅ Nível do indicado
- ✅ Quantidade de indicados (do indicado)

**Campos com visibilidade RESTRITA:**
- 📱 Telefone: Visível apenas para:
  - Superior direto (sponsor)
  - Indicados diretos (N1)
  - OU se o membro habilitar nas configurações de privacidade

**Campos NÃO visíveis:**
- ❌ Data de cadastro (opcional, pode adicionar depois)

**Responsável:** Cliente  
**Data:** 09/01/2026  
**Evidência:** Aprovação via chat

---

### TBD-017 — Arredondamento de CV e moeda ✅
**Por que importa:** Define precisão dos cálculos de CV e comissões.

**Decisão escolhida:** ✅ A — 2 casas decimais (padrão BRL)  
**Responsável:** Cliente  
**Data:** 09/01/2026  
**Implementação:** Todos os valores monetários e de comissão usam DECIMAL(10,2)

---

### TBD-020 — Período de cálculo de comissões ✅
**Por que importa:** Define quando as comissões são calculadas e disponibilizadas.

**Decisão escolhida:** ✅ A — Em tempo real  
**Motivo:** Mais simples e dá visibilidade imediata ao membro  
**Responsável:** Cliente  
**Data:** 09/01/2026  
**Implementação:** Webhook de `orders/paid` calcula e registra comissões imediatamente

---

### TBD-022 — Regras de Comissão Perpétua diferenciadas por tipo de N1 ✅
**Por que importa:** Define percentuais corretos de comissão perpétua conforme documento canônico.  
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` (linhas 163-173)

**Regras implementadas (canônico):**

| Nível do Sponsor (N0) | Tipo de N1 | Percentual |
|----------------------|------------|------------|
| Parceira | Cliente | 5% |
| Parceira | Parceira+ | **0%** (não recebe) |
| Líder / Líder em Formação | Cliente | 5% |
| Líder / Líder em Formação | Parceira+ | 7% |
| Diretora | Cliente | 5% |
| Diretora | Parceira | 7% |
| Diretora | Líder+ | 10% |
| Head | Cliente | 5% |
| Head | Parceira | 7% |
| Head | Líder | 10% |
| Head | Rede (fallback) | 15% |

**Data:** 10/01/2026  
**Implementação:**
- `lib/commissions/calculator.ts` — Função `getPerpetualPercentage(sponsorLevel, buyerLevel)`
- `supabase/migrations/20260110_fix_perpetual_commission.sql` — RPCs `get_buyer_type()`, `get_perpetual_percentage()`
- Função `calculate_order_commissions()` atualizada para usar regras diferenciadas

**Observação importante:** A implementação anterior simplificava incorretamente o cálculo usando apenas o nível do sponsor. A regra correta exige considerar TAMBÉM o nível do comprador (N1).

---

### TBD-015 — Limite de saque por CPF (PF) ✅
**Por que importa:** Define o limite mensal de saque para Pessoa Física.  
**FR relacionado:** FR-31  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (TBD-02)

**Decisão escolhida:** ✅ **R$ 1.000,00/mês**  
**Responsável:** Cliente  
**Data:** 19/01/2026  
**Evidência:** Aprovação via chat

**Implementação:**
- Constante `PF_MONTHLY_LIMIT = 1000` em `lib/payouts/constants.ts`
- Validação na função RPC `check_pf_monthly_limit()`
- Tabela `payout_monthly_limits` para controle

---

### TBD-016 — Valor mínimo para saque ✅
**Por que importa:** Define quando a parceira pode solicitar saque.  
**FR relacionado:** FR-29

**Decisão escolhida:** ✅ **R$ 100,00/saque**  
**Responsável:** Cliente  
**Data:** 19/01/2026  
**Evidência:** Aprovação via chat

**Implementação:**
- Constante `MIN_PAYOUT_AMOUNT = 100` em `lib/payouts/constants.ts`
- Validação na função RPC `create_payout_request()`

---

### TBD-018 — Integração fintech para saques ✅
**Por que importa:** Define como os pagamentos serão processados.  
**FR relacionado:** FR-33  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (TBD-04)

**Decisão escolhida:** ✅ **A) Asaas**  
**Responsável:** Cliente  
**Data:** 19/01/2026  
**Evidência:** Aprovação via chat

**Implementação pendente:**
- Criar conta Asaas e obter API keys
- Implementar `lib/payouts/asaas.ts` com integração
- Endpoints: criar cobrança, consultar status, webhook de confirmação
- Métodos suportados: PIX (prioritário), TED

**Observação:** Integração será implementada na próxima iteração após obtenção das credenciais Asaas.

---

### TBD-021 — Status da comissão (disponibilidade para saque) ✅
**Por que importa:** Define se a comissão fica disponível imediatamente ou tem período de "trava".  
**FR relacionado:** FR-28  
**Fonte:** `Biohelp_LRP_Escopo_Projeto_v1.md` (TBD-03)

**Decisão escolhida:** ✅ **Net-15 (disponível 15 dias após virada do mês)**  
**Responsável:** Cliente  
**Data:** 19/01/2026  
**Evidência:** Aprovação via chat

**Regra detalhada:**
- Comissões de um mês ficam disponíveis para saque no dia 15 do mês seguinte
- Exemplo: Comissões de dezembro ficam disponíveis em 15 de janeiro
- **Condições que cancelam/revertem comissão:**
  - ❌ Chargeback
  - ❌ Cancelamento do pedido
  - ❌ Devolução/Refund

**Implementação:**
- Campo `available_at` em `commission_ledger` calculado como `DATE_TRUNC('month', created_at) + INTERVAL '1 month' + INTERVAL '14 days'`
- Função RPC `get_available_balance()` considera apenas comissões onde `available_at <= NOW()`
- Webhooks de refund/cancel/chargeback criam entradas negativas no ledger

---

### TBD-019 — Creatina mensal grátis ✅ (Atualizado 11/02/2026)
**Por que importa:** Documento canônico diz "Todo Membro Ativo (200 CV) recebe creatina mensal grátis".  
**Origem:** Linha 153 do documento canônico.

**Decisão original (20/01/2026):** Desconto 100% no pedido real  
**Decisão atualizada (11/02/2026):** ✅ **Cupom Individual Mensal**  
**Responsável:** Cliente  
**Data:** 11/02/2026  
**Evidência:** Ata de reunião de alinhamento

**Regra detalhada:**
- Membro Ativo (CV >= 200 no mês) tem direito a **1 unidade de creatina grátis por mês**
- Sistema gera **código de cupom exclusivo** para cada membro ativo
- Cupom válido apenas naquele mês
- Se o membro não usar no mês, **não acumula** para o próximo

**Formato do cupom:**
- Padrão: `CREATINA-<NOME>-<MÊSANO>`
- Exemplo: `CREATINA-MARIA-FEV2026`

**Motivo da mudança:**
- ✔️ Mais simples de implementar
- ✔️ Mais barato (não exige Shopify Functions)
- ✔️ Não depende de validação manual
- ✔️ Cupom criado via Shopify Admin API (Discount Code)

**Implementação necessária:**
- Manter tabela `free_creatine_claims` para controlar uso mensal
- Gerar cupom via Shopify Admin API (Discount Code) — 100% OFF, 1 uso, validade mensal
- Job mensal (ou sob demanda) gera cupons para membros ativos
- API `GET /api/members/me/free-creatine` retorna código do cupom do mês
- Card no dashboard exibe cupom gerado para o membro usar na loja
- Webhook de pedido com cupom registra claim em `free_creatine_claims`

**Descartadas:**
- ❌ Shopify Functions (mais complexo, mais caro)
- ❌ Validação manual (mais trabalhoso para admin)

---

## Notas Técnicas Importantes

### NOTA-001 — Shopify REST API vs GraphQL (Limitação de Plano)

**⚠️ ATENÇÃO:** Esta nota documenta uma decisão técnica crítica para evitar confusões futuras.

**Problema identificado:**
- Planos Basic/Starter da Shopify **bloqueiam acesso a Customer PII** (dados pessoais) via **GraphQL API** para custom apps
- Isso inclui: criação, leitura, atualização de customers e suas tags

**Solução implementada:**
- Toda a sincronização de customers usa **REST API** em vez de GraphQL
- Implementação: `lib/shopify/customer.ts`

**O que funciona:**

| Funcionalidade | API | Status |
|----------------|-----|--------|
| Buscar customer por email | REST `/customers/search.json` | ✅ Funciona |
| Criar customer | REST `/customers.json` | ✅ Funciona |
| Atualizar customer/tags | REST `/customers/{id}.json` | ✅ Funciona |
| Ler informações da loja | GraphQL `shop {}` | ✅ Funciona |
| Ler/criar customers | GraphQL `customers {}` | ❌ Bloqueado |

**Scripts de teste:**

| Script | API Testada | Propósito |
|--------|-------------|-----------|
| `test-shopify-token.mjs` | GraphQL | Valida conexão (teste 3 falha por design) |
| `test-customer-set.mjs` | GraphQL | **Vai falhar** no plano Basic |
| `test-resync.mjs` | REST | Testa sync real de customers ✅ |
| `test-webhook-demo.mjs` | — | Simula webhook de pedido ✅ |

**Importante:**
- O teste de GraphQL (`test-shopify-token.mjs` teste 3) **sempre falhará** no plano Basic — isso é **esperado**
- A **implementação de produção** usa REST API e **funciona normalmente**
- Não confundir falha do teste GraphQL com falha da integração real

**Data:** 23/01/2026  
**Referência:** `lib/shopify/customer.ts` linhas 1-15

---

## Mapeamento TBDs do Escopo Formal

| TBD Escopo | TBD SDD | Tema | Status |
|------------|---------|------|--------|
| TBD-01 | TBD-001 | Cadastro sem link | ✅ House Account |
| TBD-02 | TBD-015 | Limite saque CPF | ✅ R$1.000/mês |
| TBD-03 | TBD-021 | Trava/saldo em análise | ✅ Net-15 |
| TBD-04 | TBD-018 | Fintech | ✅ Asaas |
| TBD-05 | TBD-014 | Metafield CV | ✅ custom.cv (CV=0 se ausente) |
| — | TBD-019 | Creatina grátis | ✅ Cupom Individual Mensal |

---

## Assinatura / Aprovação do Cliente
**Cliente:** ____________________  
**Aprovado por:** ____________________  
**Data:** ____/____/______  
**Observações:** ______________________________________
