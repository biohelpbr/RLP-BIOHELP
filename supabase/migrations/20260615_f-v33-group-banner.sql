-- F-V33 — banner por Grande Grupo (ex.: calendário do mês no "Encontro ao vivo").
-- 100% ADITIVO e idempotente. Só adiciona uma coluna de URL de imagem.
--
-- Rollback (se necessário):
--   ALTER TABLE academy_groups DROP COLUMN IF EXISTS banner_url;

ALTER TABLE academy_groups
  ADD COLUMN IF NOT EXISTS banner_url text NULL;

COMMENT ON COLUMN academy_groups.banner_url IS
  'F-V33: imagem de banner exibida no topo do grupo (ex.: calendário mensal de encontros ao vivo).';
