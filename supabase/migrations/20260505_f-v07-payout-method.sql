-- =====================================================
-- F-V07 — Triple resgate: PIX + Cashback Cashin + Crédito Shopify
-- SPEC: docs/sdd/features/F-V07-saque-cashin-nf/SPEC.md
-- Data: 2026-05-05
--
-- Adiciona coluna payout_method em payout_requests com
-- enum {pix, cashback_cashin, shopify_credit}. Default 'pix'
-- mantém compatibilidade com rows v1 existentes (que sempre
-- foram saques cash via RPA/CPF).
--
-- Anti-SPEC §6: nunca dropar/recriar payout_requests. Apenas
-- ALTER TABLE. Idempotente.
-- =====================================================
--
-- ROLLBACK (executar manualmente no caso de revert):
-- ALTER TABLE payout_requests DROP COLUMN IF EXISTS payout_method;
-- DROP TYPE IF EXISTS payout_method_v2;
--
-- =====================================================

-- 1. Criar enum se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_method_v2') THEN
    CREATE TYPE payout_method_v2 AS ENUM ('pix', 'cashback_cashin', 'shopify_credit');
  END IF;
END $$;

-- 2. Adicionar coluna em payout_requests
ALTER TABLE payout_requests
  ADD COLUMN IF NOT EXISTS payout_method payout_method_v2 NOT NULL DEFAULT 'pix';

COMMENT ON COLUMN payout_requests.payout_method IS
  'F-V07 (V2): método de resgate. pix exige NF (Founder+CNPJ); cashback_cashin = Cashin direto sem NF; shopify_credit = conversão 1:1 para crédito na loja.';

-- 3. Índice pra filtrar resgates por método (admin painel S4)
CREATE INDEX IF NOT EXISTS idx_payout_requests_method
  ON payout_requests (payout_method, status);
