# 📊 Status de Implementação — Biohelp LRP
**Data:** 28/04/2026 (PIVÔ V2 declarado)
**Sprint Atual:** ⏸️ Sprints v1 (1-7) CONGELADOS | 🚧 Pivô V2 em planejamento
**Status Geral:** ✅ V1 entregue (37/38 FRs) | ⚠️ V1 sendo descontinuado | 📋 18 TBDs aguardando cliente

---

## ⚠️ PIVÔ V2 — 28/04/2026 (em planejamento)

**Cliente realinhou o modelo de negócio.** O modelo MLM CV-based (Sprints 1-7, 98% FRs) está sendo descontinuado. Novo modelo: afiliação 1-nível, comissão 50% por assinatura de convidado, promoção a Founder ao atingir 5 ativos no clube, créditos Shopify pré-Founder, saque cash apenas Founder com CNPJ+NF.

📄 **Documento canônico do pivot:** [docs/sdd/PIVOT-V2.md](sdd/PIVOT-V2.md)
📄 **Workflow operacional pós-pivot:** [docs/sdd/PLAYBOOK.md](sdd/PLAYBOOK.md)
📥 **Insumos do cliente:** `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários do cliente), `documentos_escopo/Fluxograma.jpg.jpeg` (fluxograma novo, 28/04), `Fluxo.txt` (regras condensadas).

### Resumo do que muda
- ❌ **REMOVIDO:** CV, níveis (Parceira/Líder/Diretora/Head), Fast-Track, Bônus 1/2/3, Leadership Bônus, Royalty, RPA/CPF, reset mensal de CV, compressão após 6 meses inativo, ledger CV-based.
- 🔄 **ALTERADO:** cadastro exige ref obrigatório (link OU código manual); status ativo = assinatura paga (não CV); membro vê só sponsor + indicados diretos; pagamento = NF de serviço + Asaas (apenas Founder).
- ➕ **NOVO:** integração Guru, comissão 50% direta, saldo + créditos Shopify, Founder@5, ranking de Founders, área de conteúdo, link WhatsApp por Founder.
- ⏸️ **PAUSADOS:** crons `close-monthly-cv` e `network-compression` (desligar via env quando flag v2 ON).

### Backlog v2 — 12 features (detalhe em PIVOT-V2.md §2)
| Onda | Features | Status |
|---|---|---|
| 0 (docs) | PIVOT-V2.md, PLAYBOOK.md, este update | ✅ Concluído (28/04/2026) |
| 1 (TBDs) | 18 TBDs com cliente | ⏳ Aguardando |
| 2 (foundation) | F-V01, F-V02, F-V03 | ⏸️ Bloqueado por TBDs |
| 3 (commissão) | F-V04, F-V05, F-V07 | ⏸️ Bloqueado |
| 4 (Founder) | F-V06, F-V08, F-V11 | ⏸️ Bloqueado |
| 5 (conteúdo) | F-V09, F-V10 | ⏸️ Bloqueado |
| 6 (cleanup) | F-V12 (remover v1 morto) | depende |

### Bloqueios atuais
- **12 TBDs** aguardando decisão do cliente (`PIVOT-V2.md` §4.1). 11/18 respondidos em 29/04/2026; 4 novos derivados (TBD-19/20/21/22) gerados pelas respostas.
- F-V04, F-V07 (parte cálculo), F-V08, F-V09, F-V10, F-V13 ainda bloqueadas.
- F-V01, F-V02, F-V03, F-V05 ✅ **destravadas em 29/04/2026** — prontas pra começar.
- Confirmação técnica pendente: **Wink** (abordagem Guru → Shopify), **fornecedor de pagamento** (Cashin? — TBD-19).
- ✅ Sprint 7 — House Account descontinuada (TBD-10); creatina mantida com escopo alterado (TBD-17 → F-V13).
- ✅ Sprint 5 — RPA/CPF descontinuado (TBD-18). UI escondida atrás do flag v2; remoção física em F-V12.

### Trabalho em andamento (sem bloqueio de TBD)
- ✅ **Frente 1** (feature flag `LRP_V2`) concluída em 28/04/2026 — `lib/utils/featureFlags.ts`, `LRP_V2` e `CRON_DISABLED_V2` em `.env.example` e `.env.local`.
- ✅ **Frente 3** (shells dos módulos novos) concluída em 28/04/2026 — `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/`.
- ✅ **F-V11** (visão restrita da rede) — implementação concluída em 29/04/2026 na branch `feat/F-V11-visao-restrita-rede`. Build/typecheck limpos. Validação manual pendente (dev server + flag `LRP_V2=true`). Detalhe em `docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md` (matriz preenchida).
- ✅ **Adequação documental V2** concluída em 29/04/2026 — banner DEPRECATED nos 5 docs v1 (`SPEC_Biohelp_LRP.md`, `ACCEPTANCE.md`, `DECISOES_TBD.md`, `WORKFLOW.md`, `PR_TEMPLATE.md`); comentário `@deprecated` em 6 arquivos de código v1 (`lib/cv/`, `lib/levels/`, `lib/commissions/{calculator,bonus3,royalty}.ts`, `lib/network/compression.ts`); entrada v5.0 no `docs/CHANGELOG.md`; insumos do cliente persistidos em `documentos_escopo/Fluxo.txt`; índice `docs/README.md` reorganizado priorizando v2.

### Próximo passo
1. **F-V01** (cadastro com ref obrigatório) — destravada em 29/04/2026. Porta de entrada do v2.
2. **F-V02** (integração Guru via webhook Shopify) — destravada. Confirmar abordagem técnica com Wink antes de mergear.
3. **F-V03** (status ativo = subscription_paid) — destravada, depende de F-V02.
4. **F-V05** (saldo + créditos 1:1) — destravada.
5. Cliente responder os **12 TBDs ainda abertos** (8 originais + 4 derivados). Sem isso F-V04, F-V07 (cálculo), F-V08, F-V09, F-V10, F-V13 ficam bloqueadas.
6. Confirmação do fornecedor de pagamento (TBD-19 — Cashin?).

### Status de cada feature v2 (atualizar conforme avanço)
| ID | Feature | Classe | Onda | Status |
|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório | C | 2 | ✅ Destravada (TBD-10 resolvido) — pronta pra iniciar |
| F-V02 | Integração Guru via webhook Shopify | D | 2 | ✅ Destravada (TBD-7 resolvido — Shopify-first) |
| F-V03 | Status ativo = subscription_paid | C | 2 | ✅ Destravada (depende F-V02) |
| F-V04 | Comissão 50% por assinatura | D | 3 | 🚫 Bloqueada (TBD-1, TBD-2) |
| F-V05 | Saldo + créditos Shopify 1:1 | C | 3 | ✅ Destravada (TBD-14 resolvido) |
| F-V06 | Promoção a Founder ≥5 ativos | B | 4 | 🟡 Parcial (TBD-12 hipótese padrão: definitivo) |
| F-V07 | Saque Founder via Cashin + NF | D | 3 | 🟡 Parcial — fluxo OK, valor depende F-V04. UI/upload pode iniciar |
| F-V08 | Ranking de Founders | B | 4 | 🚫 Bloqueada (TBD-11) |
| F-V09 | Área de conteúdo | B | 5 | 🚫 Bloqueada (TBD-15) |
| F-V10 | Link WhatsApp Founder | A | 5 | 🚫 Bloqueada (TBD-16) |
| F-V11 | Visão restrita da rede | B | 4 (antecipada) | ✅ Implementada 29/04/2026 — pendente validação manual em dev |
| F-V12 | Cleanup v1 (remover CV, níveis, RPA, etc.) | D | 6 | depende v2 estável |
| F-V13 | Cupom de creatina como campanha configurável | C | 5 | 🚫 Bloqueada (TBD-22) — substitui cron mensal automático |

---

> ℹ️ **Tudo abaixo desta seção é histórico do modelo v1 (Sprints 1-7).** Permanece como referência do que foi entregue, mas **NÃO é fonte de verdade pro v2**. Para regras vigentes, ler `PIVOT-V2.md`.

---

## 🎯 Resumo Executivo (v1 — histórico)

O projeto concluiu as **Fases 1-6**, com sistema completo de cadastro, rede, comissões, saques e administração. **Todos os sprints planejados foram concluídos!**

### Cobertura de FRs (Requisitos Funcionais)

| Categoria | Total FRs | Implementados | Parciais | Pendentes | % |
|-----------|-----------|---------------|----------|-----------|---|
| Identidade/Acesso | 3 | 3 | 0 | 0 | 100% |
| Cadastro/Indicação | 5 | 5 | 0 | 0 | 100% |
| Rede/Visualização | 4 | 4 | 0 | 0 | 100% |
| CV/Status | 5 | 4 | 1 | 0 | 90% |
| Níveis | 3 | 3 | 0 | 0 | 100% |
| Comissões | 7 | 7 | 0 | 0 | 100% |
| Saques | 6 | 5 | 1 | 0 | 92% |
| Admin | 5 | 5 | 0 | 0 | 100% |
| **TOTAL** | **38** | **36** | **2** | **0** | **97%** |

---

## 📋 Matriz de FRs por Sprint

### Legenda
- ✅ Implementado e testado
- ⚠️ Parcialmente implementado
- ⏳ Pendente/Planejado
- ❌ Bloqueado (aguardando TBD)

| FR | Descrição | Sprint | Status | Observação |
|----|-----------|--------|--------|------------|
| **FR-01** | Autenticação de membro | 1 | ✅ | Supabase Auth |
| **FR-02** | Autenticação de admin | 1 | ✅ | Supabase Auth + role |
| **FR-03** | Controle de permissões (RBAC) | 1 | ✅ | RLS implementado |
| **FR-04** | Cadastro de novo membro | 1 | ✅ | Sync Shopify |
| **FR-05** | Captura de link de indicação | 1 | ✅ | UTM + ref |
| **FR-06** | Regra para cadastro sem link | 1 | ✅ | TBD-001 ✅ House Account (implementado 11/02/2026) |
| **FR-07** | Geração de link único | 1 | ✅ | ref_code imutável |
| **FR-08** | Ativação de preço de membro | 1 | ✅ | Via tags Shopify |
| **FR-09** | Persistência da rede | 1 | ✅ | sponsor_id FK |
| **FR-10** | Visualização da rede (membro) | 3 | ✅ | NetworkTree |
| **FR-11** | Visualização da rede (admin) | 3 | ✅ | Admin endpoint |
| **FR-12** | Regra de saída após 6 meses | 6 | ✅ | Compressão de rede implementada |
| **FR-13** | Webhooks de pedidos | 2 | ✅ | paid/refund/cancel |
| **FR-14** | Cálculo de CV por pedido | 2 | ✅ | Via metafield (busca API REST — webhook não inclui metafields) |
| **FR-15** | Status Ativo/Inativo mensal | 2 | ✅ | >= 200 CV |
| **FR-16** | Reset mensal | 2 | ✅ | Cron job |
| **FR-17** | Separação de CV (próprio vs rede) | 7 | ✅ | Dashboard com CV próprio + rede |
| **FR-18** | Recalcular nível automaticamente | 3 | ✅ | calculator.ts |
| **FR-19** | Status 'Líder em Formação' | 3 | ✅ | Janela 90 dias |
| **FR-20** | Rebaixamento automático | 3 | ✅ | Implementado |
| **FR-21** | Ledger de comissões | 4 | ✅ | Auditável |
| **FR-22** | Fast-Track | 4 | ✅ | 30%/20% |
| **FR-23** | Comissão Perpétua | 4 | ✅ | Diferenciada por tipo N1 |
| **FR-24** | Bônus 3 | 4 | ✅ | R$250/1500/8000 |
| **FR-25** | Leadership Bônus | 4 | ✅ | 3%/4% |
| **FR-26** | Royalty | 4 | ✅ | 3% nova rede |
| **FR-27** | Detalhamento por tipo de comissão | 4 | ✅ | Dashboard |
| **FR-28** | Saldo em análise (trava) | 5 | ✅ | Net-15 (15 dias após virada do mês) |
| **FR-29** | Solicitação de saque | 5 | ✅ | Mínimo R$100/saque |
| **FR-30** | Upload e validação de NF-e | 5 | ✅ | Implementado |
| **FR-31** | Emissão de RPA (CPF) | 5 | ✅ | Limite R$1.000/mês |
| **FR-32** | Workflow de aprovação | 5 | ✅ | Implementado |
| **FR-33** | Integração de pagamento | 5 | ⚠️ | Asaas definido, aguarda credenciais |
| **FR-34** | Gestão de admins | 6 | ⚠️ | CRUD básico (sem multi-admin) |
| **FR-35** | Dashboard global | 6 | ✅ | KPIs completos via API |
| **FR-36** | Filtros por modo de comissionamento | 6 | ✅ | API com filtros por tipo |
| **FR-37** | Gestão de membro | 6 | ✅ | Editar, ajustar, bloquear |
| **FR-38** | Gestão de tags | 6 | ✅ | CRUD + sync Shopify |

---

## ✅ SPRINT 1 — CONCLUÍDO (100%)

### Resumo do Sprint 1
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema Supabase** | ✅ Completo | FR-09 |
| **RLS (Row Level Security)** | ✅ Ativo | FR-03 |
| **API Backend** | ✅ Completo | FR-04, FR-05, FR-07 |
| **Integração Shopify** | ✅ Completo | FR-04, FR-08 |
| **Frontend** | ✅ Completo | FR-01, FR-02 |
| **Autenticação** | ✅ Completo | FR-01, FR-02, FR-03 |

**FRs implementados:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09  
**FRs pendentes:** Nenhum

---

## ✅ SPRINT 2 — CONCLUÍDO (100%)

### Resumo do Sprint 2
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (orders/cv)** | ✅ Completo | FR-14 |
| **Webhooks Shopify** | ✅ Completo | FR-13 |
| **Cálculo de CV** | ✅ Completo | FR-14 |
| **Job Mensal** | ✅ Completo | FR-16 |
| **Status Ativo/Inativo** | ✅ Completo | FR-15 |
| **Frontend CV** | ✅ Completo | FR-17 (parcial) |

**FRs implementados:** FR-13, FR-14, FR-15, FR-16  
**FRs parciais:** FR-17 (CV próprio vs rede não separado no dashboard)

---

## ✅ SPRINT 3 — CONCLUÍDO (100%)

### Resumo do Sprint 3
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (levels/phone)** | ✅ Completo | FR-18 |
| **Funções RPC** | ✅ Completo | FR-10, FR-11 |
| **API Endpoints** | ✅ Completo | FR-10, FR-11 |
| **Lógica de Níveis** | ✅ Completo | FR-18, FR-19, FR-20 |
| **Frontend Rede** | ✅ Completo | FR-10 |
| **Privacidade** | ✅ Completo | - |

**FRs implementados:** FR-10, FR-11, FR-18, FR-19, FR-20  
**FRs pendentes:** FR-12 (6 meses inativo - Sprint 6)

---

## ✅ SPRINT 4 — CONCLUÍDO (100%)

### Resumo do Sprint 4
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (commission_ledger, etc.)** | ✅ Completo | FR-21 |
| **Funções RPC** | ✅ Completo | FR-22, FR-23 |
| **API Endpoints** | ✅ Completo | FR-27 |
| **Bibliotecas de Cálculo** | ✅ Completo | FR-22, FR-23, FR-24, FR-25, FR-26 |
| **Frontend Comissões** | ✅ Completo | FR-27 |

**FRs implementados:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

### Regras de Comissionamento Implementadas

#### Fast-Track (60 dias) ✅
- N0 recebe 30% CV de N1 (primeiros 30 dias)
- N0 recebe 20% CV de N1 (dias 31-60)
- Líder N0 recebe 20%/10% CV de N2

#### Comissão Perpétua ✅ (Corrigido 10/01/2026)

| Nível Sponsor | Tipo de N1 | Percentual |
|---------------|------------|------------|
| Parceira | Cliente | 5% |
| Parceira | Parceira+ | **0%** (NÃO recebe) |
| Líder | Cliente | 5% |
| Líder | Parceira+ | 7% |
| Diretora | Cliente | 5% |
| Diretora | Parceira | 7% |
| Diretora | Líder+ | 10% |
| Head | Cliente | 5% |
| Head | Parceira | 7% |
| Head | Líder | 10% |
| Head | Rede (fallback) | 15% |

#### Bônus 3 ✅
- 3 Parceiras Ativas em N1 por 1 mês → R$250
- Cada N1 com 3 Parceiras Ativas → R$1.500
- Cada N2 com 3 Parceiras Ativas → R$8.000

#### Leadership Bônus ✅
- Diretora: 3% CV da rede
- Head: 4% CV da rede

#### Royalty ✅
- Head forma Head → recebe 3% CV da nova rede
- Separação não faz N0 perder status de Head

---

## ✅ SPRINT 5 — CONCLUÍDO (Saques + Fiscal)

### Resumo do Sprint 5
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (payout_requests, etc.)** | ✅ Completo | FR-29 |
| **RLS Policies** | ✅ Completo | FR-29 |
| **API Membro** | ✅ Completo | FR-29, FR-30 |
| **API Admin** | ✅ Completo | FR-32 |
| **Frontend Membro** | ✅ Completo | FR-29 |
| **Frontend Admin** | ✅ Completo | FR-32 |
| **Integração Fintech** | ⚠️ Definido | FR-33 (Asaas - aguarda credenciais) |

### TBDs Resolvidos (Sprint 5)
| TBD | Tema | Status | Decisão Final |
|-----|------|--------|---------------|
| TBD-015 | Limite de saque PF | ✅ Resolvido | **R$ 1.000/mês** |
| TBD-016 | Valor mínimo para saque | ✅ Resolvido | **R$ 100/saque** |
| TBD-018 | Integração fintech | ✅ Resolvido | **Asaas (PIX/TED)** |
| TBD-021 | Período de trava para saque | ✅ Resolvido | **Net-15** (15 dias após virada do mês) |

### Regra Net-15 (Disponibilidade de Comissões)
- Comissões de um mês ficam disponíveis no dia 15 do mês seguinte
- Exemplo: Comissões de dezembro disponíveis em 15 de janeiro
- **Condições que cancelam comissão:**
  - ❌ Chargeback
  - ❌ Cancelamento do pedido
  - ❌ Devolução/Refund

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-28 | Saldo em análise (trava) | ✅ | Net-15 implementado |
| FR-29 | Solicitação de saque | ✅ | Mínimo R$100 |
| FR-30 | Upload e validação de NF-e | ✅ | API pronta |
| FR-31 | Emissão de RPA (CPF) | ✅ | Limite R$1.000/mês |
| FR-32 | Workflow de aprovação | ✅ | Completo |
| FR-33 | Integração de pagamento | ⚠️ | Asaas definido, aguarda credenciais |

### Entregáveis Concluídos
- [x] Tabela `payout_requests`
- [x] Tabela `payout_documents`
- [x] Tabela `payout_history`
- [x] Tabela `payout_monthly_limits`
- [x] RLS policies para todas as tabelas
- [x] Funções RPC (create_payout_request, update_payout_status, etc.)
- [x] API de solicitação de saque (POST /api/members/me/payouts)
- [x] API de listagem de saques (GET /api/members/me/payouts)
- [x] API de upload de NF-e (POST /api/members/me/payouts/[id]/documents)
- [x] API admin de gestão (GET/PATCH /api/admin/payouts)
- [x] Frontend de solicitação de saque (/dashboard/payouts)
- [x] Frontend admin de aprovação (/admin/payouts)
- [x] Integração Asaas definida (aguarda credenciais para ativação)

---

## ✅ SPRINT 6 — CONCLUÍDO (Admin Avançado)

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-12 | Regra de saída após 6 meses | ✅ | Compressão de rede automática |
| FR-34 | Gestão de admins | ⚠️ | CRUD básico (sem multi-admin) |
| FR-35 | Dashboard global | ✅ | API `/api/admin/stats` com KPIs |
| FR-36 | Filtros por modo de comissionamento | ✅ | Filtro por tipo na API |
| FR-37 | Gestão de membro | ✅ | Editar, ajustar nível, bloquear |
| FR-38 | Gestão de tags | ✅ | CRUD + sync Shopify |

### Entregáveis Concluídos
- [x] Job de verificação de 6 meses inativo (`/api/cron/network-compression`)
- [x] Lógica de compressão de rede (`lib/network/compression.ts`)
- [x] Função RPC `compress_inactive_member()`
- [x] API de estatísticas globais (`/api/admin/stats`)
- [x] Função RPC `get_global_stats()` e `get_members_by_level()`
- [x] API de gestão de membro (`/api/admin/members/[id]`)
- [x] Ações: editar dados, ajustar nível, bloquear/desbloquear, ajustar comissão
- [x] API de gestão de tags (`/api/admin/members/[id]/tags`)
- [x] Sync de tags com Shopify Customer
- [x] Índices otimizados para KPIs
- [x] Cron job configurado no `vercel.json`

### Regra de 6 Meses Inativo (FR-12)
- Membros com 6+ meses consecutivos sem atingir 200 CV são removidos
- Indicados do membro removido são movidos para o sponsor dele (compressão)
- Status do membro muda para `removed`
- Histórico registrado em `member_level_history`
- Cron executa no dia 1 de cada mês às 04:00 UTC (após fechamento de CV)

---

## ✅ SPRINT 7 — CONCLUÍDO (Creatina + Decisões Fev/2026)

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-06 | Cadastro sem link (House Account) | ✅ | TBD-001 implementado 11/02/2026 |
| FR-17 | Separação CV próprio vs rede | ✅ | Dashboard com CV separado |
| TBD-019 | Creatina mensal grátis (cupom) | ✅ | Cupom individual mensal via Shopify API |

### Funcionalidades Implementadas
- [x] Dashboard do membro com CV próprio + CV da rede separados
- [x] Função RPC `get_network_cv()` para cálculo recursivo
- [x] Dashboard admin com KPIs visuais completos
- [x] Interface de gestão de membro (ajustar nível, bloquear, ajustar comissão)
- [x] Cards de estatísticas globais no admin
- [x] **TBD-001 — House Account:**
  - Conta raiz `Biohelp House` criada via migration (ID fixo)
  - Cadastro sem link atribui sponsor = House Account
  - Ref code inválido → House Account (ao invés de bloquear)
- [x] **TBD-003 — Tag de nível:**
  - Tag `nivel:<nivel>` adicionada em `generateMemberTags()`
  - Sync Shopify passa nível e status
- [x] **TBD-006 — ref_code sequencial:**
  - Formato `BH00001` via sequência + RPC `generate_sequential_ref_code()`
  - Membros existentes mantêm código antigo
- [x] **TBD-014 — CV sem fallback:**
  - Metafield `custom.cv` ausente → CV = 0 (sem fallback para preço)
  - Log `missing_cv_metafield` emitido
  - **Fix v4.1:** Webhook não inclui metafields → adicionada busca via REST API (`fetchProductCVsBatch`)
- [x] **TBD-019 — Cupom Individual Mensal Creatina:**
  - Helper `lib/shopify/coupon.ts` para criar Price Rule + Discount Code
  - API GET gera cupom automaticamente se elegível
  - Formato: `CREATINA-<NOME>-<HASH>-<MÊSANO>` (hash aleatório para segurança)
  - Colunas `coupon_code` e `coupon_shopify_id` em `free_creatine_claims`
  - **Segurança reforçada (18/02/2026):** Ver seção abaixo

### Entregas adicionais (11/02/2026 — sessão 2)
| Item | Descrição | Status |
|------|-----------|--------|
| Endpoint admin ref_code | Admin customizar ref_code (ex: MARIA2026) | ✅ Concluído |
| Cron mensal cupons | Gerar cupons batch para ativos no dia 2/mês | ✅ Concluído |
| Frontend cupom | Dashboard exibir código do cupom + copiar | ✅ Concluído |
| UNIQUE constraint | `free_creatine_claims(member_id, month_year)` | ✅ Concluído |
| Webhook creatina | Detectar uso de cupom `CREATINA-*` no pedido | ✅ Concluído |
| Sync level/status | Join + webhook passam `level` e `status` | ✅ Concluído |

### Segurança Anti-Fraude do Cupom (18/02/2026)
| Item | Descrição | Status |
|------|-----------|--------|
| Hash aleatório | Código `CREATINA-NOME-X7K9-MES` não adivinhável | ✅ Concluído |
| Customer restriction | Cupom restrito ao shopify_customer_id do membro | ✅ Concluído |
| Limite 1 uso global | usage_limit: 1 + once_per_customer: true | ✅ Concluído |
| UNIQUE coupon_code | Índice único impede duplicação | ✅ Concluído |
| Validação webhook | Detecta fraude se outra pessoa usar | ✅ Concluído |
| fraud_details JSON | Registra detalhes de tentativas de fraude | ✅ Concluído |
| View auditoria | `v_creatine_fraud_attempts` para admin | ✅ Concluído |

### Pendências externas (Sprint 7)
| Item | Descrição | Status |
|------|-----------|--------|
| FR-33 (Asaas) | Integração fintech automática | Aguarda credenciais |

---

## 📈 Progresso por Sprint

```
Sprint 1 (MVP)           [████████████████████] 100% ✅
Sprint 2 (CV + Status)   [████████████████████] 100% ✅
Sprint 3 (Rede + Níveis) [████████████████████] 100% ✅
Sprint 4 (Comissões)     [████████████████████] 100% ✅
Sprint 5 (Saques)        [████████████████████]  92% ✅
Sprint 6 (Admin)         [████████████████████] 100% ✅
Sprint 7 (Decisões)      [████████████████████] 100% ✅

