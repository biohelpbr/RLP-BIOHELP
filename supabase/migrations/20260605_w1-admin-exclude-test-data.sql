-- =============================================================================
-- W1 (call 05/06): números do admin só com dados REAIS.
--
-- A view admin_subscription_events (20260603) já excluía o load-test
-- (load-test-*@fake.dev). Aqui o critério vira função reutilizável
-- `is_test_subscriber(email, name)` e amplia para TODOS os padrões de teste
-- conhecidos no banco (levantados em 05/06 via SQL em guru_webhook_events
-- e members):
--   - load-test-* / *@fake.dev          → teste de carga 27-28/05
--   - *@flowcode.cc                     → domínio QA interno (FlowCode/dev)
--   - *+test*                           → contas descartáveis (+test2, +test3…)
--   - pending+*                         → ex.: pending+gjsturm7@gmail.com
--   - e2e-*                             → contas E2E Playwright
--   - nome começando com "teste"/"e2e"  → ex.: member "teste pending"
--   - lista explícita de e-mails da EQUIPE usados em compras de teste
--     pré-go-live (25/05–01/06): Eduardo (dev), Gabriel Sturm e Leo Wagner.
--
-- Exclusão em VIEW/função (reversível) — NENHUMA linha deletada.
-- guru_webhook_events permanece intacta (auditoria).
--
-- ROLLBACK:
--   1) Reaplicar a view da migration 20260603_admin-subscription-events-view.sql
--      (versão anterior, só com filtro de load-test);
--   2) DROP FUNCTION IF EXISTS public.is_test_subscriber(text, text);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_test_subscriber(p_email text, p_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    -- padrões de e-mail sintético/QA
       coalesce(lower(p_email), '') LIKE 'load-test-%'
    OR coalesce(lower(p_email), '') LIKE '%@fake.dev'
    OR coalesce(lower(p_email), '') LIKE '%@flowcode.cc'
    OR coalesce(lower(p_email), '') LIKE '%+test%'
    OR coalesce(lower(p_email), '') LIKE 'pending+%'
    OR coalesce(lower(p_email), '') LIKE 'e2e-%'
    -- nomes claramente de teste
    OR coalesce(lower(p_name), '')  LIKE 'teste%'
    OR coalesce(lower(p_name), '')  LIKE 'e2e %'
    -- compras de teste da equipe (pré-go-live 25/05–01/06) — manter em sincronia
    -- com lib/admin/test-data.ts
    OR coalesce(lower(p_email), '') IN (
      'eduspires123@gmail.com',
      'eduardo.sousa@ldccapital.com',
      'gjsturm7@gmail.com',
      'sturmfeevale@gmail.com',
      'leonardo@bio-help.com',
      'leonardowagner1996@gmail.com'
    )
$$;

COMMENT ON FUNCTION public.is_test_subscriber(text, text) IS
  'Identifica subscriber/member de teste (load-test, QA, E2E, equipe pré-go-live). Espelho TS: lib/admin/test-data.ts. W1 call 05/06.';

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
  -- Exclui TODO dado de teste (load-test, QA, E2E, equipe) — W1 call 05/06.
  AND NOT public.is_test_subscriber(
    e.payload -> 'subscriber' ->> 'email',
    e.payload -> 'subscriber' ->> 'name'
  );

COMMENT ON VIEW public.admin_subscription_events IS
  'Eventos de assinatura do Guru achatados p/ o painel admin. Exclui dados de teste via is_test_subscriber() (W1 05/06). Fonte: guru_webhook_events.';
