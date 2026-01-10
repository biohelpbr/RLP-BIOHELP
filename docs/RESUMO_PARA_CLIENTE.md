# Resumo Executivo — Biohelp LRP
**Status do Projeto: Sprint 4 ✅ CONCLUÍDO E TESTADO**

**Última atualização:** 10/01/2026

---

## VISÃO GERAL DO PROGRESSO

```
Sprint 1 — MVP Operacional     [████████████████████] 100% ✅
Sprint 2 — CV + Status         [████████████████████] 100% ✅
Sprint 3 — Rede Visual         [████████████████████] 100% ✅
Sprint 4 — Comissões           [████████████████████] 100% ✅
Sprint 5 — Saques              [░░░░░░░░░░░░░░░░░░░░]   0% 🔜
```

---

## 📋 ÍNDICE

1. [Sprint 1 — MVP Operacional](#-sprint-1--mvp-operacional)
2. [Sprint 2 — CV + Status](#-sprint-2--cv--status)
3. [Sprint 3 — Rede Visual + Níveis](#-sprint-3--rede-visual--níveis)
4. [Sprint 4 — Comissões + Ledger](#-sprint-4--comissões--ledger)
5. [Sprint Futuro (5)](#-sprint-futuro)
6. [Como Testar](#-como-testar)
7. [Configuração Técnica](#-configuração-técnica)
8. [Decisões Pendentes (TBD)](#-decisões-pendentes-tbd)

---

# 🚀 SPRINT 1 — MVP Operacional

## O que foi entregue

O **Sprint 1 (MVP Operacional Inicial)** permite que clientes se cadastrem como membros do programa de fidelidade.

### Funcionalidades

| # | Funcionalidade | Status | Descrição |
|---|----------------|--------|-----------|
| 1 | Cadastro com link | ✅ | Cliente recebe link de indicação e se cadastra |
| 2 | Autenticação | ✅ | Login/logout via Supabase Auth |
| 3 | Dashboard do membro | ✅ | Painel com dados pessoais e link de convite |
| 4 | Painel administrativo | ✅ | Lista, busca e gerencia membros |
| 5 | Integração Shopify | ✅ | Cria/atualiza customer com tags |
| 6 | Segurança (RLS) | ✅ | Políticas de acesso no banco |

---

## 🔄 Fluxo do Sprint 1: Cadastro de Membro

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE CADASTRO                                │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ CLIENTE RECEBE LINK
   └── Parceira compartilha: biohelp.com/join?ref=ABC123

2️⃣ CLIENTE ACESSA E PREENCHE
   └── Nome, Email, Senha
   └── Sistema captura ref_code do link

3️⃣ SISTEMA PROCESSA CADASTRO
   ├── Cria usuário no Supabase Auth
   ├── Cria registro em `members`
   ├── Vincula sponsor_id (quem indicou)
   ├── Gera ref_code único para o novo membro
   └── Registra evento em `referral_events`

4️⃣ SINCRONIZA COM SHOPIFY
   ├── Cria/atualiza Customer no Shopify
   └── Aplica tags:
       ├── lrp_member
       ├── lrp_ref:NOVOCODE
       ├── lrp_sponsor:ABC123
       └── lrp_status:pending

5️⃣ REDIRECIONA PARA DASHBOARD
   └── Membro vê seu painel com:
       ├── Dados pessoais
       ├── Link de convite próprio
       ├── Status de ativação
       └── Informações do sponsor
```

### Diagrama Visual

```
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   CLIENTE    │────▶│   SISTEMA    │────▶│   SHOPIFY    │
    │  (Browser)   │     │  (Next.js)   │     │  (Customer)  │
    └──────────────┘     └──────────────┘     └──────────────┘
           │                    │                    │
           │  1. Acessa link    │                    │
           │─────────────────▶  │                    │
           │                    │                    │
           │  2. Preenche form  │                    │
           │─────────────────▶  │                    │
           │                    │                    │
           │                    │  3. Cria Customer  │
           │                    │───────────────────▶│
           │                    │                    │
           │                    │  4. Aplica Tags    │
           │                    │───────────────────▶│
           │                    │                    │
           │  5. Dashboard      │                    │
           │◀─────────────────  │                    │
           │                    │                    │
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   SUPABASE   │◀────│   SISTEMA    │     │   SHOPIFY    │
    │  (Auth+DB)   │     │  (Backend)   │     │   (Loja)     │
    └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Banco de Dados (Sprint 1)

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `members` | Cadastro de membros | id, name, email, ref_code, sponsor_id, status |
| `referral_events` | Histórico de indicações | member_id, ref_code_used, utm_json |
| `shopify_customers` | Rastreamento de sync | member_id, shopify_customer_id, last_sync_status |
| `roles` | Controle de permissões | member_id, role (member/admin) |

---

# 📊 SPRINT 2 — CV + Status

## O que foi entregue

O **Sprint 2 (CV + Status)** implementa o cálculo de Commission Volume e status de ativação dos membros.

### Funcionalidades

| # | Funcionalidade | Status | Descrição |
|---|----------------|--------|-----------|
| 1 | Webhooks Shopify | ✅ | Recebe eventos de pedidos |
| 2 | Cálculo de CV | ✅ | CV por produto via metafield |
| 3 | Status automático | ✅ | Ativo se CV >= 200/mês |
| 4 | Dashboard com CV | ✅ | Progresso visual da meta |
| 5 | Histórico de CV | ✅ | Meses anteriores |
| 6 | Job mensal | ✅ | Fechamento automático |
| 7 | Ajuste manual | ✅ | Admin pode ajustar CV |
| 8 | Página de detalhes | ✅ | Admin vê CV, ledger, pedidos |

---

## 🔄 Fluxo do Sprint 2: Compra e CV

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE COMPRA → CV                             │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO FAZ COMPRA NA LOJA SHOPIFY
   └── Usa email cadastrado no LRP

2️⃣ SHOPIFY ENVIA WEBHOOK (orders/paid)
   └── POST /api/webhooks/shopify/orders/paid
   └── Payload com dados do pedido e itens

3️⃣ SISTEMA VALIDA WEBHOOK
   ├── Verifica assinatura HMAC ✓
   ├── Verifica domínio da loja ✓
   └── Verifica se pedido já foi processado (idempotência) ✓

4️⃣ SISTEMA CALCULA CV
   ├── Para cada item do pedido:
   │   ├── Busca CV no metafield do produto (ex: custom.cv)
   │   └── Se não houver metafield, usa preço como fallback
   └── CV do pedido = Σ(CV_item × quantidade)

5️⃣ SISTEMA REGISTRA CV
   ├── Cria registro em `orders`
   ├── Cria registros em `order_items`
   ├── Cria entradas no `cv_ledger`
   └── Atualiza `members.current_cv_month`

6️⃣ SISTEMA VERIFICA STATUS
   ├── Se CV_mensal >= 200:
   │   └── Status = "active" ✅
   └── Se CV_mensal < 200:
       └── Status = "inactive" (ou pending se nunca ativou)

7️⃣ SISTEMA ATUALIZA SHOPIFY
   └── Tag lrp_status:active (ou inactive)
```

### Diagrama Visual

```
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   SHOPIFY    │────▶│   WEBHOOK    │────▶│   SISTEMA    │
    │   (Pedido)   │     │  (orders/*)  │     │  (Next.js)   │
    └──────────────┘     └──────────────┘     └──────────────┘
           │                    │                    │
           │  1. Pedido pago    │                    │
           │─────────────────▶  │                    │
           │                    │                    │
           │                    │  2. POST webhook   │
           │                    │───────────────────▶│
           │                    │                    │
           │                    │                    │  3. Valida HMAC
           │                    │                    │  4. Busca membro
           │                    │                    │  5. Calcula CV
           │                    │                    │  6. Registra ledger
           │                    │                    │  7. Atualiza status
           │                    │                    │
           │  8. Atualiza tag   │                    │
           │◀───────────────────│────────────────────│
           │                    │                    │
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   SUPABASE   │◀────│   SISTEMA    │────▶│   SHOPIFY    │
    │   (Ledger)   │     │  (Backend)   │     │   (Tags)     │
    └──────────────┘     └──────────────┘     └──────────────┘
```

---

## ⚠️ Regras de CV (IMPORTANTE)

### CV é definido por produto, NÃO pelo preço!

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGRA DE CV (Fonte: Biohelp___Loyalty_Reward_Program.md)               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Cada produto da Biohelp tem um CV DIFERENTE do preço!                  │
│                                                                         │
│  Exemplo:                                                               │
│  ┌────────────────┬────────────────┬────────────────┐                   │
│  │    Produto     │     Preço      │       CV       │                   │
│  ├────────────────┼────────────────┼────────────────┤                   │
│  │ Lemon Dreams   │    R$ 159      │       77       │                   │
│  │ Outro produto  │    R$ 100      │       50       │                   │
│  └────────────────┴────────────────┴────────────────┘                   │
│                                                                         │
│  CV do pedido = Σ(CV_do_produto × quantidade)                           │
│                                                                         │
│  Implementação:                                                         │
│  - CV vem do metafield do produto no Shopify (ex: custom.cv)            │
│  - Se não houver metafield, usa preço como fallback (com log de aviso)  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Status de Ativação

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGRAS DE STATUS                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┬────────────────────────────────────────────────────┐  │
│  │    Status    │                    Condição                        │  │
│  ├──────────────┼────────────────────────────────────────────────────┤  │
│  │   pending    │  Recém-cadastrado, antes de qualquer ciclo         │  │
│  │   active     │  CV mensal >= 200                                  │  │
│  │   inactive   │  CV mensal < 200 (após fechamento do mês)          │  │
│  └──────────────┴────────────────────────────────────────────────────┘  │
│                                                                         │
│  Fechamento mensal (1º dia do mês às 00:00 BRT):                        │
│  - Se CV < 200 → status = "inactive" (não "pending")                    │
│  - CV é zerado para o novo mês                                          │
│  - Tag no Shopify é atualizada                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Refund/Cancelamento

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE REFUND/CANCELAMENTO                         │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ ADMIN FAZ REFUND/CANCEL NO SHOPIFY

2️⃣ SHOPIFY ENVIA WEBHOOK
   ├── orders/refunded (reembolso)
   └── orders/cancelled (cancelamento)

3️⃣ SISTEMA PROCESSA
   ├── Busca pedido original
   ├── Calcula CV a reverter
   └── Cria entradas NEGATIVAS no cv_ledger

4️⃣ SISTEMA ATUALIZA MEMBRO
   ├── Recalcula CV mensal
   └── Se CV < 200:
       └── Status muda para "inactive"

5️⃣ SISTEMA ATUALIZA SHOPIFY
   └── Tag lrp_status:inactive (se necessário)
```

---

## 🔄 Fluxo de Fechamento Mensal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE FECHAMENTO MENSAL                           │
└─────────────────────────────────────────────────────────────────────────┘

⏰ EXECUÇÃO: 1º dia do mês às 03:00 UTC (00:00 BRT)

Para cada membro:

1️⃣ CALCULA CV DO MÊS ANTERIOR
   └── Soma todas as entradas do cv_ledger do mês

2️⃣ DETERMINA NOVO STATUS
   ├── Se CV >= 200 → "active"
   └── Se CV < 200 → "inactive"

3️⃣ CRIA/ATUALIZA RESUMO MENSAL
   └── Tabela cv_monthly_summary

4️⃣ RESETA CV PARA NOVO MÊS
   └── members.current_cv_month = 0

5️⃣ ATUALIZA SHOPIFY (se status mudou)
   └── Tag lrp_status:active ou lrp_status:inactive
```

---

## Banco de Dados (Sprint 2)

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `orders` | Espelho dos pedidos Shopify | shopify_order_id, member_id, total_cv, status |
| `order_items` | Itens dos pedidos | order_id, title, quantity, price, cv_value |
| `cv_ledger` | Ledger auditável de CV | member_id, order_id, cv_amount, cv_type, month_year |
| `cv_monthly_summary` | Resumo mensal por membro | member_id, month_year, total_cv, status_at_close |

---

# 🌐 SPRINT 3 — Rede Visual + Níveis

## O que foi entregue

O **Sprint 3 (Rede Visual + Níveis)** implementa a visualização completa da rede e o sistema de níveis de liderança.

### Funcionalidades

| # | Funcionalidade | Status | Descrição |
|---|----------------|--------|-----------|
| 1 | Visualização da rede | ✅ | Árvore visual com toda a rede |
| 2 | Níveis de liderança | ✅ | Membro → Parceira → Líder → Diretora → Head |
| 3 | Progresso para próximo nível | ✅ | Requisitos e % de conclusão |
| 4 | Estatísticas da rede | ✅ | Total de membros, ativos, CV |
| 5 | Privacidade de telefone | ✅ | Configuração de visibilidade |

---

## 🔄 Fluxo do Sprint 3: Visualização da Rede

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE VISUALIZAÇÃO DA REDE                    │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO ACESSA "MINHA REDE"
   └── /dashboard/network

2️⃣ SISTEMA BUSCA REDE COMPLETA
   ├── CTE recursiva no banco
   ├── Lazy loading para redes grandes
   └── Limite técnico: 20 níveis

3️⃣ EXIBE ÁRVORE VISUAL
   ├── N1 (indicados diretos)
   ├── N2 (indicados de N1)
   ├── N3, N4... (toda a rede)
   └── Cada nó mostra: nome, status, nível, CV

4️⃣ CALCULA NÍVEL DO MEMBRO
   ├── Verifica requisitos
   ├── Mostra progresso para próximo nível
   └── Histórico de mudanças de nível
```

### Níveis de Liderança

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NÍVEIS (Documento Canônico: Biohelp___Loyalty_Reward_Program.md)       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────┬─────────────────────────────────────────────┐   │
│  │       Nível        │               Requisitos                    │   │
│  ├────────────────────┼─────────────────────────────────────────────┤   │
│  │ Membro             │ Cliente cadastrada                          │   │
│  │ Parceira           │ Membro Ativo + CV_rede >= 500               │   │
│  │ Líder em Formação  │ Parceira + 1ª Parceira em N1 (90 dias)      │   │
│  │ Líder              │ Parceira Ativa + 4 Parceiras Ativas em N1   │   │
│  │ Diretora           │ 3 Líderes Ativas em N1 + 80.000 CV na rede  │   │
│  │ Head               │ 3 Diretoras Ativas em N1 + 200.000 CV       │   │
│  └────────────────────┴─────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 💰 SPRINT 4 — Comissões + Ledger

## O que foi entregue

O **Sprint 4 (Comissões + Ledger)** implementa o motor completo de comissões com ledger auditável.

### Funcionalidades

| # | Funcionalidade | Status | Descrição |
|---|----------------|--------|-----------|
| 1 | Fast-Track | ✅ | 30%/20% nos primeiros 60 dias |
| 2 | Comissão Perpétua | ✅ | Diferenciada por tipo de N1 |
| 3 | Bônus 3 | ✅ | R$250 / R$1.500 / R$8.000 |
| 4 | Leadership Bônus | ✅ | 3%/4% para Diretora/Head |
| 5 | Royalty | ✅ | 3% quando Head forma Head |
| 6 | Dashboard de comissões | ✅ | Saldo, histórico, detalhes |
| 7 | Painel admin | ✅ | Gestão de todas comissões |
| 8 | Ledger auditável | ✅ | Registro imutável |

---

## 🔄 Fluxo do Sprint 4: Cálculo de Comissões

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE COMISSÕES                               │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ PEDIDO PAGO (Webhook orders/paid)
   └── Sistema recebe dados do pedido

2️⃣ IDENTIFICA COMPRADOR E SPONSOR
   ├── Busca membro pelo email
   └── Busca sponsor (N0)

3️⃣ VERIFICA JANELA FAST-TRACK
   ├── Se dentro dos primeiros 30 dias → 30%
   ├── Se entre 31-60 dias → 20%
   └── Se expirou → Comissão Perpétua

4️⃣ CALCULA COMISSÃO PERPÉTUA (se aplicável)
   ├── Verifica nível do SPONSOR
   ├── Verifica nível do COMPRADOR (N1)
   └── Aplica percentual correto

5️⃣ CALCULA LEADERSHIP BÔNUS (se aplicável)
   ├── Diretora: 3% CV
   └── Head: 4% CV

6️⃣ REGISTRA NO LEDGER
   ├── Entrada imutável
   └── Atualiza saldo consolidado
```

### Regras de Comissão Perpétua (IMPORTANTE!)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMISSÃO PERPÉTUA — DIFERENCIADA POR TIPO DE N1                        │
│  (Documento Canônico: Biohelp___Loyalty_Reward_Program.md)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️  O percentual depende do nível do SPONSOR e do nível do COMPRADOR! │
│                                                                         │
│  ┌──────────────────┬─────────────┬────────────────────────────────┐    │
│  │  Nível Sponsor   │ Tipo de N1  │         Percentual             │    │
│  ├──────────────────┼─────────────┼────────────────────────────────┤    │
│  │  Parceira        │ Cliente     │ 5%                             │    │
│  │  Parceira        │ Parceira+   │ 0% (NÃO recebe)                │    │
│  ├──────────────────┼─────────────┼────────────────────────────────┤    │
│  │  Líder           │ Cliente     │ 5%                             │    │
│  │  Líder           │ Parceira+   │ 7%                             │    │
│  ├──────────────────┼─────────────┼────────────────────────────────┤    │
│  │  Diretora        │ Cliente     │ 5%                             │    │
│  │  Diretora        │ Parceira    │ 7%                             │    │
│  │  Diretora        │ Líder+      │ 10%                            │    │
│  ├──────────────────┼─────────────┼────────────────────────────────┤    │
│  │  Head            │ Cliente     │ 5%                             │    │
│  │  Head            │ Parceira    │ 7%                             │    │
│  │  Head            │ Líder       │ 10%                            │    │
│  │  Head            │ Rede        │ 15%                            │    │
│  └──────────────────┴─────────────┴────────────────────────────────┘    │
│                                                                         │
│  Exemplo: Uma Parceira (sponsor) NÃO recebe comissão perpétua de        │
│  outra Parceira (comprador). Só recebe de Clientes (membros).           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fast-Track (60 dias)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FAST-TRACK — Primeiros 60 dias após cadastro                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┬──────────────────────────────────────────────────┐ │
│  │     Período     │                   Comissão                       │ │
│  ├─────────────────┼──────────────────────────────────────────────────┤ │
│  │ Dias 1-30       │ N0 recebe 30% CV de N1                           │ │
│  │ Dias 31-60      │ N0 recebe 20% CV de N1                           │ │
│  │ Após 60 dias    │ Comissão Perpétua (conforme tabela acima)        │ │
│  └─────────────────┴──────────────────────────────────────────────────┘ │
│                                                                         │
│  Líder N0 também recebe de N2:                                          │
│  ├── Dias 1-30: 20% CV de N2                                            │
│  └── Dias 31-60: 10% CV de N2                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Bônus 3

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BÔNUS 3 — Bonificação por estrutura da rede                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┬──────────────────────────────────────────────────┐ │
│  │      Valor      │                   Requisito                      │ │
│  ├─────────────────┼──────────────────────────────────────────────────┤ │
│  │    R$ 250       │ 3 Parceiras Ativas em N1 por 1 mês               │ │
│  │    R$ 1.500     │ Cada N1 com 3 Parceiras Ativas                   │ │
│  │    R$ 8.000     │ Cada N2 com 3 Parceiras Ativas                   │ │
│  └─────────────────┴──────────────────────────────────────────────────┘ │
│                                                                         │
│  Pode ocorrer em vários meses, quando completados os requisitos.        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Leadership Bônus e Royalty

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LEADERSHIP BÔNUS + ROYALTY                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Leadership Bônus:                                                      │
│  ├── Diretora: 3% CV da rede                                            │
│  └── Head: 4% CV da rede                                                │
│                                                                         │
│  Royalty (Head forma Head):                                             │
│  ├── Head N0 forma Head N1 → recebe 3% CV da nova rede                  │
│  └── A separação NÃO faz N0 perder status de Head                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Banco de Dados (Sprint 4)

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `commission_ledger` | Ledger imutável de comissões | member_id, commission_type, amount, cv_base, percentage |
| `commission_balances` | Saldo consolidado | total_earned, total_withdrawn, available_balance |
| `fast_track_windows` | Janelas de 60 dias | sponsor_id, member_id, phase_1_ends_at, phase_2_ends_at |
| `bonus_3_tracking` | Elegibilidade Bônus 3 | active_partners_n1, n1_with_3_partners, eligible_level_1/2/3 |
| `royalty_networks` | Redes separadas | original_head_id, new_head_id, royalty_percentage |

---

# 🔮 SPRINT FUTURO

## Sprint 5 — Saques + Fiscal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SPRINT 5: Sistema de Saques                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Regras de Saque:                                                       │
│  ├── Mínimo para saque: R$100 (TBD confirmar)                           │
│  ├── PF: até R$990/mês → Biohelp emite RPA, desconta impostos           │
│  ├── PJ (MEI): pode usar conta PF                                       │
│  ├── PJ (outras): obrigatório conta PJ + NF-e                           │
│  └── Conta sempre em nome da parceira (não terceiros)                   │
│                                                                         │
│  Fluxo de Saque:                                                        │
│  1. Parceira solicita saque no painel                                   │
│  2. Sistema valida saldo disponível                                     │
│  3. Se PF: gera RPA automaticamente                                     │
│  4. Se PJ: valida NF-e enviada                                          │
│  5. Transferência via integração fintech (PIX/Asaas)                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 🧪 COMO TESTAR

## URLs de Acesso

| Página | URL |
|--------|-----|
| Home | https://rlp-biohelp.vercel.app/ |
| Login | https://rlp-biohelp.vercel.app/login |
| Cadastro | https://rlp-biohelp.vercel.app/join?ref=SPONSOR01 |
| Dashboard | https://rlp-biohelp.vercel.app/dashboard |
| Admin | https://rlp-biohelp.vercel.app/admin |
| Detalhes Membro | https://rlp-biohelp.vercel.app/admin/members/[id] |

## Logins de Teste

| Portal | Email | Senha |
|--------|-------|-------|
| Admin | admin@biohelp.test | 123456 |
| Parceira | sponsor@biohelp.test | sponsor123 |

---

## Teste 1: Dashboard da Parceira

1. Acesse: https://rlp-biohelp.vercel.app/login
2. Login com: `sponsor@biohelp.test` / `sponsor123`
3. **Resultado esperado:**
   - ✅ Card de CV com valor atual
   - ✅ Barra de progresso da meta (200 CV)
   - ✅ Status "Ativo" (badge verde) se CV >= 200
   - ✅ Link de convite copiável
   - ✅ Informações do sponsor

## Teste 2: Painel Admin

1. Acesse: https://rlp-biohelp.vercel.app/login
2. Login com: `admin@biohelp.test` / `123456`
3. **Resultado esperado:**
   - ✅ Lista de parceiras
   - ✅ Busca por nome/email
   - ✅ Botão "CV" para ver detalhes
   - ✅ Botão "Resync" para sincronizar Shopify

## Teste 3: Detalhes do Membro (Admin)

1. No painel Admin, clique no nome de um membro ou no botão "CV"
2. **Resultado esperado:**
   - ✅ Card de CV do mês com progresso
   - ✅ Card de meta (200 CV)
   - ✅ Botão "Ajuste Manual"
   - ✅ Tabela de Ledger com transações
   - ✅ Lista de pedidos do mês
   - ✅ Histórico de CV mensal

## Teste 4: Ajuste Manual de CV

1. Na página de detalhes do membro, clique em "Ajuste Manual"
2. Preencha valor e descrição
3. Clique em "Adicionar CV" ou "Remover CV"
4. **Resultado esperado:**
   - ✅ CV atualizado imediatamente
   - ✅ Nova entrada no Ledger
   - ✅ Barra de progresso atualizada

---

# ⚙️ CONFIGURAÇÃO TÉCNICA

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Shopify
SHOPIFY_STORE_DOMAIN=sua-loja.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxx...
SHOPIFY_WEBHOOK_SECRET=shpss_xxx...

# Cron Job
CRON_SECRET=seu_secret_aqui
```

## Webhooks no Shopify Admin

| Evento | URL | Status |
|--------|-----|--------|
| Order payment | `/api/webhooks/shopify/orders/paid` | ✅ Ativo |
| Order cancellation | `/api/webhooks/shopify/orders/cancelled` | ✅ Ativo |
| Order refund | `/api/webhooks/shopify/orders/refunded` | ✅ Ativo |

## Cron Job (Vercel)

```json
{
  "crons": [{
    "path": "/api/cron/close-monthly-cv",
    "schedule": "0 3 1 * *"
  }]
}
```

---

# 📋 DECISÕES PENDENTES (TBD)

## Resolvidos ✅

| TBD | Descrição | Decisão |
|-----|-----------|---------|
| TBD-008 | Regra de cálculo de CV | CV via metafield do produto (não 100% do preço) |
| TBD-009 | Comportamento de refund | Reverte CV completamente |
| TBD-010 | Job de fechamento mensal | 1º dia do mês às 00:00 BRT |
| TBD-011 | Regras de níveis | Conforme documento canônico |
| TBD-012 | Profundidade da rede visível | Toda a rede (ilimitado) |
| TBD-013 | Informações visíveis dos indicados | Nome, email, CV, status, nível + telefone com privacidade |
| TBD-017 | Arredondamento de CV | 2 casas decimais (padrão BRL) |
| TBD-020 | Período de cálculo de comissões | Em tempo real (webhook) |
| TBD-022 | Comissão Perpétua diferenciada | Por tipo de N1 (cliente/parceira/líder) |

## Pendentes ❓

| TBD | Descrição | Precisa de decisão |
|-----|-----------|-------------------|
| TBD-001 | Regra para cadastro sem link | Qual rede recebe? |
| TBD-004 | URLs oficiais (staging/prod) | Definir domínios |
| TBD-014 | Nome do metafield CV no Shopify | custom.cv? lrp.cv? |
| TBD-015 | Limite de saque PF | R$990 ou R$1.000/mês? |
| TBD-016 | Valor mínimo para saque | R$100? R$50? |
| TBD-018 | Integração fintech | Asaas? PagSeguro? Manual? |

## Adiados ⏳

| TBD | Descrição | Sprint |
|-----|-----------|--------|
| TBD-019 | Creatina mensal grátis | Sprint 5+ |
| TBD-021 | Período de trava para saque | Sprint 5 |

---

# ✅ CHECKLIST DE ACEITE

## Sprint 1 ✅

| Critério | Status |
|----------|--------|
| Cadastro com link vincula sponsor | ✅ |
| `ref_code` único gerado | ✅ |
| Customer Shopify criado/atualizado | ✅ |
| Tags aplicadas corretamente | ✅ |
| Dashboard mostra link de convite | ✅ |
| Admin busca membro e executa resync | ✅ |
| RLS ativo | ✅ |
| Login funciona | ✅ |

## Sprint 2 ✅

| Critério | Status |
|----------|--------|
| Webhook `orders/paid` processa | ✅ |
| Webhook `orders/refunded` reverte CV | ✅ |
| Webhook `orders/cancelled` reverte CV | ✅ |
| Idempotência (não duplica) | ✅ |
| CV via metafield do produto | ✅ |
| Status muda para 'active' (CV >= 200) | ✅ |
| Status muda para 'inactive' (CV < 200) | ✅ |
| Job mensal fecha mês | ✅ |
| Dashboard mostra CV | ✅ |
| Admin pode ver/ajustar CV | ✅ |
| Ledger é auditável | ✅ |

## Sprint 3 ✅

| Critério | Status |
|----------|--------|
| API de rede funcionando | ✅ |
| API de nível funcionando | ✅ |
| Página "Minha Rede" com árvore visual | ✅ |
| Estatísticas da rede (total, ativos, CV) | ✅ |
| Progresso para próximo nível | ✅ |
| Privacidade de telefone | ✅ |
| Regras de níveis conforme documento canônico | ✅ |

## Sprint 4 ✅

| Critério | Status |
|----------|--------|
| Schema de comissões aplicado | ✅ |
| Triggers funcionando | ✅ |
| API de resumo de comissões | ✅ |
| API de detalhes de comissões | ✅ |
| API admin de comissões | ✅ |
| Cálculo Fast-Track 30%/20% | ✅ |
| Cálculo Perpétua diferenciada por tipo de N1 | ✅ |
| Cálculo Leadership 3%/4% | ✅ |
| Dashboard membro funcionando | ✅ |
| Painel admin funcionando | ✅ |
| Ledger auditável | ✅ |

---

# 🎉 STATUS ATUAL

**Sprint 4 — CONCLUÍDO E VALIDADO!**

**Data de conclusão:** 10/01/2026

**Correções aplicadas (10/01/2026):**
- ✅ Comissão Perpétua diferenciada por tipo de N1 (cliente/parceira/líder)
- ✅ Parceira NÃO recebe comissão de outras parceiras (apenas de clientes)
- ✅ Funções RPC `get_buyer_type()` e `get_perpetual_percentage()` implementadas
- ✅ Documentação alinhada com regras de negócio canônicas

**Próximo passo:** Iniciar Sprint 5 (Saques + Fiscal)
