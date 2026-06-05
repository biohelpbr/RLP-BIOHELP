-- Academy UX (refino 05/06): grupo temático da trilha + duração da aula.
-- Ambas nullable e editáveis pelo CMS admin (/admin/academy) — sem deploy.
--
-- Rollback:
--   ALTER TABLE public.content_trails DROP COLUMN IF EXISTS group_label;
--   ALTER TABLE public.content_modules DROP COLUMN IF EXISTS duration_minutes;

ALTER TABLE public.content_trails
  ADD COLUMN IF NOT EXISTS group_label text;

ALTER TABLE public.content_modules
  ADD COLUMN IF NOT EXISTS duration_minutes integer
    CHECK (duration_minutes IS NULL OR duration_minutes > 0);
