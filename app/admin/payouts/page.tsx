'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'

// Tipos
interface PayoutItem {
  id: string
  member_id: string
  member_name: string
  member_email: string
  amount: number
  gross_amount: number
  tax_amount: number
  net_amount: number
  person_type: 'pf' | 'mei' | 'pj'
  status: string
  bank_name: string
  pix_key: string | null
  cpf_cnpj: string
  holder_name: string
  created_at: string
  reviewed_at: string | null
  rejection_reason: string | null
  total_count: number
}

interface PayoutStats {
  pending: number
  awaiting_document: number
  under_review: number
  approved: number
  processing: number
  completed: number
  rejected: number
  cancelled: number
}

// Status labels e cores
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pendente', class: 'statusPending' },
  awaiting_document: { label: 'Aguard. NF-e', class: 'statusAwaiting' },
  under_review: { label: 'Em Análise', class: 'statusReview' },
  approved: { label: 'Aprovado', class: 'statusApproved' },
  processing: { label: 'Processando', class: 'statusProcessing' },
  completed: { label: 'Pago', class: 'statusCompleted' },
  rejected: { label: 'Rejeitado', class: 'statusRejected' },
  cancelled: { label: 'Cancelado', class: 'statusCancelled' }
}

// Ícones SVG
const Icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  dollar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 18V6"/>
    </svg>
  ),
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function AdminPayoutsPage() {
  const router = useRouter()
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const pageSize = 20

  // Buscar dados
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('limit', pageSize.toString())
      params.set('offset', (page * pageSize).toString())

      const res = await fetch(`/api/admin/payouts?${params}`)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 403) {
        router.push('/dashboard')
        return
      }
      if (!res.ok) throw new Error('Erro ao carregar dados')
      
      const data = await res.json()
      setPayouts(data.payouts)
      setStats(data.stats)
      setTotalCount(data.payouts[0]?.total_count ?? 0)
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, page])

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

  // Atualizar status
  const updateStatus = async (payoutId: string, newStatus: string, reason?: string) => {
    setUpdating(payoutId)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_id: payoutId,
          new_status: newStatus,
          reason
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao atualizar')
      }

      // Recarregar dados
      await fetchData()
      setShowRejectModal(null)
      setRejectReason('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setUpdating(null)
    }
  }

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>B</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Biohelp</span>
              <span className={styles.logoSubtitle}>Admin</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.home}</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.users}</span>
                <span>Membros</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin/commissions">
                <span className={styles.navIcon}>{Icons.dollar}</span>
                <span>Comissões</span>
              </Link>
            </li>
            <li className={`${styles.navItem} ${styles.navItemActive}`}>
              <Link href="/admin/payouts">
                <span className={styles.navIcon}>{Icons.wallet}</span>
                <span>Saques</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <span className={styles.navIcon}>{Icons.logout}</span>
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Gestão de Saques</h1>
            <p>Aprove ou rejeite solicitações de saque</p>
          </div>
        </header>

        {/* Stats */}
        {stats && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Pendentes</span>
              <span className={styles.summaryValue}>{stats.pending}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Em Análise</span>
              <span className={styles.summaryValue}>{stats.under_review}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Aguard. NF-e</span>
              <span className={styles.summaryValue}>{stats.awaiting_document}</span>
            </div>
            <div className={styles.summaryCardPrimary}>
              <span className={styles.summaryLabel}>Pagos</span>
              <span className={styles.summaryValue}>{stats.completed}</span>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                className={styles.filterSelect}
              >
                <option value="">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="awaiting_document">Aguardando NF-e</option>
                <option value="under_review">Em Análise</option>
                <option value="approved">Aprovados</option>
                <option value="processing">Processando</option>
                <option value="completed">Pagos</option>
                <option value="rejected">Rejeitados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            {loading && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner} />
                <span>Carregando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Membro</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>{Icons.wallet}</div>
                      <h3>Nenhum saque encontrado</h3>
                      <p>Não há solicitações de saque com os filtros selecionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => {
                  const statusConfig = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending
                  return (
                    <tr key={payout.id}>
                      <td>
                        <div className={styles.memberCell}>
                          <Link href={`/admin/members/${payout.member_id}`} className={styles.memberName}>
                            {payout.member_name}
                          </Link>
                          <span className={styles.memberEmail}>{payout.member_email}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{formatCurrency(payout.gross_amount)}</strong>
                          {payout.tax_amount > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Líquido: {formatCurrency(payout.net_amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.refCode}>
                          {payout.person_type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusConfig.class]}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className={styles.dateCell}>
                        {formatDate(payout.created_at)}
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <Link href={`/admin/payouts/${payout.id}`} className={styles.viewBtn}>
                            {Icons.eye}
                            Ver
                          </Link>
                          
                          {/* Botões de ação baseados no status */}
                          {['pending', 'under_review'].includes(payout.status) && (
                            <>
                              <button
                                onClick={() => updateStatus(payout.id, 'approved')}
                                disabled={updating === payout.id}
                                className={styles.resyncBtn}
                                style={{ background: '#d1fae5', color: '#059669' }}
                              >
                                {Icons.check}
                                Aprovar
                              </button>
                              <button
                                onClick={() => setShowRejectModal(payout.id)}
                                disabled={updating === payout.id}
                                className={styles.resyncBtn}
                                style={{ background: '#fee2e2', color: '#dc2626' }}
                              >
                                {Icons.x}
                                Rejeitar
                              </button>
                            </>
                          )}

                          {payout.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(payout.id, 'processing')}
                              disabled={updating === payout.id}
                              className={styles.resyncBtn}
                            >
                              Processar
                            </button>
                          )}

                          {payout.status === 'processing' && (
                            <button
                              onClick={() => updateStatus(payout.id, 'completed')}
                              disabled={updating === payout.id}
                              className={styles.resyncBtn}
                              style={{ background: '#d1fae5', color: '#059669' }}
                            >
                              {Icons.check}
                              Confirmar Pago
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className={styles.pageBtn}
              >
                ←
              </button>
              <span className={styles.pageInfo}>
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className={styles.pageBtn}
              >
                →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Rejeitar Saque</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280' }}>
              Informe o motivo da rejeição:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                minHeight: '100px',
                marginBottom: '16px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason('') }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => updateStatus(showRejectModal, 'rejected', rejectReason)}
                disabled={!rejectReason.trim() || updating === showRejectModal}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: 'white',
                  cursor: 'pointer',
                  opacity: !rejectReason.trim() ? 0.5 : 1
                }}
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
