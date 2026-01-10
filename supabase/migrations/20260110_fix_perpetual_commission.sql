-- =====================================================
-- FIX: Comissão Perpétua - Diferenciação por Tipo de N1
-- Data: 2026-01-10
-- 
-- CORREÇÃO BASEADA NO DOCUMENTO CANÔNICO:
-- Biohelp___Loyalty_Reward_Program.md (linhas 163-173)
-- 
-- REGRAS CORRETAS:
-- - Parceira (N0): 5% CV de clientes N1 (APENAS clientes, não parceiras)
-- - Líder (N0): 7% CV da rede inteira + 5% CV de clientes N1
-- - Diretora (N0): 10% CV da rede + 7% CV de parceiras N1 + 5% CV de clientes N1
-- - Head (N0): 15% CV da rede + 10% CV de líderes N1 + 7% CV de parceiras N1 + 5% CV de clientes N1
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO AUXILIAR: Determinar tipo do comprador
-- =====================================================

CREATE OR REPLACE FUNCTION get_buyer_type(p_level member_level)
RETURNS TEXT AS $$
BEGIN
  -- Cliente = membro (não é parceira ou superior)
  IF p_level = 'membro' THEN
    RETURN 'cliente';
  END IF;
  
  -- Parceira = parceira ou lider_formacao
  IF p_level IN ('parceira', 'lider_formacao') THEN
    RETURN 'parceira';
  END IF;
  
  -- Líder = lider, diretora, head
  IF p_level IN ('lider', 'diretora', 'head') THEN
    RETURN 'lider';
  END IF;
  
  -- Fallback
  RETURN 'cliente';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_buyer_type IS 'Determina o tipo do comprador para cálculo de comissão perpétua (cliente/parceira/lider)';

-- =====================================================
-- 2. FUNÇÃO AUXILIAR: Obter percentual de comissão perpétua
-- =====================================================

