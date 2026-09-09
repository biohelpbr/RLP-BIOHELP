-- Saldo de comissão passa a descontar os saques já pagos.
--
-- Problema: update_commission_balance() calculava
--   available_balance = SUM(commission_ledger.amount)
-- e nunca preenchia total_withdrawn. Como o saque grava só em payout_requests
-- (sem lançar baixa no ledger), o valor pago continuava aparecendo como
-- disponível — a parceira podia solicitar de novo o mesmo dinheiro.
-- Em 09/09/26: 4 parceiras, R$ 1.545 pagos e ainda exibidos como disponíveis.
--
-- Correção: o saldo passa a considerar payout_requests com status 'completed'
--   total_withdrawn    = SUM(saques completed)
--   available_balance  = SUM(ledger) - SUM(saques completed)
-- e um gatilho novo em payout_requests recalcula o saldo quando um saque muda
-- de status (antes só um lançamento novo no ledger disparava o recálculo).
--
-- Rollback:
--   DROP TRIGGER IF EXISTS trigger_payout_updates_balance ON payout_requests;
--   DROP FUNCTION IF EXISTS recalc_balance_on_payout();
--   (e restaurar update_commission_balance da migration 20260110_sprint4_commissions.sql)

-- 1) Recalcula o saldo de UM membro a partir das duas fontes (ledger + saques).
CREATE OR REPLACE FUNCTION recalc_commission_balance(p_member_id UUID)
RETURNS VOID AS $$
DECLARE
  current_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_withdrawn NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_withdrawn
  FROM payout_requests
  WHERE member_id = p_member_id AND status = 'completed';

  INSERT INTO commission_balances (
    member_id, total_earned, total_withdrawn, available_balance, current_month,
    fast_track_month, perpetual_month, bonus_3_month, leadership_month, royalty_month, updated_at
  )
  SELECT
    p_member_id,
    COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0),
    v_withdrawn,
    -- Nunca deixa negativo: um saque manual maior que o extrato zeraria o card
    -- e assustaria a parceira sem motivo.
    GREATEST(COALESCE(SUM(amount), 0) - v_withdrawn, 0),
    current_month_start,
    COALESCE(SUM(amount) FILTER (WHERE commission_type IN ('fast_track_30','fast_track_20') AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'perpetual' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type LIKE 'bonus_3%' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'leadership' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'royalty' AND reference_month = current_month_start), 0),
    now()
  FROM commission_ledger
  WHERE member_id = p_member_id
  ON CONFLICT (member_id) DO UPDATE SET
    total_earned = EXCLUDED.total_earned,
    total_withdrawn = EXCLUDED.total_withdrawn,
    available_balance = EXCLUDED.available_balance,
    current_month = EXCLUDED.current_month,
    fast_track_month = EXCLUDED.fast_track_month,
    perpetual_month = EXCLUDED.perpetual_month,
    bonus_3_month = EXCLUDED.bonus_3_month,
    leadership_month = EXCLUDED.leadership_month,
    royalty_month = EXCLUDED.royalty_month,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 2) Lançamento novo no extrato → recalcula (mesmo gatilho de antes, agora delegando).
CREATE OR REPLACE FUNCTION update_commission_balance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalc_commission_balance(NEW.member_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Saque muda de status → recalcula (o que faltava).
CREATE OR REPLACE FUNCTION recalc_balance_on_payout()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalc_commission_balance(COALESCE(NEW.member_id, OLD.member_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payout_updates_balance ON payout_requests;
CREATE TRIGGER trigger_payout_updates_balance
  AFTER INSERT OR UPDATE OF status, amount OR DELETE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION recalc_balance_on_payout();

-- 4) Corrige o que já está gravado errado (idempotente: recalcula da fonte).
DO $$
DECLARE
  m UUID;
BEGIN
  FOR m IN
    SELECT member_id FROM commission_balances
    UNION
    SELECT DISTINCT member_id FROM payout_requests WHERE status = 'completed'
  LOOP
    PERFORM recalc_commission_balance(m);
  END LOOP;
END $$;
