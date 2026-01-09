# 📋 Plano Técnico — Sprint 2 (CV + Status) + Sprint 3 (Rede + Níveis)

## Parte 1: Sprint 2 (CV + Status) — ✅ CONCLUÍDO

**Status:** ✅ CONCLUÍDO E VALIDADO EM PRODUÇÃO  
**Especificação:** `docs/SPEC.md` Seção 1.2  
**Data de Conclusão:** 08/01/2026  
**Validação:** Webhooks testados em produção na Vercel

---

## 🎯 Objetivo do Sprint 2

Implementar cálculo de CV (Commission Volume) e status mensal dos membros baseado em pedidos do Shopify.

**Entrega:** "Membro compra → CV é calculado → Status muda para 'active' se CV >= 200 no mês"

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Schema do Banco (Supabase) ✅

#### 1.1 Tabela `orders` (espelho do Shopify)
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text UNIQUE NOT NULL,
  shopify_order_number text NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  total_cv decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  shopify_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 1.2 Tabela `order_items` (itens do pedido)
```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  shopify_line_item_id text NOT NULL,
  product_id text,
  variant_id text,
  sku text,
  title text NOT NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  cv_value decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### 1.3 Tabela `cv_ledger` (auditável e imutável)
```sql
CREATE TABLE cv_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  cv_amount decimal(10,2) NOT NULL,
  cv_type text NOT NULL, -- 'order_paid', 'order_refunded', 'order_cancelled', 'manual_adjustment'
  month_year text NOT NULL, -- formato 'YYYY-MM'
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES members(id) ON DELETE SET NULL
);
```

#### 1.4 Tabela `cv_monthly_summary`
```sql
CREATE TABLE cv_monthly_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL,
  total_cv decimal(10,2) NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  status_at_close text,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, month_year)
);
```

#### 1.5 Campos adicionados em `members`
```sql
ALTER TABLE members 
  ADD COLUMN current_cv_month decimal(10,2) DEFAULT 0,
  ADD COLUMN current_cv_month_year text,
  ADD COLUMN last_cv_calculation_at timestamptz;
