-- F-V31 Academy v2 — Grande Grupo como entidade + materiais + re-nivelar a trava (F-V27)
-- Idempotente + aditivo. Backfill preserva o que já existe (group_label → entidade).
-- A trava (F-V27) sobe de content_trails → academy_groups; ativação por trilha →
-- por grupo. Colunas antigas (group_label, access_mode/lock_* em trails,
-- member_trail_activations) ficam DEPRECATED (mantidas p/ rollback; UI para de usar).
--
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS academy_group_materials CASCADE;
--   DROP TABLE IF EXISTS member_group_activations CASCADE;
--   ALTER TABLE content_trails DROP COLUMN IF EXISTS group_id;
--   DROP TABLE IF EXISTS academy_groups CASCADE;
--   -- (o CHECK de content_modules volta ao original abaixo, ver seção F)

-- ── A. Entidade Grande Grupo (com a trava que sobe do F-V27) ────────────────────
CREATE TABLE IF NOT EXISTS academy_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) >= 2),
  description text NULL,
  lock_cta_label   text NULL,
  lock_modal_title text NULL,
  lock_modal_body  text NULL,
  access_mode text NOT NULL DEFAULT 'open' CHECK (access_mode IN ('open','locked')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academy_groups_order ON academy_groups (display_order);

ALTER TABLE academy_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage groups" ON academy_groups;
CREATE POLICY "Admins manage groups" ON academy_groups FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));
DROP POLICY IF EXISTS "Members read groups" ON academy_groups;
CREATE POLICY "Members read groups" ON academy_groups FOR SELECT TO authenticated USING (true);

-- ── B. content_trails (Módulo) aponta pro grupo ────────────────────────────────
ALTER TABLE content_trails
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES academy_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_content_trails_group ON content_trails (group_id);

-- ── C. Backfill: 1 grupo por group_label distinto (+ "Geral" p/ sem grupo) ──────
INSERT INTO academy_groups (title, display_order)
SELECT DISTINCT trim(t.group_label), 0
FROM content_trails t
WHERE t.group_label IS NOT NULL AND trim(t.group_label) <> ''
  AND NOT EXISTS (SELECT 1 FROM academy_groups g WHERE g.title = trim(t.group_label));

-- Grupo "Geral" só se houver trilha sem group_label
INSERT INTO academy_groups (title, display_order)
SELECT 'Geral', 999
WHERE EXISTS (
  SELECT 1 FROM content_trails t
  WHERE (t.group_label IS NULL OR trim(t.group_label) = '')
) AND NOT EXISTS (SELECT 1 FROM academy_groups g WHERE g.title = 'Geral');

-- Vincular trilhas com group_label ao grupo correspondente
UPDATE content_trails t
SET group_id = g.id
FROM academy_groups g
WHERE t.group_id IS NULL
  AND t.group_label IS NOT NULL AND trim(t.group_label) = g.title;

-- Trilhas sem group_label → grupo "Geral"
UPDATE content_trails t
SET group_id = (SELECT id FROM academy_groups WHERE title = 'Geral')
WHERE t.group_id IS NULL;

-- ── D. Copiar a trava (F-V27) das trilhas travadas → grupo (best-effort) ────────
-- Pega os textos da 1ª trilha travada de cada grupo. Se nenhuma estava travada, o
-- grupo fica 'open' (default) — admin liga depois no CMS.
UPDATE academy_groups g
SET access_mode = 'locked',
    lock_cta_label   = COALESCE(g.lock_cta_label,   src.lock_cta_label),
    lock_modal_title = COALESCE(g.lock_modal_title, src.lock_modal_title),
    lock_modal_body  = COALESCE(g.lock_modal_body,  src.lock_modal_body)
FROM (
  SELECT DISTINCT ON (group_id) group_id, lock_cta_label, lock_modal_title, lock_modal_body
  FROM content_trails
  WHERE access_mode = 'locked' AND group_id IS NOT NULL
  ORDER BY group_id, display_order
) src
WHERE g.id = src.group_id AND g.access_mode = 'open';

-- ── E. Ativação por grupo (substitui member_trail_activations) ──────────────────
CREATE TABLE IF NOT EXISTS member_group_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES academy_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_mga_member ON member_group_activations (member_id);
CREATE INDEX IF NOT EXISTS idx_mga_group  ON member_group_activations (group_id);

ALTER TABLE member_group_activations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read group activations" ON member_group_activations;
CREATE POLICY "Admins read group activations" ON member_group_activations FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));
DROP POLICY IF EXISTS "Members manage own group activations" ON member_group_activations;
CREATE POLICY "Members manage own group activations" ON member_group_activations FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM members m WHERE m.id = member_group_activations.member_id AND m.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM members m WHERE m.id = member_group_activations.member_id AND m.auth_user_id = auth.uid()));

-- Migrar ativações por-trilha (F-V27) → por-grupo (se a tabela existir e tiver linhas)
INSERT INTO member_group_activations (group_id, member_id)
SELECT DISTINCT t.group_id, a.member_id
FROM member_trail_activations a
JOIN content_trails t ON t.id = a.trail_id
WHERE t.group_id IS NOT NULL
ON CONFLICT (group_id, member_id) DO NOTHING;

-- ── F. content_modules: aula "Em breve" pode existir SÓ com título ──────────────
-- O F-V09 criou um CHECK inline (sem nome) exigindo conteúdo. Trocamos por um
-- nomeado que dispensa conteúdo quando is_coming_soon = true.
DO $$
DECLARE c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'content_modules'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%content_text%' AND pg_get_constraintdef(oid) ILIKE '%content_url%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE content_modules DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE content_modules DROP CONSTRAINT IF EXISTS content_modules_content_or_comingsoon;
ALTER TABLE content_modules ADD CONSTRAINT content_modules_content_or_comingsoon CHECK (
  is_coming_soon = true
  OR (kind = 'text'  AND content_text IS NOT NULL)
  OR (kind <> 'text' AND content_url  IS NOT NULL)
);

-- ── G. Material complementar (PDFs) por grupo ──────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_group_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES academy_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_group_materials ON academy_group_materials (group_id, display_order);

ALTER TABLE academy_group_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage group materials" ON academy_group_materials;
CREATE POLICY "Admins manage group materials" ON academy_group_materials FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));
DROP POLICY IF EXISTS "Members read group materials" ON academy_group_materials;
CREATE POLICY "Members read group materials" ON academy_group_materials FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE academy_groups IS 'F-V31: Grande Grupo (camada) da Academy — entidade criável. Trava (fricção positiva) mora aqui, não mais na trilha.';
COMMENT ON COLUMN content_trails.group_id IS 'F-V31: módulo pertence a um academy_groups. Substitui o group_label (texto, deprecated).';
COMMENT ON TABLE academy_group_materials IS 'F-V31: PDFs/materiais complementares por Grande Grupo. Gated junto com a trava do grupo.';
