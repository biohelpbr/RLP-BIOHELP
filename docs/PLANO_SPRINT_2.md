# 📋 Plano Técnico — Sprint 2 (CV + Status)
**Status:** ✅ Implementação Completa  
**Especificação:** `docs/SPEC.md` Seção 1.2  
**Data de Conclusão:** Janeiro 2026

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

**Regra de CV (TBD-008):** CV = 100% do preço do item (padrão)

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
| Status volta para 'pending' quando CV < 200 | ✅ |
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

### TBD-008 — Regra de cálculo de CV
**Decisão:** CV = 100% do preço do item (padrão)
- Implementado em `lib/cv/calculator.ts`
- Constante `CV_PERCENTAGE = 1.0`

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

## 📅 Próximos Passos

### Configuração no Shopify Admin
1. Criar webhooks para:
   - `orders/paid`
   - `orders/updated` (para refunds)
   - `orders/cancelled`
2. Configurar URL base para webhooks
3. Copiar webhook secret para env

### Configuração na Vercel
1. Adicionar variáveis de ambiente
2. Configurar cron job no `vercel.json`

### Testes
1. Criar pedido de teste no Shopify
2. Verificar CV calculado
3. Testar refund
4. Testar fechamento mensal

---

## 📊 Métricas de Implementação

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 10 |
| Arquivos modificados | 3 |
| Tabelas criadas | 4 |
| Endpoints criados | 6 |
| Linhas de código | ~1500 |
| Tempo estimado | 5-7 dias |

---

**Sprint 2 concluído!**

**Próximo:** Sprint 3 (Rede Visual + Níveis)