```

**Arquivo:** `supabase/migrations/20260107_sprint2_cv_tables.sql`

---

### 2. RLS Policies ✅

Políticas implementadas para todas as novas tabelas:
- Members podem ler apenas seus próprios dados
- Admins podem ler todos os dados
- Apenas service_role pode inserir/atualizar (via webhooks)

**Arquivo:** `supabase/migrations/20260107_sprint2_rls_policies.sql`

---

### 3. Webhooks Shopify ✅

#### 3.1 `POST /api/webhooks/shopify/orders/paid`
- ✅ Validação HMAC
- ✅ Verificação de idempotência
- ✅ Busca de membro por e-mail
- ✅ Criação de order e order_items
- ✅ Cálculo de CV por item
- ✅ Registro no cv_ledger
- ✅ Atualização de CV mensal do membro
- ✅ Verificação de status (active se CV >= 200)
- ✅ Atualização de tags no Shopify

**Arquivo:** `app/api/webhooks/shopify/orders/paid/route.ts`

#### 3.2 `POST /api/webhooks/shopify/orders/refunded`
- ✅ Reversão de CV
- ✅ Atualização de status do pedido
- ✅ Registro de reversão no cv_ledger
- ✅ Recálculo de CV mensal
- ✅ Verificação de mudança de status

**Arquivo:** `app/api/webhooks/shopify/orders/refunded/route.ts`

#### 3.3 `POST /api/webhooks/shopify/orders/cancelled`
- ✅ Reversão de CV
- ✅ Atualização de status do pedido
- ✅ Registro de reversão no cv_ledger
- ✅ Recálculo de CV mensal

**Arquivo:** `app/api/webhooks/shopify/orders/cancelled/route.ts`

---

### 4. Cálculo de CV ✅

#### Biblioteca: `lib/cv/calculator.ts`
- ✅ `calculateItemCV()` - CV por item
- ✅ `calculateOrderCV()` - CV total do pedido
- ✅ `processShopifyLineItems()` - Processar itens do Shopify
- ✅ `createCVLedgerEntriesForOrder()` - Criar entradas no ledger
- ✅ `createCVLedgerReversalEntries()` - Criar reversões
- ✅ `createCVManualAdjustment()` - Ajuste manual
- ✅ Funções auxiliares (getCurrentMonthYear, isActiveCV, etc.)

**Regra de CV (TBD-008):** CV é definido por produto (metacampo/metafield CV na Shopify) e pode ser diferente do preço.
CV do pedido = Σ(CV_do_produto × quantidade). Ex.: Lemon Dreams (R$159) gera CV=77.

---

### 5. API Endpoints ✅

#### 5.1 `GET /api/members/me/cv`
Retorna CV do membro autenticado:
```json
{
  "currentMonth": {
    "month": "2026-01",
    "cv": 150.00,
    "target": 200.00,
    "remaining": 50.00,
    "status": "pending",
    "percentage": 75
  },
  "history": [...]
}
```

**Arquivo:** `app/api/members/me/cv/route.ts`

#### 5.2 `GET /api/admin/members/:id/cv`
Retorna CV detalhado de um membro (admin):
- Dados do membro
- CV do mês atual
- Histórico de meses
- Ledger detalhado
- Pedidos do mês

**Arquivo:** `app/api/admin/members/[id]/cv/route.ts`

#### 5.3 `POST /api/admin/members/:id/cv`
Ajuste manual de CV (admin):
```json
{
  "amount": 50.00,
  "description": "Ajuste manual - bônus especial",
  "month": "2026-01"
}
```

---

### 6. Job de Fechamento Mensal ✅

#### `GET /api/cron/close-monthly-cv`
- ✅ Executar no 1º dia do mês
- ✅ Fechar CV do mês anterior
- ✅ Atualizar status de todos os membros
- ✅ Atualizar tags no Shopify
- ✅ Resetar CV para o novo mês
- ✅ Proteção por secret

**Arquivo:** `app/api/cron/close-monthly-cv/route.ts`

**Configuração Vercel:**
```json
{
  "crons": [{
    "path": "/api/cron/close-monthly-cv",
    "schedule": "0 3 1 * *"
  }]
}
```

---

### 7. Frontend ✅

#### Dashboard atualizado com:
- ✅ Card de CV com progresso visual
- ✅ Barra de progresso para meta de 200 CV
- ✅ Status atual (pending/active/inactive)
- ✅ Histórico de meses anteriores
- ✅ Indicação de quanto falta para ativar

**Arquivos:**
- `app/dashboard/page.tsx`
- `app/dashboard/page.module.css`

---

### 8. Tipos TypeScript ✅

Novos tipos adicionados em `types/database.ts`:
- `Order`, `OrderInsert`
- `OrderItem`, `OrderItemInsert`
- `CVLedger`, `CVLedgerInsert`
- `CVMonthlySummary`, `CVMonthlySummaryInsert`
- `MemberCVResponse`
- `CVAdjustmentRequest`

---

## 📋 Checklist de Aceite (Sprint 2)

| Critério | Status |
|----------|--------|
| Webhook `orders/paid` processa corretamente | ✅ |
| Webhook `orders/refunded` reverte CV | ✅ |
| Webhook `orders/cancelled` reverte CV | ✅ |
| Idempotência: mesmo pedido não duplica CV | ✅ |
| CV mensal soma corretamente | ✅ |
| Status muda para 'active' quando CV >= 200 | ✅ |
| Status volta para 'inactive' quando CV < 200 | ✅ |
| Job mensal fecha mês corretamente | ✅ |
| Dashboard mostra CV atual | ✅ |
| Admin pode ver CV de qualquer membro | ✅ |
| Admin pode fazer ajuste manual de CV | ✅ |
| Ledger é imutável (auditável) | ✅ |

---

## 🔒 Segurança

### Webhooks
- ✅ Validação HMAC do Shopify
- ✅ Verificação de shop domain
- ✅ Logs estruturados

### RLS
- ✅ Policies para todas as novas tabelas
- ✅ Members só veem seus próprios dados
- ✅ Admins podem ver todos os dados

### Cron Job
- ✅ Protegido por CRON_SECRET
- ✅ Aceita header do Vercel Cron

---

## 📝 TBDs Resolvidos

### TBD-008 — Regra de cálculo de CV (CORRIGIDO)
**Decisão (alinhada ao doc mestre):** CV do pedido = soma dos CVs dos itens (metacampo por produto).
- Ex.: Lemon Dreams (R$159) pode ter CV 77.
- Implementado em `lib/cv/calculator.ts` - prioriza metafield do produto
- Fallback: se não houver metacampo, usar preço do item e logar warning

### TBD-009 — Comportamento de refund/cancel
**Decisão:** Reverter CV completamente
- Implementado nos webhooks de refund e cancel
- Valores negativos no cv_ledger

### TBD-010 — Job de fechamento mensal
**Decisão:**
- Executar: 1º dia do mês às 03:00 UTC (00:00 BRT)
- Timezone: UTC-3 (America/Sao_Paulo)
- Pedidos: Considerados até 23:59:59 do mês anterior

---

## 📂 Arquivos Criados/Modificados

### Novos Arquivos
- `supabase/migrations/20260107_sprint2_cv_tables.sql`
- `supabase/migrations/20260107_sprint2_rls_policies.sql`
- `lib/cv/calculator.ts`
- `lib/shopify/webhook.ts`
- `app/api/webhooks/shopify/orders/paid/route.ts`
- `app/api/webhooks/shopify/orders/refunded/route.ts`
- `app/api/webhooks/shopify/orders/cancelled/route.ts`
- `app/api/members/me/cv/route.ts`
- `app/api/admin/members/[id]/cv/route.ts`
- `app/api/cron/close-monthly-cv/route.ts`

### Arquivos Modificados
- `types/database.ts` - Novos tipos
- `app/dashboard/page.tsx` - Exibição de CV
- `app/dashboard/page.module.css` - Estilos de CV

---

## 🔧 Variáveis de Ambiente Necessárias

```env
# Existentes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SHOPIFY_STORE_DOMAIN=...
SHOPIFY_ADMIN_API_TOKEN=...

