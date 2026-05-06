-- F-V09 Academy CMS (conteúdo global do admin + visualização do membro)
-- Aplicada via MCP em 2026-05-06 (version 20260506032710) no projeto rlp-biohelp.
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS content_views CASCADE;
--   DROP TABLE IF EXISTS content_modules CASCADE;
--   DROP TABLE IF EXISTS content_trails CASCADE;

CREATE TABLE IF NOT EXISTS content_trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) >= 2),
  description text NULL,
  cover_url text NULL,
  status text NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id uuid NOT NULL REFERENCES content_trails(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) >= 2),
  kind text NOT NULL CHECK (kind IN ('youtube','pdf','text')),
  content_url text NULL,
  content_text text NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'text' AND content_text IS NOT NULL) OR (kind <> 'text' AND content_url IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES content_modules(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  UNIQUE(module_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_content_trails_status ON content_trails (status, display_order);
CREATE INDEX IF NOT EXISTS idx_content_modules_trail ON content_modules (trail_id, display_order);
CREATE INDEX IF NOT EXISTS idx_content_views_module ON content_views (module_id);
CREATE INDEX IF NOT EXISTS idx_content_views_member ON content_views (member_id);

ALTER TABLE content_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage trails" ON content_trails;
CREATE POLICY "Admins manage trails" ON content_trails FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Members read published trails" ON content_trails;
CREATE POLICY "Members read published trails" ON content_trails FOR SELECT TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage modules" ON content_modules;
CREATE POLICY "Admins manage modules" ON content_modules FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Members read modules of published trails" ON content_modules;
CREATE POLICY "Members read modules of published trails" ON content_modules FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM content_trails t WHERE t.id = content_modules.trail_id AND t.status = 'published'));

DROP POLICY IF EXISTS "Admins read all views" ON content_views;
CREATE POLICY "Admins read all views" ON content_views FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Members manage own views" ON content_views;
CREATE POLICY "Members manage own views" ON content_views FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM members m WHERE m.id = content_views.member_id AND m.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM members m WHERE m.id = content_views.member_id AND m.auth_user_id = auth.uid()));

COMMENT ON TABLE content_trails IS 'F-V09: trilhas de conteúdo (Academy). Admin posta global; membros consomem em /dashboard/academy.';
COMMENT ON TABLE content_modules IS 'F-V09: módulos da trilha. kind youtube/pdf/text — youtube/pdf usam content_url, text usa content_text.';
COMMENT ON TABLE content_views IS 'F-V09: visualizações idempotentes (UNIQUE module_id+member_id). started_at na 1a chamada; completed_at quando markView(completed=true).';
