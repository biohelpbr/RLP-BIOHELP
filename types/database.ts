/**
 * Tipos do banco de dados Supabase
 * Baseado em: SPEC.md seções 9.1-9.4
 * Formato compatível com @supabase/supabase-js v2.x
 */

export type MemberStatus = 'pending' | 'active' | 'inactive'
export type RoleType = 'member' | 'admin'
export type SyncStatus = 'pending' | 'ok' | 'failed'

// SPEC 9.1 - Tabela members
export interface Member {
  id: string
  name: string
  email: string
  ref_code: string
  sponsor_id: string | null
  status: MemberStatus
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

// Tipos de inserção
export type MemberInsert = {
  id?: string
  name: string
  email: string
  ref_code: string
  sponsor_id?: string | null
  status?: MemberStatus
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

// Database types for Supabase client
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Aliases para facilitar uso direto
export type Tables = Database['public']['Tables']
export type MembersTable = Tables['members']
export type ReferralEventsTable = Tables['referral_events']
export type ShopifyCustomersTable = Tables['shopify_customers']
export type RolesTable = Tables['roles']
