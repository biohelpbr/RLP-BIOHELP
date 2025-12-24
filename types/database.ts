/**
 * Tipos do banco de dados Supabase
 * Baseado em: SPEC.md seções 9.1-9.4
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

// Database types for Supabase client
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Member, 'id' | 'ref_code'>> // ref_code é imutável (SPEC 3.2)
      }
      referral_events: {
        Row: ReferralEvent
        Insert: Omit<ReferralEvent, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ReferralEvent, 'id'>>
      }
      shopify_customers: {
        Row: ShopifyCustomer
        Insert: Omit<ShopifyCustomer, 'id'> & { id?: string }
        Update: Partial<Omit<ShopifyCustomer, 'id' | 'member_id'>>
      }
      roles: {
        Row: Role
        Insert: Omit<Role, 'id'> & { id?: string }
        Update: Partial<Omit<Role, 'id' | 'member_id'>>
      }
    }
  }
}

