/**
 * Cliente Supabase para uso no browser (Client Components)
 * 
 * SPEC 8.1: Usa apenas anon key (pública) no client
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria cliente Supabase para Client Components
 * Usa anon key e gerencia sessão via cookies automaticamente
 */
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

