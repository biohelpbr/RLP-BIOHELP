'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

// Tipos
interface PayoutBalance {
  available: number
  pending: number
  total_earned: number
  total_withdrawn: number
}

interface PfMonthlyLimit {
  limit: number
  used: number
  remaining: number
}

interface PayoutItem {
  id: string
  amount: number
  gross_amount: number
  tax_amount: number
  net_amount: number
  person_type: 'pf' | 'mei' | 'pj'
  status: string
  bank_name: string
  pix_key: string | null
  created_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

interface PayoutForm {
  amount: string
  person_type: 'pf' | 'mei' | 'pj'
  bank_name: string
  bank_agency: string
  bank_account: string
  bank_account_type: 'corrente' | 'poupanca'
  pix_key: string
  cpf_cnpj: string
  holder_name: string
}

// Status labels e cores
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pendente', class: 'statusPending' },
  awaiting_document: { label: 'Aguardando NF-e', class: 'statusAwaiting' },
  under_review: { label: 'Em Análise', class: 'statusReview' },
  approved: { label: 'Aprovado', class: 'statusApproved' },
  processing: { label: 'Processando', class: 'statusProcessing' },
  completed: { label: 'Pago', class: 'statusCompleted' },
  rejected: { label: 'Rejeitado', class: 'statusRejected' },
  cancelled: { label: 'Cancelado', class: 'statusCancelled' }
}

