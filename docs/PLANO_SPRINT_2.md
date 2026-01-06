# 📋 Plano Técnico — Sprint 2 (CV + Status)
**Status:** Preparação / Aguardando conclusão do Sprint 1  
**Especificação:** `docs/SPEC.md` Seção 1.2

---

## 🎯 Objetivo do Sprint 2

Implementar cálculo de CV (Commission Volume) e status mensal dos membros baseado em pedidos do Shopify.

**Entrega:** "Membro compra → CV é calculado → Status muda para 'active' se CV >= 200 no mês"

---

## 📊 Dependências do Sprint 1

### ✅ O que já está pronto
- Estrutura de membros (`members` table)
- Integração básica com Shopify (customer sync)
- Sistema de tags

### ❌ O que falta (bloqueadores)
- **Autenticação Supabase Auth** (CRÍTICO)
  - Webhooks precisam validar origem
  - Sistema precisa identificar membro por e-mail
- **TBD-001 resolvido** (cadastro sem link)
- **Testes Sprint 1 completos**

---

## 🏗️ Estrutura Técnica do Sprint 2

### 1. Schema do Banco (Supabase)

#### 1.1 Tabela `orders` (espelho do Shopify)
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text UNIQUE NOT NULL,
  shopify_order_number text NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL, -- 'paid', 'refunded', 'cancelled', 'pending'
  paid_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  shopify_data jsonb, -- dados completos do pedido
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_orders_shopify_order_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_paid_at ON orders(paid_at) WHERE status = 'paid';
```

#### 1.2 Tabela `order_items` (itens do pedido)
```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  shopify_line_item_id text NOT NULL,
  product_id text, -- Shopify product ID
  variant_id text, -- Shopify variant ID
  title text NOT NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  cv_value decimal(10,2) NOT NULL DEFAULT 0, -- CV calculado para este item
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

#### 1.3 Tabela `cv_ledger` (auditável e imutável)
```sql
CREATE TABLE cv_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  cv_amount decimal(10,2) NOT NULL,
  cv_type text NOT NULL, -- 'order_paid', 'order_refunded', 'order_cancelled', 'manual_adjustment'
  month_year text NOT NULL, -- formato 'YYYY-MM' (ex: '2025-01')
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES members(id) ON DELETE SET NULL -- se for ajuste manual
);

CREATE INDEX idx_cv_ledger_member_id ON cv_ledger(member_id);
CREATE INDEX idx_cv_ledger_month_year ON cv_ledger(month_year);
CREATE INDEX idx_cv_ledger_member_month ON cv_ledger(member_id, month_year);
```

#### 1.4 Atualizar tabela `members`
```sql
-- Adicionar campos para CV e status
ALTER TABLE members ADD COLUMN IF NOT EXISTS current_cv_month decimal(10,2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS current_cv_month_year text; -- 'YYYY-MM'
ALTER TABLE members ADD COLUMN IF NOT EXISTS last_cv_calculation_at timestamptz;
```

### 2. Webhooks Shopify

#### 2.1 Endpoint: `POST /api/webhooks/shopify/orders/paid`
**Especificação:** SPEC 8.3, 7.3

**Funcionalidades:**
- Receber webhook do Shopify quando pedido é pago
- Validar assinatura HMAC (segurança)
- Verificar idempotência (não processar mesmo pedido 2x)
- Buscar customer por e-mail
- Buscar member no Supabase por e-mail
- Criar registro em `orders` e `order_items`
- Calcular CV por item (regra a definir)
- Registrar no `cv_ledger`
- Atualizar `members.current_cv_month`
- Verificar se status deve mudar para 'active' (CV >= 200)

**Estrutura do webhook:**
```typescript
interface ShopifyOrderPaidWebhook {
  id: string
  order_number: number
  email: string
  financial_status: 'paid'
  total_price: string
  currency: string
  line_items: Array<{
    id: string
    product_id: string
    variant_id: string
    title: string
    quantity: number
    price: string
  }>
  created_at: string
  updated_at: string
}
```

#### 2.2 Endpoint: `POST /api/webhooks/shopify/orders/refunded`
**Funcionalidades:**
- Reverter CV quando pedido é reembolsado
- Atualizar status do pedido para 'refunded'
- Registrar reversão no `cv_ledger`
- Recalcular CV mensal
- Verificar se status deve voltar para 'pending' (CV < 200)

#### 2.3 Endpoint: `POST /api/webhooks/shopify/orders/cancelled`
**Funcionalidades:**
- Similar ao refunded, mas para cancelamentos

### 3. Cálculo de CV

#### 3.1 Regra de CV por produto (TBD)
**Pendente:** Definir como calcular CV por item
- Opção A: CV = preço do item (100%)
- Opção B: CV = preço do item × porcentagem (ex: 80%)
- Opção C: CV por categoria de produto
- Opção D: CV fixo por produto (metafield no Shopify)

**Implementação sugerida:**
```typescript
// lib/cv/calculator.ts
export function calculateCVForItem(
  item: OrderItem,
  productMetafield?: { namespace: string; key: string; value: string }
): number {
  // Se metafield existe, usar valor do metafield
  if (productMetafield?.value) {
    return parseFloat(productMetafield.value) * item.quantity
  }
  
  // Senão, usar regra padrão (100% do preço)
  return parseFloat(item.price) * item.quantity
}
```

