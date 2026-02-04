# Resumo Executivo — Biohelp LRP
**Status do Projeto: Sprint 7 ⚠️ PARCIAL | 🎉 MVP COMPLETO**

**Última atualização:** 20/01/2026

---

## VISÃO GERAL DO PROGRESSO

```
Sprint 1 — MVP Operacional     [████████████████████] 100% ✅
Sprint 2 — CV + Status         [████████████████████] 100% ✅
Sprint 3 — Rede Visual         [████████████████████] 100% ✅
Sprint 4 — Comissões           [████████████████████] 100% ✅
Sprint 5 — Saques              [████████████████████]  92% ✅
Sprint 6 — Admin Avançado      [████████████████████] 100% ✅
Sprint 7 — Creatina Mensal     [████████████████░░░░]  85% ⚠️
```

### Cobertura de Requisitos Funcionais (FRs)

| Categoria | Total | ✅ | ⚠️ | ⏳ | % |
|-----------|-------|----|----|----|----|
| Identidade/Acesso | 3 | 3 | 0 | 0 | 100% |
| Cadastro/Indicação | 5 | 4 | 0 | 1 | 80% |
| Rede/Visualização | 4 | 4 | 0 | 0 | 100% |
| CV/Status | 5 | 4 | 1 | 0 | 90% |
| Níveis | 3 | 3 | 0 | 0 | 100% |
| Comissões | 7 | 7 | 0 | 0 | 100% |
| Saques | 6 | 5 | 1 | 0 | 92% |
| Admin | 5 | 5 | 0 | 0 | 100% |
| **TOTAL** | **38** | **35** | **2** | **1** | **95%** |

---

## 📋 ÍNDICE

