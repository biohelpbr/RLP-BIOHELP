/**
 * Tipos do banco de dados Supabase
 * Baseado em: SPEC.md seções 9.1-9.5
 * Formato compatível com @supabase/supabase-js v2.x
 * 
 * Sprint 1: members, referral_events, shopify_customers, roles
 * Sprint 2: orders, order_items, cv_ledger, cv_monthly_summary
 */

// =====================================================
// ENUMS E TIPOS BASE
// =====================================================

export type MemberStatus = 'pending' | 'active' | 'inactive'
export type RoleType = 'member' | 'admin'
export type SyncStatus = 'pending' | 'ok' | 'failed'
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'cancelled'
export type CVType = 'order_paid' | 'order_refunded' | 'order_cancelled' | 'manual_adjustment'

// Sprint 3 - Níveis de liderança
export type MemberLevel = 'membro' | 'parceira' | 'lider_formacao' | 'lider' | 'diretora' | 'head'
export type PhoneVisibility = 'public' | 'network' | 'private'

// =====================================================
// SPRINT 1 — TABELAS BASE
// =====================================================

// SPEC 9.1 - Tabela members
export interface Member {
  id: string
  name: string
  email: string
  ref_code: string
  sponsor_id: string | null
  status: MemberStatus
  auth_user_id: string | null
  // Sprint 2 - campos de CV
  current_cv_month: number | null
  current_cv_month_year: string | null
  last_cv_calculation_at: string | null
  // Sprint 3 - campos de nível e rede
  level: MemberLevel
  level_updated_at: string | null
  phone: string | null
  phone_visibility: PhoneVisibility
  lider_formacao_started_at: string | null
  inactive_months_count: number
  created_at: string
}

// SPEC 9.2 - Tabela referral_events
export interface ReferralEvent {
  id: string
  member_id: string
  ref_code_used: string | null
  utm_json: UtmParams | null
  created_at: string
}

// SPEC 9.3 - Tabela shopify_customers
export interface ShopifyCustomer {
  id: string
  member_id: string
  shopify_customer_id: string | null
  last_sync_at: string | null
  last_sync_status: SyncStatus
  last_sync_error: string | null
}

// SPEC 9.4 - Tabela roles
export interface Role {
  id: string
  member_id: string
  role: RoleType
}

// UTM parameters (SPEC 7.1)
export interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

// =====================================================
// SPRINT 2 — TABELAS CV
// =====================================================

// SPEC 9.5 - Tabela orders (espelho do Shopify)
export interface Order {
  id: string
  shopify_order_id: string
  shopify_order_number: string
  member_id: string | null
  customer_email: string
  total_amount: number
  total_cv: number
  currency: string
  status: OrderStatus
  paid_at: string | null
  refunded_at: string | null
  cancelled_at: string | null
  shopify_data: ShopifyOrderData | null
  created_at: string
  updated_at: string
}

// SPEC 9.5 - Tabela order_items
export interface OrderItem {
  id: string
  order_id: string
  shopify_line_item_id: string
  product_id: string | null
  variant_id: string | null
  sku: string | null
  title: string
  quantity: number
  price: number
  cv_value: number
  created_at: string
}

// SPEC 9.5 - Tabela cv_ledger (auditável e imutável)
export interface CVLedger {
  id: string
  member_id: string
  order_id: string | null
  order_item_id: string | null
  cv_amount: number
  cv_type: CVType
  month_year: string // formato 'YYYY-MM'
  description: string | null
  created_at: string
  created_by: string | null
}

