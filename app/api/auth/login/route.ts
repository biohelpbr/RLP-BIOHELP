/**
 * POST /api/auth/login
 * SPEC: Seção 5.2 - Fluxo de login
 * Sprint: 1
 * 
 * Autentica usuário via Supabase Auth e retorna sessão
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'

// Schema de validação
const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = LoginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'VALIDATION_ERROR',
          message: validation.error.errors[0]?.message || 'Dados inválidos',
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    const supabase = await createServerSupabaseClient()

    // Tentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      console.error('[login] Auth error:', error.message)
      return NextResponse.json(
        {
          ok: false,
          error: 'AUTH_ERROR',
          message: 'E-mail ou senha incorretos.',
        },
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          ok: false,
          error: 'AUTH_ERROR',
          message: 'Erro ao fazer login. Tente novamente.',
        },
        { status: 401 }
      )
    }

    // Buscar dados do membro
    const serviceClient = createServiceClient()
    const { data: member } = await serviceClient
      .from('members')
      .select('id, name, email, ref_code')
      .eq('auth_user_id', data.user.id)
      .single()

    // Verificar se é admin
    let isAdmin = false
    if (member) {
      const { data: role } = await serviceClient
        .from('roles')
        .select('role')
        .eq('member_id', member.id)
        .single()
      
      isAdmin = role?.role === 'admin'
    }

    return NextResponse.json(
      {
        ok: true,
        redirect: isAdmin ? '/admin' : '/dashboard',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        member: member || null,
        isAdmin,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[login] Unexpected error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno. Tente novamente.',
      },
      { status: 500 }
    )
  }
}

