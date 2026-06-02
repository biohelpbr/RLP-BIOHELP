-- F-V22 Avisos no painel (announcement bar configurável pelo admin)
-- Barra fixa no topo do dashboard do membro, gerenciada via /admin/announcements.
-- Aplicar via Supabase MCP (mcp__supabase__apply_migration) — projeto rlp-biohelp ref ikvwzfbkbwpiewhkumrj.
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS announcements CASCADE;

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (length(trim(message)) >= 2),
  image_url text NULL,
  link_url text NULL,
  cta_label text NULL,
  variant text NOT NULL CHECK (variant IN ('coral','primary','accent')) DEFAULT 'coral',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotência defensiva caso a tabela já exista de uma versão anterior sem image_url.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url text NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (active, ends_at);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo (CRUD).
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

-- Qualquer membro autenticado lê avisos ativos dentro da janela de exibição.
-- (a leitura no dashboard usa service client, mas mantemos a policy coerente
--  com o padrão de events: leitura pública restrita ao que está "no ar".)
DROP POLICY IF EXISTS "Anyone reads live announcements" ON announcements;
CREATE POLICY "Anyone reads live announcements" ON announcements FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

COMMENT ON TABLE announcements IS 'F-V22: avisos exibidos como barra fixa no topo do dashboard do membro. Gerenciados em /admin/announcements. starts_at/ends_at NULL = sem limite; active controla on/off manual.';

-- Bucket público pra imagens dos avisos (upload pelo admin via /api/admin/announcements/upload).
-- Public = leitura via URL pública (CDN), sem RLS de SELECT. Upload é feito com service
-- client (admin-gated no app), então não exige policy de INSERT em storage.objects.
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO UPDATE SET public = true;
