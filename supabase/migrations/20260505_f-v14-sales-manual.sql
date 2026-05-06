-- =====================================================
-- F-V14 — Vendas manuais do membro (CRM leve)
-- SPEC: docs/sdd/features/F-V14-vendas-manuais-membro/SPEC.md
-- Data: 2026-05-05
--
-- Reunião 29/04/2026 PM: membro registra leads e vendas
-- concretizadas FORA do canal Shopify. Métricas derivam só
-- do que ele preenche; sem rastreio automático.
--
-- Idempotente (IF NOT EXISTS / IF EXISTS). RLS por
-- members.auth_user_id = auth.uid() seguindo o pattern de
-- 20260107_sprint2_rls_policies.sql.
-- =====================================================
--
-- ROLLBACK (executar manualmente no caso de revert):
-- DROP POLICY IF EXISTS "Members can manage own sales" ON member_sales;
-- DROP POLICY IF EXISTS "Admins can view all sales" ON member_sales;
-- DROP POLICY IF EXISTS "Members can manage own leads" ON member_leads;
-- DROP POLICY IF EXISTS "Admins can view all leads" ON member_leads;
-- DROP TABLE IF EXISTS member_sales CASCADE;
-- DROP TABLE IF EXISTS member_leads CASCADE;
--
-- =====================================================

-- =====================================================
-- 1. Tabela member_leads (potenciais clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS member_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  contact text NOT NULL CHECK (length(trim(contact)) >= 3),
  target_product text NULL,
  note text NULL,
  last_contact_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_leads_member_created
  ON member_leads (member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_leads_last_contact
  ON member_leads (member_id, last_contact_at DESC);

COMMENT ON TABLE member_leads IS 'F-V14: leads (potenciais clientes) registrados manualmente pelo membro. Sem rastreio automático.';

-- =====================================================
-- 2. Tabela member_sales (vendas concretizadas manualmente)
-- =====================================================
CREATE TABLE IF NOT EXISTS member_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  customer_name text NOT NULL CHECK (length(trim(customer_name)) >= 2),
  product_name text NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty >= 1),
  paid_amount numeric(12,2) NOT NULL CHECK (paid_amount > 0),
  payment_method text NOT NULL CHECK (
    payment_method IN ('pix', 'cartao', 'dinheiro', 'transferencia', 'outro')
  ),
  sold_at date NOT NULL DEFAULT current_date,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_sales_member_sold
  ON member_sales (member_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_sales_member_created
  ON member_sales (member_id, created_at DESC);

COMMENT ON TABLE member_sales IS 'F-V14: vendas concretizadas FORA do canal Shopify, registradas manualmente pelo membro.';

-- =====================================================
-- 3. Habilitar RLS
-- =====================================================
ALTER TABLE member_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_sales ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Policies — member_leads
-- =====================================================
DROP POLICY IF EXISTS "Members can manage own leads" ON member_leads;
CREATE POLICY "Members can manage own leads"
  ON member_leads
  FOR ALL
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all leads" ON member_leads;
CREATE POLICY "Admins can view all leads"
  ON member_leads
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

-- =====================================================
-- 5. Policies — member_sales
-- =====================================================
DROP POLICY IF EXISTS "Members can manage own sales" ON member_sales;
CREATE POLICY "Members can manage own sales"
  ON member_sales
  FOR ALL
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all sales" ON member_sales;
CREATE POLICY "Admins can view all sales"
  ON member_sales
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
