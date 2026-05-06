/**
 * Módulo de Assinaturas (Pivô V2)
 *
 * Lida com integração Guru → Shopify e estado de assinatura do membro.
 * Substitui a lógica de "ativo via 200 CV mensais" do v1.
 *
 * F-V03 (S5): subscription_status enum (pending|paid|cancelled) em members.
 * Coluna populada pelo hook em webhooks/orders/paid quando produto for de
 * assinatura/clube. View member_active_affiliate_count usa esta coluna.
 */

export type {
  SubscriptionStatusV2,
  SubscriptionState,
} from "./queries"

export {
  getSubscriptionStatus,
  getActiveAffiliateCount,
} from "./queries"

export {
  markSubscriptionPaid,
  cancelSubscription,
} from "./actions"

export {
  detectSubscriptionPurchase,
  hookOnOrderPaidSubscription,
} from "./hook-on-order-paid"
export type {
  OrderPaidHookInput,
  OrderPaidHookResult,
} from "./hook-on-order-paid"
