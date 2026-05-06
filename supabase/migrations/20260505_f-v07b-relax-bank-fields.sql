-- =====================================================
-- F-V07b — Relaxa NOT NULL dos campos bancários em payout_requests
-- SPEC: docs/sdd/features/F-V07-saque-cashin-nf/SPEC.md
-- Data: 2026-05-05
--
-- Modelo v1 exigia bank_name/agency/account/account_type/cpf_cnpj/holder_name
-- como NOT NULL (RPA/CPF sempre tinha conta bancária). O v2 não exige conta
-- pra cashback_cashin nem shopify_credit. Esta migration torna esses 6 campos
-- NULLable; rows v1 existentes mantêm os valores intactos.
--
-- Anti-SPEC §6: nunca dropar/recriar payout_requests. Apenas ALTER COLUMN.
-- Validação de "dados bancários obrigatórios pra PIX" continua na server
-- action requestPayout (v2) e no RPC create_payout_request (v1).
-- =====================================================
--
-- ROLLBACK (executar manualmente no caso de revert):
-- ALTER TABLE payout_requests ALTER COLUMN bank_name SET NOT NULL;
-- ALTER TABLE payout_requests ALTER COLUMN bank_agency SET NOT NULL;
-- ALTER TABLE payout_requests ALTER COLUMN bank_account SET NOT NULL;
-- ALTER TABLE payout_requests ALTER COLUMN bank_account_type SET NOT NULL;
-- ALTER TABLE payout_requests ALTER COLUMN cpf_cnpj SET NOT NULL;
-- ALTER TABLE payout_requests ALTER COLUMN holder_name SET NOT NULL;
-- (atenção: rollback só funciona se TODAS as rows tiverem esses campos
-- preenchidos — rows v2 vão precisar de backfill antes do rollback.)
--
-- =====================================================

ALTER TABLE payout_requests ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE payout_requests ALTER COLUMN bank_agency DROP NOT NULL;
ALTER TABLE payout_requests ALTER COLUMN bank_account DROP NOT NULL;
ALTER TABLE payout_requests ALTER COLUMN bank_account_type DROP NOT NULL;
ALTER TABLE payout_requests ALTER COLUMN cpf_cnpj DROP NOT NULL;
ALTER TABLE payout_requests ALTER COLUMN holder_name DROP NOT NULL;

COMMENT ON COLUMN payout_requests.bank_name IS
  'F-V07b: nullable a partir de v2 — só PIX exige dados bancários completos.';
