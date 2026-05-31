-- =====================================================
-- F-V20 — Dados bancários persistidos em members
-- SPEC: docs/sdd/features/F-V20-politica-financeira-lovable/SPEC.md
-- Data: 2026-05-31
--
-- Política Financeira Nutrition Club Biohelp + UI Lovable definem:
--   1. Dados bancários moram no perfil do membro (autopreenchem no resgate)
--   2. Titularidade exige CPF/CNPJ = document_number do cadastro
--   3. Após alterar dados bancários, janela de 7 dias antes de novo saque
--   4. Tipo de pessoa (PF/PJ) define modalidade aceita
--
-- Esta migration adiciona 9 colunas em members + 1 índice parcial.
-- TUDO idempotente (ADD COLUMN IF NOT EXISTS) e nullable — backfill é zero.
--
-- Anti-SPEC v2:
--   §1 NÃO toca sponsor_id. ✓
--   §5 RLS já existente (members_update_own_or_admin) cobre as colunas novas
--      automaticamente — nada para alterar.
--   §6 NÃO dropa, NÃO recria. Apenas ADD COLUMN.
--   §7 NÃO mexe ref_code.
--
-- =====================================================
-- ROLLBACK (executar manualmente no caso de revert — perde dados gravados):
--
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_name;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_agency;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_account;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_account_type;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_pix_key;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_holder_name;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_contact_phone;
-- ALTER TABLE members DROP COLUMN IF EXISTS person_type;
-- ALTER TABLE members DROP COLUMN IF EXISTS document_number;
-- ALTER TABLE members DROP COLUMN IF EXISTS bank_data_updated_at;
-- DROP INDEX IF EXISTS idx_members_document_number;
--
-- =====================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS bank_name            text,
  ADD COLUMN IF NOT EXISTS bank_agency          text,
  ADD COLUMN IF NOT EXISTS bank_account         text,
  ADD COLUMN IF NOT EXISTS bank_account_type    text,
  ADD COLUMN IF NOT EXISTS bank_pix_key         text,
  ADD COLUMN IF NOT EXISTS bank_holder_name     text,
  ADD COLUMN IF NOT EXISTS bank_contact_phone   text,
  ADD COLUMN IF NOT EXISTS person_type          text,
  ADD COLUMN IF NOT EXISTS document_number      text,
  ADD COLUMN IF NOT EXISTS bank_data_updated_at timestamptz;

-- person_type só aceita 'pf' ou 'pj' — CHECK só se constraint ainda não existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'members_person_type_check'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT members_person_type_check
      CHECK (person_type IS NULL OR person_type IN ('pf', 'pj'));
  END IF;
END $$;

-- Índice para lookup por documento (futura validação de titularidade no payout)
CREATE INDEX IF NOT EXISTS idx_members_document_number
  ON members (document_number)
  WHERE document_number IS NOT NULL;

COMMENT ON COLUMN members.bank_name IS
  'F-V20: nome do banco do membro (ex: "260 - Nu Pagamentos"). Persistido pra autopreencher resgate.';
COMMENT ON COLUMN members.bank_holder_name IS
  'F-V20: nome do titular da conta. Política financeira exige match com cadastro.';
COMMENT ON COLUMN members.document_number IS
  'F-V20: CPF (PF) ou CNPJ (PJ) do titular. Usado para validar titularidade no resgate.';
COMMENT ON COLUMN members.person_type IS
  'F-V20: pf | pj — define modalidades aceitas no resgate (PF: RPA; PJ: NF).';
COMMENT ON COLUMN members.bank_data_updated_at IS
  'F-V20: timestamp da última alteração de qualquer dado bancário. Janela de segurança de 7 dias bloqueia novos saques após mudança (política §5).';
