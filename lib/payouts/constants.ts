/**
 * Constantes de Saques (Payouts) - Sprint 5
 * 
 * Valores definidos conforme TBDs resolvidos:
 * - TBD-015: Limite PF = R$ 1.000/mês
 * - TBD-016: Mínimo para saque = R$ 100
 * - TBD-018: Integração Asaas
 * - TBD-021: Net-15 (disponível 15 dias após virada do mês)
 */

// TBD-015: Limite mensal para PF (CPF)
export const PF_MONTHLY_LIMIT = 1000

// TBD-016: Valor mínimo para saque
export const MIN_PAYOUT_AMOUNT = 100

// TBD-021: Dias após virada do mês para disponibilidade (Net-15)
export const NET_DAYS_AVAILABILITY = 15

// TBD-018: Provider de pagamento
export const PAYMENT_PROVIDER = 'asaas'

// Taxa aproximada de impostos para PF (RPA)
export const PF_TAX_RATE = 0.16

// Condições que invalidam uma comissão
export const COMMISSION_INVALIDATION_REASONS = [
  'chargeback',
  'cancellation', 
  'refund'
] as const

export type CommissionInvalidationReason = typeof COMMISSION_INVALIDATION_REASONS[number]

// Status de saque
export const PAYOUT_STATUS = {
  PENDING: 'pending',
  AWAITING_DOCUMENT: 'awaiting_document',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const

export type PayoutStatus = typeof PAYOUT_STATUS[keyof typeof PAYOUT_STATUS]

// Tipos de pessoa
export const PERSON_TYPE = {
  PF: 'pf',    // Pessoa Física - até R$1.000/mês via RPA
  MEI: 'mei',  // MEI - pode usar conta PF
  PJ: 'pj'     // Pessoa Jurídica - obrigatório NF-e
} as const

export type PersonType = typeof PERSON_TYPE[keyof typeof PERSON_TYPE]

// Mensagens de erro
export const PAYOUT_ERRORS = {
  MIN_AMOUNT: `Valor mínimo para saque é R$ ${MIN_PAYOUT_AMOUNT}`,
  PF_LIMIT_EXCEEDED: (remaining: number) => 
    `Limite mensal PF excedido. Disponível: R$ ${remaining.toFixed(2)}`,
  INSUFFICIENT_BALANCE: (available: number) => 
    `Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`,
  THIRD_PARTY_ACCOUNT: 'A conta bancária deve estar em nome do membro. Não é permitido saque para conta de terceiros.',
  INVALID_PERSON_TYPE: 'Tipo de pessoa inválido',
  INCOMPLETE_BANK_DATA: 'Dados bancários incompletos',
  MISSING_CPF_CNPJ: 'CPF/CNPJ e nome do titular são obrigatórios'
} as const

// Mensagens de próximos passos
export const PAYOUT_NEXT_STEPS = {
  PF: 'Sua solicitação foi recebida. Um RPA será gerado automaticamente e o pagamento será processado em até 5 dias úteis.',
  MEI: 'Sua solicitação foi recebida. Por ser MEI, você pode usar conta PF. O pagamento será processado em até 5 dias úteis.',
  PJ: 'Sua solicitação foi recebida. Por favor, faça o upload da Nota Fiscal Eletrônica (NF-e) para que o pagamento seja processado.'
} as const