Progresso Geral: 98% (37/38 FRs implementados + 6 TBDs resolvidos + 3 fixes)
Pendente externo: FR-33 Asaas (aguarda credenciais)
```

---

## 🔒 Segurança e RLS

### Policies Implementadas

| Tabela | Policy | Status |
|--------|--------|--------|
| `members` | Member lê próprio, Admin lê todos | ✅ |
| `shopify_customers` | Member lê próprio, Admin lê todos | ✅ |
| `roles` | Apenas admin | ✅ |
| `orders` | Member lê próprios, Admin lê todos | ✅ |
| `order_items` | Via orders | ✅ |
| `cv_ledger` | Member lê próprio, Admin lê todos | ✅ |
| `cv_monthly_summary` | Member lê próprio, Admin lê todos | ✅ |
| `commission_ledger` | Member lê próprio, Admin lê todos | ✅ |
| `commission_balances` | Member lê próprio, Admin lê todos | ✅ |

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Shopify
SHOPIFY_STORE_DOMAIN=...
SHOPIFY_ADMIN_API_TOKEN=...
SHOPIFY_WEBHOOK_SECRET=...

# Cron
CRON_SECRET=...
```

### Webhooks no Shopify Admin
1. `Order payment` → `/api/webhooks/shopify/orders/paid`
2. `Order refund` → `/api/webhooks/shopify/orders/refunded`
3. `Order cancellation` → `/api/webhooks/shopify/orders/cancelled`

