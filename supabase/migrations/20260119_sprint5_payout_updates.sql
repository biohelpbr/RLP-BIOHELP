-- =====================================================
-- Sprint 5: Atualização de valores conforme TBDs resolvidos
-- Data: 19/01/2026
-- 
-- TBD-015: Limite PF = R$ 1.000/mês (era R$990)
-- TBD-016: Mínimo para saque = R$ 100 (era R$50)
-- TBD-018: Integração Asaas definida
-- TBD-021: Net-15 (disponível 15 dias após virada do mês)
-- =====================================================

-- 1. Atualizar default do limite mensal PF para R$1.000
ALTER TABLE payout_monthly_limits 
  ALTER COLUMN monthly_limit SET DEFAULT 1000.00;

-- 2. Atualizar comentário da coluna person_type
COMMENT ON COLUMN payout_requests.person_type IS 'pf=CPF até R$1.000/mês (RPA), mei=pode usar conta PF, pj=obrigatório NF-e';

-- 3. Atualizar comentário da tabela payout_monthly_limits
COMMENT ON TABLE payout_monthly_limits IS 'Controle de limite mensal de saque PF (R$1.000/mês) - FR-31';

-- 4. Adicionar campo available_at na commission_ledger para Net-15
ALTER TABLE commission_ledger 
  ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE;

-- 5. Atualizar comissões existentes com available_at (Net-15)
-- Comissões ficam disponíveis no dia 15 do mês seguinte
UPDATE commission_ledger 
SET available_at = DATE_TRUNC('month', created_at) + INTERVAL '1 month' + INTERVAL '14 days'
WHERE available_at IS NULL;

-- 6. Adicionar comentário explicativo
COMMENT ON COLUMN commission_ledger.available_at IS 'Data em que a comissão fica disponível para saque (Net-15: 15 dias após virada do mês)';

-- 7. Criar trigger para definir available_at automaticamente em novas comissões
CREATE OR REPLACE FUNCTION set_commission_available_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Net-15: disponível no dia 15 do mês seguinte
  NEW.available_at := DATE_TRUNC('month', NEW.created_at) + INTERVAL '1 month' + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_commission_available_at ON commission_ledger;
CREATE TRIGGER trigger_set_commission_available_at
  BEFORE INSERT ON commission_ledger
  FOR EACH ROW
  EXECUTE FUNCTION set_commission_available_at();

-- 8. Recriar função get_available_balance para considerar Net-15
-- (DROP necessário pois mudou a assinatura de retorno)
DROP FUNCTION IF EXISTS get_available_balance(uuid);
CREATE OR REPLACE FUNCTION get_available_balance(p_member_id UUID)
RETURNS TABLE (
  total_earned NUMERIC,
  total_withdrawn NUMERIC,
  pending_balance NUMERIC,
  available_balance NUMERIC,
  available_for_withdrawal NUMERIC
) AS $$
DECLARE
  v_total_earned NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_pending_balance NUMERIC := 0;
  v_available_balance NUMERIC := 0;
  v_available_for_withdrawal NUMERIC := 0;
BEGIN
  -- Total ganho (todas as comissões positivas)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM commission_ledger
  WHERE member_id = p_member_id AND amount > 0;
  
  -- Total sacado
  SELECT COALESCE(SUM(amount), 0) INTO v_total_withdrawn
  FROM payout_requests
  WHERE member_id = p_member_id AND status IN ('completed', 'approved', 'processing');
  
  -- Saldo pendente (comissões ainda não disponíveis - Net-15)
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_balance
  FROM commission_ledger
  WHERE member_id = p_member_id 
    AND amount > 0 
    AND (available_at IS NULL OR available_at > NOW());
  
  -- Saldo disponível (comissões já liberadas)
  SELECT COALESCE(SUM(amount), 0) INTO v_available_balance
  FROM commission_ledger
  WHERE member_id = p_member_id 
    AND amount > 0 
    AND available_at IS NOT NULL 
    AND available_at <= NOW();
  
  -- Subtrair reversões/ajustes negativos
  SELECT v_available_balance - COALESCE(SUM(ABS(amount)), 0) INTO v_available_balance
  FROM commission_ledger
  WHERE member_id = p_member_id AND amount < 0;
  
  -- Disponível para saque = disponível - já sacado - em processamento
  v_available_for_withdrawal := v_available_balance - v_total_withdrawn;
  
  -- Subtrair saques pendentes
  SELECT v_available_for_withdrawal - COALESCE(SUM(amount), 0) INTO v_available_for_withdrawal
  FROM payout_requests
  WHERE member_id = p_member_id AND status IN ('pending', 'awaiting_document', 'under_review');
  
  IF v_available_for_withdrawal < 0 THEN
    v_available_for_withdrawal := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_total_earned,
    v_total_withdrawn,
    v_pending_balance,
    v_available_balance,
    v_available_for_withdrawal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Atualizar função check_pf_monthly_limit com novo limite