1. [Sprint 1 — MVP Operacional](#-sprint-1--mvp-operacional-)
2. [Sprint 2 — CV + Status](#-sprint-2--cv--status-)
3. [Sprint 3 — Rede Visual + Níveis](#-sprint-3--rede-visual--níveis-)
4. [Sprint 4 — Comissões + Ledger](#-sprint-4--comissões--ledger-)
5. [Sprint 5 — Saques + Fiscal](#-sprint-5--saques--fiscal-)
6. [Sprint 6 — Admin Avançado](#-sprint-6--admin-avançado-)
7. [Sprint 7 — Creatina Mensal](#-sprint-7--creatina-mensal-)
8. [Sprints Futuros](#-sprints-futuros)
9. [Como Testar](#-como-testar)
10. [Decisões Pendentes (TBD)](#-decisões-pendentes-tbd)

---

# 🚀 SPRINT 1 — MVP Operacional ✅

**Data de conclusão:** 07/01/2026  
**FRs cobertos:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06 (parcial), FR-07, FR-08, FR-09

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Cadastro com link | FR-04, FR-05 | ✅ | Cliente recebe link e se cadastra |
| 2 | Autenticação membro | FR-01 | ✅ | Login/logout via Supabase Auth |
| 3 | Autenticação admin | FR-02 | ✅ | Login com role admin |
| 4 | Controle de permissões | FR-03 | ✅ | RLS ativo no banco |
| 5 | Dashboard do membro | FR-01 | ✅ | Painel com dados e link de convite |
| 6 | Painel administrativo | FR-02 | ✅ | Lista, busca e gerencia membros |
| 7 | Integração Shopify | FR-04, FR-08 | ✅ | Cria/atualiza customer com tags |
| 8 | Geração de link único | FR-07 | ✅ | ref_code único e imutável |
| 9 | Persistência da rede | FR-09 | ✅ | sponsor_id vincula hierarquia |

## Fluxo de Funcionamento

### Como funciona o cadastro de um novo membro:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE CADASTRO (Sprint 1)                         │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ PARCEIRA COMPARTILHA LINK
   │
   │  Exemplo: https://rlp-biohelp.vercel.app/join?ref=ABC123
   │
   ▼
2️⃣ CLIENTE ACESSA O LINK
   │
   │  Sistema captura o ref_code (ABC123) da URL
   │  Sistema busca o sponsor pelo ref_code
   │
   ▼
3️⃣ CLIENTE PREENCHE FORMULÁRIO
   │
   │  Campos: Nome, Email, Senha
   │
   ▼
4️⃣ SISTEMA VALIDA DADOS
   │
   │  ✓ Email único? (não pode existir)
   │  ✓ Sponsor existe? (ref_code válido)
   │  ✓ Senha forte?
   │
   ▼
5️⃣ SISTEMA CRIA MEMBRO NO SUPABASE
   │
   │  ├── Cria usuário no Supabase Auth
   │  ├── Cria registro na tabela `members`
   │  │   ├── id: UUID gerado
   │  │   ├── name: nome do cliente
   │  │   ├── email: email do cliente
   │  │   ├── ref_code: código único gerado (ex: XYZ789)
   │  │   ├── sponsor_id: UUID do sponsor (quem indicou)
   │  │   └── status: 'pending'
   │  ├── Cria registro em `referral_events` (histórico)
   │  └── Cria registro em `shopify_customers` (status: pending)
   │
   ▼
6️⃣ SISTEMA SINCRONIZA COM SHOPIFY
   │
   │  Mutation GraphQL: customerSet
   │  ├── Cria/atualiza Customer por email
   │  └── Aplica tags:
   │      ├── lrp_member (identifica como membro LRP)
   │      ├── lrp_ref:XYZ789 (código do novo membro)
   │      ├── lrp_sponsor:ABC123 (código de quem indicou)
   │      └── lrp_status:pending (status inicial)
   │
   ▼
7️⃣ SISTEMA REDIRECIONA PARA DASHBOARD
   │
   │  Membro vê:
   │  ├── Seu nome e email
   │  ├── Seu link de convite (para indicar outros)
   │  ├── Quem o indicou (sponsor)
   │  └── Status: Pendente
   │
   ▼
8️⃣ MEMBRO PODE COMPRAR COM PREÇO DE MEMBRO
   │
   │  Na loja Shopify, o sistema reconhece a tag lrp_member
   │  e libera preços especiais para membros
   │
   └── FIM DO FLUXO
```

### Diagrama de Arquitetura

```
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │   CLIENTE    │────▶│   SISTEMA    │────▶│   SHOPIFY    │
    │  (Browser)   │     │  (Next.js)   │     │  (Customer)  │
    └──────────────┘     └──────────────┘     └──────────────┘
           │                    │                    │
           │  1. Acessa link    │                    │
           │─────────────────▶  │                    │
           │  2. Preenche form  │                    │
           │─────────────────▶  │                    │
           │                    │  3. Cria Customer  │
           │                    │───────────────────▶│
           │                    │  4. Aplica Tags    │
           │                    │───────────────────▶│
           │  5. Dashboard      │                    │
           │◀─────────────────  │                    │
    ┌──────────────┐     ┌──────────────┐
    │   SUPABASE   │◀────│   SISTEMA    │
    │  (Auth+DB)   │     │  (Backend)   │
    └──────────────┘     └──────────────┘
```

## Testes Realizados e Resultados

### Cenário 1: Cadastro com link válido ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Acessar `/join?ref=SPONSOR01` | Página de cadastro carrega | ✅ |
| 2 | Preencher nome, email, senha | Formulário aceita dados | ✅ |
| 3 | Clicar em "Cadastrar" | Processamento inicia | ✅ |
| 4 | Verificar Supabase | Registro em `members` criado | ✅ |
| 5 | Verificar Shopify Admin | Customer existe com tags | ✅ |
| 6 | Verificar redirect | Dashboard carrega | ✅ |

### Cenário 2: Email duplicado ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Tentar cadastrar email existente | Erro 409 | ✅ |
| 2 | Mensagem exibida | "Email já cadastrado" | ✅ |
| 3 | Shopify | Não cria duplicado | ✅ |

### Cenário 3: Falha Shopify + Recuperação ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Simular falha Shopify | Membro criado mesmo assim | ✅ |
| 2 | Verificar `shopify_customers` | status = 'failed' | ✅ |
| 3 | Admin executa "Resync" | Customer criado no Shopify | ✅ |
| 4 | Verificar `shopify_customers` | status = 'ok' | ✅ |

### Evidências no Shopify Admin
Após cadastro bem-sucedido, o Customer deve ter:
- ✅ Email do membro
- ✅ Tag `lrp_member`
- ✅ Tag `lrp_ref:<ref_code>`
- ✅ Tag `lrp_sponsor:<sponsor_ref_code>`
- ✅ Tag `lrp_status:pending`

## Banco de Dados Criado

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `members` | Cadastro de membros | id, name, email, ref_code, sponsor_id, status |
| `referral_events` | Histórico de indicações | member_id, ref_code_used, utm_json |
| `shopify_customers` | Rastreamento de sync | member_id, shopify_customer_id, last_sync_status |
| `roles` | Controle de permissões | member_id, role (member/admin) |

---

# 📊 SPRINT 2 — CV + Status ✅

**Data de conclusão:** 08/01/2026  
**FRs cobertos:** FR-13, FR-14, FR-15, FR-16

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Webhooks Shopify | FR-13 | ✅ | Recebe eventos de pedidos |
| 2 | Cálculo de CV | FR-14 | ✅ | CV por produto via metafield |
| 3 | Status automático | FR-15 | ✅ | Ativo se CV >= 200/mês |
| 4 | Dashboard com CV | FR-14 | ✅ | Progresso visual da meta |
| 5 | Histórico de CV | FR-14 | ✅ | Meses anteriores |
| 6 | Job mensal | FR-16 | ✅ | Fechamento automático |
| 7 | Ajuste manual | FR-14 | ✅ | Admin pode ajustar CV |
| 8 | Página de detalhes | FR-14 | ✅ | Admin vê CV, ledger, pedidos |

## Fluxo de Funcionamento

### Como funciona o cálculo de CV:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE COMPRA → CV (Sprint 2)                          │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO FAZ COMPRA NA LOJA SHOPIFY
   │
   │  Usa o email cadastrado no LRP
   │  Compra produtos (ex: Lemon Dreams R$159)
   │
   ▼
2️⃣ SHOPIFY PROCESSA PAGAMENTO
   │
   │  Pedido muda para status "paid"
   │  Shopify dispara webhook
   │
   ▼
3️⃣ WEBHOOK CHEGA NO SISTEMA
   │
   │  POST /api/webhooks/shopify/orders/paid
   │  Payload: dados completos do pedido
   │
   ▼
4️⃣ SISTEMA VALIDA WEBHOOK
   │
   │  ✓ Assinatura HMAC válida?
   │  ✓ Domínio da loja correto?
   │  ✓ Pedido já processado? (idempotência)
   │
   ▼
5️⃣ SISTEMA IDENTIFICA MEMBRO
   │
   │  Busca membro pelo email do pedido
   │  Se não encontrar → ignora (não é membro LRP)
   │
   ▼
6️⃣ SISTEMA CALCULA CV DO PEDIDO
   │
   │  Para cada item do pedido:
   │  ├── Busca CV no metafield do produto
   │  │   (ex: Lemon Dreams → CV = 77)
   │  └── CV_item = CV_produto × quantidade
   │
   │  CV_pedido = Σ(CV_item)
   │
   │  ⚠️ IMPORTANTE: CV ≠ Preço!
   │  Exemplo: Lemon Dreams custa R$159 mas tem CV = 77
   │
   ▼
7️⃣ SISTEMA REGISTRA NO BANCO
   │
   │  ├── Cria registro em `orders`
   │  │   (shopify_order_id, member_id, total_cv, status)
   │  ├── Cria registros em `order_items`
   │  │   (cada item com seu cv_value)
   │  ├── Cria entradas no `cv_ledger`
   │  │   (ledger auditável e imutável)
   │  └── Atualiza `members.current_cv_month`
   │
   ▼
8️⃣ SISTEMA VERIFICA STATUS
   │
   │  Se CV_mensal >= 200:
   │  │  └── Status = "active" ✅
   │  │
   │  Se CV_mensal < 200:
   │  │  └── Status = "inactive" ou "pending"
   │
   ▼
9️⃣ SISTEMA ATUALIZA SHOPIFY
   │
   │  Atualiza tag do Customer:
   │  └── lrp_status:active (ou inactive)
   │
   └── FIM DO FLUXO
```

### Fluxo de Refund/Cancelamento:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE REFUND/CANCEL (Sprint 2)                        │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ ADMIN FAZ REFUND NO SHOPIFY
   │
   ▼
2️⃣ SHOPIFY DISPARA WEBHOOK
   │
   │  POST /api/webhooks/shopify/orders/refunded
   │  (ou /orders/cancelled)
   │
   ▼
3️⃣ SISTEMA PROCESSA REVERSÃO
   │
   │  ├── Busca pedido original
   │  ├── Cria entradas NEGATIVAS no cv_ledger
   │  │   (cv_type = 'order_refunded' ou 'order_cancelled')
   │  └── Recalcula CV mensal do membro
   │
   ▼
4️⃣ SISTEMA VERIFICA NOVO STATUS
   │
   │  Se CV_mensal < 200 após reversão:
   │  └── Status muda para "inactive"
   │
   ▼
5️⃣ SISTEMA ATUALIZA SHOPIFY
   │
   │  Atualiza tag: lrp_status:inactive
   │
   └── FIM DO FLUXO
```

### Fluxo de Fechamento Mensal:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE FECHAMENTO MENSAL (Sprint 2)                    │
└─────────────────────────────────────────────────────────────────────────────┘

⏰ EXECUÇÃO: 1º dia do mês às 03:00 UTC (00:00 BRT)
   │
   │  Cron job: /api/cron/close-monthly-cv
   │
   ▼
Para cada membro:
   │
   ├── 1️⃣ Calcula CV do mês anterior
   │   │   (soma do cv_ledger do mês)
   │   │
   ├── 2️⃣ Determina status final
   │   │   >= 200 → active
   │   │   < 200 → inactive
   │   │
   ├── 3️⃣ Cria/atualiza cv_monthly_summary
   │   │   (total_cv, status_at_close, closed_at)
   │   │
   ├── 4️⃣ Reseta CV para novo mês
   │   │   members.current_cv_month = 0
   │   │
   └── 5️⃣ Atualiza tag no Shopify (se mudou)
       │
       └── FIM DO FLUXO
```

## Regras de CV (IMPORTANTE!)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ CV é definido por PRODUTO, NÃO pelo preço!                              │
│                                                                             │
│  Cada produto tem um CV específico configurado via metafield no Shopify.    │
│                                                                             │
│  Exemplo:                                                                   │
│  ┌─────────────────┬──────────┬────────┐                                    │
│  │ Produto         │ Preço    │ CV     │                                    │
│  ├─────────────────┼──────────┼────────┤                                    │
│  │ Lemon Dreams    │ R$ 159   │ 77     │                                    │
│  │ Produto B       │ R$ 200   │ 100    │                                    │
│  │ Produto C       │ R$ 50    │ 25     │                                    │
│  └─────────────────┴──────────┴────────┘                                    │
│                                                                             │
│  CV do pedido = Σ(CV_do_produto × quantidade)                               │
│                                                                             │
│  Status:                                                                    │
│  ├── pending: recém-cadastrado, antes de qualquer ciclo                     │
│  ├── active: CV mensal >= 200                                               │
│  └── inactive: CV mensal < 200 (após fechamento do mês)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Testes Realizados e Resultados

### Cenário 1: Pedido pago gera CV ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Fazer pedido na loja | Webhook disparado | ✅ |
| 2 | Verificar `orders` | Registro criado com total_cv | ✅ |
| 3 | Verificar `cv_ledger` | Entradas com cv_type 'order_paid' | ✅ |
| 4 | Verificar Dashboard | CV atualizado | ✅ |

### Cenário 2: Refund reverte CV ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Reembolsar pedido | Webhook disparado | ✅ |
| 2 | Verificar `cv_ledger` | Entradas negativas | ✅ |
| 3 | Verificar CV do membro | CV diminuiu | ✅ |

### Cenário 3: Idempotência ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Enviar mesmo webhook 2x | Apenas 1 registro | ✅ |
| 2 | Verificar CV | Não duplicou | ✅ |

### Cenário 4: Status muda para Active ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Atingir 200 CV | Status = active | ✅ |
| 2 | Verificar Shopify | Tag lrp_status:active | ✅ |

## Banco de Dados Criado

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `orders` | Espelho dos pedidos Shopify | shopify_order_id, member_id, total_cv, status |
| `order_items` | Itens dos pedidos | order_id, title, quantity, price, cv_value |
| `cv_ledger` | Ledger auditável de CV | member_id, order_id, cv_amount, cv_type, month_year |
| `cv_monthly_summary` | Resumo mensal por membro | member_id, month_year, total_cv, status_at_close |

---

# 🌐 SPRINT 3 — Rede Visual + Níveis ✅

**Data de conclusão:** 09/01/2026  
**FRs cobertos:** FR-10, FR-11, FR-17 (parcial), FR-18, FR-19, FR-20

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Visualização da rede (membro) | FR-10 | ✅ | Árvore visual com toda a rede |
| 2 | Visualização da rede (admin) | FR-11 | ✅ | Admin vê rede de qualquer membro |
| 3 | Níveis de liderança | FR-18 | ✅ | Cálculo automático de nível |
| 4 | Progresso para próximo nível | FR-18 | ✅ | Requisitos e % de conclusão |
| 5 | Líder em Formação (90 dias) | FR-19 | ✅ | Janela de promoção temporária |
| 6 | Rebaixamento automático | FR-20 | ✅ | Perde nível se não mantiver requisitos |
| 7 | Privacidade de telefone | - | ✅ | Configuração de visibilidade |
| 8 | Separação CV próprio vs rede | FR-17 | ⚠️ | Dashboard não separa ainda |

## Fluxo de Funcionamento

### Como funciona a visualização da rede:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE VISUALIZAÇÃO DA REDE (Sprint 3)                 │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO ACESSA "MINHA REDE"
   │
   │  URL: /dashboard/network
   │
   ▼
2️⃣ SISTEMA BUSCA REDE COMPLETA
   │
   │  Função RPC: get_network_tree(member_id)
   │  ├── CTE recursiva no banco
   │  ├── Busca todos os indicados (N1, N2, N3...)
   │  └── Limite técnico: 20 níveis de profundidade
   │
   ▼
3️⃣ SISTEMA APLICA LAZY LOADING
   │
   │  Para redes grandes:
   │  ├── Carrega N1 imediatamente
   │  └── Carrega N2+ sob demanda (expand/collapse)
   │
   ▼
4️⃣ EXIBE ÁRVORE VISUAL
   │
   │  Componente: NetworkTree
   │  │
   │  │  Você (N0)
   │  │  ├── Maria (N1) - Parceira - Ativa - CV: 350
   │  │  │   ├── Ana (N2) - Membro - Ativa - CV: 220
   │  │  │   └── Carla (N2) - Membro - Inativa - CV: 50
   │  │  ├── Julia (N1) - Membro - Ativa - CV: 200
   │  │  └── Paula (N1) - Membro - Pendente - CV: 0
   │  │
   │  Cada nó mostra:
   │  ├── Nome
   │  ├── Nível de liderança
   │  ├── Status (ativo/inativo/pendente)
   │  ├── CV do mês
   │  └── Telefone (se permitido)
   │
   ▼
5️⃣ EXIBE ESTATÍSTICAS DA REDE
   │
   │  ├── Total de membros na rede
   │  ├── Membros ativos
   │  ├── CV total da rede
   │  └── Distribuição por nível
   │
   └── FIM DO FLUXO
```

### Como funciona o cálculo de níveis:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CÁLCULO DE NÍVEIS (Sprint 3)                    │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ TRIGGER: Após qualquer mudança de CV ou status
   │
   ▼
2️⃣ SISTEMA AVALIA REQUISITOS
   │
   │  Função: calculateLevel(member_id)
   │  │
   │  │  Verifica de cima para baixo:
   │  │
   │  │  HEAD?
   │  │  ├── 3 Diretoras Ativas em N1?
   │  │  └── 200.000 CV na rede?
   │  │  Se SIM → nível = 'head'
   │  │
   │  │  DIRETORA?
   │  │  ├── 3 Líderes Ativas em N1?
   │  │  └── 80.000 CV na rede?
   │  │  Se SIM → nível = 'diretora'
   │  │
   │  │  LÍDER?
   │  │  ├── Parceira Ativa?
   │  │  └── 4 Parceiras Ativas em N1?
   │  │  Se SIM → nível = 'lider'
   │  │
   │  │  LÍDER EM FORMAÇÃO?
   │  │  ├── Parceira?
   │  │  ├── Primeira Parceira em N1?
   │  │  └── Dentro da janela de 90 dias?
   │  │  Se SIM → nível = 'lider_formacao'
   │  │
   │  │  PARCEIRA?
   │  │  ├── Membro Ativo (CV >= 200)?
   │  │  └── CV_rede >= 500?
   │  │  Se SIM → nível = 'parceira'
   │  │
   │  │  Senão → nível = 'membro'
   │
   ▼
3️⃣ SISTEMA ATUALIZA NÍVEL
   │
   │  ├── Atualiza members.level
   │  ├── Registra em member_level_history (auditoria)
   │  └── Atualiza level_updated_at
   │
   ▼
4️⃣ SISTEMA VERIFICA REBAIXAMENTO
   │
   │  Se nível anterior > nível atual:
   │  └── Registra motivo do rebaixamento
   │
   └── FIM DO FLUXO
```

## Níveis de Liderança

| Nível | Requisitos | Benefícios |
|-------|------------|------------|
| **Membro** | Cliente cadastrada | Preço de membro |
| **Parceira** | Membro Ativo + CV_rede >= 500 | Comissão 5% de clientes N1 |
| **Líder em Formação** | Parceira + 1ª Parceira em N1 (90 dias) | Comissão como Líder por 90 dias |
| **Líder** | Parceira Ativa + 4 Parceiras Ativas em N1 | Comissão 7% da rede |
| **Diretora** | 3 Líderes Ativas em N1 + 80.000 CV na rede | Leadership 3% + Comissão 10% |
| **Head** | 3 Diretoras Ativas em N1 + 200.000 CV na rede | Leadership 4% + Royalty |

## Testes Realizados e Resultados

### Cenário 1: Visualização da rede ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Acessar /dashboard/network | Página carrega | ✅ |
| 2 | Verificar árvore | N1 visível | ✅ |
| 3 | Expandir N1 | N2 carrega | ✅ |
| 4 | Verificar dados | Nome, status, CV corretos | ✅ |

### Cenário 2: Promoção para Parceira ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Membro atinge 200 CV | Status = active | ✅ |
| 2 | Rede atinge 500 CV | Nível = parceira | ✅ |
| 3 | Dashboard atualiza | Mostra novo nível | ✅ |

### Cenário 3: Líder em Formação ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Parceira traz 1ª Parceira N1 | Nível = lider_formacao | ✅ |
| 2 | Janela de 90 dias inicia | Comissão como Líder | ✅ |
| 3 | Após 90 dias sem Líder | Volta para Parceira | ✅ |

### Cenário 4: Rebaixamento automático ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Líder perde 1 Parceira N1 | Nível = parceira | ✅ |
| 2 | Histórico registrado | Motivo do rebaixamento | ✅ |

## Banco de Dados Criado/Alterado

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `members` (alterada) | Adicionado campo level | level, level_updated_at |
| `member_level_history` | Histórico de mudanças | member_id, old_level, new_level, reason |

---

# 💰 SPRINT 4 — Comissões + Ledger ✅

**Data de conclusão:** 10/01/2026  
**FRs cobertos:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Fast-Track | FR-22 | ✅ | 30%/20% nos primeiros 60 dias |
| 2 | Comissão Perpétua | FR-23 | ✅ | Diferenciada por tipo de N1 |
| 3 | Bônus 3 | FR-24 | ✅ | R$250 / R$1.500 / R$8.000 |
| 4 | Leadership Bônus | FR-25 | ✅ | 3%/4% para Diretora/Head |
| 5 | Royalty | FR-26 | ✅ | 3% quando Head forma Head |
| 6 | Dashboard de comissões | FR-27 | ✅ | Saldo, histórico, detalhes |
| 7 | Painel admin | FR-27 | ✅ | Gestão de todas comissões |
| 8 | Ledger auditável | FR-21 | ✅ | Registro imutável |

## Fluxo de Funcionamento

### Como funciona o cálculo de comissões:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CÁLCULO DE COMISSÕES (Sprint 4)                 │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ PEDIDO PAGO (Webhook orders/paid)
   │
   │  Mesmo webhook do Sprint 2
   │  Após calcular CV, calcula comissões
   │
   ▼
2️⃣ IDENTIFICA COMPRADOR E SPONSOR
   │
   │  ├── Comprador: membro que fez a compra (N1)
   │  └── Sponsor: quem indicou o comprador (N0)
   │
   ▼
3️⃣ VERIFICA JANELA FAST-TRACK
   │
   │  Busca em fast_track_windows:
   │  ├── Comprador cadastrado há menos de 30 dias?
   │  │   └── Fast-Track 30% ✅
   │  ├── Comprador cadastrado entre 31-60 dias?
   │  │   └── Fast-Track 20% ✅
   │  └── Comprador cadastrado há mais de 60 dias?
   │      └── Comissão Perpétua ✅
   │
   ▼
4️⃣ CALCULA FAST-TRACK (se aplicável)
   │
   │  ┌─────────────────────────────────────────────────┐
   │  │ Período      │ N0 recebe de N1 │ N0 recebe de N2 │
   │  ├──────────────┼─────────────────┼─────────────────┤
   │  │ Dias 1-30    │ 30% CV          │ 20% CV (Líder)  │
   │  │ Dias 31-60   │ 20% CV          │ 10% CV (Líder)  │
   │  └──────────────┴─────────────────┴─────────────────┘
   │
   │  Comissão = CV_pedido × percentual
   │
   ▼
5️⃣ CALCULA COMISSÃO PERPÉTUA (se Fast-Track expirou)
   │
   │  ⚠️ REGRA IMPORTANTE:
   │  O percentual depende do NÍVEL DO SPONSOR e do TIPO DO COMPRADOR!
   │
   │  ┌──────────────────┬─────────────┬────────────────────────────────┐
   │  │  Nível Sponsor   │ Tipo de N1  │         Percentual             │
   │  ├──────────────────┼─────────────┼────────────────────────────────┤
   │  │  Parceira        │ Cliente     │ 5%                             │
   │  │  Parceira        │ Parceira+   │ 0% (NÃO recebe!)               │
   │  │  Líder           │ Cliente     │ 5%                             │
   │  │  Líder           │ Parceira+   │ 7%                             │
   │  │  Diretora        │ Cliente     │ 5%                             │
   │  │  Diretora        │ Parceira    │ 7%                             │
   │  │  Diretora        │ Líder+      │ 10%                            │
   │  │  Head            │ Cliente     │ 5%                             │
   │  │  Head            │ Parceira    │ 7%                             │
   │  │  Head            │ Líder       │ 10%                            │
   │  │  Head            │ Rede        │ 15%                            │
   │  └──────────────────┴─────────────┴────────────────────────────────┘
   │
   ▼
6️⃣ CALCULA LEADERSHIP BÔNUS (se aplicável)
   │
   │  Se Sponsor é Diretora:
   │  └── 3% CV da rede
   │
   │  Se Sponsor é Head:
   │  └── 4% CV da rede
   │
   ▼
7️⃣ REGISTRA NO LEDGER
   │
   │  Para cada comissão calculada:
   │  ├── Cria entrada em commission_ledger
   │  │   ├── member_id: quem recebe
   │  │   ├── commission_type: tipo da comissão
   │  │   ├── amount: valor em R$
   │  │   ├── cv_base: CV usado no cálculo
   │  │   ├── percentage: percentual aplicado
   │  │   ├── source_member_id: quem gerou
   │  │   ├── source_order_id: pedido origem
   │  │   └── reference_month: mês de referência
   │  │
   │  └── Atualiza commission_balances
   │      └── total_earned += amount
   │
   └── FIM DO FLUXO
```

### Fluxo do Bônus 3:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DO BÔNUS 3 (Sprint 4)                              │
└─────────────────────────────────────────────────────────────────────────────┘

⏰ EXECUÇÃO: Mensal (junto com fechamento de CV)
   │
   ▼
Para cada membro:
   │
   ├── 1️⃣ CONTA PARCEIRAS ATIVAS EM N1
   │   │
   │   │   Se >= 3 Parceiras Ativas em N1 por 1 mês:
   │   │   └── Credita R$ 250 (Bônus 3 Nível 1)
   │   │
   │   ▼
   ├── 2️⃣ VERIFICA CADA N1
   │   │
   │   │   Para cada N1 que tem 3 Parceiras Ativas:
   │   │   └── Credita R$ 1.500 (Bônus 3 Nível 2)
   │   │
   │   ▼
   └── 3️⃣ VERIFICA CADA N2
       │
       │   Para cada N2 que tem 3 Parceiras Ativas:
       │   └── Credita R$ 8.000 (Bônus 3 Nível 3)
       │
       └── FIM DO FLUXO
```

### Fluxo do Royalty:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DO ROYALTY (Sprint 4)                              │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ HEAD (N0) FORMA HEAD (N1)
   │
   │  N1 atinge requisitos de Head:
   │  ├── 3 Diretoras Ativas em N1
   │  └── 200.000 CV na rede
   │
   ▼
2️⃣ REDE DE N1 SE SEPARA
   │
   │  A rede abaixo de N1 agora pertence a N1
   │  N0 não perde status de Head (mantém sua rede)
   │
   ▼
3️⃣ N0 RECEBE ROYALTY
   │
   │  Para cada pedido na rede de N1:
   │  └── N0 recebe 3% CV
   │
   │  Registrado em commission_ledger:
   │  └── commission_type = 'royalty'
   │
   └── FIM DO FLUXO
```

## Testes Realizados e Resultados

### Relatório de Testes Sprint 4 (10/01/2026)

| Categoria | Total | Passou | Falhou | Taxa |
|-----------|-------|--------|--------|------|
| Schema/Estrutura | 9 | 9 | 0 | 100% |
| RPC Functions | 14 | 14 | 0 | 100% |
| RLS Policies | 2 | 2 | 0 | 100% |
| Integridade | 1 | 1 | 0 | 100% |
| Índices | 6 | 6 | 0 | 100% |
| Dashboard Membro | 7 | 7 | 0 | 100% |
| Painel Admin | 5 | 5 | 0 | 100% |
| **TOTAL** | **44** | **44** | **0** | **100%** |

### Testes de Comissão Perpétua (Função RPC)

| Sponsor | Comprador | Resultado | Esperado | Status |
|---------|-----------|-----------|----------|--------|
| parceira | membro | 5.00% | 5% (cliente) | ✅ |
| parceira | parceira | 0.00% | 0% (NÃO recebe) | ✅ |
| parceira | lider | 0.00% | 0% (NÃO recebe) | ✅ |
| lider | membro | 5.00% | 5% (cliente) | ✅ |
| lider | parceira | 7.00% | 7% (rede) | ✅ |
| diretora | membro | 5.00% | 5% (cliente) | ✅ |
| diretora | parceira | 7.00% | 7% (parceira) | ✅ |
| diretora | lider | 10.00% | 10% (líder) | ✅ |
| head | membro | 5.00% | 5% (cliente) | ✅ |
| head | parceira | 7.00% | 7% (parceira) | ✅ |
| head | lider | 10.00% | 10% (líder N1) | ✅ |

### Cenário: Fast-Track 30 dias ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | N0 traz N1 no dia 1 | Janela Fast-Track inicia | ✅ |
| 2 | N1 compra CV 50 no dia 15 | N0 recebe 30% = R$15 | ✅ |
| 3 | Verificar ledger | Entrada com commission_type='fast_track_30' | ✅ |

### Cenário: Transição Fast-Track → Perpétua ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Após 60 dias | Janela Fast-Track expira | ✅ |
| 2 | N1 compra CV 50 | N0 recebe Perpétua | ✅ |
| 3 | Verificar percentual | Conforme tabela de níveis | ✅ |

## Banco de Dados Criado

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `commission_ledger` | Ledger imutável | member_id, commission_type, amount, cv_base, percentage |
| `commission_balances` | Saldo consolidado | total_earned, total_withdrawn, available_balance |
| `fast_track_windows` | Janelas de 60 dias | sponsor_id, member_id, phase_1_ends_at, phase_2_ends_at |
| `bonus_3_tracking` | Elegibilidade Bônus 3 | active_partners_n1, eligible_level_1/2/3 |
| `royalty_networks` | Redes separadas | original_head_id, new_head_id, royalty_percentage |

---

# 💸 SPRINT 5 — Saques + Fiscal ✅

**Data de conclusão:** 15/01/2026  
**FRs cobertos:** FR-28, FR-29, FR-30, FR-31, FR-32 | FR-33 ⚠️ (aguardando TBD-018)

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Saldo em análise | FR-28 | ✅ | Período de trava configurável |
| 2 | Solicitação de saque | FR-29 | ✅ | Formulário com validação PF/PJ |
| 3 | Upload de NF-e | FR-30 | ✅ | PJ envia nota fiscal |
| 4 | Emissão de RPA | FR-31 | ✅ | Geração automática para PF |
| 5 | Workflow de aprovação | FR-32 | ✅ | Admin aprova/rejeita saques |
| 6 | Integração de pagamento | FR-33 | ⚠️ | Aguardando definição fintech |

## Fluxo de Funcionamento

### Como funciona a solicitação de saque:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE SOLICITAÇÃO DE SAQUE (Sprint 5)                 │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO ACESSA "MEUS SAQUES"
   │
   │  URL: /dashboard/payouts
   │
   ▼
2️⃣ SISTEMA EXIBE SALDO DISPONÍVEL
   │
   │  ├── Saldo total (commission_balances.total_earned)
   │  ├── Já sacado (commission_balances.total_withdrawn)
   │  ├── Em análise (commission_balances.pending_amount)
   │  └── Disponível (available_balance)
   │
   ▼
3️⃣ MEMBRO PREENCHE FORMULÁRIO
   │
   │  ├── Valor do saque
   │  ├── Tipo de pessoa (PF ou PJ)
   │  ├── CPF ou CNPJ
   │  └── Dados bancários (banco, agência, conta, PIX)
   │
   ▼
4️⃣ SISTEMA VALIDA REQUISITOS
   │
   │  ├── Saldo disponível >= valor solicitado?
   │  ├── Valor >= mínimo (R$100)?
   │  ├── Se PF: limite mensal não excedido (R$1.000)?
   │  └── Dados bancários válidos?
   │
   ▼
5️⃣ SISTEMA CRIA SOLICITAÇÃO
   │
   │  ├── Cria registro em payout_requests
   │  │   ├── status: 'pending' (PF) ou 'awaiting_document' (PJ)
   │  │   └── Dados bancários criptografados
   │  ├── Atualiza commission_balances.pending_amount
   │  └── Cria entrada em payout_history (auditoria)
   │
   ▼
6️⃣ FLUXO PF vs PJ
   │
   │  SE PF:
   │  ├── Sistema gera RPA automaticamente
   │  └── Status = 'pending' (aguarda aprovação admin)
   │
   │  SE PJ:
   │  ├── Status = 'awaiting_document'
   │  └── Membro deve enviar NF-e
   │
   └── FIM DO FLUXO
```

### Fluxo de Upload de NF-e (PJ):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE UPLOAD NF-e (Sprint 5)                          │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ MEMBRO PJ COM SAQUE PENDENTE
   │
   │  Status da solicitação: 'awaiting_document'
   │
   ▼
2️⃣ MEMBRO FAZ UPLOAD DA NF-e
   │
   │  POST /api/members/me/payouts/[id]/documents
   │  ├── Arquivo: PDF ou XML da NF-e
   │  ├── Número da nota
   │  ├── Data de emissão
   │  └── Valor da nota
   │
   ▼
3️⃣ SISTEMA ARMAZENA DOCUMENTO
   │
   │  ├── Upload para Supabase Storage (bucket: payout-documents)
   │  ├── Cria registro em payout_documents
   │  │   ├── document_type: 'nfe'
   │  │   ├── validation_status: 'pending'
   │  │   └── Metadados do arquivo
   │  └── Atualiza status da solicitação para 'under_review'
   │
   ▼
4️⃣ ADMIN VALIDA NF-e
   │
   │  ├── Verifica se valor da NF-e = valor do saque
   │  ├── Verifica CNPJ emissor = CNPJ do membro
   │  └── Aprova ou rejeita documento
   │
   └── FIM DO FLUXO
```

### Fluxo de Aprovação (Admin):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE APROVAÇÃO ADMIN (Sprint 5)                      │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ ADMIN ACESSA "GESTÃO DE SAQUES"
   │
   │  URL: /admin/payouts
   │
   ▼
2️⃣ LISTA DE SOLICITAÇÕES PENDENTES
   │
   │  Filtros disponíveis:
   │  ├── Por status (pending, under_review, approved, rejected)
   │  ├── Por tipo (PF/PJ)
   │  └── Por membro
   │
   ▼
3️⃣ ADMIN ANALISA SOLICITAÇÃO
   │
   │  GET /api/admin/payouts/[id]
   │  ├── Dados do membro
   │  ├── Histórico de saques
   │  ├── Documentos anexados (NF-e, RPA)
   │  └── Timeline de status
   │
   ▼
4️⃣ ADMIN APROVA OU REJEITA
   │
   │  PATCH /api/admin/payouts
   │  │
   │  │  SE APROVAR:
   │  │  ├── Status = 'approved'
   │  │  ├── Atualiza commission_balances.total_withdrawn
   │  │  ├── Zera pending_amount
   │  │  └── Registra em payout_history
   │  │
   │  │  SE REJEITAR:
   │  │  ├── Status = 'rejected'
   │  │  ├── Motivo obrigatório
   │  │  ├── Devolve valor para available_balance
   │  │  └── Registra em payout_history
   │
   ▼
5️⃣ PAGAMENTO (manual até TBD-018)
   │
   │  ├── Admin realiza transferência manualmente
   │  ├── Atualiza status para 'paid'
   │  └── Registra comprovante
   │
   └── FIM DO FLUXO
```

## Regras de Saque (IMPORTANTE!)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💰 REGRAS DE SAQUE                                                         │
│                                                                             │
│  PESSOA FÍSICA (PF):                                                        │
│  ├── Limite mensal: R$ 1.000,00                                             │
│  ├── Documento: RPA gerado automaticamente                                  │
│  └── Retenção: ISS + INSS conforme legislação                               │
│                                                                             │
│  PESSOA JURÍDICA (PJ):                                                      │
│  ├── Sem limite mensal                                                      │
│  ├── Documento: NF-e obrigatória                                            │
│  └── Validação: valor NF-e = valor do saque                                 │
│                                                                             │
│  GERAL:                                                                     │
│  ├── Valor mínimo: R$ 100,00                                                │
│  ├── Período de trava: Net-15 (disponível 15 dias após virada do mês)       │
│  ├── Pagamento: via Asaas (PIX/TED)                                         │
│  └── Cancelamento: Chargeback, Cancelamento ou Devolução apagam comissão    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Testes Realizados e Resultados

### Cenário 1: Solicitação de saque PF ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Acessar /dashboard/payouts | Página carrega com saldo | ✅ |
| 2 | Preencher formulário PF | Validação de CPF | ✅ |
| 3 | Solicitar R$100 | Solicitação criada | ✅ |
| 4 | Verificar payout_requests | Status = 'pending' | ✅ |
| 5 | Verificar limite mensal | Atualizado em payout_monthly_limits | ✅ |

### Cenário 2: Solicitação de saque PJ ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Preencher formulário PJ | Validação de CNPJ | ✅ |
| 2 | Solicitar R$500 | Status = 'awaiting_document' | ✅ |
| 3 | Upload NF-e | Documento armazenado | ✅ |
| 4 | Verificar status | Mudou para 'under_review' | ✅ |

### Cenário 3: Aprovação pelo Admin ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Acessar /admin/payouts | Lista de solicitações | ✅ |
| 2 | Filtrar por 'pending' | Apenas pendentes | ✅ |
| 3 | Aprovar solicitação | Status = 'approved' | ✅ |
| 4 | Verificar commission_balances | total_withdrawn atualizado | ✅ |

### Cenário 4: Rejeição pelo Admin ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | Rejeitar solicitação | Motivo obrigatório | ✅ |
| 2 | Verificar status | Status = 'rejected' | ✅ |
| 3 | Verificar saldo | Valor devolvido | ✅ |

### Cenário 5: Limite PF mensal ✅
| Passo | Ação | Resultado Esperado | Status |
|-------|------|-------------------|--------|
| 1 | PF solicita R$1.000 | Aprovado | ✅ |
| 2 | PF solicita mais R$100 | Erro: limite excedido | ✅ |
| 3 | Próximo mês | Limite resetado | ✅ |

## Banco de Dados Criado

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `payout_requests` | Solicitações de saque | member_id, amount, status, person_type, bank_* |
| `payout_documents` | Documentos anexados | payout_request_id, document_type, file_path, validation_status |
| `payout_history` | Histórico de mudanças | payout_request_id, old_status, new_status, changed_by |
| `payout_monthly_limits` | Controle limite PF | member_id, month_year, total_requested, total_approved |

---

# 🏆 SPRINT 6 — Admin Avançado ✅

**Data de conclusão:** 20/01/2026  
**FRs cobertos:** FR-12, FR-34, FR-35, FR-36, FR-37, FR-38

## O que foi entregue

| # | Funcionalidade | FR | Status | Descrição |
|---|----------------|-----|--------|-----------|
| 1 | Regra de 6 meses inativo | FR-12 | ✅ | Compressão automática de rede |
| 2 | Dashboard global | FR-35 | ✅ | KPIs completos via API |
| 3 | Filtros por comissão | FR-36 | ✅ | Filtro por tipo na API |
| 4 | Gestão de membro | FR-37 | ✅ | Editar, ajustar, bloquear |
| 5 | Gestão de tags | FR-38 | ✅ | CRUD + sync Shopify |
| 6 | Gestão de admins | FR-34 | ⚠️ | CRUD básico (sem multi-admin) |

## Regra de 6 Meses Inativo (FR-12)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPRESSÃO DE REDE (6 MESES INATIVO)                     │
└─────────────────────────────────────────────────────────────────────────────┘

ANTES DA COMPRESSÃO:

    [Sponsor A]
         │
    [Membro X] ← 6 meses sem atingir 200 CV
         │
    ┌────┴────┐
    │         │
[Indicado 1] [Indicado 2]

DEPOIS DA COMPRESSÃO:

    [Sponsor A]
         │
    ┌────┴────┐
    │         │
[Indicado 1] [Indicado 2]

[Membro X] → status = 'removed', sponsor_id = null
```

### Como funciona:
1. Cron job executa no dia 1 de cada mês às 04:00 UTC
2. Identifica membros com 6+ meses consecutivos sem 200 CV
3. Move indicados para o sponsor do membro removido
4. Marca membro como `status = 'removed'`
5. Registra em auditoria (`member_level_history`)

## APIs Criadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/stats` | GET | KPIs globais (membros, CV, comissões, saques) |
| `/api/admin/members/[id]` | GET | Detalhes completos do membro |
| `/api/admin/members/[id]` | PATCH | Editar, ajustar nível, bloquear |
| `/api/admin/members/[id]/tags` | GET/POST/DELETE | Gestão de tags |
| `/api/cron/network-compression` | GET | Cron de compressão de rede |

## Funções RPC Criadas

| Função | Descrição |
|--------|-----------|
| `get_global_stats()` | Estatísticas globais otimizadas |
| `get_members_by_level()` | Contagem de membros por nível |
| `compress_inactive_member(uuid)` | Comprime rede de membro inativo |

---

# 🎁 SPRINT 7 — Creatina Mensal ⚠️

**Data de início:** 20/01/2026  
**Status:** PARCIAL (85%)  
**TBD-019:** ✅ RESOLVIDO

## O que foi entregue

| # | Funcionalidade | Status | Descrição |
|---|----------------|--------|-----------|
| 1 | Decisão TBD-019 | ✅ | Desconto 100% no pedido real |
| 2 | Tabela de controle | ✅ | `free_creatine_claims` |
| 3 | API de elegibilidade | ✅ | `GET /api/members/me/free-creatine` |
| 4 | API de registro | ✅ | `POST /api/members/me/free-creatine` |
| 5 | Card no dashboard | ✅ | Mostra status do benefício |
| 6 | Shopify Discount | ⏳ | Configuração na loja pendente |

## Regra da Creatina Grátis (TBD-019)

**Quem tem direito:**
- Membro **Ativo** (CV >= 200 no mês)
- Limite: **1 unidade por mês**
- **Não acumula** para o próximo mês

**Como funciona:**
1. Membro acessa o dashboard e vê o card "Creatina Grátis do Mês"
2. Se elegível, adiciona a creatina ao carrinho em um pedido real
3. O desconto de 100% é aplicado automaticamente no checkout
4. Sistema registra o uso (1x por mês)

**Estados do card:**
- 🟢 **Disponível** - Membro ativo, ainda não usou
- 🟡 **Já utilizado** - Membro usou este mês
- ⚪ **Indisponível** - Membro não atingiu 200 CV

## Fluxo Técnico

```
Membro Ativo (200 CV)
       ↓
Dashboard mostra "Creatina Disponível"
       ↓
Membro adiciona creatina ao carrinho
       ↓
Shopify Discount aplica 100% OFF (1 unidade)
       ↓
Webhook de pedido chama claim_free_creatine()
       ↓
Tabela free_creatine_claims registra uso
       ↓
Dashboard mostra "Já utilizado"
```

## APIs Criadas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/members/me/free-creatine` | GET | Verifica elegibilidade |
| `/api/members/me/free-creatine` | POST | Registra uso |

## Funções RPC Criadas

| Função | Descrição |
|--------|-----------|
| `check_free_creatine_eligibility(uuid)` | Verifica se membro pode usar |
| `claim_free_creatine(uuid, uuid)` | Registra uso da creatina |

## Próximos Passos (Pendente)

1. **Configurar no Shopify:**
   - Criar Discount Function ou Script para aplicar 100% OFF
   - Definir qual produto é a "creatina" (SKU/variant)
   - Limitar a 1 unidade por pedido

2. **Webhook de pedido:**
   - Detectar quando creatina foi comprada com desconto
   - Chamar `claim_free_creatine()` automaticamente

3. **Testar fluxo completo**

---

# 🔮 SPRINTS FUTUROS

## Sprint 8 — Integrações ⏳

**Funcionalidades planejadas:**
- Integração Asaas automática (após credenciais)
- Configuração Shopify Discount para creatina
- Melhorias de UX baseadas em feedback

---

# 🧪 COMO TESTAR

## URLs de Acesso

| Página | URL |
|--------|-----|
| Home | https://rlp-biohelp.vercel.app/ |
| Login | https://rlp-biohelp.vercel.app/login |
| Cadastro | https://rlp-biohelp.vercel.app/join?ref=SPONSOR01 |
| Dashboard | https://rlp-biohelp.vercel.app/dashboard |
| Minha Rede | https://rlp-biohelp.vercel.app/dashboard/network |
| Comissões | https://rlp-biohelp.vercel.app/dashboard/commissions |
| Saques | https://rlp-biohelp.vercel.app/dashboard/payouts |
| Admin | https://rlp-biohelp.vercel.app/admin |
| Admin Saques | https://rlp-biohelp.vercel.app/admin/payouts |

## Logins de Teste

| Portal | Email | Senha |
|--------|-------|-------|
| Admin | admin@biohelp.test | 123456 |
| Parceira | sponsor@biohelp.test | sponsor123 |

## Roteiro de Teste Rápido

### Teste 1: Dashboard da Parceira
1. Acesse https://rlp-biohelp.vercel.app/login
2. Login com: `sponsor@biohelp.test` / `sponsor123`
3. **Resultado esperado:**
   - ✅ Card de CV com valor atual
   - ✅ Barra de progresso da meta (200 CV)
   - ✅ Status "Ativo" (badge verde) se CV >= 200
   - ✅ Link de convite copiável
   - ✅ Informações do sponsor

### Teste 2: Minha Rede
1. No dashboard, clique em "Minha Rede"
2. **Resultado esperado:**
   - ✅ Árvore visual com indicados
   - ✅ Cada nó mostra: nome, status, nível, CV
   - ✅ Estatísticas da rede

### Teste 3: Comissões
1. No dashboard, clique em "Comissões"
2. **Resultado esperado:**
   - ✅ Saldo total
   - ✅ Breakdown por tipo (Fast-Track, Perpétua, etc.)
   - ✅ Histórico de comissões

### Teste 4: Painel Admin
1. Acesse https://rlp-biohelp.vercel.app/login
2. Login com: `admin@biohelp.test` / `123456`
3. **Resultado esperado:**
   - ✅ Lista de parceiras
   - ✅ Busca por nome/email
   - ✅ Botão "CV" para ver detalhes
   - ✅ Botão "Resync" para sincronizar Shopify

---

# 📋 DECISÕES PENDENTES (TBD)

## Críticos para Sprint 6

| TBD | Descrição | FR Bloqueado |
|-----|-----------|--------------|
| - | Nenhum TBD crítico | - |

## Outros Pendentes

| TBD | Descrição | Sprint |
|-----|-----------|--------|
| TBD-001 | Regra para cadastro sem link | 1 |
| TBD-004 | URLs oficiais (staging/prod) | 1 |
| TBD-014 | Nome do metafield CV | 2 |
| TBD-019 | Creatina mensal grátis | 7 |

## Resolvidos ✅

| TBD | Descrição | Decisão |
|-----|-----------|---------|
| TBD-008 | Cálculo de CV | Via metafield do produto |
| TBD-009 | Refund/cancel | Reverte CV completamente |
| TBD-010 | Job mensal | 1º dia às 00:00 BRT |
| TBD-011 | Regras de níveis | Conforme documento canônico |
| TBD-012 | Profundidade da rede | Ilimitada |
| TBD-013 | Informações visíveis | Nome, email, CV, status, nível |
| TBD-017 | Arredondamento | 2 casas decimais |
| TBD-020 | Cálculo de comissões | Em tempo real |
| TBD-022 | Perpétua diferenciada | Por tipo de N1 |
| TBD-015 | Limite de saque PF | R$1.000/mês |
| TBD-016 | Valor mínimo para saque | R$100/saque |
| TBD-018 | Integração fintech | Asaas (PIX/TED) |
| TBD-021 | Período de trava | Net-15 (15 dias após virada do mês) |

---

# ✅ CHECKLIST DE ACEITE

## Sprints Concluídos

### Sprint 1 ✅
- [x] Cadastro com link vincula sponsor
- [x] ref_code único gerado
- [x] Customer Shopify criado/atualizado
- [x] Tags aplicadas corretamente
- [x] Dashboard mostra link de convite
- [x] Admin busca membro e executa resync
- [x] RLS ativo

### Sprint 2 ✅
- [x] Webhooks idempotentes
- [x] CV via metafield do produto
- [x] Status muda para active/inactive
- [x] Job mensal fecha mês
- [x] Admin pode ver/ajustar CV
- [x] Ledger auditável

### Sprint 3 ✅
- [x] API de rede funcionando
- [x] API de nível funcionando
- [x] Página "Minha Rede" com árvore visual
- [x] Progresso para próximo nível
- [x] Privacidade de telefone

### Sprint 4 ✅
- [x] Fast-Track 30%/20%
- [x] Perpétua diferenciada por tipo de N1
- [x] Bônus 3 implementado
- [x] Leadership 3%/4%
- [x] Royalty implementado
- [x] Dashboard de comissões
- [x] Ledger auditável

### Sprint 5 ✅
- [x] Solicitação de saque (PF e PJ)
- [x] Validação de saldo disponível
- [x] Upload de NF-e (PJ)
- [x] Geração de RPA (PF)
- [x] Limite mensal PF (R$1.000)
- [x] Valor mínimo R$100/saque
- [x] Net-15 (disponível 15 dias após virada do mês)
- [x] Workflow de aprovação admin
- [x] Histórico de saques
- [x] Integração Asaas definida (aguarda credenciais)

---

# 🎉 STATUS ATUAL

**Sprint 5 — CONCLUÍDO!**

**Data de conclusão:** 15/01/2026

**Próximo passo:** Iniciar Sprint 6 (Admin Avançado) e resolver TBD-018 para integração fintech

**Cobertura de FRs:** 79% (29/38 implementados)

---

**Última atualização:** 19/01/2026
