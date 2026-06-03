-- F-V23 Disparo de e-mail nativo no admin (Resend Pro)
-- Campanhas de e-mail criadas/disparadas pelo admin (/admin/emails), com segmentação
-- e status por destinatário. Aplicar via Supabase MCP — projeto rlp-biohelp.
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS email_campaign_recipients CASCADE;
--   DROP TABLE IF EXISTS email_campaigns CASCADE;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL CHECK (length(trim(subject)) >= 2),
  body text NOT NULL CHECK (length(trim(body)) >= 2),
  from_label text NULL,
  segment text NOT NULL CHECK (segment IN ('all','active','pending','canceled')) DEFAULT 'all',
  status text NOT NULL CHECK (status IN ('draft','sending','sent','failed')) DEFAULT 'draft',
  total int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  delivered_count int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  created_by uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  member_id uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued','sent','delivered','bounced','complained','failed')) DEFAULT 'queued',
  resend_id text NULL,
  error text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_recipients_campaign ON email_campaign_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_resend ON email_campaign_recipients (resend_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created ON email_campaigns (created_at DESC);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Feature 100% admin (leitura/escrita via service client; policies coerentes).
DROP POLICY IF EXISTS "Admins manage email campaigns" ON email_campaigns;
CREATE POLICY "Admins manage email campaigns" ON email_campaigns FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Admins manage email recipients" ON email_campaign_recipients;
CREATE POLICY "Admins manage email recipients" ON email_campaign_recipients FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

COMMENT ON TABLE email_campaigns IS 'F-V23: campanhas de e-mail disparadas pelo admin via Resend. segment filtra a base; status_count agregados.';
COMMENT ON TABLE email_campaign_recipients IS 'F-V23: 1 linha por destinatário de uma campanha. status atualizado pelo webhook do Resend (delivered/bounced).';
