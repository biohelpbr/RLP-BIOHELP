-- Comissão de indicação passa a ter lançamento recorrente por renovação.
--
-- Contexto: a regra implementada em 26/05 (call 25/05) pagava R$80/R$40 UMA VEZ,
-- na ativação. Em 09/09 o cliente definiu que a comissão é devida a cada mês em
-- que a pessoa indicada mantém a assinatura, retroativo. Este tipo separa o
-- lançamento recorrente da ativação original, pra que o extrato continue legível
-- e o backfill seja auditável/reversível.
--
-- Aditiva; não altera dado existente.
--
-- ROLLBACK:
--   DELETE FROM commission_ledger WHERE commission_type = 'subscription_recurring';
--   (e recriar o CHECK sem 'subscription_recurring')

ALTER TABLE public.commission_ledger
  DROP CONSTRAINT IF EXISTS commission_ledger_commission_type_check;

ALTER TABLE public.commission_ledger
  ADD CONSTRAINT commission_ledger_commission_type_check
  CHECK (commission_type = ANY (ARRAY[
    'fast_track_30','fast_track_20','perpetual',
    'bonus_3_level_1','bonus_3_level_2','bonus_3_level_3',
    'leadership','royalty','adjustment','reversal',
    'subscription_activation',
    'subscription_recurring',  -- NOVO: mensalidade da indicação (renovação)
    'activation_v2_direct','activation_v2_builder',
    'affiliate_sale',
    'affiliate_perpetual'
  ]));
