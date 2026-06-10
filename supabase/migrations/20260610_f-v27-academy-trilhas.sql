-- F-V27 Academy: trilhas com trava (fricção positiva) + aulas "em breve"
-- Decisão §A.3 validada pelo cliente 10/06 = Opção A (ativação por membro).
-- 100% ADITIVO e idempotente — não altera/remove nada existente. Trilhas atuais
-- ficam access_mode='open' (comportamento de hoje) → não quebra produção.
--
-- Rollback (se necessário):
--   DROP TABLE IF EXISTS member_trail_activations CASCADE;
--   ALTER TABLE content_modules DROP COLUMN IF EXISTS available_at;
--   ALTER TABLE content_modules DROP COLUMN IF EXISTS is_coming_soon;
--   ALTER TABLE content_trails DROP COLUMN IF EXISTS access_mode;
--   ALTER TABLE content_trails DROP COLUMN IF EXISTS lock_cta_label;
--   ALTER TABLE content_trails DROP COLUMN IF EXISTS lock_modal_title;
--   ALTER TABLE content_trails DROP COLUMN IF EXISTS lock_modal_body;

-- ── A. Trilha aberta vs travada + textos da trava (autonomia do admin) ──────────
ALTER TABLE content_trails
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'open'
    CHECK (access_mode IN ('open','locked'));
ALTER TABLE content_trails
  ADD COLUMN IF NOT EXISTS lock_cta_label   text NULL;  -- botão do card travado ("Quero indicar e desenvolver")
ALTER TABLE content_trails
  ADD COLUMN IF NOT EXISTS lock_modal_title text NULL;  -- título do modal ("Você escolheu um novo caminho")
ALTER TABLE content_trails
  ADD COLUMN IF NOT EXISTS lock_modal_body  text NULL;  -- corpo do modal ("A partir desse momento vamos te ensinar tudo. Você quer mesmo?")

-- ── C. Aulas "em breve" (data opcional OU trava manual) ─────────────────────────
ALTER TABLE content_modules
  ADD COLUMN IF NOT EXISTS available_at   timestamptz NULL;                 -- libera sozinho quando a data chega
ALTER TABLE content_modules
  ADD COLUMN IF NOT EXISTS is_coming_soon boolean NOT NULL DEFAULT false;   -- trava manual até admin desmarcar

-- ── B. Ativação por membro (Opção A) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_trail_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id uuid NOT NULL REFERENCES content_trails(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trail_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_mta_member ON member_trail_activations (member_id);
CREATE INDEX IF NOT EXISTS idx_mta_trail  ON member_trail_activations (trail_id);

ALTER TABLE member_trail_activations ENABLE ROW LEVEL SECURITY;

-- RLS espelha o padrão do F-V09: admin lê tudo; membro só lê/insere as próprias linhas.
-- (Defesa-em-profundidade — o app usa service_role e impõe o gating em código.)
DROP POLICY IF EXISTS "Admins read all activations" ON member_trail_activations;
CREATE POLICY "Admins read all activations" ON member_trail_activations FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM roles r JOIN members m ON r.member_id = m.id
    WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "Members manage own activations" ON member_trail_activations;
CREATE POLICY "Members manage own activations" ON member_trail_activations FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM members m WHERE m.id = member_trail_activations.member_id AND m.auth_user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM members m WHERE m.id = member_trail_activations.member_id AND m.auth_user_id = auth.uid()));

COMMENT ON COLUMN content_trails.access_mode IS 'F-V27: open = entra direto (hoje); locked = fricção positiva, precisa ativar por membro.';
COMMENT ON TABLE member_trail_activations IS 'F-V27: ativação da trilha travada POR membro (Opção A). UNIQUE(trail_id, member_id) torna activateTrail idempotente.';