# Novas (Sprint 2)
SHOPIFY_WEBHOOK_SECRET=...  # Secret para validação HMAC
CRON_SECRET=...             # Secret para proteger cron job
```

---

## ✅ Configuração Realizada (08/01/2026)

### Shopify Admin ✅
1. ✅ Webhook `orders/paid` configurado
2. ✅ Webhook `orders/refunded` configurado
3. ✅ Webhook `orders/cancelled` configurado
4. ✅ Webhook secret copiado para Vercel

### Vercel ✅
1. ✅ Variáveis de ambiente configuradas
2. ✅ `vercel.json` com cron job
3. ✅ Deploy realizado e testado

### Validação em Produção ✅
1. ✅ Webhook simulado processado com sucesso
2. ✅ CV calculado corretamente (R$ 150 por pedido)
3. ✅ CV mensal acumulado (R$ 550 total)
4. ✅ Idempotência funcionando (não duplica pedidos)
5. ✅ Status atualizado para "active"

---

## 📊 Métricas de Implementação

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 10 |
| Arquivos modificados | 3 |
| Tabelas criadas | 4 |
| Endpoints criados | 6 |
| Linhas de código | ~1500 |
| Tempo de implementação | 2 dias |

---

## 🎉 Sprint 2 — CONCLUÍDO!

**Data de conclusão:** 08/01/2026  
**Validação:** Teste de webhook em produção bem-sucedido

---

# 🚀 PRÓXIMO: Sprint 3 (Rede Visual + Níveis)

## 🎯 Objetivo do Sprint 3

**Especificação:** `docs/SPEC.md` Seção 1.3

Implementar visualização da rede de indicados e cálculo de níveis dos membros.

**Entrega:** "Membro vê sua rede de indicados (N1, N2) e seu nível é calculado automaticamente"

---

## 📋 Escopo do Sprint 3

### 1. Visualização da Rede
- Ver indicados diretos (N1)
- Ver indicados de segundo nível (N2)
- Contagem de membros por nível
- Status de cada membro (ativo/inativo)

### 2. Cálculo de Níveis
Conforme documento canônico (`documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`):

| Nível | Requisitos |
|-------|------------|
| **Membro** | Cliente cadastrada |
| **Parceira** | Membro Ativo + CV_rede >= 500 (inclui próprio membro) |
| **Líder em Formação** | Parceira que trouxe sua primeira Parceira em N1 (janela de 90 dias) |
| **Líder** | Parceira Ativa (N0) + 4 Parceiras Ativas em N1 |
| **Diretora** | N0 com mínimo 3 Líderes Ativas em N1 + 80.000 CV na rede |
| **Head** | N0 com mínimo 3 Diretoras Ativas em N1 + 200.000 CV na rede |

**Regras de perda de nível:**
- Se requisitos deixam de ser atendidos, a Parceira desce de cargo
- Líder perde status se não mantiver 4 Parceiras ativas em N1
- Após 6 meses sem se ativar, perde totalmente o status e sai da rede

### 3. Dashboard Atualizado
- Card de nível atual
- Progresso para próximo nível
- Visualização da árvore de rede

---

## ⚠️ TBDs Necessários para Sprint 3

Antes de iniciar o Sprint 3, precisamos de decisões do cliente:

### TBD-011 — Regras de progressão de nível ✅ RESOLVIDO
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`

