/**
 * Cliente Supabase para uso no servidor (API routes, Server Actions)
 * 
 * SPEC 8.1: Token apenas no servidor, nunca expor no client
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria cliente Supabase com service_role (bypass RLS)
 * Usar APENAS no backend para operações administrativas
 * 
 * Nota: Usando cliente sem tipagem genérica para evitar conflitos de versão.
 * Os tipos são verificados manualmente via interfaces em types/database.ts
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Cria cliente Supabase Admin para operações de Auth
 * Usado para criar/gerenciar usuários via Admin API
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Cria cliente Supabase para Server Components e Route Handlers
 * Usa cookies para manter sessão do usuário
 * SPEC 5.2: Autentica via Supabase
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Obtém o usuário autenticado atual
 * Retorna null se não estiver autenticado
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Obtém o membro atual baseado no usuário autenticado
 * Retorna null se não autenticado ou membro não encontrado
 */
export async function getCurrentMember() {
  const user = await getAuthUser()
  if (!user) return null
  
  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()
  
  return member
}

/**
 * Verifica se o usuário atual é admin
 */
export async function isCurrentUserAdmin() {
  const user = await getAuthUser()
  if (!user) return false
  
  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  
  if (!member) return false
  
  const { data: role } = await supabase
    .from('roles')
    .select('role')
    .eq('member_id', member.id)
    .single()
  
  return role?.role === 'admin'
}
