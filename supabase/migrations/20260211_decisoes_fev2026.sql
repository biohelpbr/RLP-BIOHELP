-- =====================================================
-- Decisões Reunião Fev/2026: House Account + Sequência ref_code
-- Data: 11/02/2026
-- 
-- TBD-001: House Account (conta raiz da empresa)
-- TBD-006: Sequência para ref_code no formato BH00001
-- TBD-019: Coluna coupon_code para creatina
-- =====================================================

-- 1. Criar sequência para ref_code (TBD-006)
CREATE SEQUENCE IF NOT EXISTS ref_code_seq START WITH 1 INCREMENT BY 1;

-- 2. Adicionar coluna coupon_code à free_creatine_claims (TBD-019)
ALTER TABLE free_creatine_claims 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_shopify_id TEXT;

COMMENT ON COLUMN free_creatine_claims.coupon_code IS 'Código do cupom gerado (ex: CREATINA-MARIA-FEV2026) — TBD-019';
COMMENT ON COLUMN free_creatine_claims.coupon_shopify_id IS 'ID do Price Rule/Discount na Shopify — TBD-019';

-- 3. Criar House Account (TBD-001)
INSERT INTO members (id, name, email, ref_code, sponsor_id, status, level, auth_user_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Biohelp House',
  'house@biohelp.com.br',
  'HOUSE',
  NULL,
  'active',
  'membro',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar role para House Account
INSERT INTO roles (member_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin')
ON CONFLICT (member_id) DO NOTHING;

-- 5. Criar registro Shopify para House Account
INSERT INTO shopify_customers (member_id, last_sync_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'ok')
ON CONFLICT (member_id) DO NOTHING;

-- 6. Função helper para gerar próximo ref_code sequencial
CREATE OR REPLACE FUNCTION generate_sequential_ref_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val INTEGER;
  new_code TEXT;
BEGIN
  next_val := nextval('ref_code_seq');
  new_code := 'BH' || LPAD(next_val::TEXT, 5, '0');
  WHILE EXISTS (SELECT 1 FROM members WHERE ref_code = new_code) LOOP
    next_val := nextval('ref_code_seq');
    new_code := 'BH' || LPAD(next_val::TEXT, 5, '0');
  END LOOP;
  RETURN new_code;
END;
$$;
