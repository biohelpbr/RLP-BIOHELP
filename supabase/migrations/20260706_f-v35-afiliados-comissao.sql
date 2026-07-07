-- F-V35 fase 3 — tipos de comissão de afiliado no commission_ledger.
-- Estende o CHECK de commission_type. Superset com os tipos do F-V34 (activation_v2_*)
-- pra que, independente da ordem de merge, o CHECK final aceite todos.
-- Aditiva; não muda dado. Reversível.
--
-- ROLLBACK: recriar o CHECK sem 'affiliate_sale'/'affiliate_perpetual'.

ALTER TABLE public.commission_ledger
  DROP CONSTRAINT IF EXISTS commission_ledger_commission_type_check;

ALTER TABLE public.commission_ledger
  ADD CONSTRAINT commission_ledger_commission_type_check
  CHECK (commission_type = ANY (ARRAY[
    'fast_track_30','fast_track_20','perpetual',
    'bonus_3_level_1','bonus_3_level_2','bonus_3_level_3',
    'leadership','royalty','adjustment','reversal',
    'subscription_activation',
    'activation_v2_direct','activation_v2_builder',  -- F-V34 (superset)
    'affiliate_sale',      -- F-V35: comissão da venda (faixa GMV) ao Afiliado Atual
    'affiliate_perpetual'  -- F-V35: perpétua 10% ao Afiliado Originador
  ]));
