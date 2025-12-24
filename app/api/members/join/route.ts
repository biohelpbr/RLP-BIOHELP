/**
 * POST /api/members/join
 * SPEC: Seção 7.1 - Endpoint de cadastro de membro
 * Sprint: 1
 * 
 * Regras implementadas:
 * - 4.1: Cadastro com link (ref)
 * - 4.2: Cadastro sem link (TBD-001 pendente - bloqueia por padrão)
 * - 4.3: Unicidade de membro (email único)
 * - 4.4: Shopify sync (customer + tags)
 * - 12: Se Shopify falhar, não bloquear criação do membro
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { generateRefCode } from '@/lib/utils/ref-code'
import { syncMemberToShopify } from '@/lib/shopify/sync'
import type { UtmParams } from '@/types/database'

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
      const { data: sponsor } = await supabase
        .from('members')
        .select('id, ref_code')
        .eq('ref_code', ref)
        .single()

      if (sponsor) {
        sponsorId = sponsor.id
        refCodeUsed = sponsor.ref_code
      } else {
        // SPEC 4.1: Se ref inválido → tratar como cadastro sem link
        // SPEC 4.2: TBD-001 não decidido → bloquear por padrão
        return NextResponse.json(
          {
            ok: false,
            error: ErrorCodes.INVALID_REF,
            message: 'Código de indicação inválido.',
          },
          { status: 400 }
        )
      }
    } else {
      // SPEC 4.2: Cadastro sem link
      // TBD-001 não decidido → comportamento padrão: bloquear
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.NO_REF_BLOCKED,
          message: 'Cadastro indisponível sem convite.',
        },
        { status: 400 }
      )
    }

    // 4. Gerar ref_code único (SPEC 3.2)
    let newRefCode = generateRefCode()
    let refCodeAttempts = 0
    const maxAttempts = 5

    // Garantir unicidade do ref_code
    while (refCodeAttempts < maxAttempts) {
      const { data: existingRefCode } = await supabase
        .from('members')
        .select('id')
        .eq('ref_code', newRefCode)
        .single()

      if (!existingRefCode) break
      
      newRefCode = generateRefCode()
      refCodeAttempts++
    }

    if (refCodeAttempts >= maxAttempts) {
      console.error('[join] Failed to generate unique ref_code after max attempts')
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro interno. Tente novamente.',
        },
        { status: 500 }
      )
    }

    // 5. Criar membro (SPEC 9.1)
    const { data: newMember, error: memberError } = await supabase
      .from('members')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ref_code: newRefCode,
        sponsor_id: sponsorId,
        status: 'pending', // SPEC: pending no Sprint 1
      })
      .select()
      .single()

    if (memberError || !newMember) {
      console.error('[join] Failed to create member:', memberError)
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro ao criar cadastro. Tente novamente.',
        },
        { status: 500 }
      )
    }

    // 6. Registrar referral_event com UTMs (SPEC 9.2)
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

    // 7. Criar role padrão (SPEC 9.4)
    const { error: roleError } = await supabase
      .from('roles')
      .insert({
        member_id: newMember.id,
        role: 'member',
      })

    if (roleError) {
      console.warn('[join] Failed to create role:', roleError)
    }

    // 8. Criar registro de shopify_customers com status pending (SPEC 9.3)
    const { error: shopifyRecordError } = await supabase
      .from('shopify_customers')
      .insert({
        member_id: newMember.id,
        last_sync_status: 'pending',
      })

    if (shopifyRecordError) {
      console.warn('[join] Failed to create shopify_customers record:', shopifyRecordError)
    }

    // 9. Sync com Shopify (SPEC 4.4, 8.2)
    // SPEC 12: Se Shopify falhar, NÃO bloquear criação do membro
    // O sync é feito após criar o registro para permitir reprocesso via admin
    const shopifySyncResult = await syncMemberToShopify({
      memberId: newMember.id,
      email: newMember.email,
      name: newMember.name,
      refCode: newMember.ref_code,
      sponsorRefCode: refCodeUsed, // ref_code do sponsor
    })

    if (!shopifySyncResult.success) {
      // Log mas NÃO retorna erro - SPEC 12
      console.warn('[join] Shopify sync failed (will retry via admin):', shopifySyncResult.error)
    }

    // 10. TODO: Criar usuário no Supabase Auth (task separada)
    // Por enquanto apenas registramos o membro no banco

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

    // TODO: Substituir por Supabase Auth session
    // Cookie temporário para dashboard funcionar antes do auth
    response.cookies.set('member_id', newMember.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })

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