CREATE OR REPLACE FUNCTION get_perpetual_percentage(
  p_sponsor_level member_level,
  p_buyer_level member_level
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_buyer_type TEXT;
BEGIN
  v_buyer_type := get_buyer_type(p_buyer_level);
  
  -- PARCEIRA: só recebe 5% de clientes N1
  IF p_sponsor_level = 'parceira' THEN
    IF v_buyer_type = 'cliente' THEN
      RETURN 5.00;
    END IF;
    RETURN 0.00; -- Parceira NÃO recebe de outras parceiras
  END IF;
  
  -- LÍDER / LÍDER EM FORMAÇÃO: 7% da rede + 5% de clientes N1
  IF p_sponsor_level IN ('lider', 'lider_formacao') THEN
    IF v_buyer_type = 'cliente' THEN
      RETURN 5.00; -- 5% de clientes N1
    END IF;
    RETURN 7.00; -- 7% de parceiras+ N1 (parte da rede)
  END IF;
  
  -- DIRETORA: 10% da rede + 7% de parceiras N1 + 5% de clientes N1
  IF p_sponsor_level = 'diretora' THEN
    IF v_buyer_type = 'cliente' THEN
      RETURN 5.00; -- 5% de clientes N1
    END IF;
    IF v_buyer_type = 'parceira' THEN
      RETURN 7.00; -- 7% de parceiras N1
    END IF;
    RETURN 10.00; -- 10% de líderes+ N1 (parte da rede)
  END IF;
  
  -- HEAD: 15% da rede + 10% de líderes N1 + 7% de parceiras N1 + 5% de clientes N1
  IF p_sponsor_level = 'head' THEN
    IF v_buyer_type = 'cliente' THEN
      RETURN 5.00; -- 5% de clientes N1
    END IF;
    IF v_buyer_type = 'parceira' THEN
      RETURN 7.00; -- 7% de parceiras N1
    END IF;
    IF v_buyer_type = 'lider' THEN
      RETURN 10.00; -- 10% de líderes N1
    END IF;
    RETURN 15.00; -- 15% fallback (rede)
  END IF;
  
  -- Membro não recebe comissão perpétua
  RETURN 0.00;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_perpetual_percentage IS 'Calcula percentual de comissão perpétua baseado no nível do sponsor E no nível do comprador (documento canônico)';

-- =====================================================
-- 3. ATUALIZAR FUNÇÃO: calculate_order_commissions
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_order_commissions(
  p_order_id UUID,
  p_buyer_id UUID,
  p_cv_total DECIMAL(10,2)
)
RETURNS TABLE (
  member_id UUID,
  commission_type TEXT,
  amount DECIMAL(10,2),
  cv_base DECIMAL(10,2),
  percentage DECIMAL(5,2),
  network_level INT,
  description TEXT
) AS $$
DECLARE
  v_buyer RECORD;
  v_sponsor RECORD;
  v_grand_sponsor RECORD;
  v_fast_track RECORD;
  v_now TIMESTAMPTZ;
  v_reference_month DATE;
  v_perpetual_pct DECIMAL(5,2);
  v_buyer_type TEXT;
BEGIN
  v_now := now();
  v_reference_month := date_trunc('month', v_now)::DATE;
  
  -- Buscar dados do comprador (incluindo nível)
  SELECT m.id, m.sponsor_id, m.level, m.status, m.name
  INTO v_buyer
  FROM members m
  WHERE m.id = p_buyer_id;
  
  IF v_buyer.sponsor_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Buscar sponsor (N0)
  SELECT m.id, m.sponsor_id, m.level, m.status, m.name
  INTO v_sponsor
  FROM members m
  WHERE m.id = v_buyer.sponsor_id;
  
  -- Verificar se sponsor está ativo
  IF v_sponsor.status != 'active' THEN
    RETURN;
  END IF;
  
  -- Determinar tipo do comprador para descrições
  v_buyer_type := get_buyer_type(v_buyer.level);
  
  -- ===== FAST-TRACK =====
  SELECT *
  INTO v_fast_track
  FROM fast_track_windows
  WHERE sponsor_id = v_sponsor.id
    AND member_id = p_buyer_id
    AND is_active = true;
  
  IF v_fast_track.id IS NOT NULL THEN
    -- Fase 1: 30% (primeiros 30 dias)
    IF v_now <= v_fast_track.phase_1_ends_at THEN
      RETURN QUERY SELECT
        v_sponsor.id,
        'fast_track_30'::TEXT,
        ROUND(p_cv_total * 0.30, 2),
        p_cv_total,
        30.00::DECIMAL(5,2),
        1,
        format('Fast-Track 30%% - %s (N1, primeiros 30 dias)', v_buyer.name)::TEXT;
    -- Fase 2: 20% (dias 31-60)
    ELSIF v_now <= v_fast_track.phase_2_ends_at THEN
      RETURN QUERY SELECT
        v_sponsor.id,
        'fast_track_20'::TEXT,
        ROUND(p_cv_total * 0.20, 2),
        p_cv_total,
        20.00::DECIMAL(5,2),
        1,
        format('Fast-Track 20%% - %s (N1, dias 31-60)', v_buyer.name)::TEXT;
    END IF;
  ELSE
    -- ===== COMISSÃO PERPÉTUA (Fast-Track expirou ou não existe) =====
    -- Usar função que diferencia por tipo de N1
    v_perpetual_pct := get_perpetual_percentage(v_sponsor.level, v_buyer.level);
    
    IF v_perpetual_pct > 0 THEN
      RETURN QUERY SELECT
        v_sponsor.id,
        'perpetual'::TEXT,
        ROUND(p_cv_total * (v_perpetual_pct / 100), 2),
        p_cv_total,
        v_perpetual_pct,
        1,
        format('Comissão Perpétua %s%% - %s (%s)', 
               v_perpetual_pct::TEXT, 
               v_buyer.name, 
               CASE v_buyer_type 
                 WHEN 'cliente' THEN 'Cliente'
                 WHEN 'parceira' THEN 'Parceira'
                 WHEN 'lider' THEN 'Líder'
                 ELSE 'Membro'
               END)::TEXT;
    END IF;
  END IF;
  
  -- ===== LEADERSHIP BÔNUS =====
  IF v_sponsor.level = 'diretora' THEN
    RETURN QUERY SELECT
      v_sponsor.id,
      'leadership'::TEXT,
      ROUND(p_cv_total * 0.03, 2),
      p_cv_total,
      3.00::DECIMAL(5,2),
      1,
      format('Leadership Bônus Diretora 3%% - %s', v_buyer.name)::TEXT;
  ELSIF v_sponsor.level = 'head' THEN
    RETURN QUERY SELECT
      v_sponsor.id,
      'leadership'::TEXT,
      ROUND(p_cv_total * 0.04, 2),
      p_cv_total,
      4.00::DECIMAL(5,2),
      1,
      format('Leadership Bônus Head 4%% - %s', v_buyer.name)::TEXT;
  END IF;
  
  -- ===== N2 (Grand Sponsor) - Fast-Track para Líderes =====
  IF v_sponsor.level IN ('lider', 'lider_formacao', 'diretora', 'head') AND v_sponsor.sponsor_id IS NOT NULL THEN
    SELECT m.id, m.level, m.status, m.name
    INTO v_grand_sponsor
    FROM members m
    WHERE m.id = v_sponsor.sponsor_id;
    
    IF v_grand_sponsor.status = 'active' AND v_grand_sponsor.level IN ('lider', 'lider_formacao', 'diretora', 'head') THEN
      -- Verificar Fast-Track N2
      SELECT *
      INTO v_fast_track
      FROM fast_track_windows
      WHERE sponsor_id = v_grand_sponsor.id
        AND member_id = p_buyer_id
        AND is_active = true;
      
      IF v_fast_track.id IS NOT NULL THEN
        IF v_now <= v_fast_track.phase_1_ends_at THEN
          RETURN QUERY SELECT
            v_grand_sponsor.id,
            'fast_track_30'::TEXT,
            ROUND(p_cv_total * 0.20, 2),
            p_cv_total,
            20.00::DECIMAL(5,2),
            2,
            format('Fast-Track Líder 20%% - %s (N2, primeiros 30 dias)', v_buyer.name)::TEXT;
        ELSIF v_now <= v_fast_track.phase_2_ends_at THEN
          RETURN QUERY SELECT
            v_grand_sponsor.id,
            'fast_track_20'::TEXT,
            ROUND(p_cv_total * 0.10, 2),
            p_cv_total,
            10.00::DECIMAL(5,2),
            2,
            format('Fast-Track Líder 10%% - %s (N2, dias 31-60)', v_buyer.name)::TEXT;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_order_commissions IS 'Calcula comissões para um pedido (Fast-Track, Perpétua diferenciada por tipo de N1, Leadership) - CORRIGIDO conforme documento canônico';

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_buyer_type TO authenticated;
GRANT EXECUTE ON FUNCTION get_perpetual_percentage TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_order_commissions TO authenticated;

-- =====================================================
-- 5. COMENTÁRIO DE AUDITORIA
-- =====================================================

COMMENT ON SCHEMA public IS 'Schema público com correção de Comissão Perpétua (10/01/2026) - Agora diferencia percentual por tipo de N1 (cliente/parceira/líder) conforme documento canônico Biohelp___Loyalty_Reward_Program.md';

