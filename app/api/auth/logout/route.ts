/**
 * POST /api/auth/logout
 * SPEC: Seção 5.2 - Logout
 * Sprint: 1
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.json(
      {
        ok: true,
        redirect: '/login',
      },
      { status: 200 }
    )
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