**Critérios definidos:**
- Membro → Parceira: Membro Ativo + CV_rede >= 500
- Parceira → Líder em Formação: Trouxe primeira Parceira em N1 (90 dias de janela)
- Parceira → Líder: Parceira Ativa + 4 Parceiras Ativas em N1
- Líder → Diretora: 3 Líderes Ativas em N1 + 80.000 CV na rede
- Diretora → Head: 3 Diretoras Ativas em N1 + 200.000 CV na rede

### TBD-012 — Profundidade da rede visível
**Pergunta:** Quantos níveis o membro pode ver?
- **A)** Apenas N1 (indicados diretos)
- **B)** N1 + N2 (2 níveis)
- **C)** N1 + N2 + N3 (3 níveis)
- **D)** Toda a rede abaixo

### TBD-013 — Informações visíveis dos indicados
**Pergunta:** O que o membro pode ver sobre seus indicados?
- Nome completo ou apenas primeiro nome?
- Email visível?
- CV do indicado visível?
- Status (ativo/inativo)?
- Nível do indicado?

---

## 📐 Arquitetura Proposta (Sprint 3)

### Banco de Dados

#### Opção A: Usar tabela existente `members`
```sql
-- Campos já existentes
sponsor_id uuid REFERENCES members(id)

-- Novos campos
ALTER TABLE members ADD COLUMN level text DEFAULT 'parceira';
ALTER TABLE members ADD COLUMN level_updated_at timestamptz;
```

#### Opção B: Criar tabela de níveis
```sql
CREATE TABLE member_levels (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES members(id),
  level text NOT NULL,
  achieved_at timestamptz,
  criteria_snapshot jsonb
);
```

### API Endpoints Previstos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/members/me/network` | GET | Rede do membro (N1, N2) |
| `/api/members/me/level` | GET | Nível atual e progresso |
| `/api/admin/members/:id/network` | GET | Rede de qualquer membro (admin) |

### Frontend

| Componente | Descrição |
|------------|-----------|
| NetworkTree | Visualização em árvore da rede |
| LevelCard | Card com nível atual e progresso |
| NetworkStats | Estatísticas da rede (contagem, CV total) |

---

## 📅 Estimativa Sprint 3

| Item | Estimativa |
|------|------------|
| Schema + Migrations | 0.5 dia |
| API Endpoints | 1 dia |
| Cálculo de Níveis | 1 dia |
| Frontend (Dashboard) | 1 dia |
| Testes | 0.5 dia |
| **Total** | **4 dias** |

---

## ✅ Checklist de Aceite (Sprint 3)

| Critério | Status |
|----------|--------|
| Membro vê seus indicados diretos (N1) | ⏳ |
| Membro vê indicados de N2 (se aprovado) | ⏳ |
| Contagem de indicados por nível | ⏳ |
| Status de cada indicado visível | ⏳ |
| Nível do membro calculado automaticamente | ⏳ |
| Progresso para próximo nível visível | ⏳ |
| Admin pode ver rede de qualquer membro | ⏳ |

---

## 🚦 Bloqueadores

Para iniciar o Sprint 3, precisamos:

1. **TBD-011** resolvido (regras de níveis)
2. **TBD-012** resolvido (profundidade visível)
3. **TBD-013** resolvido (informações visíveis)

**Ação:** Aguardar aprovação do cliente para os TBDs acima.
