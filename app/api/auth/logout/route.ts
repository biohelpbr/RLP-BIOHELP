/**
 * POST /api/auth/logout
 * SPEC: Seção 5.2 - Logout
 * Sprint: 1
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Força rota dinâmica (usa cookies)
export const dynamic = 'force-dynamic'

async function handleLogout(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    // Limpar cookies de autenticação
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    // 303 See Other: força navegador a fazer GET no /login após POST
    const loginUrl = new URL('/login', req.url)
    const response = NextResponse.redirect(loginUrl, { status: 303 })

    allCookies.forEach((cookie) => {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })

    return response
  } catch (error) {
    console.error('[logout] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Erro ao fazer logout.' },
      { status: 500 }
    )
  }
}

export const POST = handleLogout
export const GET = handleLogout

