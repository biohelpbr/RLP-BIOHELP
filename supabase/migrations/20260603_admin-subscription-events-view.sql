-- =============================================================================
-- Admin: view de eventos de assinatura (Guru) p/ painel "Assinaturas & Compras"
-- Pedido call BioHelp&FlowCode 03/06: ver assinaturas/cancelamentos por dia e
-- repropor /admin/orders lendo o Guru (canal de pagamento real) em vez da
-- Shopify (orders/paid nunca popula neste modelo).
--
-- Achata guru_webhook_events: extrai email/nome do payload, classifica o tipo
-- de evento em vocabulário de negócio e EXCLUI o lixo do teste de carga
-- (load-test-*@fake.dev de 27-28/05) que poluía a contagem.
--
-- View read-only, idempotente (CREATE OR REPLACE). Sem mudança de dado.
--
-- ROLLBACK:
--   DROP VIEW IF EXISTS public.admin_subscription_events;
-- =============================================================================

CREATE OR REPLACE VIEW public.admin_subscription_events AS
SELECT
  e.id,
  e.received_at,
  e.processed_at,
  e.error,
  e.event_type,
  -- Vocabulário de negócio p/ a UI (call 03/06).
  CASE
    WHEN e.event_type = 'subscription.active'   THEN 'ativacao'
    WHEN e.event_type = 'subscription.started'  THEN 'iniciada'
    WHEN e.event_type = 'subscription.canceled' THEN 'cancelamento'
    WHEN e.event_type = 'subscription.expired'  THEN 'expiracao'
    WHEN e.event_type = 'subscription.inactive' THEN 'expiracao'
    WHEN e.event_type LIKE 'transaction.%'      THEN 'transacao'
    ELSE 'outro'
  END AS business_kind,
  lower(e.payload -> 'subscriber' ->> 'email') AS email,
  e.payload -> 'subscriber' ->> 'name'         AS subscriber_name,
  (e.payload ->> 'charged_times')::int         AS charged_times
FROM public.guru_webhook_events e
WHERE e.event_type LIKE 'subscription.%'
  -- Exclui dados sintéticos do teste de carga (não são vendas reais).
  AND coalesce(e.payload -> 'subscriber' ->> 'email', '') NOT LIKE 'load-test-%'
  AND coalesce(e.payload -> 'subscriber' ->> 'email', '') NOT LIKE '%@fake.dev';

COMMENT ON VIEW public.admin_subscription_events IS
  'Eventos de assinatura do Guru achatados p/ o painel admin (call 03/06). Exclui load-test. Fonte: guru_webhook_events.';
