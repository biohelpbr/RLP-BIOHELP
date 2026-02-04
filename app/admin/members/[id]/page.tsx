/**
 * Detalhes do Membro (Admin)
 * SPEC: Sprint 2 - CV detalhado, Ajuste manual, Ledger
 * 
 * Funcionalidades:
 * - Ver CV atual e histórico
 * - Fazer ajuste manual de CV
 * - Ver ledger de transações
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import styles from './page.module.css'

interface MemberDetails {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  level?: string
  ref_code?: string
  lastCalculation: string | null
}

interface CurrentMonth {
  month: string
  cv: number
  target: number
  remaining: number
  percentage: number
}

interface HistoryItem {
  month: string
  cv: number
  ordersCount: number
  status: string
  closedAt: string | null
}

interface LedgerItem {
  id: string
  cv_amount: number
  cv_type: string
  description: string | null
  created_at: string
  order_id: string | null
}

interface OrderItem {
  id: string
  shopify_order_number: string | null
  total_amount: number
  total_cv: number
  status: string
  paid_at: string
}

interface MemberCVData {
  member: MemberDetails
  currentMonth: CurrentMonth
  history: HistoryItem[]
  ledger: LedgerItem[]
  orders: OrderItem[]
}

// Ícones SVG
const Icons = {
  arrowLeft: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  trendingUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  minus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  fileText: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  shoppingBag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  unlock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  award: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  dollarSign: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
}

export default function MemberDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [data, setData] = useState<MemberCVData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado do modal de ajuste CV
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustDescription, setAdjustDescription] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustSuccess, setAdjustSuccess] = useState(false)
  
  // Estado do modal de ações (Sprint 7)
  const [showActionModal, setShowActionModal] = useState<'level' | 'block' | 'commission' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState('')
  const [commissionAmount, setCommissionAmount] = useState('')
  const [commissionDescription, setCommissionDescription] = useState('')
  const [actionReason, setActionReason] = useState('')

  useEffect(() => {
    fetchMemberData()
  }, [id])

  const fetchMemberData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/members/${id}/cv`)
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/login')
          return
        }
        if (response.status === 404) {
          setError('Membro não encontrado')
          return
        }
        throw new Error('Erro ao carregar dados')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar dados do membro')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(adjustAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Informe um valor válido maior que zero')
      return
    }
    
    if (!adjustDescription.trim()) {
      alert('Informe uma descrição para o ajuste')
      return
    }
    
    setIsAdjusting(true)
    
    try {
      const finalAmount = adjustType === 'subtract' ? -amount : amount
      
      const response = await fetch(`/api/admin/members/${id}/cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          description: adjustDescription.trim()
        })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erro ao fazer ajuste')
      }
      
      setAdjustSuccess(true)
      setTimeout(() => {
        setShowAdjustModal(false)
        setAdjustAmount('')
        setAdjustDescription('')
        setAdjustType('add')
        setAdjustSuccess(false)
        fetchMemberData() // Recarregar dados
      }, 1500)
      
    } catch (err) {
      console.error('Erro ao ajustar CV:', err)
      alert(err instanceof Error ? err.message : 'Erro ao fazer ajuste')
    } finally {
      setIsAdjusting(false)
    }
  }

  // Ações de gestão do membro (Sprint 7)
  const handleMemberAction = async (action: string, actionData?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: actionData,
          reason: actionReason
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erro ao executar ação')
      }

      // Sucesso - recarregar dados
      setShowActionModal(null)
      setActionReason('')
      setSelectedLevel('')
      setCommissionAmount('')
      setCommissionDescription('')
      fetchMemberData()
      alert('Ação executada com sucesso!')
    } catch (err) {
      console.error('Erro:', err)
      alert(err instanceof Error ? err.message : 'Erro ao executar ação')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLevelChange = () => {
    if (!selectedLevel) {
      alert('Selecione um nível')
      return
    }
    handleMemberAction('adjust_level', { level: selectedLevel })
  }

  const handleBlockToggle = () => {
    const action = data?.member.status === 'inactive' ? 'unblock' : 'block'
    handleMemberAction(action)
  }

  const handleCommissionAdjust = () => {
    const amount = parseFloat(commissionAmount)
    if (isNaN(amount) || amount === 0) {
      alert('Informe um valor válido')
      return
    }
    if (!commissionDescription.trim()) {
      alert('Informe uma descrição')
      return
    }
    handleMemberAction('adjust_commission', {
      commission_adjustment: {
        amount,
        description: commissionDescription
      }
    })
  }

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(month) - 1]}/${year}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa'
      case 'inactive': return 'Inativa'
      default: return 'Pendente'
    }
  }

  const getCVTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Pedido'
      case 'refund': return 'Reembolso'
      case 'adjustment': return 'Ajuste Manual'
      case 'manual': return 'Ajuste Manual'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Erro</h2>
          <p>{error || 'Dados não encontrados'}</p>
          <Link href="/admin" className={styles.backLink}>
            {Icons.arrowLeft} Voltar para lista
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin" className={styles.backLink}>
          {Icons.arrowLeft}
          <span>Voltar</span>
        </Link>
        
        <div className={styles.memberHeader}>
          <div className={styles.memberAvatar}>
            {data.member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className={styles.memberInfo}>
            <h1>{data.member.name}</h1>
            <p>{data.member.email}</p>
            {data.member.level && (
              <span className={styles.levelBadge}>{data.member.level}</span>
            )}
          </div>
          <span className={`${styles.statusBadge} ${data.member.status === 'active' ? styles.statusActive : styles.statusPending}`}>
            {getStatusLabel(data.member.status)}
          </span>
        </div>
        
        {/* Ações de Gestão - Sprint 7 */}
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionBtn}
            onClick={() => setShowActionModal('level')}
            title="Ajustar Nível"
          >
            {Icons.award}
            <span>Nível</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${data.member.status === 'inactive' ? styles.actionBtnSuccess : styles.actionBtnDanger}`}
            onClick={() => setShowActionModal('block')}
            title={data.member.status === 'inactive' ? 'Desbloquear' : 'Bloquear'}
          >
            {data.member.status === 'inactive' ? Icons.unlock : Icons.lock}
            <span>{data.member.status === 'inactive' ? 'Desbloquear' : 'Bloquear'}</span>
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => setShowActionModal('commission')}
            title="Ajustar Comissão"
          >
            {Icons.dollarSign}
            <span>Comissão</span>
          </button>
        </div>
      </div>

      {/* CV Cards */}
      <div className={styles.cvGrid}>
        <div className={styles.cvCard}>
          <div className={styles.cvCardHeader}>
            <span className={styles.cvCardIcon}>{Icons.trendingUp}</span>
            <span className={styles.cvCardLabel}>CV do Mês</span>
          </div>
          <div className={styles.cvCardValue}>{data.currentMonth.cv.toFixed(0)}</div>
          <div className={styles.cvCardSub}>{formatMonth(data.currentMonth.month)}</div>
        </div>

        <div className={styles.cvCard}>
          <div className={styles.cvCardHeader}>
            <span className={styles.cvCardIcon}>{Icons.target}</span>
            <span className={styles.cvCardLabel}>Meta</span>
          </div>
          <div className={styles.cvCardValue}>{data.currentMonth.target}</div>
          <div className={styles.cvCardSub}>CV necessário</div>
        </div>

        <div className={styles.cvCard}>
          <div className={styles.cvCardHeader}>
            <span className={styles.cvCardIcon}>{Icons.zap}</span>
            <span className={styles.cvCardLabel}>Progresso</span>
          </div>
          <div className={styles.cvCardValue}>{data.currentMonth.percentage.toFixed(0)}%</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.min(data.currentMonth.percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className={`${styles.cvCard} ${styles.cvCardAction}`}>
          <button 
            className={styles.adjustBtn}
            onClick={() => setShowAdjustModal(true)}
          >
            {Icons.plus}
            <span>Ajuste Manual</span>
          </button>
          <p className={styles.adjustHint}>Adicionar ou remover CV</p>
        </div>
      </div>

      {/* Tabs Content */}
      <div className={styles.sections}>
        {/* Ledger Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{Icons.fileText}</span>
            <h2>Ledger de CV</h2>
            <span className={styles.sectionCount}>{data.ledger.length} transações</span>
          </div>
          
          {data.ledger.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma transação de CV este mês</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th className={styles.textRight}>CV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <span className={`${styles.typeBadge} ${styles[`type${item.cv_type}`]}`}>
                          {getCVTypeLabel(item.cv_type)}
                        </span>
                      </td>
                      <td>{item.description || '—'}</td>
                      <td className={`${styles.textRight} ${item.cv_amount >= 0 ? styles.cvPositive : styles.cvNegative}`}>
                        {item.cv_amount >= 0 ? '+' : ''}{item.cv_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{Icons.shoppingBag}</span>
            <h2>Pedidos do Mês</h2>
            <span className={styles.sectionCount}>{data.orders.length} pedidos</span>
          </div>
          
          {data.orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum pedido este mês</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th className={styles.textRight}>Valor</th>
                    <th className={styles.textRight}>CV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <code className={styles.orderNumber}>
                          #{order.shopify_order_number || order.id.slice(0, 8)}
                        </code>
                      </td>
                      <td>{formatDate(order.paid_at)}</td>
                      <td>
                        <span className={`${styles.orderStatus} ${styles[`order${order.status}`]}`}>
                          {order.status === 'paid' ? 'Pago' : order.status}
                        </span>
                      </td>
                      <td className={styles.textRight}>{formatCurrency(order.total_amount)}</td>
                      <td className={`${styles.textRight} ${styles.cvPositive}`}>
                        +{order.total_cv.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{Icons.calendar}</span>
            <h2>Histórico de CV</h2>
            <span className={styles.sectionCount}>{data.history.length} meses</span>
          </div>
          
          {data.history.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum histórico disponível</p>
              <span className={styles.emptyHint}>O histórico aparece após o fechamento mensal</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Pedidos</th>
                    <th>Status</th>
                    <th className={styles.textRight}>CV Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((item, index) => (
                    <tr key={index}>
                      <td>{formatMonth(item.month)}</td>
                      <td>{item.ordersCount}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${item.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className={styles.textRight}>{item.cv.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ajuste CV */}
      {showAdjustModal && (
        <div className={styles.modalOverlay} onClick={() => !isAdjusting && setShowAdjustModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {adjustSuccess ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>{Icons.check}</div>
                <h3>Ajuste realizado!</h3>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <h3>Ajuste Manual de CV</h3>
                  <p>Membro: {data.member.name}</p>
                </div>
                
                <form onSubmit={handleAdjustSubmit} className={styles.adjustForm}>
                  <div className={styles.adjustTypeToggle}>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${adjustType === 'add' ? styles.typeBtnActive : ''}`}
                      onClick={() => setAdjustType('add')}
                    >
                      {Icons.plus} Adicionar
                    </button>
                    <button
                      type="button"
                      className={`${styles.typeBtn} ${adjustType === 'subtract' ? styles.typeBtnActive : ''}`}
                      onClick={() => setAdjustType('subtract')}
                    >
                      {Icons.minus} Remover
                    </button>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="amount">Valor do CV</label>
                    <input
                      type="number"
                      id="amount"
                      step="0.01"
                      min="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="Ex: 50.00"
                      required
                      disabled={isAdjusting}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Descrição (obrigatório)</label>
                    <textarea
                      id="description"
                      value={adjustDescription}
                      onChange={(e) => setAdjustDescription(e.target.value)}
                      placeholder="Ex: Correção de pedido #1234"
                      required
                      disabled={isAdjusting}
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setShowAdjustModal(false)}
                      disabled={isAdjusting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`${styles.submitBtn} ${adjustType === 'subtract' ? styles.submitBtnDanger : ''}`}
                      disabled={isAdjusting}
                    >
                      {isAdjusting ? 'Salvando...' : adjustType === 'add' ? 'Adicionar CV' : 'Remover CV'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Nível - Sprint 7 */}
      {showActionModal === 'level' && (
        <div className={styles.modalOverlay} onClick={() => !actionLoading && setShowActionModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Ajustar Nível</h3>
              <p>Membro: {data.member.name}</p>
            </div>
            
            <div className={styles.adjustForm}>
              <div className={styles.formGroup}>
                <label>Nível Atual</label>
                <p className={styles.currentValue}>{data.member.level || 'membro'}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="level">Novo Nível</label>
                <select
                  id="level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="">Selecione...</option>
                  <option value="membro">Membro</option>
                  <option value="parceira">Parceira</option>
                  <option value="lider_formacao">Líder em Formação</option>
                  <option value="lider">Líder</option>
                  <option value="diretora">Diretora</option>
                  <option value="head">Head</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="reason">Motivo (opcional)</label>
                <textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ex: Promoção manual por mérito"
                  disabled={actionLoading}
                  rows={2}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowActionModal(null)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleLevelChange}
                  disabled={actionLoading || !selectedLevel}
                >
                  {actionLoading ? 'Salvando...' : 'Alterar Nível'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bloquear/Desbloquear - Sprint 7 */}
      {showActionModal === 'block' && (
        <div className={styles.modalOverlay} onClick={() => !actionLoading && setShowActionModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{data.member.status === 'inactive' ? 'Desbloquear Membro' : 'Bloquear Membro'}</h3>
              <p>Membro: {data.member.name}</p>
            </div>
            
            <div className={styles.adjustForm}>
              <div className={styles.warningBox}>
                {data.member.status === 'inactive' ? (
                  <p>O membro será desbloqueado e poderá voltar a participar do programa.</p>
                ) : (
                  <p>O membro será bloqueado e não poderá mais participar do programa até ser desbloqueado.</p>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="blockReason">Motivo (opcional)</label>
                <textarea
                  id="blockReason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ex: Violação de termos"
                  disabled={actionLoading}
                  rows={2}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowActionModal(null)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={data.member.status === 'inactive' ? styles.submitBtn : styles.submitBtnDanger}
                  onClick={handleBlockToggle}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processando...' : data.member.status === 'inactive' ? 'Desbloquear' : 'Bloquear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Comissão - Sprint 7 */}
      {showActionModal === 'commission' && (
        <div className={styles.modalOverlay} onClick={() => !actionLoading && setShowActionModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Ajustar Comissão</h3>
              <p>Membro: {data.member.name}</p>
            </div>
            
            <div className={styles.adjustForm}>
              <div className={styles.formGroup}>
                <label htmlFor="commissionAmount">Valor (R$)</label>
                <input
                  type="number"
                  id="commissionAmount"
                  step="0.01"
                  value={commissionAmount}
                  onChange={(e) => setCommissionAmount(e.target.value)}
                  placeholder="Ex: 50.00 ou -50.00"
                  disabled={actionLoading}
                />
                <small>Use valor negativo para débito</small>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="commissionDesc">Descrição (obrigatório)</label>
                <textarea
                  id="commissionDesc"
                  value={commissionDescription}
                  onChange={(e) => setCommissionDescription(e.target.value)}
                  placeholder="Ex: Bônus especial de campanha"
                  disabled={actionLoading}
                  rows={2}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="commissionReason">Motivo (opcional)</label>
                <textarea
                  id="commissionReason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ex: Aprovado pela diretoria"
                  disabled={actionLoading}
                  rows={2}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowActionModal(null)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleCommissionAdjust}
                  disabled={actionLoading || !commissionAmount || !commissionDescription}
                >
                  {actionLoading ? 'Salvando...' : 'Ajustar Comissão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

