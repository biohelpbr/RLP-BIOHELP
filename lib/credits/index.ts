/**
 * Módulo de Saldo e Créditos da Loja (Pivô V2)
 *
 * Pre-Founder: pode converter saldo em crédito Shopify (1:1 ou ágio — TBD-12).
 * Founder: pode converter ou sacar (F-V07 cuida do saque cash via Asaas).
 *
 * Status: SHELL — aguardando TBD-12 (taxa de conversão e validade) e TBD-9 (prazo de saldo).
 * Feature: F-V05 (PIVOT-V2.md §2)
 */

export interface MemberBalance {
  member_id: string
  available_brl: number
  pending_brl: number
  // TODO(F-V05): adicionar expires_at após TBD-9 (prazo de saldo do inativo)
}

export interface ShopifyCreditConversion {
  id: string
  member_id: string
  amount_brl: number
  shopify_credit_id?: string    // gift card ou store credit ID na Shopify
  converted_at: string
}

// TODO(F-V05):
//   - convertToShopifyCredit(memberId, amount)
//   - getBalance(memberId)
