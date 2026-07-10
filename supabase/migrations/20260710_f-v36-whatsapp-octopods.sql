-- F-V36 — WhatsApp (Octopods) plugado no fluxo de e-mail.
--
-- Adiciona um canal WhatsApp por passo do fluxo: cada passo pode ter um
-- whatsapp_template_id (ID do template no Octopods). Ao disparar o passo, além
-- do e-mail, envia o WhatsApp. O log de envios ganha `channel` pra idempotência
-- separada por canal (não confundir e-mail com WhatsApp).
--
-- Rollback:
--   ALTER TABLE email_flow_sends DROP CONSTRAINT IF EXISTS email_flow_sends_member_flow_step_channel_key;
--   ALTER TABLE email_flow_sends ADD CONSTRAINT email_flow_sends_member_id_flow_key_step_order_key UNIQUE (member_id, flow_key, step_order);
--   ALTER TABLE email_flow_sends DROP COLUMN IF EXISTS channel;
--   ALTER TABLE email_flow_steps DROP COLUMN IF EXISTS whatsapp_template_id;

-- 1) Template Octopods por passo (NULL = passo sem WhatsApp).
ALTER TABLE email_flow_steps ADD COLUMN IF NOT EXISTS whatsapp_template_id text;

-- 2) Canal no log de envios (email | whatsapp), default 'email' pros existentes.
ALTER TABLE email_flow_sends ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';

-- 3) Idempotência por canal: troca UNIQUE(member,flow,step) por (…,channel).
ALTER TABLE email_flow_sends
  DROP CONSTRAINT IF EXISTS email_flow_sends_member_id_flow_key_step_order_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_flow_sends_member_flow_step_channel_key'
  ) THEN
    ALTER TABLE email_flow_sends
      ADD CONSTRAINT email_flow_sends_member_flow_step_channel_key
      UNIQUE (member_id, flow_key, step_order, channel);
  END IF;
END $$;

-- 4) (opcional) restringe o canal a valores conhecidos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_flow_sends_channel_check'
  ) THEN
    ALTER TABLE email_flow_sends
      ADD CONSTRAINT email_flow_sends_channel_check
      CHECK (channel IN ('email', 'whatsapp'));
  END IF;
END $$;
