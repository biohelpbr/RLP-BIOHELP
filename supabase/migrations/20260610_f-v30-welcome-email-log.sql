-- F-V30 Welcome email — tabela de auditoria + idempotência + de-para.
-- Cada disparo do gatilho de boas-vindas grava 1 linha:
--   status: dryrun (ensaio, não enviou) | sent (enviado) | failed | skipped (allowlist).
-- A presença de status='sent' por member_id é a idempotência do modo live.
-- 100% ADITIVO e idempotente. Não altera/remove nada.
--
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS welcome_email_log CASCADE;

CREATE TABLE IF NOT EXISTS welcome_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('dryrun','sent','failed','skipped')),
  matched text NULL,          -- heurística que detectou a assinatura (line_item_title/total_threshold/...)
  error text NULL,            -- mensagem quando status='failed'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_welcome_log_member ON welcome_email_log (member_id);
CREATE INDEX IF NOT EXISTS idx_welcome_log_status ON welcome_email_log (status, created_at);

ALTER TABLE welcome_email_log ENABLE ROW LEVEL SECURITY;

-- App escreve via service_role (ignora RLS). Admin lê pro de-para/auditoria.
DROP POLICY IF EXISTS "Admins read welcome log" ON welcome_email_log;
CREATE POLICY "Admins read welcome log" ON welcome_email_log FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

COMMENT ON TABLE welcome_email_log IS 'F-V30: auditoria do e-mail de boas-vindas. status sent = idempotência do modo live; dryrun = ensaio sem envio (de-para vs members.subscription_paid_at).';