CREATE OR REPLACE FUNCTION check_pf_monthly_limit(
  p_member_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE (
  can_withdraw BOOLEAN,
  monthly_limit NUMERIC,
  current_total NUMERIC,
  remaining NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_monthly_limit NUMERIC := 1000.00; -- TBD-015: R$1.000/mês
  v_current_total NUMERIC := 0;
  v_remaining NUMERIC;
  v_can_withdraw BOOLEAN;
  v_message TEXT;
BEGIN
  -- Buscar total já solicitado no mês (apenas PF)
  SELECT COALESCE(SUM(pr.amount), 0) INTO v_current_total
  FROM payout_requests pr
  WHERE pr.member_id = p_member_id
    AND pr.person_type = 'pf'
    AND pr.status NOT IN ('rejected', 'cancelled')
    AND TO_CHAR(pr.created_at, 'YYYY-MM') = v_current_month;
  
  v_remaining := v_monthly_limit - v_current_total;
  
  IF v_remaining < 0 THEN
    v_remaining := 0;
  END IF;
  
  IF p_amount <= v_remaining THEN
    v_can_withdraw := true;
    v_message := 'OK';
  ELSE
    v_can_withdraw := false;
    v_message := FORMAT('Limite mensal PF excedido. Disponível: R$ %s', v_remaining);
  END IF;
  
  RETURN QUERY SELECT 
    v_can_withdraw,
    v_monthly_limit,
    v_current_total,
    v_remaining,
    v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atualizar função create_payout_request com novos valores
CREATE OR REPLACE FUNCTION create_payout_request(
  p_member_id UUID,
  p_amount NUMERIC,
  p_person_type TEXT,
  p_bank_name TEXT,
  p_bank_agency TEXT,
  p_bank_account TEXT,
  p_bank_account_type TEXT,
  p_pix_key TEXT DEFAULT NULL,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_holder_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  payout_id UUID,
  message TEXT
) AS $$
DECLARE
  v_payout_id UUID;
  v_available NUMERIC;
  v_pf_limit_check RECORD;
  v_status payout_status;
  v_gross_amount NUMERIC;
  v_tax_amount NUMERIC := 0;
  v_net_amount NUMERIC;
  v_min_payout NUMERIC := 100.00; -- TBD-016: R$100 mínimo
BEGIN
  -- 1. Verificar valor mínimo
  IF p_amount < v_min_payout THEN
    RETURN QUERY SELECT false, NULL::UUID, FORMAT('Valor mínimo para saque é R$ %s', v_min_payout);
    RETURN;
  END IF;
  
  -- 2. Verificar saldo disponível (considerando Net-15)
  SELECT available_for_withdrawal INTO v_available
  FROM get_available_balance(p_member_id);
  
  IF v_available IS NULL OR v_available < p_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, FORMAT('Saldo insuficiente. Disponível: R$ %s', COALESCE(v_available, 0));
    RETURN;
  END IF;
  
  -- 3. Se PF, verificar limite mensal
  IF p_person_type = 'pf' THEN
    SELECT * INTO v_pf_limit_check
    FROM check_pf_monthly_limit(p_member_id, p_amount);
    
    IF NOT v_pf_limit_check.can_withdraw THEN
      RETURN QUERY SELECT false, NULL::UUID, v_pf_limit_check.message;
      RETURN;
    END IF;
    
    -- Calcular impostos para PF (aproximadamente 16%)
    v_tax_amount := ROUND(p_amount * 0.16, 2);
  END IF;
  
  -- 4. Definir status inicial
  IF p_person_type = 'pj' THEN
    v_status := 'awaiting_document';
  ELSE
    v_status := 'pending';
  END IF;
  
  -- 5. Calcular valores
  v_gross_amount := p_amount;
  v_net_amount := p_amount - v_tax_amount;
  
  -- 6. Criar solicitação
  INSERT INTO payout_requests (
    member_id, amount, person_type, 
    bank_name, bank_agency, bank_account, bank_account_type,
    pix_key, cpf_cnpj, holder_name,
    status, gross_amount, tax_amount, net_amount
  ) VALUES (
    p_member_id, p_amount, p_person_type::person_type,
    p_bank_name, p_bank_agency, p_bank_account, p_bank_account_type,
    p_pix_key, p_cpf_cnpj, p_holder_name,
    v_status, v_gross_amount, v_tax_amount, v_net_amount
  )
  RETURNING id INTO v_payout_id;
  
  -- 7. Registrar no histórico
  INSERT INTO payout_history (
    payout_request_id, previous_status, new_status, change_reason
  ) VALUES (
    v_payout_id, NULL, v_status, 'Solicitação criada'
  );
  
  -- 8. Atualizar pending_balance em commission_balances
  UPDATE commission_balances
  SET pending_balance = COALESCE(pending_balance, 0) + p_amount,
      updated_at = NOW()
  WHERE member_id = p_member_id;
  
  RETURN QUERY SELECT true, v_payout_id, 'Solicitação criada com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Criar índice para otimizar consultas de available_at
CREATE INDEX IF NOT EXISTS idx_commission_ledger_available_at 
  ON commission_ledger(member_id, available_at) 
  WHERE amount > 0;

-- 12. Adicionar comentário sobre Net-15 na tabela
COMMENT ON TABLE commission_ledger IS 'Ledger imutável de todas as comissões (auditoria). Net-15: comissões disponíveis 15 dias após virada do mês.';
