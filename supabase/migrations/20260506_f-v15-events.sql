-- F-V15 Eventos admin (criação + funil + link/tag)
-- Aplicada via MCP em 2026-05-06 (version 20260506032649) no projeto rlp-biohelp.
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS event_attendances CASCADE;
--   DROP TABLE IF EXISTS event_visits CASCADE;
--   DROP TABLE IF EXISTS event_eligible_products CASCADE;
--   DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  description text NULL,
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL CHECK (end_at > start_at),
  mode text NOT NULL CHECK (mode IN ('online','presencial','hibrido')),
  location text NULL,
  redirect_url text NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  status text NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_eligible_products (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shopify_product_id text NOT NULL,
  PRIMARY KEY (event_id, shopify_product_id)
);

CREATE TABLE IF NOT EXISTS event_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id uuid NULL REFERENCES members(id) ON DELETE SET NULL,
  ip text NULL,
  user_agent text NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_attendances (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT false,
  marked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_events_period ON events (start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
CREATE INDEX IF NOT EXISTS idx_event_visits_event ON event_visits (event_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_visits_member ON event_visits (member_id, visited_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_eligible_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage events" ON events;
CREATE POLICY "Admins manage events" ON events FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Anyone can read active published events" ON events;
CREATE POLICY "Anyone can read active published events" ON events FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND now() BETWEEN start_at AND end_at);

DROP POLICY IF EXISTS "Admins manage eligible products" ON event_eligible_products;
CREATE POLICY "Admins manage eligible products" ON event_eligible_products FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Anyone reads eligible products of published events" ON event_eligible_products;
CREATE POLICY "Anyone reads eligible products of published events" ON event_eligible_products FOR SELECT
  TO anon, authenticated
  USING (EXISTS(SELECT 1 FROM events e WHERE e.id = event_eligible_products.event_id
    AND e.status = 'published' AND now() BETWEEN e.start_at AND e.end_at));

DROP POLICY IF EXISTS "Admins manage event visits" ON event_visits;
CREATE POLICY "Admins manage event visits" ON event_visits FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Members read own event visits" ON event_visits;
CREATE POLICY "Members read own event visits" ON event_visits FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM members m WHERE m.id = event_visits.member_id AND m.auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage attendances" ON event_attendances;
CREATE POLICY "Admins manage attendances" ON event_attendances FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

COMMENT ON TABLE events IS 'F-V15: eventos do admin (online/presencial/híbrido) com link único, produtos elegíveis e métricas de funil. Substitui conceito de cupom mensal de creatina (F-V13 absorvida).';
COMMENT ON TABLE event_eligible_products IS 'F-V15: produtos Shopify cuja compra durante o período do evento dispara aplicação de tag evento:<slug> via hook do webhook orders/paid.';
COMMENT ON TABLE event_visits IS 'F-V15: visitas em /r/<slug> (topo de funil). member_id preenchido se o visitante for membro autenticado.';
COMMENT ON TABLE event_attendances IS 'F-V15: presenças marcadas manualmente pelo admin. Idempotente (PK composta).';