### Cron Job (Vercel)
```json
{
  "crons": [{
    "path": "/api/cron/close-monthly-cv",
    "schedule": "0 3 1 * *"
  }]
}
```

---

## 📂 Arquivos por Sprint

### Sprint 1
- `supabase/migrations/20260107_sprint1_*.sql`
- `app/api/members/join/route.ts`
- `app/api/auth/*/route.ts`
- `app/dashboard/page.tsx`
- `app/admin/page.tsx`
- `lib/shopify/customer.ts`

### Sprint 2
- `supabase/migrations/20260107_sprint2_*.sql`
- `app/api/webhooks/shopify/orders/*/route.ts`
- `app/api/members/me/cv/route.ts`
- `app/api/cron/close-monthly-cv/route.ts`
- `lib/cv/calculator.ts`
- `lib/shopify/webhook.ts`

### Sprint 3
- `supabase/migrations/20260110_sprint3_*.sql`
- `app/api/members/me/network/route.ts`
- `app/api/members/me/level/route.ts`
- `app/components/NetworkTree.tsx`
- `app/components/LevelCard.tsx`
- `app/dashboard/network/page.tsx`
- `lib/levels/calculator.ts`

### Sprint 4
- `supabase/migrations/20260110_sprint4_*.sql`
- `app/api/members/me/commissions/route.ts`
- `app/api/admin/commissions/route.ts`
- `app/dashboard/commissions/page.tsx`
- `app/admin/commissions/page.tsx`
- `lib/commissions/calculator.ts`
- `lib/commissions/bonus3.ts`
- `lib/commissions/royalty.ts`

