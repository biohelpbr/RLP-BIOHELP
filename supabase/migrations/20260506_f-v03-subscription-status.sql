-- =====================================================
-- F-V03 — Status ativo via subscription_paid
-- SPEC: docs/sdd/features/F-V03-status-via-assinatura/SPEC.md
-- Data: 2026-05-06
--
-- Adiciona members.subscription_status (enum pending|paid|cancelled)
-- e members.subscription_paid_at (timestamptz). Atualiza a view
-- `member_active_affiliate_count` para usar subscription_status='paid'
-- ao invés do proxy v1 status='active'.
--
-- Idempotente. Não toca sponsor_id/ref_code/orders (Anti-SPEC §1).
-- Composição mínima — só ALTER ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW.
--
-- ROLLBACK (executar manualmente em caso de revert):
--   CREATE OR REPLACE VIEW member_active_affiliate_count AS
--     SELECT m.id AS member_id,
--            count(a.id) FILTER (WHERE a.status = 'active') AS active_count
--     FROM members m LEFT JOIN members a ON a.sponsor_id = m.id
--     GROUP BY m.id;
--   DROP INDEX IF EXISTS idx_members_subscription_status;
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_paid_at;
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_status;
--   -- Tipo enum mantido (DROP TYPE IF EXISTS subscription_status_v2 se nada mais depender)
-- =====================================================

-- 1. Tipo enum (idempotente via DO $$)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_v2') THEN
    CREATE TYPE subscription_status_v2 AS ENUM ('pending', 'paid', 'cancelled');
  END IF;
END $$;

-- 2. Colunas em members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status_v2 NOT NULL DEFAULT 'pending';

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS subscription_paid_at timestamptz NULL;

-- 3. Index para query de contagem (view + filtros admin)
CREATE INDEX IF NOT EXISTS idx_members_subscription_status
  ON members(subscription_status);

COMMENT ON COLUMN members.subscription_status IS
  'F-V03: status da assinatura no clube Biohelp (pending|paid|cancelled). Substitui o proxy v1 status=active. Atualizado pelo hook em /api/webhooks/shopify/orders/paid quando produto for de clube/assinatura, ou via Server Action markSubscriptionPaid/cancelSubscription.';

COMMENT ON COLUMN members.subscription_paid_at IS
  'F-V03: timestamp do primeiro pagamento que marcou subscription_status=paid. NULL para members pending.';

-- 4. View — substitui proxy v1 (status=active) por subscription_status=paid
CREATE OR REPLACE VIEW member_active_affiliate_count AS
SELECT
  m.id AS member_id,
  COUNT(a.id) FILTER (WHERE a.subscription_status = 'paid') AS active_count
FROM members m
LEFT JOIN members a ON a.sponsor_id = m.id
GROUP BY m.id;

COMMENT ON VIEW member_active_affiliate_count IS
  'F-V03 (S5): contagem de afiliados N1 com assinatura paga (subscription_status=paid). Substitui o proxy v1 status=active. Consumida por F-V18 (auto-classifier) e F-V06 (promoção Founder).';
