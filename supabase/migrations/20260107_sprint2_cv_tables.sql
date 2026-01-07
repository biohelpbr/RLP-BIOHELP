-- =====================================================
-- SPRINT 2 — CV + Status
-- Migration: Criar tabelas orders, order_items, cv_ledger
-- SPEC: Seção 1.2, 9.5
-- Data: 2026-01-07
-- =====================================================

-- =====================================================
-- 1. Tabela orders (espelho do Shopify)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text UNIQUE NOT NULL,
  shopify_order_number text NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  total_cv decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'cancelled'
  paid_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  shopify_data jsonb, -- dados completos do pedido
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_order_id ON orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

COMMENT ON TABLE orders IS 'Espelho dos pedidos do Shopify - SPEC 9.5';
COMMENT ON COLUMN orders.shopify_order_id IS 'ID único do pedido no Shopify (gid://shopify/Order/xxx)';
COMMENT ON COLUMN orders.status IS 'Status do pedido: pending, paid, refunded, cancelled';
COMMENT ON COLUMN orders.total_cv IS 'CV total calculado para este pedido';

-- =====================================================
-- 2. Tabela order_items (itens do pedido)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  shopify_line_item_id text NOT NULL,
  product_id text, -- Shopify product ID
  variant_id text, -- Shopify variant ID
  sku text,
  title text NOT NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  cv_value decimal(10,2) NOT NULL DEFAULT 0, -- CV calculado para este item
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Itens dos pedidos com CV por item';
COMMENT ON COLUMN order_items.cv_value IS 'CV calculado para este item (quantidade * regra de CV)';

-- =====================================================
-- 3. Tabela cv_ledger (auditável e imutável)
-- =====================================================
CREATE TABLE IF NOT EXISTS cv_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  cv_amount decimal(10,2) NOT NULL,
  cv_type text NOT NULL, -- 'order_paid', 'order_refunded', 'order_cancelled', 'manual_adjustment'
  month_year text NOT NULL, -- formato 'YYYY-MM' (ex: '2026-01')
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES members(id) ON DELETE SET NULL -- se for ajuste manual
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cv_ledger_member_id ON cv_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_cv_ledger_month_year ON cv_ledger(month_year);
CREATE INDEX IF NOT EXISTS idx_cv_ledger_member_month ON cv_ledger(member_id, month_year);
CREATE INDEX IF NOT EXISTS idx_cv_ledger_order_id ON cv_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_cv_ledger_cv_type ON cv_ledger(cv_type);

COMMENT ON TABLE cv_ledger IS 'Ledger auditável de CV - imutável - SPEC 9.5';
COMMENT ON COLUMN cv_ledger.cv_type IS 'Tipo: order_paid, order_refunded, order_cancelled, manual_adjustment';
COMMENT ON COLUMN cv_ledger.month_year IS 'Mês/ano no formato YYYY-MM para agrupamento mensal';

-- =====================================================
-- 4. Atualizar tabela members com campos de CV
-- =====================================================
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS current_cv_month decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_cv_month_year text,
  ADD COLUMN IF NOT EXISTS last_cv_calculation_at timestamptz;

COMMENT ON COLUMN members.current_cv_month IS 'CV acumulado do mês atual';
COMMENT ON COLUMN members.current_cv_month_year IS 'Mês/ano atual no formato YYYY-MM';
COMMENT ON COLUMN members.last_cv_calculation_at IS 'Última vez que o CV foi recalculado';

-- =====================================================
-- 5. Tabela cv_monthly_summary (resumo mensal por membro)
-- =====================================================
CREATE TABLE IF NOT EXISTS cv_monthly_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  month_year text NOT NULL, -- formato 'YYYY-MM'
  total_cv decimal(10,2) NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  status_at_close text, -- 'active' ou 'inactive' no fechamento
  closed_at timestamptz, -- quando o mês foi fechado
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(member_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_cv_monthly_summary_member ON cv_monthly_summary(member_id);
CREATE INDEX IF NOT EXISTS idx_cv_monthly_summary_month ON cv_monthly_summary(month_year);

COMMENT ON TABLE cv_monthly_summary IS 'Resumo mensal de CV por membro para histórico';

-- =====================================================
-- 6. Função para atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cv_monthly_summary_updated_at ON cv_monthly_summary;
CREATE TRIGGER update_cv_monthly_summary_updated_at
  BEFORE UPDATE ON cv_monthly_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Função RPC para calcular CV mensal de um membro
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_member_cv(
  p_member_id uuid,
  p_month_year text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS decimal AS $$
DECLARE
  v_total_cv decimal;
BEGIN
  SELECT COALESCE(SUM(cv_amount), 0)
  INTO v_total_cv
  FROM cv_ledger
  WHERE member_id = p_member_id
    AND month_year = p_month_year;
  
  RETURN v_total_cv;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_member_cv IS 'Calcula CV total de um membro para um mês específico';

-- =====================================================
-- 8. Função RPC para verificar se membro está ativo
-- =====================================================
CREATE OR REPLACE FUNCTION is_member_active(
  p_member_id uuid,
  p_month_year text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS boolean AS $$
DECLARE
  v_cv decimal;
BEGIN
  v_cv := calculate_member_cv(p_member_id, p_month_year);
  RETURN v_cv >= 200;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_member_active IS 'Verifica se membro está ativo (CV >= 200) - SPEC 3.3';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

