-- =====================================================
-- Sprint 4: Comissões + Ledger
-- Data: 2026-01-10
-- Descrição: Tabelas para motor de comissões auditável
-- =====================================================

-- =====================================================
-- 1. TABELA: commission_ledger
-- Ledger imutável para auditoria de todas as comissões
-- =====================================================

CREATE TABLE IF NOT EXISTS commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  
  -- Tipo de comissão
  commission_type TEXT NOT NULL CHECK (commission_type IN (
    'fast_track_30',      -- Fast-Track 30% (primeiros 30 dias)
    'fast_track_20',      -- Fast-Track 20% (dias 31-60)
    'perpetual',          -- Comissão Perpétua
    'bonus_3_level_1',    -- Bônus 3 - R$250
    'bonus_3_level_2',    -- Bônus 3 - R$1.500
    'bonus_3_level_3',    -- Bônus 3 - R$8.000
    'leadership',         -- Leadership Bônus
    'royalty',            -- Royalty (Head forma Head)
    'adjustment',         -- Ajuste manual (admin)
    'reversal'            -- Reversão (refund)
  )),
  
  -- Valores (DECIMAL 10,2 conforme TBD-017)
  amount DECIMAL(10,2) NOT NULL,           -- Valor da comissão em R$
  cv_base DECIMAL(10,2),                   -- CV base usado no cálculo
  percentage DECIMAL(5,2),                 -- Percentual aplicado (ex: 30.00)
  
  -- Origem
  source_member_id UUID REFERENCES members(id),  -- Membro que gerou a comissão
  source_order_id UUID REFERENCES orders(id),    -- Pedido que gerou a comissão
  network_level INT,                             -- Nível na rede (N1=1, N2=2, etc.)
  
  -- Período
  reference_month DATE NOT NULL,           -- Mês de referência (YYYY-MM-01)
  
  -- Metadados
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Validações
  CONSTRAINT positive_or_negative_amount CHECK (amount != 0),
  CONSTRAINT valid_network_level CHECK (network_level IS NULL OR network_level >= 1)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_commission_ledger_member ON commission_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_month ON commission_ledger(reference_month);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_type ON commission_ledger(commission_type);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_source_order ON commission_ledger(source_order_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_created ON commission_ledger(created_at DESC);

-- =====================================================
-- 2. TABELA: commission_balances
-- Saldo consolidado de cada membro (atualizado via trigger)
-- =====================================================

CREATE TABLE IF NOT EXISTS commission_balances (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  
  -- Saldos totais
  total_earned DECIMAL(10,2) DEFAULT 0,      -- Total ganho (histórico)
  total_withdrawn DECIMAL(10,2) DEFAULT 0,   -- Total sacado
  available_balance DECIMAL(10,2) DEFAULT 0, -- Disponível para saque
  pending_balance DECIMAL(10,2) DEFAULT 0,   -- Em análise/trava (Sprint 5)
  
  -- Por tipo (mês atual)
  fast_track_month DECIMAL(10,2) DEFAULT 0,
  perpetual_month DECIMAL(10,2) DEFAULT 0,
  bonus_3_month DECIMAL(10,2) DEFAULT 0,
  leadership_month DECIMAL(10,2) DEFAULT 0,
  royalty_month DECIMAL(10,2) DEFAULT 0,
  
  -- Mês de referência atual
  current_month DATE,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. TABELA: fast_track_windows
-- Controla a janela de 60 dias do Fast-Track
-- =====================================================

CREATE TABLE IF NOT EXISTS fast_track_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,  -- N0 (quem recebe)
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,   -- N1 (quem gera)
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),       -- Início da janela
  phase_1_ends_at TIMESTAMPTZ NOT NULL,                -- Fim dos 30% (30 dias)
  phase_2_ends_at TIMESTAMPTZ NOT NULL,                -- Fim dos 20% (60 dias)
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(sponsor_id, member_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fast_track_sponsor ON fast_track_windows(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_fast_track_member ON fast_track_windows(member_id);
CREATE INDEX IF NOT EXISTS idx_fast_track_active ON fast_track_windows(is_active) WHERE is_active = true;

-- =====================================================
-- 4. TABELA: bonus_3_tracking
-- Rastreia elegibilidade para Bônus 3
-- =====================================================

CREATE TABLE IF NOT EXISTS bonus_3_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  reference_month DATE NOT NULL,           -- Mês de referência
  
  -- Contagens de Parceiras Ativas por nível
  active_partners_n1 INT DEFAULT 0,        -- Parceiras ativas em N1
  n1_with_3_partners INT DEFAULT 0,        -- Quantas N1 têm 3+ parceiras
  n2_with_3_partners INT DEFAULT 0,        -- Quantas N2 têm 3+ parceiras
  
  -- Bônus elegíveis
  eligible_level_1 BOOLEAN DEFAULT false,  -- 3 em N1 → R$250
  eligible_level_2 BOOLEAN DEFAULT false,  -- Cada N1 com 3 → R$1.500
  eligible_level_3 BOOLEAN DEFAULT false,  -- Cada N2 com 3 → R$8.000
  
  -- Status de pagamento
  paid_level_1 BOOLEAN DEFAULT false,
  paid_level_2 BOOLEAN DEFAULT false,
  paid_level_3 BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(member_id, reference_month)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bonus_3_member ON bonus_3_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_bonus_3_month ON bonus_3_tracking(reference_month);

-- =====================================================
-- 5. TABELA: royalty_networks
-- Rastreia redes separadas por Royalty (Head forma Head)
-- =====================================================

CREATE TABLE IF NOT EXISTS royalty_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  original_head_id UUID NOT NULL REFERENCES members(id),  -- Head N0 original
  new_head_id UUID NOT NULL REFERENCES members(id),       -- Head N1 que se separou
  
  separated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  royalty_percentage DECIMAL(5,2) DEFAULT 3.00,           -- 3% conforme doc canônico
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(original_head_id, new_head_id)
);

-- =====================================================
-- 6. FUNÇÃO: Criar janela Fast-Track automaticamente
-- Executada quando um novo membro é cadastrado
-- =====================================================

CREATE OR REPLACE FUNCTION create_fast_track_window()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o novo membro tem sponsor, criar janela Fast-Track
  IF NEW.sponsor_id IS NOT NULL THEN
    INSERT INTO fast_track_windows (
      sponsor_id,
      member_id,
      started_at,
      phase_1_ends_at,
      phase_2_ends_at
    ) VALUES (
      NEW.sponsor_id,
      NEW.id,
      now(),
      now() + INTERVAL '30 days',
      now() + INTERVAL '60 days'
    )
    ON CONFLICT (sponsor_id, member_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar Fast-Track ao cadastrar membro
DROP TRIGGER IF EXISTS trigger_create_fast_track ON members;
CREATE TRIGGER trigger_create_fast_track
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION create_fast_track_window();

-- =====================================================
-- 7. FUNÇÃO: Atualizar saldo de comissões
-- Executada após cada insert no ledger
-- =====================================================

CREATE OR REPLACE FUNCTION update_commission_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_month_start DATE;
BEGIN
  current_month_start := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Inserir ou atualizar saldo
  INSERT INTO commission_balances (
    member_id,
    total_earned,
    available_balance,
    current_month,
    fast_track_month,
    perpetual_month,
    bonus_3_month,
    leadership_month,
    royalty_month,
    updated_at
  )
  SELECT
    NEW.member_id,
    COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0),
    COALESCE(SUM(amount), 0),
    current_month_start,
    COALESCE(SUM(amount) FILTER (WHERE commission_type IN ('fast_track_30', 'fast_track_20') AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'perpetual' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type LIKE 'bonus_3%' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'leadership' AND reference_month = current_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE commission_type = 'royalty' AND reference_month = current_month_start), 0),
    now()
  FROM commission_ledger
  WHERE member_id = NEW.member_id
  ON CONFLICT (member_id) DO UPDATE SET
    total_earned = EXCLUDED.total_earned,
    available_balance = EXCLUDED.available_balance,
    current_month = EXCLUDED.current_month,
    fast_track_month = EXCLUDED.fast_track_month,
    perpetual_month = EXCLUDED.perpetual_month,
    bonus_3_month = EXCLUDED.bonus_3_month,
    leadership_month = EXCLUDED.leadership_month,
    royalty_month = EXCLUDED.royalty_month,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo após insert no ledger
DROP TRIGGER IF EXISTS trigger_update_commission_balance ON commission_ledger;
CREATE TRIGGER trigger_update_commission_balance
  AFTER INSERT ON commission_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_balance();

-- =====================================================
-- 8. FUNÇÃO RPC: Calcular comissões de um pedido
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
BEGIN
  v_now := now();
  v_reference_month := date_trunc('month', v_now)::DATE;
  
  -- Buscar dados do comprador
  SELECT m.id, m.sponsor_id, m.level, m.status
  INTO v_buyer
  FROM members m
  WHERE m.id = p_buyer_id;
  
  IF v_buyer.sponsor_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Buscar sponsor (N0)
  SELECT m.id, m.sponsor_id, m.level, m.status
  INTO v_sponsor
  FROM members m
  WHERE m.id = v_buyer.sponsor_id;
  
  -- Verificar se sponsor está ativo
  IF v_sponsor.status != 'active' THEN
    RETURN;
  END IF;
  
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
        'Fast-Track 30% (N1, primeiros 30 dias)'::TEXT;
    -- Fase 2: 20% (dias 31-60)
    ELSIF v_now <= v_fast_track.phase_2_ends_at THEN
      RETURN QUERY SELECT
        v_sponsor.id,
        'fast_track_20'::TEXT,
        ROUND(p_cv_total * 0.20, 2),
        p_cv_total,
        20.00::DECIMAL(5,2),
        1,
        'Fast-Track 20% (N1, dias 31-60)'::TEXT;
    END IF;
  ELSE
    -- ===== COMISSÃO PERPÉTUA =====
    -- Parceira: 5% de N1
    IF v_sponsor.level IN ('parceira', 'lider_formacao', 'lider', 'diretora', 'head') THEN
      RETURN QUERY SELECT
        v_sponsor.id,
        'perpetual'::TEXT,
        ROUND(p_cv_total * 0.05, 2),
        p_cv_total,
        5.00::DECIMAL(5,2),
        1,
        'Comissão Perpétua 5% (N1)'::TEXT;
    END IF;
    
    -- Líder/Diretora/Head: % adicional da rede
    IF v_sponsor.level = 'lider' OR v_sponsor.level = 'lider_formacao' THEN
      -- Líder: 7% da rede (além dos 5% de N1)
      RETURN QUERY SELECT
        v_sponsor.id,
        'perpetual'::TEXT,
        ROUND(p_cv_total * 0.02, 2), -- 7% - 5% já pago = 2% adicional
        p_cv_total,
        2.00::DECIMAL(5,2),
        1,
        'Comissão Perpétua Líder +2% (7% total)'::TEXT;
    ELSIF v_sponsor.level = 'diretora' THEN
      -- Diretora: 10% da rede
      RETURN QUERY SELECT
        v_sponsor.id,
        'perpetual'::TEXT,
        ROUND(p_cv_total * 0.05, 2), -- 10% - 5% já pago = 5% adicional
        p_cv_total,
        5.00::DECIMAL(5,2),
        1,
        'Comissão Perpétua Diretora +5% (10% total)'::TEXT;
    ELSIF v_sponsor.level = 'head' THEN
      -- Head: 15% da rede
      RETURN QUERY SELECT
        v_sponsor.id,
        'perpetual'::TEXT,
        ROUND(p_cv_total * 0.10, 2), -- 15% - 5% já pago = 10% adicional
        p_cv_total,
        10.00::DECIMAL(5,2),
        1,
        'Comissão Perpétua Head +10% (15% total)'::TEXT;
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
      'Leadership Bônus Diretora 3%'::TEXT;
  ELSIF v_sponsor.level = 'head' THEN
    RETURN QUERY SELECT
      v_sponsor.id,
      'leadership'::TEXT,
      ROUND(p_cv_total * 0.04, 2),
      p_cv_total,
      4.00::DECIMAL(5,2),
      1,
      'Leadership Bônus Head 4%'::TEXT;
  END IF;
  
  -- ===== N2 (Grand Sponsor) - Fast-Track para Líderes =====
  IF v_sponsor.level IN ('lider', 'lider_formacao', 'diretora', 'head') AND v_sponsor.sponsor_id IS NOT NULL THEN
    SELECT m.id, m.level, m.status
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
            'Fast-Track Líder 20% (N2, primeiros 30 dias)'::TEXT;
        ELSIF v_now <= v_fast_track.phase_2_ends_at THEN
          RETURN QUERY SELECT
            v_grand_sponsor.id,
            'fast_track_20'::TEXT,
            ROUND(p_cv_total * 0.10, 2),
            p_cv_total,
            10.00::DECIMAL(5,2),
            2,
            'Fast-Track Líder 10% (N2, dias 31-60)'::TEXT;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNÇÃO RPC: Obter resumo de comissões do membro
-- =====================================================

CREATE OR REPLACE FUNCTION get_member_commission_summary(p_member_id UUID)
RETURNS JSON AS $$
DECLARE
  v_balance RECORD;
  v_current_month DATE;
  v_history JSON;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Buscar saldo
  SELECT * INTO v_balance
  FROM commission_balances
  WHERE member_id = p_member_id;
  
  -- Se não existe, criar registro zerado
  IF v_balance IS NULL THEN
    INSERT INTO commission_balances (member_id, current_month)
    VALUES (p_member_id, v_current_month)
    RETURNING * INTO v_balance;
  END IF;
  
  -- Buscar histórico (últimos 6 meses)
  SELECT json_agg(month_data ORDER BY month DESC)
  INTO v_history
  FROM (
    SELECT
      reference_month AS month,
      SUM(amount) AS total,
      json_build_object(
        'fast_track', SUM(amount) FILTER (WHERE commission_type IN ('fast_track_30', 'fast_track_20')),
        'perpetual', SUM(amount) FILTER (WHERE commission_type = 'perpetual'),
        'bonus_3', SUM(amount) FILTER (WHERE commission_type LIKE 'bonus_3%'),
        'leadership', SUM(amount) FILTER (WHERE commission_type = 'leadership'),
        'royalty', SUM(amount) FILTER (WHERE commission_type = 'royalty')
      ) AS breakdown
    FROM commission_ledger
    WHERE member_id = p_member_id
      AND reference_month >= v_current_month - INTERVAL '6 months'
    GROUP BY reference_month
  ) month_data;
  
  RETURN json_build_object(
    'balance', json_build_object(
      'total_earned', COALESCE(v_balance.total_earned, 0),
      'total_withdrawn', COALESCE(v_balance.total_withdrawn, 0),
      'available', COALESCE(v_balance.available_balance, 0),
      'pending', COALESCE(v_balance.pending_balance, 0)
    ),
    'current_month', json_build_object(
      'fast_track', COALESCE(v_balance.fast_track_month, 0),
      'perpetual', COALESCE(v_balance.perpetual_month, 0),
      'bonus_3', COALESCE(v_balance.bonus_3_month, 0),
      'leadership', COALESCE(v_balance.leadership_month, 0),
      'royalty', COALESCE(v_balance.royalty_month, 0),
      'total', COALESCE(v_balance.fast_track_month, 0) + 
               COALESCE(v_balance.perpetual_month, 0) + 
               COALESCE(v_balance.bonus_3_month, 0) + 
               COALESCE(v_balance.leadership_month, 0) + 
               COALESCE(v_balance.royalty_month, 0)
    ),
    'history', COALESCE(v_history, '[]'::JSON)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- commission_ledger
ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem próprias comissões"
  ON commission_ledger FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins veem todas comissões"
  ON commission_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Sistema pode inserir comissões"
  ON commission_ledger FOR INSERT
  WITH CHECK (true);

-- commission_balances
ALTER TABLE commission_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem próprio saldo"
  ON commission_balances FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins veem todos saldos"
  ON commission_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- fast_track_windows
ALTER TABLE fast_track_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem próprias janelas Fast-Track"
  ON fast_track_windows FOR SELECT
  USING (
    sponsor_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
    OR
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins veem todas janelas"
  ON fast_track_windows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- bonus_3_tracking
ALTER TABLE bonus_3_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem próprio tracking Bônus 3"
  ON bonus_3_tracking FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins veem todos trackings"
  ON bonus_3_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- royalty_networks
ALTER TABLE royalty_networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Heads veem próprias redes Royalty"
  ON royalty_networks FOR SELECT
  USING (
    original_head_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
    OR
    new_head_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins veem todas redes Royalty"
  ON royalty_networks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE auth_user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- =====================================================
-- 11. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE commission_ledger IS 'Ledger imutável de todas as comissões (auditoria)';
COMMENT ON TABLE commission_balances IS 'Saldo consolidado de comissões por membro';
COMMENT ON TABLE fast_track_windows IS 'Janelas de 60 dias do Fast-Track por par sponsor-membro';
COMMENT ON TABLE bonus_3_tracking IS 'Tracking de elegibilidade para Bônus 3';
COMMENT ON TABLE royalty_networks IS 'Redes separadas por Royalty (Head forma Head)';

COMMENT ON FUNCTION calculate_order_commissions IS 'Calcula comissões para um pedido (Fast-Track, Perpétua, Leadership)';
COMMENT ON FUNCTION get_member_commission_summary IS 'Retorna resumo de comissões do membro (saldo + histórico)';