// Ícones SVG
const Icons = {
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  send: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4Z"/>
      <path d="M22 2 11 13"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

export default function PayoutsPage() {
  const router = useRouter()
  const [balance, setBalance] = useState<PayoutBalance | null>(null)
  const [pfLimit, setPfLimit] = useState<PfMonthlyLimit | null>(null)
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [form, setForm] = useState<PayoutForm>({
    amount: '',
    person_type: 'pf',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: 'corrente',
    pix_key: '',
    cpf_cnpj: '',
    holder_name: ''
  })

  // Buscar dados
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/members/me/payouts')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar dados')
        const data = await res.json()
        setBalance(data.balance)
        setPfLimit(data.pf_monthly_limit)
        setPayouts(data.payouts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  // Formatar valor em BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Atualizar form
  const updateForm = (field: keyof PayoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  // Submeter saque
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const res = await fetch('/api/members/me/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          person_type: form.person_type,
          bank_name: form.bank_name,
          bank_agency: form.bank_agency,
          bank_account: form.bank_account,
          bank_account_type: form.bank_account_type,
          pix_key: form.pix_key || null,
          cpf_cnpj: form.cpf_cnpj,
          holder_name: form.holder_name
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      setFormSuccess(data.next_steps)
      setShowForm(false)
      
      // Recarregar dados
      const refreshRes = await fetch('/api/members/me/payouts')
      const refreshData = await refreshRes.json()
      setBalance(refreshData.balance)
      setPfLimit(refreshData.pf_monthly_limit)
      setPayouts(refreshData.payouts)

      // Limpar form
      setForm({
        amount: '',
        person_type: 'pf',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'corrente',
        pix_key: '',
        cpf_cnpj: '',
        holder_name: ''
      })

    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <Link href="/dashboard" className={styles.retryButton}>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backButton}>
          ← Voltar
        </Link>
        <h1 className={styles.title}>Meus Saques</h1>
      </header>

      {/* Success Message */}
      {formSuccess && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>{Icons.check}</span>
          <div>
            <strong>Solicitação enviada!</strong>
            <p>{formSuccess}</p>
          </div>
          <button onClick={() => setFormSuccess(null)} className={styles.closeButton}>
            {Icons.x}
          </button>
        </div>
      )}

      {/* Balance Cards */}
      <div className={styles.balanceGrid}>
        <div className={styles.balanceCardPrimary}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconGreen}`}>
              {Icons.wallet}
            </div>
            <span className={styles.balanceLabelPrimary}>Disponível para Saque</span>
          </div>
          <p className={styles.balanceValuePrimary}>
            {formatCurrency(balance?.available ?? 0)}
          </p>
          {balance && balance.available >= 50 && (
            <button 
              onClick={() => setShowForm(true)} 
              className={styles.withdrawButton}
            >
              {Icons.send}
              Solicitar Saque
            </button>
          )}
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconYellow}`}>
              {Icons.clock}
            </div>
            <span className={styles.balanceLabel}>Em Processamento</span>
          </div>
          <p className={styles.balanceValue}>
            {formatCurrency(balance?.pending ?? 0)}
          </p>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconGreen}`}>
              {Icons.check}
            </div>
            <span className={styles.balanceLabel}>Total Sacado</span>
          </div>
          <p className={styles.balanceValue}>
            {formatCurrency(balance?.total_withdrawn ?? 0)}
          </p>
        </div>
      </div>

      {/* PF Limit Info */}
      {pfLimit && form.person_type === 'pf' && (
        <div className={styles.limitCard}>
          <h3 className={styles.limitTitle}>Limite Mensal PF</h3>
          <div className={styles.limitBar}>
            <div 
              className={styles.limitProgress} 
              style={{ width: `${Math.min((pfLimit.used / pfLimit.limit) * 100, 100)}%` }}
            />
          </div>
          <div className={styles.limitInfo}>
            <span>Utilizado: {formatCurrency(pfLimit.used)}</span>
            <span>Disponível: {formatCurrency(pfLimit.remaining)}</span>
          </div>
          <p className={styles.limitNote}>
            Limite de {formatCurrency(pfLimit.limit)}/mês para CPF (PF). 
            Acima deste valor, é necessário cadastro PJ.
          </p>
        </div>
      )}

      {/* Withdrawal Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Solicitar Saque</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeFormButton}>
                {Icons.x}
              </button>
            </div>

            {formError && (
              <div className={styles.formError}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Valor */}
              <div className={styles.formGroup}>
                <label>Valor do Saque *</label>
                <input
                  type="number"
                  step="0.01"
                  min="100"
                  max={balance?.available ?? 0}
                  value={form.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                  placeholder="R$ 0,00"
                  required
                  className={styles.input}
                />
                <small>Mínimo: R$100,00 | Disponível: {formatCurrency(balance?.available ?? 0)}</small>
              </div>

              {/* Tipo de Pessoa */}
              <div className={styles.formGroup}>
                <label>Tipo de Pessoa *</label>
                <select
                  value={form.person_type}
                  onChange={(e) => updateForm('person_type', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="pf">Pessoa Física (CPF)</option>
                  <option value="mei">MEI</option>
                  <option value="pj">Pessoa Jurídica (CNPJ)</option>
                </select>
                {form.person_type === 'pf' && (
                  <small>Limite de R$1.000/mês. Biohelp emite RPA e desconta impostos (~16%).</small>
                )}
                {form.person_type === 'pj' && (
                  <small>Obrigatório enviar NF-e antes do pagamento.</small>
                )}
              </div>

              {/* CPF/CNPJ */}
              <div className={styles.formGroup}>
                <label>{form.person_type === 'pf' || form.person_type === 'mei' ? 'CPF' : 'CNPJ'} *</label>
                <input
                  type="text"
                  value={form.cpf_cnpj}
                  onChange={(e) => updateForm('cpf_cnpj', e.target.value)}
                  placeholder={form.person_type === 'pf' || form.person_type === 'mei' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required
                  className={styles.input}
                />
              </div>

              {/* Nome do Titular */}
              <div className={styles.formGroup}>
                <label>Nome do Titular da Conta *</label>
                <input
                  type="text"
                  value={form.holder_name}
                  onChange={(e) => updateForm('holder_name', e.target.value)}
                  placeholder="Nome completo (deve ser seu nome)"
                  required
                  className={styles.input}
                />
                <small>A conta deve estar em seu nome. Não é permitido saque para terceiros.</small>
              </div>

              {/* Dados Bancários */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Banco *</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => updateForm('bank_name', e.target.value)}
                    placeholder="Nome do banco"
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo de Conta *</label>
                  <select
                    value={form.bank_account_type}
                    onChange={(e) => updateForm('bank_account_type', e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Agência *</label>
                  <input
                    type="text"
                    value={form.bank_agency}
                    onChange={(e) => updateForm('bank_agency', e.target.value)}
                    placeholder="0000"
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Conta *</label>
                  <input
                    type="text"
                    value={form.bank_account}
                    onChange={(e) => updateForm('bank_account', e.target.value)}
                    placeholder="00000-0"
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Chave PIX */}
              <div className={styles.formGroup}>
                <label>Chave PIX (preferencial)</label>
                <input
                  type="text"
                  value={form.pix_key}
                  onChange={(e) => updateForm('pix_key', e.target.value)}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className={styles.input}
                />
                <small>Se informado, o pagamento será feito via PIX.</small>
              </div>

              {/* Botões */}
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? 'Processando...' : 'Solicitar Saque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payouts List */}
      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>Histórico de Saques</h2>

        {payouts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{Icons.wallet}</div>
            <p className={styles.emptyText}>Nenhum saque realizado ainda</p>
            <p className={styles.emptySubtext}>
              Quando você solicitar um saque, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className={styles.payoutsList}>
            {payouts.map((payout) => {
              const statusConfig = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending
              return (
                <div key={payout.id} className={styles.payoutItem}>
                  <div className={styles.payoutMain}>
                    <div className={styles.payoutInfo}>
                      <span className={styles.payoutAmount}>
                        {formatCurrency(payout.gross_amount)}
                      </span>
                      <span className={styles.payoutDate}>
                        {formatDate(payout.created_at)}
                      </span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[statusConfig.class]}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className={styles.payoutDetails}>
                    <span>Tipo: {payout.person_type.toUpperCase()}</span>
                    <span>Banco: {payout.bank_name}</span>
                    {payout.pix_key && <span>PIX: {payout.pix_key}</span>}
                  </div>

                  {payout.tax_amount > 0 && (
                    <div className={styles.payoutTax}>
                      <span>Impostos: -{formatCurrency(payout.tax_amount)}</span>
                      <span>Líquido: {formatCurrency(payout.net_amount)}</span>
                    </div>
                  )}

                  {payout.rejection_reason && (
                    <div className={styles.payoutRejection}>
                      <strong>Motivo da rejeição:</strong> {payout.rejection_reason}
                    </div>
                  )}

                  {payout.status === 'awaiting_document' && (
                    <Link 
                      href={`/dashboard/payouts/${payout.id}/upload`}
                      className={styles.uploadLink}
                    >
                      {Icons.upload}
                      Enviar NF-e
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>Informações sobre Saques</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <h4>Pessoa Física (CPF)</h4>
            <p>Limite de R$1.000/mês. Biohelp emite RPA automaticamente e desconta impostos (~16%).</p>
          </div>
          <div className={styles.infoItem}>
            <h4>MEI</h4>
            <p>Pode usar conta de pessoa física. Mesmas regras de PF.</p>
          </div>
          <div className={styles.infoItem}>
            <h4>Pessoa Jurídica (CNPJ)</h4>
            <p>Sem limite. Obrigatório enviar NF-e antes do pagamento. Conta deve ser PJ.</p>
          </div>
          <div className={styles.infoItem}>
            <h4>Prazo</h4>
            <p>Pagamentos são processados em até 5 dias úteis após aprovação.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
