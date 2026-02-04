/**
 * API: POST /api/members/me/payouts/[id]/documents
 * Upload de documentos para solicitação de saque (NF-e)
 * 
 * Sprint 5 - FR-30 (Upload e validação de NF-e)
 * SPEC 7.2: PJ obrigatório NF-e antes do pagamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST: Upload de documento
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Verificar autenticação
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: payoutId } = await context.params
    const supabase = createServiceClient()

    // 2. Buscar membro
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 3. Verificar se o saque pertence ao membro
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select('id, member_id, status, person_type')
      .eq('id', payoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: 'Solicitação de saque não encontrada' },
        { status: 404 }
      )
    }

    if (payout.member_id !== member.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // 4. Verificar status - só pode enviar documento em status específicos
    const allowedStatuses = ['awaiting_document', 'pending', 'under_review']
    if (!allowedStatuses.includes(payout.status)) {
      return NextResponse.json(
        { error: 'Não é possível enviar documentos para esta solicitação' },
        { status: 400 }
      )
    }

    // 5. Processar upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = formData.get('document_type') as string
    const documentNumber = formData.get('document_number') as string | null
    const documentDate = formData.get('document_date') as string | null
    const documentValue = formData.get('document_value') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tipo de documento
    if (!['nfe', 'comprovante'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      )
    }

    // PJ deve enviar NF-e
    if (payout.person_type === 'pj' && documentType !== 'nfe') {
      return NextResponse.json(
        { error: 'Para PJ, é obrigatório enviar NF-e' },
        { status: 400 }
      )
    }

    // Validar tamanho (máx 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'image/jpeg',
      'image/png'
    ]
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, XML, JPEG ou PNG.' },
        { status: 400 }
      )
    }

    // 6. Fazer upload para Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${payoutId}/${documentType}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('payout-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      
      // Se o bucket não existir, criar
      if (uploadError.message.includes('not found')) {
        // Tentar criar o bucket (isso geralmente é feito via dashboard)
        return NextResponse.json(
          { error: 'Bucket de armazenamento não configurado. Contate o administrador.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // 7. Registrar documento no banco
    const { data: document, error: docError } = await supabase
      .from('payout_documents')
      .insert({
        payout_request_id: payoutId,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        document_number: documentNumber,
        document_date: documentDate || null,
        document_value: documentValue ? parseFloat(documentValue) : null,
        validation_status: 'pending'
      })
      .select()
      .single()

    if (docError) {
      console.error('Erro ao registrar documento:', docError)
      // Tentar remover arquivo do storage
      await supabase.storage.from('payout-documents').remove([fileName])
      
      return NextResponse.json(
        { error: 'Erro ao registrar documento' },
        { status: 500 }
      )
    }

    // 8. Atualizar status do saque se estava aguardando documento
    if (payout.status === 'awaiting_document') {
      await supabase
        .from('payout_requests')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', payoutId)

      // Registrar histórico
      await supabase
        .from('payout_history')
        .insert({
          payout_request_id: payoutId,
          previous_status: 'awaiting_document',
          new_status: 'under_review',
          change_reason: 'Documento enviado pelo membro'
        })
    }

    return NextResponse.json({
      success: true,
      document_id: document.id,
      message: 'Documento enviado com sucesso. Aguarde a validação.'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no upload de documento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET: Listar documentos do saque
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Verificar autenticação
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id: payoutId } = await context.params
    const supabase = createServiceClient()

    // 2. Buscar membro
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // 3. Verificar se o saque pertence ao membro
    const { data: payout } = await supabase
      .from('payout_requests')
      .select('id, member_id')
      .eq('id', payoutId)
      .single()

    if (!payout || payout.member_id !== member.id) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // 4. Buscar documentos
    const { data: documents } = await supabase
      .from('payout_documents')
      .select('*')
      .eq('payout_request_id', payoutId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      documents: documents ?? []
    })

  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
