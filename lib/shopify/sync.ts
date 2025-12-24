/**
 * Sincronização Shopify ↔ Supabase
 * SPEC: Seção 4.4, 9.3, 12
 * 
 * Regras:
 * - SPEC 12: Se Shopify indisponível, criar member mesmo assim
 * - Marcar sync_status = 'failed' + last_sync_error
 * - Permitir reprocesso via admin
 */

import { createServiceClient } from '@/lib/supabase/server'
import { syncCustomerToShopify, type CustomerSyncParams } from './customer'

export interface SyncMemberToShopifyParams {
  memberId: string
  email: string
  name: string
  refCode: string
  sponsorRefCode: string | null
}

export interface SyncResult {
  success: boolean
  shopifyCustomerId: string | null
  error: string | null
}

/**
 * Sincroniza membro com Shopify e registra status no Supabase
 * SPEC 4.4: Ao cadastrar (ou re-sincronizar), garantir customer + tags
 * SPEC 9.3: Registrar last_sync_status e last_sync_error
 */
export async function syncMemberToShopify(
  params: SyncMemberToShopifyParams
): Promise<SyncResult> {
  const supabase = createServiceClient()

  // 1. Tentar sync com Shopify
  const syncParams: CustomerSyncParams = {
    email: params.email,
    firstName: params.name,
    refCode: params.refCode,
    sponsorRefCode: params.sponsorRefCode,
  }

  const shopifyResult = await syncCustomerToShopify(syncParams)

  // 2. Atualizar registro no Supabase (SPEC 9.3)
  const now = new Date().toISOString()

  if (shopifyResult.success && shopifyResult.shopifyCustomerId) {
    // Sucesso - atualizar com status ok
    const { error: updateError } = await supabase
      .from('shopify_customers')
      .update({
        shopify_customer_id: shopifyResult.shopifyCustomerId,
        last_sync_at: now,
        last_sync_status: 'ok',
        last_sync_error: null,
      })
      .eq('member_id', params.memberId)

    if (updateError) {
      console.error('[sync] Failed to update shopify_customers:', updateError)
    }

    return {
      success: true,
      shopifyCustomerId: shopifyResult.shopifyCustomerId,
      error: null,
    }
  } else {
    // Falha - registrar erro (SPEC 12: não bloquear criação do member)
    // Nota: Não expor segredos no erro (regra supabase-db-rls.mdc)
    const safeError = sanitizeErrorMessage(shopifyResult.error || 'Unknown error')

    const { error: updateError } = await supabase
      .from('shopify_customers')
      .update({
        last_sync_at: now,
        last_sync_status: 'failed',
        last_sync_error: safeError,
      })
      .eq('member_id', params.memberId)

    if (updateError) {
      console.error('[sync] Failed to update shopify_customers:', updateError)
    }

    return {
      success: false,
      shopifyCustomerId: null,
      error: safeError,
    }
  }
}

/**
 * Remove informações sensíveis da mensagem de erro
 * SPEC supabase-db-rls.mdc: sem vazar segredos
 */
function sanitizeErrorMessage(error: string): string {
  // Remover tokens, URLs com credenciais, etc.
  return error
    .replace(/Bearer\s+\S+/gi, '[REDACTED_TOKEN]')
    .replace(/X-Shopify-Access-Token:\s*\S+/gi, '[REDACTED_TOKEN]')
    .replace(/password[=:]\S+/gi, 'password=[REDACTED]')
    .substring(0, 500) // Limitar tamanho
}