### Sprint 5
- `supabase/migrations/20260115_sprint5_*.sql`
- `app/api/members/me/payouts/route.ts`
- `app/api/members/me/payouts/[id]/documents/route.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/payouts/[id]/route.ts`
- `app/dashboard/payouts/page.tsx`
- `app/dashboard/payouts/page.module.css`
- `app/admin/payouts/page.tsx`

---

## 📝 TBDs Resolvidos

| TBD | Tema | Decisão | Data |
|-----|------|---------|------|
| TBD-008 | Cálculo de CV | Via metafield do produto | 07/01/2026 |
| TBD-009 | Refund/cancel | Reverter CV completamente | 07/01/2026 |
| TBD-010 | Job mensal | 1º dia às 03:00 UTC | 07/01/2026 |
| TBD-011 | Regras de nível | Conforme documento canônico | 09/01/2026 |
| TBD-012 | Profundidade da rede | Ilimitada (limite técnico 20) | 09/01/2026 |
| TBD-013 | Informações visíveis | Nome, email, CV, status, nível | 09/01/2026 |
| TBD-017 | Arredondamento | 2 casas decimais | 09/01/2026 |
| TBD-020 | Período de cálculo | Em tempo real | 09/01/2026 |
| TBD-022 | Perpétua diferenciada | Por tipo de N1 | 10/01/2026 |

