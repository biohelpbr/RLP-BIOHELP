-- =============================================================================
-- W4 (call 05/06): CMS de configurações do app (app_settings key/value jsonb).
-- Primeiro uso: telefone/horário do suporte editável pelo admin em
-- /admin/settings — o card "Comunidade & Atendimento" da home do membro
-- passa a ler daqui (com fallback hardcoded) em vez de env var.
--
-- Princípio transversal (Eduardo): todo conteúdo editável sem deploy.
--
-- Idempotente. Aplicar via Supabase MCP — projeto rlp-biohelp.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS app_settings CASCADE;
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo (mesmo padrão de announcements).
DROP POLICY IF EXISTS "Admins manage app_settings" ON app_settings;
CREATE POLICY "Admins manage app_settings" ON app_settings FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

-- Membros autenticados leem (config não-sensível: contato de suporte etc.).
DROP POLICY IF EXISTS "Authenticated read app_settings" ON app_settings;
CREATE POLICY "Authenticated read app_settings" ON app_settings FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE app_settings IS
  'W4 05/06: configurações editáveis pelo admin sem deploy (key/value jsonb). Ex.: support_contact (telefone+horário do suporte exibidos na home do membro).';

-- Seed: contato de suporte oficial (Apêndice B da call 05/06).
INSERT INTO app_settings (key, value)
VALUES (
  'support_contact',
  '{"phone": "51 98101-9332", "whatsapp_digits": "5551981019332", "hours": "Segunda a sexta, 9h às 18h"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
