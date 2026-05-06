-- =====================================================
-- F-V17 — Auth audit (SSO Shopify)
-- SPEC: docs/sdd/features/F-V17-sso-shopify/SPEC.md
-- Data: 2026-05-06
--
-- Tabela de log para SSO Shopify App Proxy. Registra cada tentativa
-- de SSO (sucesso ou falha) pra debug de fricção e auditoria.
--
-- Idempotente. Sem RLS pública (admin-only via service_role).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS auth_audit;
-- =====================================================

CREATE TABLE IF NOT EXISTS auth_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,                    -- 'shopify_app_proxy' | 'shopify_multipass' | 'magic_link' | etc.
  outcome text NOT NULL,                   -- 'success' | 'invalid_signature' | 'member_not_found' | 'no_logged_in_customer' | 'expired' | 'error'
  email text NULL,
  member_id uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  shop_domain text NULL,
  ip text NULL,
  user_agent text NULL,
  details jsonb NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_source_outcome ON auth_audit(source, outcome);
CREATE INDEX IF NOT EXISTS idx_auth_audit_member_id ON auth_audit(member_id);

COMMENT ON TABLE auth_audit IS
  'F-V17: log de tentativas de auth/SSO. Útil pra debug de SSO Shopify (App Proxy) e auditoria de magic links. Service-role only.';

-- RLS: deny-all default. Service role bypassa.
ALTER TABLE auth_audit ENABLE ROW LEVEL SECURITY;
