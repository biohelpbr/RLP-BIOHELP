-- F-V32 Fluxo de e-mails (drip por gatilho "novo assinante") — v1.
-- Cria a infra do motor de sequência. 100% ADITIVO e idempotente:
--   * email_flow_steps  — os passos editáveis do fluxo (D+0, D+x...). v1: 1 fluxo só.
--   * email_flow_sends  — 1 linha por (membro, passo): idempotência + auditoria.
--   * members.email_unsubscribed_at — descadastro (para o fluxo).
-- NÃO altera/remove nada existente. welcome_email_log (F-V30) segue intacto.
-- Nada dispara só por aplicar isto: o motor é gated por EMAIL_FLOW_MODE (default off)
-- e o cron só roda quando registrado no vercel.json.
--
-- Rollback (se necessário):
--   ALTER TABLE members DROP COLUMN IF EXISTS email_unsubscribed_at;
--   DROP TABLE IF EXISTS email_flow_sends CASCADE;
--   DROP TABLE IF EXISTS email_flow_steps CASCADE;

-- ── Passos do fluxo (conteúdo editável no CMS) ───────────────────────────────
CREATE TABLE IF NOT EXISTS email_flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_key text NOT NULL DEFAULT 'new_subscriber',  -- v2: vira FK a uma tabela de fluxos
  step_order int NOT NULL,                           -- 1, 2, 3, 4...
  delay_days int NOT NULL DEFAULT 0,                 -- D+0, D+3, D+7... (a partir de subscription_paid_at)
  subject text NOT NULL,
  body text NOT NULL,                                -- HTML/texto (reusa buildHtml do F-V23)
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flow_key, step_order),
  CHECK (delay_days >= 0),
  CHECK (step_order >= 1)
);

CREATE INDEX IF NOT EXISTS idx_email_flow_steps_flow ON email_flow_steps (flow_key, step_order);

-- ── Envios (idempotência + auditoria) ────────────────────────────────────────
-- 1 linha por (membro, fluxo, passo). UNIQUE garante "envia 1x por membro".
CREATE TABLE IF NOT EXISTS email_flow_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  flow_key text NOT NULL DEFAULT 'new_subscriber',
  step_order int NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped','dryrun')),
  email text NULL,            -- destinatário no momento do envio (auditoria)
  error text NULL,            -- mensagem quando status='failed'
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, flow_key, step_order)
);

CREATE INDEX IF NOT EXISTS idx_email_flow_sends_member ON email_flow_sends (member_id);
CREATE INDEX IF NOT EXISTS idx_email_flow_sends_flow ON email_flow_sends (flow_key, step_order, status);

-- ── Descadastro (para o fluxo) ───────────────────────────────────────────────
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS email_unsubscribed_at timestamptz NULL;

COMMENT ON COLUMN members.email_unsubscribed_at IS
  'F-V32: quando preenchido, o membro saiu da régua de e-mails — o fluxo (D+0 e cron) para de enviar.';

-- ── RLS: app escreve via service_role (ignora RLS); admin lê pra auditoria/CMS ──
ALTER TABLE email_flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_flow_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read flow steps" ON email_flow_steps;
CREATE POLICY "Admins read flow steps" ON email_flow_steps FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Admins read flow sends" ON email_flow_sends;
CREATE POLICY "Admins read flow sends" ON email_flow_sends FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

COMMENT ON TABLE email_flow_steps IS 'F-V32: passos editáveis do fluxo de e-mails (drip). v1: flow_key=new_subscriber.';
COMMENT ON TABLE email_flow_sends IS 'F-V32: 1 linha por (membro,passo) — idempotência do envio + auditoria (sent/failed/skipped/dryrun).';
