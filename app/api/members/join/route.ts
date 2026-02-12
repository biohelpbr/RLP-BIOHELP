/**
 * POST /api/members/join
 * SPEC: Seção 7.1 - Endpoint de cadastro de membro
 * Sprint: 1
 * 
 * Regras implementadas:
 * - 4.1: Cadastro com link (ref)
 * - 4.2: Cadastro sem link (TBD-001 RESOLVIDO — House Account)
 * - 4.3: Unicidade de membro (email único)
 * - 4.4: Shopify sync (customer + tags + nivel)
 * - 5.2: Cria usuário no Supabase Auth
 * - 12: Se Shopify falhar, não bloquear criação do membro
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient, createAdminClient } from '@/lib/supabase/server'
import { generateRefCode, HOUSE_ACCOUNT_ID } from '@/lib/utils/ref-code'
import { syncMemberToShopify } from '@/lib/shopify/sync'
import type { UtmParams, Member } from '@/types/database'

// Schema de validação do body (SPEC 7.1)
const JoinRequestSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  ref: z.string().nullable().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    content: z.string().optional(),
    term: z.string().optional(),
  }).optional(),
})

type JoinRequest = z.infer<typeof JoinRequestSchema>

// Códigos de erro (SPEC 7.1)
const ErrorCodes = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_REF: 'INVALID_REF',
  NO_REF_BLOCKED: 'NO_REF_BLOCKED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação do body
    const body = await request.json()
    const validation = JoinRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.VALIDATION_ERROR,
          message: validation.error.errors[0]?.message || 'Dados inválidos',
        },
        { status: 400 }
      )
    }

    const { name, email, password, ref, utm } = validation.data
    const supabase = createServiceClient()
    const adminClient = createAdminClient()

    // 2. Verificar se e-mail já existe (SPEC 4.3)
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingMember) {
      // SPEC 7.1: 409 EMAIL_EXISTS
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.EMAIL_EXISTS,
          message: 'Este e-mail já está cadastrado. Faça login.',
        },
        { status: 409 }
      )
    }

    // 3. Resolver sponsor via ref (SPEC 4.1, 4.2)
    let sponsorId: string | null = null
    let refCodeUsed: string | null = null

    if (ref) {
      // SPEC 4.1: Cadastro com link
      const { data: sponsorData } = await supabase
        .from('members')
        .select('id, ref_code')
        .eq('ref_code', ref)
        .single()

      const sponsor = sponsorData as Pick<Member, 'id' | 'ref_code'> | null

      if (sponsor) {
        sponsorId = sponsor.id
        refCodeUsed = sponsor.ref_code
      } else {
        // SPEC 4.1: Se ref inválido → tratar como cadastro sem link (House Account)
        console.warn(`[join] ref_code inválido "${ref}" — usando House Account como sponsor`)
        sponsorId = HOUSE_ACCOUNT_ID
        refCodeUsed = null
      }
    } else {
      // SPEC 4.2 + TBD-001 RESOLVIDO: Cadastro sem link → House Account
      // Comissões de membros sem convite vão para a empresa (Biohelp)
      console.info('[join] Cadastro sem link de convite — atribuindo sponsor = House Account')
      sponsorId = HOUSE_ACCOUNT_ID
      refCodeUsed = null
    }

    // 4. Criar usuário no Supabase Auth (SPEC 5.2)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        name: name.trim(),
      },
    })

    if (authError || !authData.user) {
      console.error('[join] Failed to create auth user:', authError)
      
      // Verificar se é erro de email duplicado no Auth
      if (authError?.message?.includes('already been registered')) {
        return NextResponse.json(
          {
            ok: false,
            error: ErrorCodes.EMAIL_EXISTS,
            message: 'Este e-mail já está cadastrado. Faça login.',
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.AUTH_ERROR,
          message: 'Erro ao criar conta. Tente novamente.',
        },
        { status: 500 }
      )
    }

    const authUserId = authData.user.id

    // 5. Gerar ref_code único (SPEC 3.2 + TBD-006: formato sequencial BH00001)
    let newRefCode: string
    try {
      newRefCode = await generateRefCode()
    } catch (refError) {
      console.error('[join] Failed to generate ref_code:', refError)
      await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro interno. Tente novamente.',
        },
        { status: 500 }
      )
    }

    // Verificação extra de unicidade (a RPC já garante, mas por segurança)
    const { data: existingRefCodeData } = await supabase
      .from('members')
      .select('id')
      .eq('ref_code', newRefCode)
      .single()

    if (existingRefCodeData) {
      console.error('[join] ref_code gerado já existe (colisão):', newRefCode)
      // Tentar novamente
      try {
        newRefCode = await generateRefCode()
      } catch {
        await adminClient.auth.admin.deleteUser(authUserId)
        return NextResponse.json(
          {
            ok: false,
            error: ErrorCodes.INTERNAL_ERROR,
            message: 'Erro interno. Tente novamente.',
          },
          { status: 500 }
        )
      }
    }

    // 6. Criar membro (SPEC 9.1) - agora com auth_user_id
    const { data: newMemberData, error: memberError } = await supabase
      .from('members')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ref_code: newRefCode,
        sponsor_id: sponsorId,
        status: 'pending', // SPEC: pending no Sprint 1
        auth_user_id: authUserId, // Vincula ao Supabase Auth
      })
      .select()
      .single()

    if (memberError || !newMemberData) {
      console.error('[join] Failed to create member:', memberError)
      // Limpar usuário Auth criado
      await adminClient.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro ao criar cadastro. Tente novamente.',
        },
        { status: 500 }
      )
    }

    // Type assertion para garantir tipagem correta
    const newMember = newMemberData as Member

    // 7. Registrar referral_event com UTMs (SPEC 9.2)
    const utmJson: UtmParams | null = utm && Object.keys(utm).length > 0 ? utm : null

    const { error: eventError } = await supabase
      .from('referral_events')
      .insert({
        member_id: newMember.id,
        ref_code_used: refCodeUsed,
        utm_json: utmJson,
      })

    if (eventError) {
      // Log mas não bloqueia - evento é secundário
      console.warn('[join] Failed to create referral_event:', eventError)
    }

    // 8. Criar role padrão (SPEC 9.4)
    const { error: roleError } = await supabase
      .from('roles')
      .insert({
        member_id: newMember.id,
        role: 'member',
      })

    if (roleError) {
      console.warn('[join] Failed to create role:', roleError)
    }

    // 9. Criar registro de shopify_customers com status pending (SPEC 9.3)
    const { error: shopifyRecordError } = await supabase
      .from('shopify_customers')
      .insert({
        member_id: newMember.id,
        last_sync_status: 'pending',
      })

    if (shopifyRecordError) {
      console.warn('[join] Failed to create shopify_customers record:', shopifyRecordError)
    }

    // 10. Sync com Shopify (SPEC 4.4, 8.2)
    // SPEC 12: Se Shopify falhar, NÃO bloquear criação do membro
    // O sync é feito após criar o registro para permitir reprocesso via admin
    const shopifySyncResult = await syncMemberToShopify({
      memberId: newMember.id,
      email: newMember.email,
      name: newMember.name,
      refCode: newMember.ref_code,
      sponsorRefCode: refCodeUsed, // ref_code do sponsor
      level: 'membro', // nível padrão no cadastro
      status: 'active', // status padrão no cadastro (TBD-003)
    })

    if (!shopifySyncResult.success) {
      // Log mas NÃO retorna erro - SPEC 12
      console.warn('[join] Shopify sync failed (will retry via admin):', shopifySyncResult.error)
    }

    // 11. Retorno de sucesso (SPEC 7.1)
    // Inclui status do sync para debug (não bloqueia)
    const response = NextResponse.json(
      {
        ok: true,
        redirect: '/dashboard?new=1',
        member: {
          id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          ref_code: newMember.ref_code,
        },
        shopify_sync: {
          success: shopifySyncResult.success,
          customer_id: shopifySyncResult.shopifyCustomerId,
        },
      },
      { status: 201 }
    )

    return response

  } catch (error) {
    console.error('[join] Unexpected error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Erro interno. Tente novamente.',
      },
      { status: 500 }
    )
  }
}
