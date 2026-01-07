-- =====================================================
-- SPRINT 2 — CV + Status
-- Migration: RLS Policies para novas tabelas
-- SPEC: Seção 10 - Políticas RLS
-- Data: 2026-01-07
-- =====================================================

-- =====================================================
-- 1. Habilitar RLS nas novas tabelas
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_monthly_summary ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Policies para tabela orders
-- =====================================================

-- Member pode ler apenas seus próprios pedidos
CREATE POLICY "Members can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Admin pode ler todos os pedidos
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid()
        AND r.role = 'admin'
    )
  );

-- Apenas service_role pode inserir/atualizar (via webhooks)
CREATE POLICY "Service role can insert orders"
  ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update orders"
  ON orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. Policies para tabela order_items
-- =====================================================

-- Member pode ler apenas itens de seus próprios pedidos
CREATE POLICY "Members can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN members m ON o.member_id = m.id
      WHERE m.auth_user_id = auth.uid()
    )
  );

-- Admin pode ler todos os itens
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid()
        AND r.role = 'admin'
    )
  );

-- Apenas service_role pode inserir
CREATE POLICY "Service role can insert order items"
  ON order_items
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 4. Policies para tabela cv_ledger
-- =====================================================

-- Member pode ler apenas seu próprio ledger
CREATE POLICY "Members can view own cv ledger"
  ON cv_ledger
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Admin pode ler todos os ledgers
CREATE POLICY "Admins can view all cv ledger"
  ON cv_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid()
        AND r.role = 'admin'
    )
  );

-- Apenas service_role pode inserir (webhooks e ajustes)
CREATE POLICY "Service role can insert cv ledger"
  ON cv_ledger
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- 5. Policies para tabela cv_monthly_summary
-- =====================================================

-- Member pode ler apenas seu próprio resumo
CREATE POLICY "Members can view own cv summary"
  ON cv_monthly_summary
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Admin pode ler todos os resumos
CREATE POLICY "Admins can view all cv summary"
  ON cv_monthly_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid()
        AND r.role = 'admin'
    )
  );

-- Apenas service_role pode inserir/atualizar
CREATE POLICY "Service role can insert cv summary"
  ON cv_monthly_summary
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cv summary"
  ON cv_monthly_summary
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

