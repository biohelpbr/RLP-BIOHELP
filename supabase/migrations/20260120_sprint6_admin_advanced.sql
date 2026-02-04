-- =====================================================
-- Sprint 6: Admin Avançado + Regras Especiais
-- Data: 20/01/2026
-- 
-- FRs: FR-12, FR-34, FR-35, FR-36, FR-37, FR-38
-- 
-- Funcionalidades:
-- - FR-12: Regra de 6 meses inativo (compressão de rede)
-- - FR-35: Dashboard global com KPIs
-- - FR-37: Gestão completa de membro
-- - FR-38: Gestão de tags
-- =====================================================

-- 1. Adicionar status 'removed' ao enum de status (se não existir)
DO $$ 
BEGIN
  -- Verificar se o status 'removed' já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'removed' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'member_status')
  ) THEN
    -- Adicionar novo valor ao enum (se existir enum)
    -- Se não existir enum, o check constraint já permite
    NULL;
  END IF;
END $$;

-- 2. Atualizar check constraint para incluir 'removed'
ALTER TABLE members 
  DROP CONSTRAINT IF EXISTS members_status_check;

ALTER TABLE members 
  ADD CONSTRAINT members_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'removed'::text]));

-- 3. Garantir que inactive_months_count existe e tem default
ALTER TABLE members 
  ALTER COLUMN inactive_months_count SET DEFAULT 0;

-- 4. Criar índice para busca de membros inativos (compressão)
CREATE INDEX IF NOT EXISTS idx_members_inactive_months 
  ON members(inactive_months_count) 
  WHERE inactive_months_count >= 6 AND status != 'removed';

-- 5. Criar índice para dashboard global (KPIs por nível)
CREATE INDEX IF NOT EXISTS idx_members_level_status 
  ON members(level, status);

-- 6. Criar índice para busca de comissões por tipo
CREATE INDEX IF NOT EXISTS idx_commission_ledger_type 
  ON commission_ledger(commission_type, reference_month);

-- 7. Criar função RPC para estatísticas globais (otimização)
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE (
  total_members BIGINT,
  active_members BIGINT,
  inactive_members BIGINT,
  pending_members BIGINT,
  removed_members BIGINT,
  total_cv NUMERIC,
  total_commissions NUMERIC,
  total_paid_payouts NUMERIC,
  pending_payouts_count BIGINT,
  pending_payouts_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM members WHERE status != 'removed')::BIGINT as total_members,
    (SELECT COUNT(*) FROM members WHERE status = 'active')::BIGINT as active_members,
    (SELECT COUNT(*) FROM members WHERE status = 'inactive')::BIGINT as inactive_members,
    (SELECT COUNT(*) FROM members WHERE status = 'pending')::BIGINT as pending_members,
    (SELECT COUNT(*) FROM members WHERE status = 'removed')::BIGINT as removed_members,
    (SELECT COALESCE(SUM(cv_amount), 0) FROM cv_ledger WHERE cv_amount > 0)::NUMERIC as total_cv,
    (SELECT COALESCE(SUM(amount), 0) FROM commission_ledger WHERE amount > 0)::NUMERIC as total_commissions,
    (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status = 'completed')::NUMERIC as total_paid_payouts,
    (SELECT COUNT(*) FROM payout_requests WHERE status IN ('pending', 'awaiting_document', 'under_review'))::BIGINT as pending_payouts_count,
    (SELECT COALESCE(SUM(amount), 0) FROM payout_requests WHERE status IN ('pending', 'awaiting_document', 'under_review'))::NUMERIC as pending_payouts_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar função RPC para membros por nível
CREATE OR REPLACE FUNCTION get_members_by_level()
RETURNS TABLE (
  level TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(m.level::TEXT, 'membro') as level,
    COUNT(*)::BIGINT as count
  FROM members m
  WHERE m.status != 'removed'
  GROUP BY m.level
  ORDER BY 
    CASE m.level
      WHEN 'membro' THEN 1
      WHEN 'parceira' THEN 2
      WHEN 'lider_formacao' THEN 3
      WHEN 'lider' THEN 4
      WHEN 'diretora' THEN 5
      WHEN 'head' THEN 6
      ELSE 7
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para compressão de rede (chamada pelo cron)
CREATE OR REPLACE FUNCTION compress_inactive_member(p_member_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  recruits_moved INTEGER,
  message TEXT
) AS $$
DECLARE
  v_member RECORD;
  v_recruits_count INTEGER;
BEGIN
  -- Buscar membro
  SELECT id, name, sponsor_id, inactive_months_count 
  INTO v_member
  FROM members
  WHERE id = p_member_id AND status != 'removed';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Membro não encontrado ou já removido';
    RETURN;
  END IF;
  
  -- Verificar se tem 6+ meses inativos
  IF v_member.inactive_months_count < 6 THEN
    RETURN QUERY SELECT false, 0, 'Membro não atingiu 6 meses de inatividade';
    RETURN;
  END IF;
  
  -- Contar indicados
  SELECT COUNT(*) INTO v_recruits_count
  FROM members
  WHERE sponsor_id = p_member_id;
  
  -- Mover indicados para o sponsor do membro removido
  UPDATE members
  SET sponsor_id = v_member.sponsor_id
  WHERE sponsor_id = p_member_id;
  
  -- Marcar membro como removido
  UPDATE members
  SET 
    status = 'removed',
    sponsor_id = NULL,
    level = 'membro'
  WHERE id = p_member_id;
  
  -- Registrar no histórico
  INSERT INTO member_level_history (
    member_id, previous_level, new_level, reason, criteria_snapshot
  ) VALUES (
    p_member_id,
    v_member.level,
    'membro',
    'Removido da rede por 6 meses de inatividade consecutiva',
    jsonb_build_object(
      'compression', true,
      'inactive_months', v_member.inactive_months_count,
      'recruits_moved', v_recruits_count,
      'original_sponsor_id', v_member.sponsor_id
    )
  );
  
  RETURN QUERY SELECT true, v_recruits_count, 'Membro removido e rede comprimida com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentários para documentação
COMMENT ON FUNCTION get_global_stats() IS 'Retorna estatísticas globais para dashboard admin (Sprint 6 - FR-35)';
COMMENT ON FUNCTION get_members_by_level() IS 'Retorna contagem de membros por nível (Sprint 6 - FR-35)';
COMMENT ON FUNCTION compress_inactive_member(UUID) IS 'Comprime rede de membro inativo há 6+ meses (Sprint 6 - FR-12)';
