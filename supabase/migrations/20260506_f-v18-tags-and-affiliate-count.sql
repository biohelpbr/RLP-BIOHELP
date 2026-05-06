-- =====================================================
-- F-V18 — Tags automáticas Líder/Influenciador
-- SPEC: docs/sdd/features/F-V18-tags-automaticas/SPEC.md
-- Data: 2026-05-06
--
-- Adiciona members.tags (jsonb default '[]') + view de contagem
-- de afiliados ativos N1. View usa proxy status='active' até F-V03
-- entrar (S5+); troca em 1 linha quando subscription_status existir.
--
-- Idempotente. Não toca members.sponsor_id (Anti-SPEC §1).
-- =====================================================
--
-- ROLLBACK (executar manualmente no caso de revert):
-- DROP VIEW IF EXISTS member_active_affiliate_count;
-- DROP INDEX IF EXISTS idx_members_tags;
-- ALTER TABLE members DROP COLUMN IF EXISTS tags;
--
-- =====================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_members_tags
  ON members USING gin (tags);

COMMENT ON COLUMN members.tags IS
  'F-V18: array jsonb de tags. Convenção: prefix `auto:` para tags geradas pelo cron de classificação automática (ex.: auto:lider, auto:influenciador); prefix `manual:` para tags aplicadas pelo admin (ex.: manual:vip). Cron preserva manual:* e só recalcula auto:*.';

CREATE OR REPLACE VIEW member_active_affiliate_count AS
SELECT
  m.id AS member_id,
  COUNT(a.id) FILTER (WHERE a.status = 'active') AS active_count
FROM members m
LEFT JOIN members a ON a.sponsor_id = m.id
GROUP BY m.id;

COMMENT ON VIEW member_active_affiliate_count IS
  'F-V18: contagem de afiliados N1 ativos por membro. Proxy: status=active (até F-V03 entrar em S5+ e popular subscription_status=paid). Quando F-V03 vier, trocar a cláusula FILTER pra (a.subscription_status = ''paid'').';