### 4. Job de Fechamento Mensal

#### 4.1 Função: Fechar CV do mês anterior
**Quando:** Primeiro dia de cada mês (cron job)

**Funcionalidades:**
- Buscar todos os membros com `current_cv_month_year` = mês anterior
- Verificar se CV >= 200
- Atualizar `status` para 'active' ou 'inactive'
- Atualizar tag Shopify `lrp_status:active` ou `lrp_status:inactive`
- Resetar `current_cv_month` para 0
- Atualizar `current_cv_month_year` para mês atual

**Implementação:**
```typescript
// app/api/cron/close-monthly-cv/route.ts
// Protegido por secret (Vercel Cron ou similar)
```

### 5. API Endpoints

#### 5.1 `GET /api/members/me/cv`
**Retorna:**
```json
{
  "currentMonth": {
    "month": "2025-01",
    "cv": 150.00,
    "target": 200.00,
    "remaining": 50.00,
    "status": "pending"
  },
  "history": [
    {
      "month": "2024-12",
      "cv": 250.00,
      "status": "active"
    }
  ]
}
```

#### 5.2 `GET /api/admin/members/:id/cv`
**Retorna:** CV detalhado do membro (admin)

#### 5.3 `POST /api/admin/members/:id/cv/adjust`
**Funcionalidade:** Ajuste manual de CV (admin)
**Body:**
```json
{
  "amount": 50.00,
  "description": "Ajuste manual - bônus especial",
  "month": "2025-01"
}
```

### 6. Dashboard (Atualização)

#### 6.1 Exibir CV no dashboard
- CV do mês atual
- Progresso para 200 CV (barra de progresso)
- Status atual (pending/active/inactive)
- Histórico de meses anteriores

---

## 🔒 Segurança e RLS

### RLS Policies

#### `orders`
- Member pode ler apenas seus próprios pedidos
- Admin pode ler todos

#### `order_items`
- Member pode ler apenas itens de seus próprios pedidos
- Admin pode ler todos

#### `cv_ledger`
- Member pode ler apenas seu próprio ledger
- Admin pode ler todos
- Apenas admin pode criar (ajustes manuais)

---

## 📝 TBDs do Sprint 2

### TBD-008 — Regra de cálculo de CV por produto
**Opções:**
- A) CV = 100% do preço
- B) CV = preço × porcentagem fixa
- C) CV por categoria
- D) CV via metafield no produto Shopify

### TBD-009 — Comportamento de refund/cancel
- Reverter CV completamente?
- Reverter parcialmente?
- Manter CV mas marcar como "cancelado"?

### TBD-010 — Job de fechamento mensal
- Quando executar? (1º dia do mês, último dia do mês anterior?)
- Timezone?
- O que fazer com pedidos pagos no último dia?

---

## ✅ Checklist de Aceite (Sprint 2)

Conforme `docs/ACCEPTANCE.md`:

- [ ] Webhook `orders/paid` processa corretamente
- [ ] Webhook `orders/refunded` reverte CV corretamente
- [ ] Webhook `orders/cancelled` reverte CV corretamente
- [ ] Idempotência: mesmo pedido não duplica CV
- [ ] CV mensal soma corretamente
- [ ] Status muda para 'active' quando CV >= 200
- [ ] Status volta para 'pending' quando CV < 200
- [ ] Job mensal fecha mês corretamente
- [ ] Dashboard mostra CV atual
- [ ] Admin pode ver CV de qualquer membro
- [ ] Admin pode fazer ajuste manual de CV
- [ ] Ledger é imutável (auditável)

---

## 🚧 Limitações e Considerações

1. **Webhooks precisam de autenticação:**
   - Validar HMAC do Shopify
   - Endpoint deve ser público (Shopify chama de fora)
   - Mas validar origem via secret

2. **Idempotência:**
   - Usar `shopify_order_id` como chave única
   - Verificar se pedido já foi processado antes de criar

3. **Performance:**
   - Webhooks devem ser rápidos (< 5s)
   - Processar cálculo de CV de forma assíncrona se necessário
   - Usar índices no banco

4. **Dados do Shopify:**
   - Webhook pode não ter todos os dados
   - Pode precisar fazer query adicional na Admin API

---

## 📅 Estimativa

**Tempo total:** 5-7 dias úteis

- Schema e migrations: 1 dia
- Webhooks (3 endpoints): 2-3 dias
- Cálculo de CV: 1 dia
- Job mensal: 1 dia
- Dashboard atualizado: 1 dia
- Testes: 1 dia

---

## 🎯 Próximos Passos (Após Sprint 1)

1. **Completar Sprint 1:**
   - ✅ Autenticação Supabase Auth
   - ✅ Resolver TBD-001
   - ✅ Testes completos

2. **Preparar Sprint 2:**
   - ✅ Definir TBD-008 (regra de CV)
   - ✅ Configurar webhooks no Shopify Admin
   - ✅ Testar webhooks em ambiente de desenvolvimento

3. **Implementar Sprint 2:**
   - ✅ Seguir este plano técnico
   - ✅ Validar com critérios de aceite

---

**Documento relacionado:** `docs/SPEC.md` Seção 1.2, 8.3, 9.5

