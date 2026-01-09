-- =====================================================
-- Sprint 3: Rede Visual + Níveis
-- SPEC 1.3 + TBD-011, TBD-012, TBD-013
-- Data: 10/01/2026
-- =====================================================

-- =====================================================
-- 1. ENUM PARA NÍVEIS
-- =====================================================

-- Níveis de liderança conforme documento canônico
-- Biohelp___Loyalty_Reward_Program.md (linhas 132-147)
DO $$ BEGIN
  CREATE TYPE member_level AS ENUM (
    'membro',           -- Cliente cadastrada
    'parceira',         -- Membro Ativo + CV_rede >= 500
    'lider_formacao',   -- Parceira + primeira Parceira em N1 (90 dias)
    'lider',            -- Parceira Ativa + 4 Parceiras Ativas em N1
    'diretora',         -- 3 Líderes Ativas em N1 + 80.000 CV na rede
    'head'              -- 3 Diretoras Ativas em N1 + 200.000 CV na rede
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. NOVOS CAMPOS NA TABELA MEMBERS
-- =====================================================

-- Campo de nível atual
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS level member_level DEFAULT 'membro';

COMMENT ON COLUMN members.level IS 'Nível atual do membro: membro, parceira, lider_formacao, lider, diretora, head';

-- Campo de quando o nível foi atualizado
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS level_updated_at timestamptz;

COMMENT ON COLUMN members.level_updated_at IS 'Última vez que o nível foi recalculado/atualizado';

-- Campo de telefone (TBD-013)
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN members.phone IS 'Telefone do membro (opcional)';

-- Campo de visibilidade do telefone (TBD-013)
-- 'public' = visível para toda a rede
-- 'network' = visível apenas para sponsor e N1
-- 'private' = não visível
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS phone_visibility text DEFAULT 'network'
  CHECK (phone_visibility IN ('public', 'network', 'private'));

COMMENT ON COLUMN members.phone_visibility IS 'Visibilidade do telefone: public (toda rede), network (sponsor + N1), private (ninguém)';

-- Campo para data de início como Líder em Formação (janela de 90 dias)
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS lider_formacao_started_at timestamptz;

COMMENT ON COLUMN members.lider_formacao_started_at IS 'Data de início como Líder em Formação (janela de 90 dias para atingir Líder)';

-- Campo para contagem de meses inativos consecutivos
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS inactive_months_count integer DEFAULT 0;

COMMENT ON COLUMN members.inactive_months_count IS 'Meses consecutivos inativos (6 meses = perde status e sai da rede)';

-- =====================================================
-- 3. TABELA MEMBER_LEVEL_HISTORY (Auditoria)
-- =====================================================

CREATE TABLE IF NOT EXISTS member_level_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  previous_level member_level,
  new_level member_level NOT NULL,
  reason text NOT NULL,
  -- Snapshot dos critérios no momento da mudança
  criteria_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE member_level_history IS 'Histórico de mudanças de nível para auditoria - Sprint 3';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_member_level_history_member_id 
  ON member_level_history(member_id);

CREATE INDEX IF NOT EXISTS idx_member_level_history_created_at 
  ON member_level_history(created_at DESC);

-- =====================================================
-- 4. VIEW PARA REDE DO MEMBRO (Recursive CTE)
-- =====================================================

-- View que retorna a rede completa de um membro usando CTE recursiva
-- Usada pelo endpoint /api/members/me/network
CREATE OR REPLACE VIEW member_network_view AS
WITH RECURSIVE network AS (
  -- Base: todos os membros que são sponsors
  SELECT 
    m.id,
    m.name,
    m.email,
    m.phone,
    m.phone_visibility,
    m.ref_code,
    m.sponsor_id,
    m.status,
    m.level,
    m.current_cv_month,
    m.created_at,
    1 as depth,
    m.sponsor_id as root_sponsor_id
  FROM members m
  WHERE m.sponsor_id IS NOT NULL
  
  UNION ALL
  
  -- Recursivo: indicados dos indicados
  SELECT 
    m.id,
    m.name,
    m.email,
    m.phone,
    m.phone_visibility,
    m.ref_code,
    m.sponsor_id,
    m.status,
    m.level,
    m.current_cv_month,
    m.created_at,
    n.depth + 1,
    n.root_sponsor_id
  FROM members m
  INNER JOIN network n ON m.sponsor_id = n.id
  WHERE n.depth < 20 -- Limite de segurança para evitar loops infinitos
)
SELECT * FROM network;

COMMENT ON VIEW member_network_view IS 'View recursiva para obter a rede completa de um membro';

-- =====================================================
-- 5. FUNÇÃO PARA CONTAR INDICADOS POR NÍVEL
-- =====================================================

CREATE OR REPLACE FUNCTION count_network_by_level(p_member_id uuid, p_depth integer DEFAULT 1)
RETURNS TABLE (
  level_depth integer,
  total_count bigint,
  active_count bigint,
  inactive_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network AS (
    SELECT 
      m.id,
      m.status,
      1 as depth
    FROM members m
    WHERE m.sponsor_id = p_member_id
    
    UNION ALL
    
    SELECT 
      m.id,
      m.status,
      n.depth + 1
    FROM members m
    INNER JOIN network n ON m.sponsor_id = n.id
    WHERE n.depth < p_depth
  )
  SELECT 
    depth as level_depth,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status != 'active') as inactive_count
  FROM network
  GROUP BY depth
  ORDER BY depth;
END;
$$;

COMMENT ON FUNCTION count_network_by_level IS 'Conta membros da rede por nível de profundidade';

-- =====================================================
-- 6. FUNÇÃO PARA CALCULAR CV TOTAL DA REDE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_network_cv(p_member_id uuid, p_month_year text DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_year text;
  v_total_cv numeric;
BEGIN
  -- Se não passou mês, usa o mês atual
  v_month_year := COALESCE(p_month_year, to_char(now(), 'YYYY-MM'));
  
  WITH RECURSIVE network AS (
    -- Inclui o próprio membro
    SELECT id FROM members WHERE id = p_member_id
    
    UNION ALL
    
    -- Inclui toda a rede abaixo
    SELECT m.id
    FROM members m
    INNER JOIN network n ON m.sponsor_id = n.id
  )
  SELECT COALESCE(SUM(cv.cv_amount), 0) INTO v_total_cv
  FROM network n
  INNER JOIN cv_ledger cv ON cv.member_id = n.id
  WHERE cv.month_year = v_month_year
    AND cv.cv_amount > 0; -- Apenas entradas positivas
  
  RETURN v_total_cv;
END;
$$;

COMMENT ON FUNCTION calculate_network_cv IS 'Calcula CV total da rede de um membro (inclui o próprio membro)';

-- =====================================================
-- 7. FUNÇÃO PARA CONTAR PARCEIRAS ATIVAS EM N1
-- =====================================================

CREATE OR REPLACE FUNCTION count_active_parceiras_n1(p_member_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM members m
  WHERE m.sponsor_id = p_member_id
    AND m.status = 'active'
    AND m.level IN ('parceira', 'lider_formacao', 'lider', 'diretora', 'head');
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION count_active_parceiras_n1 IS 'Conta Parceiras (ou superior) ativas no primeiro nível (N1)';

-- =====================================================
-- 8. FUNÇÃO PARA CONTAR LÍDERES ATIVAS EM N1
-- =====================================================

CREATE OR REPLACE FUNCTION count_active_lideres_n1(p_member_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM members m
  WHERE m.sponsor_id = p_member_id
    AND m.status = 'active'
    AND m.level IN ('lider', 'diretora', 'head');
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION count_active_lideres_n1 IS 'Conta Líderes (ou superior) ativas no primeiro nível (N1)';

-- =====================================================
-- 9. FUNÇÃO PARA CONTAR DIRETORAS ATIVAS EM N1
-- =====================================================

CREATE OR REPLACE FUNCTION count_active_diretoras_n1(p_member_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM members m
  WHERE m.sponsor_id = p_member_id
    AND m.status = 'active'
    AND m.level IN ('diretora', 'head');
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION count_active_diretoras_n1 IS 'Conta Diretoras (ou superior) ativas no primeiro nível (N1)';

-- =====================================================
-- 10. RLS POLICIES PARA MEMBER_LEVEL_HISTORY
-- =====================================================

ALTER TABLE member_level_history ENABLE ROW LEVEL SECURITY;

-- Members podem ver apenas seu próprio histórico
CREATE POLICY "members_view_own_level_history" ON member_level_history
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Admins podem ver todo o histórico
CREATE POLICY "admins_view_all_level_history" ON member_level_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      INNER JOIN members m ON r.member_id = m.id
      WHERE m.auth_user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Apenas service_role pode inserir (via API)
CREATE POLICY "service_insert_level_history" ON member_level_history
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 11. ÍNDICES PARA PERFORMANCE DA REDE
-- =====================================================

-- Índice para buscar indicados diretos rapidamente
CREATE INDEX IF NOT EXISTS idx_members_sponsor_id 
  ON members(sponsor_id) 
  WHERE sponsor_id IS NOT NULL;

-- Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_members_status 
  ON members(status);

-- Índice para filtrar por nível
CREATE INDEX IF NOT EXISTS idx_members_level 
  ON members(level);

-- Índice composto para busca de rede ativa
CREATE INDEX IF NOT EXISTS idx_members_sponsor_status_level 
  ON members(sponsor_id, status, level) 
  WHERE sponsor_id IS NOT NULL;

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

-- Permissões para as novas funções
GRANT EXECUTE ON FUNCTION count_network_by_level TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_network_cv TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_parceiras_n1 TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_lideres_n1 TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_diretoras_n1 TO authenticated;

-- Permissões para a view
GRANT SELECT ON member_network_view TO authenticated;

-- Permissões para a tabela de histórico
GRANT SELECT ON member_level_history TO authenticated;
GRANT INSERT ON member_level_history TO service_role;

