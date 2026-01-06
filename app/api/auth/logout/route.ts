/**
 * POST /api/auth/logout
 * SPEC: Seção 5.2 - Logout
 * Sprint: 1
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    // Limpar cookies de autenticação
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const response = NextResponse.json(
      {
        ok: true,
        redirect: '/login',
      },
      { status: 200 }
    )

    // Remover todos os cookies relacionados ao Supabase
    allCookies.forEach((cookie) => {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })

    return response
  } catch (error) {
    console.error('[logout] Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao fazer logout.',
      },
      { status: 500 }
    )
  }
}