// Tabela cv_monthly_summary
export interface CVMonthlySummary {
  id: string
  member_id: string
  month_year: string
  total_cv: number
  orders_count: number
  status_at_close: MemberStatus | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

// Dados do pedido Shopify (armazenado em shopify_data)
export interface ShopifyOrderData {
  id: string
  order_number: number
  email: string
  financial_status: string
  fulfillment_status: string | null
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  line_items: ShopifyLineItem[]
  customer?: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

export interface ShopifyLineItem {
  id: string
  product_id: string | null
  variant_id: string | null
  title: string
  sku: string | null
  quantity: number
  price: string
  // Campos para CV via metafield (TBD-008)
  properties?: Array<{
    name: string
    value: string
  }>
  metafields?: Array<{
    namespace: string
    key: string
    value: string
    value_type?: string
  }>
}

// =====================================================
// TIPOS DE INSERÇÃO
// =====================================================

export type MemberInsert = {
  id?: string
  name: string
  email: string
  ref_code: string
  sponsor_id?: string | null
  status?: MemberStatus
  auth_user_id?: string | null
  current_cv_month?: number | null
  current_cv_month_year?: string | null
  last_cv_calculation_at?: string | null
  // Sprint 3 - campos de nível e rede
  level?: MemberLevel
  level_updated_at?: string | null
  phone?: string | null
  phone_visibility?: PhoneVisibility
  lider_formacao_started_at?: string | null
  inactive_months_count?: number
  created_at?: string
}

export type ReferralEventInsert = {
  id?: string
  member_id: string
  ref_code_used?: string | null
  utm_json?: UtmParams | null
  created_at?: string
}

export type ShopifyCustomerInsert = {
  id?: string
  member_id: string
  shopify_customer_id?: string | null
  last_sync_at?: string | null
  last_sync_status?: SyncStatus
  last_sync_error?: string | null
}

export type RoleInsert = {
  id?: string
  member_id: string
  role?: RoleType
}

export type OrderInsert = {
  id?: string
  shopify_order_id: string
  shopify_order_number: string
  member_id?: string | null
  customer_email: string
  total_amount: number
  total_cv?: number
  currency?: string
  status?: OrderStatus
  paid_at?: string | null
  refunded_at?: string | null
  cancelled_at?: string | null
  shopify_data?: ShopifyOrderData | null
  created_at?: string
  updated_at?: string
}

export type OrderItemInsert = {
  id?: string
  order_id: string
  shopify_line_item_id: string
  product_id?: string | null
  variant_id?: string | null
  sku?: string | null
  title: string
  quantity: number
  price: number
  cv_value?: number
  created_at?: string
}

export type CVLedgerInsert = {
  id?: string
  member_id: string
  order_id?: string | null
  order_item_id?: string | null
  cv_amount: number
  cv_type: CVType
  month_year: string
  description?: string | null
  created_at?: string
  created_by?: string | null
}

export type CVMonthlySummaryInsert = {
  id?: string
  member_id: string
  month_year: string
  total_cv?: number
  orders_count?: number
  status_at_close?: MemberStatus | null
  closed_at?: string | null
  created_at?: string
  updated_at?: string
}

// =====================================================
// DATABASE TYPES PARA SUPABASE CLIENT
// =====================================================

export type Database = {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: MemberInsert
        Update: Partial<MemberInsert>
        Relationships: []
      }
      referral_events: {
        Row: ReferralEvent
        Insert: ReferralEventInsert
        Update: Partial<ReferralEventInsert>
        Relationships: []
      }
      shopify_customers: {
        Row: ShopifyCustomer
        Insert: ShopifyCustomerInsert
        Update: Partial<ShopifyCustomerInsert>
        Relationships: []
      }
      roles: {
        Row: Role
        Insert: RoleInsert
        Update: Partial<RoleInsert>
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: OrderInsert
        Update: Partial<OrderInsert>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: OrderItemInsert
        Update: Partial<OrderItemInsert>
        Relationships: []
      }
      cv_ledger: {
        Row: CVLedger
        Insert: CVLedgerInsert
        Update: Partial<CVLedgerInsert>
        Relationships: []
      }
      cv_monthly_summary: {
        Row: CVMonthlySummary
        Insert: CVMonthlySummaryInsert
        Update: Partial<CVMonthlySummaryInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      calculate_member_cv: {
        Args: { p_member_id: string; p_month_year?: string }
        Returns: number
      }
      is_member_active: {
        Args: { p_member_id: string; p_month_year?: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// =====================================================
// ALIASES PARA FACILITAR USO DIRETO
// =====================================================

export type Tables = Database['public']['Tables']
export type MembersTable = Tables['members']
export type ReferralEventsTable = Tables['referral_events']
export type ShopifyCustomersTable = Tables['shopify_customers']
export type RolesTable = Tables['roles']
export type OrdersTable = Tables['orders']
export type OrderItemsTable = Tables['order_items']
export type CVLedgerTable = Tables['cv_ledger']
export type CVMonthlySummaryTable = Tables['cv_monthly_summary']

// =====================================================
// TIPOS AUXILIARES PARA API
// =====================================================

// Resposta do endpoint /api/members/me/cv
export interface MemberCVResponse {
  currentMonth: {
    month: string // 'YYYY-MM'
    cv: number
    target: number // 200
    remaining: number
    status: MemberStatus
    percentage: number
  }
  history: Array<{
    month: string
    cv: number
    status: MemberStatus
    ordersCount: number
  }>
}

// Dados para ajuste manual de CV
export interface CVAdjustmentRequest {
  amount: number
  description: string
  month?: string // 'YYYY-MM', default = mês atual
}

// =====================================================
// SPRINT 3 — TIPOS DE REDE E NÍVEIS
// =====================================================

// Tabela member_level_history
export interface MemberLevelHistory {
  id: string
  member_id: string
  previous_level: MemberLevel | null
  new_level: MemberLevel
  reason: string
  criteria_snapshot: LevelCriteriaSnapshot | null
  created_at: string
}

// Snapshot dos critérios no momento da mudança de nível
export interface LevelCriteriaSnapshot {
  cv_pessoal: number
  cv_rede: number
  parceiras_ativas_n1: number
  lideres_ativas_n1: number
  diretoras_ativas_n1: number
  status: MemberStatus
}

// Membro na visualização de rede (com campos filtrados por privacidade)
export interface NetworkMember {
  id: string
  name: string
  email: string
  phone: string | null // null se não tiver permissão
  ref_code: string
  status: MemberStatus
  level: MemberLevel
  cv_month: number | null
  depth: number // Nível na árvore (1 = N1, 2 = N2, etc.)
  children_count: number
  created_at: string
}

// Resposta do endpoint /api/members/me/network
export interface MemberNetworkResponse {
  member: {
    id: string
    name: string
    level: MemberLevel
    cv_pessoal: number
    cv_rede: number
  }
  network: NetworkMember[]
  stats: {
    total_members: number
    active_members: number
    by_level: Record<number, { total: number; active: number }>
  }
}

// Resposta do endpoint /api/members/me/level
export interface MemberLevelResponse {
  current: {
    level: MemberLevel
    since: string | null
  }
  progress: {
    next_level: MemberLevel | null
    requirements: LevelRequirement[]
  }
  history: MemberLevelHistory[]
}

// Requisito para próximo nível
export interface LevelRequirement {
  name: string
  current: number
  required: number
  met: boolean
}

// Níveis com seus requisitos (para referência)
export const LEVEL_REQUIREMENTS = {
  membro: {
    name: 'Membro',
    requirements: [] // Nenhum requisito, é o nível inicial
  },
  parceira: {
    name: 'Parceira',
    requirements: [
      { name: 'Status Ativo', type: 'status', value: 'active' },
      { name: 'CV da Rede', type: 'cv_rede', value: 500 }
    ]
  },
  lider_formacao: {
    name: 'Líder em Formação',
    requirements: [
      { name: 'Nível Parceira', type: 'level', value: 'parceira' },
      { name: 'Primeira Parceira em N1', type: 'parceiras_n1', value: 1 }
    ]
  },
  lider: {
    name: 'Líder',
    requirements: [
      { name: 'Status Ativo', type: 'status', value: 'active' },
      { name: 'Parceiras Ativas em N1', type: 'parceiras_n1', value: 4 }
    ]
  },
  diretora: {
    name: 'Diretora',
    requirements: [
      { name: 'Líderes Ativas em N1', type: 'lideres_n1', value: 3 },
      { name: 'CV da Rede', type: 'cv_rede', value: 80000 }
    ]
  },
  head: {
    name: 'Head',
    requirements: [
      { name: 'Diretoras Ativas em N1', type: 'diretoras_n1', value: 3 },
      { name: 'CV da Rede', type: 'cv_rede', value: 200000 }
    ]
  }
} as const

// =====================================================
// SPRINT 4 — TIPOS DE COMISSÕES
// =====================================================

// Tipos de comissão
export type CommissionType = 
  | 'fast_track_30'     // Fast-Track 30% (primeiros 30 dias)
  | 'fast_track_20'     // Fast-Track 20% (dias 31-60)
  | 'perpetual'         // Comissão Perpétua
  | 'bonus_3_level_1'   // Bônus 3 - R$250
  | 'bonus_3_level_2'   // Bônus 3 - R$1.500
  | 'bonus_3_level_3'   // Bônus 3 - R$8.000
  | 'leadership'        // Leadership Bônus
  | 'royalty'           // Royalty (Head forma Head)
  | 'adjustment'        // Ajuste manual (admin)
  | 'reversal'          // Reversão (refund)

// Tabela commission_ledger
export interface CommissionLedger {
  id: string
  member_id: string
  commission_type: CommissionType
  amount: number
  cv_base: number | null
  percentage: number | null
  source_member_id: string | null
  source_order_id: string | null
  network_level: number | null
  reference_month: string // 'YYYY-MM-DD' (primeiro dia do mês)
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// Tabela commission_balances
export interface CommissionBalance {
  member_id: string
  total_earned: number
  total_withdrawn: number
  available_balance: number
  pending_balance: number
  fast_track_month: number
  perpetual_month: number
  bonus_3_month: number
  leadership_month: number
  royalty_month: number
  current_month: string | null
  updated_at: string
}

// Tabela fast_track_windows
export interface FastTrackWindow {
  id: string
  sponsor_id: string
  member_id: string
  started_at: string
  phase_1_ends_at: string
  phase_2_ends_at: string
  is_active: boolean
  created_at: string
}

// Tabela bonus_3_tracking
export interface Bonus3Tracking {
  id: string
  member_id: string
  reference_month: string
  active_partners_n1: number
  n1_with_3_partners: number
  n2_with_3_partners: number
  eligible_level_1: boolean
  eligible_level_2: boolean
  eligible_level_3: boolean
  paid_level_1: boolean
  paid_level_2: boolean
  paid_level_3: boolean
  created_at: string
  updated_at: string
}

// Tabela royalty_networks
export interface RoyaltyNetwork {
  id: string
  original_head_id: string
  new_head_id: string
  separated_at: string
  royalty_percentage: number
  is_active: boolean
  created_at: string
}

// Tipos de inserção
export type CommissionLedgerInsert = {
  id?: string
  member_id: string
  commission_type: CommissionType
  amount: number
  cv_base?: number | null
  percentage?: number | null
  source_member_id?: string | null
  source_order_id?: string | null
  network_level?: number | null
  reference_month: string
  description?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
}

export type CommissionBalanceInsert = {
  member_id: string
  total_earned?: number
  total_withdrawn?: number
  available_balance?: number
  pending_balance?: number
  fast_track_month?: number
  perpetual_month?: number
  bonus_3_month?: number
  leadership_month?: number
  royalty_month?: number
  current_month?: string | null
  updated_at?: string
}

export type FastTrackWindowInsert = {
  id?: string
  sponsor_id: string
  member_id: string
  started_at?: string
  phase_1_ends_at: string
  phase_2_ends_at: string
  is_active?: boolean
  created_at?: string
}

export type Bonus3TrackingInsert = {
  id?: string
  member_id: string
  reference_month: string
  active_partners_n1?: number
  n1_with_3_partners?: number
  n2_with_3_partners?: number
  eligible_level_1?: boolean
  eligible_level_2?: boolean
  eligible_level_3?: boolean
  paid_level_1?: boolean
  paid_level_2?: boolean
  paid_level_3?: boolean
  created_at?: string
  updated_at?: string
}

// Resposta do endpoint /api/members/me/commissions
export interface MemberCommissionsResponse {
  balance: {
    total_earned: number
    total_withdrawn: number
    available: number
    pending: number
  }
  current_month: {
    fast_track: number
    perpetual: number
    bonus_3: number
    leadership: number
    royalty: number
    total: number
  }
  history: Array<{
    month: string
    total: number
    breakdown: {
      fast_track: number | null
      perpetual: number | null
      bonus_3: number | null
      leadership: number | null
      royalty: number | null
    }
  }>
}

// Detalhes de uma comissão individual
export interface CommissionDetail {
  id: string
  type: CommissionType
  type_label: string
  amount: number
  cv_base: number | null
  percentage: number | null
  source_member_name: string | null
  source_order_number: string | null
  network_level: number | null
  description: string | null
  created_at: string
}

// Resposta do endpoint /api/members/me/commissions/details
export interface CommissionDetailsResponse {
  month: string
  commissions: CommissionDetail[]
  totals: {
    fast_track: number
    perpetual: number
    bonus_3: number
    leadership: number
    royalty: number
    total: number
  }
}

// Labels para tipos de comissão (para UI)
export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  fast_track_30: 'Fast-Track 30%',
  fast_track_20: 'Fast-Track 20%',
  perpetual: 'Comissão Perpétua',
  bonus_3_level_1: 'Bônus 3 - Nível 1',
  bonus_3_level_2: 'Bônus 3 - Nível 2',
  bonus_3_level_3: 'Bônus 3 - Nível 3',
  leadership: 'Leadership Bônus',
  royalty: 'Royalty',
  adjustment: 'Ajuste Manual',
  reversal: 'Reversão'
}

// Valores dos Bônus 3
export const BONUS_3_VALUES = {
  level_1: 250,    // R$250 - 3 Parceiras em N1
  level_2: 1500,   // R$1.500 - Cada N1 com 3 Parceiras
  level_3: 8000    // R$8.000 - Cada N2 com 3 Parceiras
} as const

// Percentuais de comissão por nível
// DOCUMENTO CANÔNICO: Biohelp___Loyalty_Reward_Program.md (linhas 163-173)
export const COMMISSION_PERCENTAGES = {
  fast_track: {
    phase_1: 30,  // 30% primeiros 30 dias
    phase_2: 20   // 20% dias 31-60
  },
  fast_track_n2: {
    phase_1: 20,  // 20% primeiros 30 dias (Líder)
    phase_2: 10   // 10% dias 31-60 (Líder)
  },
  // Comissão Perpétua - DIFERENCIADA POR TIPO DE N1
  // O percentual depende do nível do SPONSOR e do nível do COMPRADOR
  perpetual: {
    // Percentuais BASE sobre N1 específicos
    base_cliente: 5,    // 5% sobre CV de clientes N1 (todos os níveis)
    base_parceira: 7,   // 7% sobre CV de parceiras N1 (Diretora/Head)
    base_lider: 10,     // 10% sobre CV de líderes N1 (Head)
    
    // Percentuais da REDE (N2+)
    rede_lider: 7,      // Líder: 7% CV da rede inteira
    rede_diretora: 10,  // Diretora: 10% CV da rede inteira
    rede_head: 15       // Head: 15% CV da rede inteira
  },
  leadership: {
    diretora: 3,
    head: 4
  },
  royalty: 3  // 3% quando Head forma Head
} as const

/**
 * Regras de Comissão Perpétua (Documento Canônico):
 * 
 * PARCEIRA (N0):
 *   - 5% CV de clientes N1
 *   - NÃO recebe de outras parceiras
 * 
 * LÍDER / LÍDER EM FORMAÇÃO (N0):
 *   - 5% CV de clientes N1
 *   - 7% CV de parceiras+ N1 (parte da rede)
 * 
 * DIRETORA (N0):
 *   - 5% CV de clientes N1
 *   - 7% CV de parceiras N1
 *   - 10% CV de líderes+ N1
 * 
 * HEAD (N0):
 *   - 5% CV de clientes N1
 *   - 7% CV de parceiras N1
 *   - 10% CV de líderes N1
 *   - 15% CV da rede inteira (fallback)
 */
