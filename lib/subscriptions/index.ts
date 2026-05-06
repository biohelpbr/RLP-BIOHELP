/**
 * Módulo de Assinaturas (Pivô V2)
 *
 * Lida com integração Guru → Shopify e estado de assinatura do membro.
 * Substitui a lógica de "ativo via 200 CV mensais" do v1.
 *
 * Status: SHELL — aguardando TBD-7 (Guru webhook direto vs leitura via Shopify)
 * Feature: F-V02 (PIVOT-V2.md §2)
 *
 * NÃO IMPORTAR EM PRODUÇÃO ainda — só após implementação completa atrás de LRP_V2 flag.
 */

export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'paused'

export interface MemberSubscription {
  member_id: string
  status: SubscriptionStatus
  guru_subscription_id?: string
  shopify_order_id?: string
  started_at?: string
  cancelled_at?: string
  // TODO(F-V02): definir campos finais após TBD-7
}

// TODO(F-V02): implementar quando TBD-7 estiver resolvido
//   - getSubscriptionStatus(memberId)
//   - syncFromGuruWebhook(payload)
//   - syncFromShopifyOrder(orderId)
