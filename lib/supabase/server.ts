/**
 * Cliente Supabase para uso no servidor (API routes, Server Actions)
 * Usa service_role para bypass de RLS quando necessário
 * 
 * SPEC 8.1: Token apenas no servidor, nunca expor no client
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cria cliente Supabase com service_role (bypass RLS)
 * Usar APENAS no backend para operações administrativas
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

