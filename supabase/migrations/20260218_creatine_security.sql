-- Migration: Segurança do cupom de creatina (TBD-019 melhorado)
-- Data: 2026-02-18
-- Objetivo: Adicionar campos para rastreamento de fraude e auditoria
-- Status: ✅ Aplicada via Supabase MCP

-- 1. Adicionar coluna fraud_details
ALTER TABLE free_creatine_claims
ADD COLUMN IF NOT EXISTS fraud_details JSONB;

-- 2. Criar índice para busca por coupon_code
CREATE INDEX IF NOT EXISTS idx_free_creatine_claims_coupon_code 
ON free_creatine_claims(coupon_code);

-- 3. Criar índice para busca de fraudes
CREATE INDEX IF NOT EXISTS idx_free_creatine_claims_status 
ON free_creatine_claims(status) 
WHERE status IN ('fraud_attempt', 'claimed_untracked');

-- 4. Constraint para garantir unicidade do cupom
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_creatine_claims_coupon_unique 
ON free_creatine_claims(coupon_code) 
WHERE coupon_code IS NOT NULL;

-- 5. Comentários
COMMENT ON COLUMN free_creatine_claims.fraud_details IS 'JSON com detalhes de tentativa de fraude (se detectada)';

-- 6. View para auditoria de fraudes (admin)
CREATE OR REPLACE VIEW v_creatine_fraud_attempts AS
SELECT 
  fcc.id,
  fcc.member_id,
  m.name AS member_name,
  m.email AS member_email,
  fcc.coupon_code,
  fcc.status,
  fcc.fraud_details,
  fcc.claimed_at
FROM free_creatine_claims fcc
JOIN members m ON m.id = fcc.member_id
WHERE fcc.status IN ('fraud_attempt', 'claimed_untracked')
ORDER BY fcc.claimed_at DESC;

COMMENT ON VIEW v_creatine_fraud_attempts IS 'Auditoria de tentativas de fraude com cupons de creatina';
