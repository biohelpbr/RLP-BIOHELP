-- F-V19: Fluxo pré-cadastro Guru → LRP → Shopify
-- SPEC: docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md
-- Classe: D (webhook produção-crítico + sync Shopify)
-- Idempotente: pode rodar mais de uma vez sem erro.
--
-- Rollback:
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_auto_renew;
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_expires_at;
--   ALTER TABLE members DROP COLUMN IF EXISTS pre_registered_at;
--   ALTER TABLE members DROP COLUMN IF EXISTS guru_subscriber_id;
--   ALTER TABLE orders DROP COLUMN IF EXISTS is_subscription_clone;
--   DROP INDEX IF EXISTS idx_members_subscription_expires_at;
--   DROP INDEX IF EXISTS idx_members_guru_subscriber_id;
--   DROP TABLE IF EXISTS guru_webhook_events;
--   DROP TABLE IF EXISTS notifications;

-- ============================================================================
-- 1. Members: timestamps + refs externos para fluxo Guru
-- ============================================================================
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pre_registered_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS guru_subscriber_id text NULL;

COMMENT ON COLUMN members.subscription_expires_at IS 'F-V19: quando assinatura expira (now+1y após Guru paid). NULL se nunca pagou.';
COMMENT ON COLUMN members.subscription_auto_renew IS 'F-V19: false após subscription.cancelled do Guru. Cron diário inativa se expires_at < now() AND auto_renew=false.';
COMMENT ON COLUMN members.pre_registered_at IS 'F-V19: quando lead entrou na lista de espera (antes do checkout Guru).';
COMMENT ON COLUMN members.guru_subscriber_id IS 'F-V19: id externo da assinatura no Guru. Idempotência de webhook.';

CREATE INDEX IF NOT EXISTS idx_members_subscription_expires_at
  ON members (subscription_expires_at)
  WHERE subscription_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_members_guru_subscriber_id
  ON members (guru_subscriber_id)
  WHERE guru_subscriber_id IS NOT NULL;

-- ============================================================================
-- 2. Orders: distinguir pedido fake (clone Guru) de pedido Shopify real
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_subscription_clone boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN orders.is_subscription_clone IS 'F-V19: true quando pedido é espelho LRP de assinatura Guru (R$0, tag subscriber).';

-- ============================================================================
-- 3. guru_webhook_events: idempotência + auditoria
-- ============================================================================
CREATE TABLE IF NOT EXISTS guru_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  error text NULL
);

COMMENT ON TABLE guru_webhook_events IS 'F-V19: auditoria + idempotência de webhooks Guru. event_id UNIQUE bloqueia reprocessamento.';

CREATE INDEX IF NOT EXISTS idx_guru_webhook_events_event_type
  ON guru_webhook_events (event_type, received_at DESC);

ALTER TABLE guru_webhook_events ENABLE ROW LEVEL SECURITY;

-- Apenas service_role lê/escreve (igual auth_audit)
DROP POLICY IF EXISTS guru_webhook_events_service_role ON guru_webhook_events;
CREATE POLICY guru_webhook_events_service_role ON guru_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. notifications: in-app (sininho) — MVP A5/U6 ainda em discussão
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role text NOT NULL CHECK (recipient_role IN ('admin', 'member')),
  recipient_member_id uuid NULL REFERENCES members(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NULL,
  href text NULL,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'F-V19/A5/U6: notificações in-app (sininho). recipient_role=admin → todos admins; recipient_role=member → apenas o member.';

CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread
  ON notifications (created_at DESC)
  WHERE recipient_role = 'admin' AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_member_unread
  ON notifications (recipient_member_id, created_at DESC)
  WHERE recipient_role = 'member' AND read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins leem notificações de role=admin. Padrão F-V15 (JOIN roles + members).
DROP POLICY IF EXISTS notifications_admin_select ON notifications;
CREATE POLICY notifications_admin_select ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Members leem as próprias notificações
DROP POLICY IF EXISTS notifications_member_select ON notifications;
CREATE POLICY notifications_member_select ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_role = 'member'
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = notifications.recipient_member_id
        AND m.auth_user_id = auth.uid()
    )
  );

-- Admins podem marcar notificações de admin como lidas (UPDATE read_at)
DROP POLICY IF EXISTS notifications_admin_update ON notifications;
CREATE POLICY notifications_admin_update ON notifications
  FOR UPDATE TO authenticated
  USING (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'
    )
  )
  WITH CHECK (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM roles r
      JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Members podem marcar as próprias notificações como lidas
DROP POLICY IF EXISTS notifications_member_update ON notifications;
CREATE POLICY notifications_member_update ON notifications
  FOR UPDATE TO authenticated
  USING (
    recipient_role = 'member'
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = notifications.recipient_member_id
        AND m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    recipient_role = 'member'
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = notifications.recipient_member_id
        AND m.auth_user_id = auth.uid()
    )
  );

-- service_role tem acesso total (server actions usam service client)
DROP POLICY IF EXISTS notifications_service_role_all ON notifications;
CREATE POLICY notifications_service_role_all ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