---

## 📝 TBDs Pendentes

| TBD | Tema | Sprint | Impacto |
|-----|------|--------|---------|
| TBD-004 | URLs oficiais | 1 | Redirects |

## 📝 TBDs Resolvidos (reunião 11/02/2026)

| TBD | Tema | Decisão | Data |
|-----|------|---------|------|
| TBD-001 | Cadastro sem link | ✅ House Account | 11/02/2026 |
| TBD-002 | Preço de membro Shopify | ✅ Cliente configura na loja | 11/02/2026 |
| TBD-003 | Tags/metacampos finais | ✅ Tags atuais + tag `nivel:` | 11/02/2026 |
| TBD-005 | Resync Shopify | ✅ Somente atualizar se divergente | 11/02/2026 |
| TBD-006 | Formato ref_code | ✅ Sequencial `BH00001` + customização admin | 11/02/2026 |
| TBD-007 | Landing page | ✅ Redirect para /login (sem mudança) | 11/02/2026 |
| TBD-014 | Metafield CV | ✅ `custom.cv`, CV=0 se ausente | 11/02/2026 |
| TBD-019 | Creatina grátis | ✅ Cupom Individual Mensal (atualizado) | 11/02/2026 |

---

## 🧪 Testes Realizados

### Sprint 4 (10/01/2026)
| Categoria | Total | Passou | Falhou |
|-----------|-------|--------|--------|
| Schema/Estrutura | 9 | 9 | 0 |
| RPC Functions | 14 | 14 | 0 |
| RLS Policies | 2 | 2 | 0 |
| Integridade | 1 | 1 | 0 |
| Índices | 6 | 6 | 0 |
| Dashboard Membro | 7 | 7 | 0 |
| Painel Admin | 5 | 5 | 0 |
| **TOTAL** | **44** | **44** | **0** |

**Taxa de sucesso: 100%** ✅

---

**Última atualização:** 11/02/2026  
**Status:** Sprint 7 CONCLUÍDO | 6 TBDs resolvidos + implementados (reunião 11/02/2026) + 3 fixes (sessão 2)  
**Cobertura de FRs:** 98% (37/38 implementados) | TBDs pendentes: 1 (TBD-004)  
**Pendências externas:** FR-33 Asaas (aguarda credenciais), TBD-004 URLs oficiais
