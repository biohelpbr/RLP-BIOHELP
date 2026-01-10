'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'

interface Commission {
  id: string
  member: {
    id: string
    name: string
    email: string
    level: string
  }
  type: string
  type_label: string
  amount: number
  cv_base: number | null
  percentage: number | null
  source_member_name: string | null
  source_order_number: string | null
  network_level: number | null
  description: string | null
  created_at: string
}

interface CommissionsResponse {
  commissions: Commission[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  summary: {
    total_amount: number
    by_type: Record<string, number>
  }
}

// Ícones SVG inline para design clean
const Icons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  network: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  box: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  dollarSign: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
}

// Cores para tipos de comissão
const TYPE_COLORS: Record<string, string> = {
  fast_track_30: styles.typeFastTrack,
  fast_track_20: styles.typeFastTrack,
  perpetual: styles.typePerpetual,
  bonus_3_level_1: styles.typeBonus3,
  bonus_3_level_2: styles.typeBonus3,
  bonus_3_level_3: styles.typeBonus3,
  leadership: styles.typeLeadership,
  royalty: styles.typeRoyalty,
  adjustment: styles.typeAdjustment,
  reversal: styles.typeReversal
}

export default function AdminCommissionsPage() {
  const router = useRouter()
  const [data, setData] = useState<CommissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedType, setSelectedType] = useState<string>('')
  const [page, setPage] = useState(0)
  const limit = 50

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Buscar comissões
  useEffect(() => {
    async function fetchCommissions() {
      setLoading(true)
      try {
        let url = `/api/admin/commissions?month=${selectedMonth}&limit=${limit}&offset=${page * limit}`
        if (selectedType) {
          url += `&type=${selectedType}`
        }
        
        const res = await fetch(url)
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/dashboard')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar comissões')
        const responseData = await res.json()
        setData(responseData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchCommissions()
  }, [router, selectedMonth, selectedType, page])

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Gerar opções de mês (últimos 12 meses)
  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>B</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Admin Biohelp</span>
              <span className={styles.logoSubtitle}>Painel de Gestão</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.users}</span>
                <span>Parceiras</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.network}</span>
                <span>Rede</span>
              </Link>
            </li>
            <li className={`${styles.navItem} ${styles.navItemActive}`}>
              <Link href="/admin/commissions">
                <span className={styles.navIcon}>{Icons.dollarSign}</span>
                <span>Comissões</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.box}</span>
                <span>Produtos</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>{Icons.settings}</span>
                <span>Configurações</span>
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

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Gestão de Comissões</h1>
            <p>{data?.pagination.total || 0} registros no período</p>
          </div>
        </div>

        {/* Filtros */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  setPage(0)
                }}
                className={styles.filterSelect}
              >
                {getMonthOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setPage(0)
                }}
                className={styles.filterSelect}
              >
                <option value="">Todos</option>
                <option value="fast_track_30">Fast-Track 30%</option>
                <option value="fast_track_20">Fast-Track 20%</option>
                <option value="perpetual">Perpétua</option>
                <option value="bonus_3_level_1">Bônus 3 - Nível 1</option>
                <option value="bonus_3_level_2">Bônus 3 - Nível 2</option>
                <option value="bonus_3_level_3">Bônus 3 - Nível 3</option>
                <option value="leadership">Leadership</option>
                <option value="royalty">Royalty</option>
                <option value="adjustment">Ajuste</option>
                <option value="reversal">Reversão</option>
              </select>
            </div>

            {loading && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner}></div>
                <span>Carregando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumo */}
        {data && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCardPrimary}>
              <span className={styles.summaryLabel}>Total do Período</span>
              <p className={styles.summaryValue}>
                {formatCurrency(data.summary.total_amount)}
              </p>
            </div>
            
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Registros</span>
              <p className={styles.summaryValue}>
                {data.pagination.total}
              </p>
            </div>

            <div className={styles.summaryCardFastTrack}>
              <span className={styles.summaryLabel}>Fast-Track</span>
              <p className={styles.summaryValue}>
                {formatCurrency((data.summary.by_type['fast_track_30'] || 0) + (data.summary.by_type['fast_track_20'] || 0))}
              </p>
            </div>

            <div className={styles.summaryCardPerpetual}>
              <span className={styles.summaryLabel}>Perpétua</span>
              <p className={styles.summaryValue}>
                {formatCurrency(data.summary.by_type['perpetual'] || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Tabela de Comissões */}
        <div className={styles.tableCard}>
          {loading && !data ? (
            <div className={styles.loading}>Carregando...</div>
          ) : error ? (
            <div className={styles.emptyState}>
              <h3>Erro ao carregar</h3>
              <p>{error}</p>
            </div>
          ) : data?.commissions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>{Icons.dollarSign}</div>
              <h3>Nenhuma comissão encontrada</h3>
              <p>Não há comissões registradas neste período.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Tipo</th>
                  <th>Origem</th>
                  <th>CV Base</th>
                  <th>%</th>
                  <th>Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.commissions.map((commission) => (
                  <tr key={commission.id}>
                    <td>
                      <div className={styles.memberCell}>
                        <span className={styles.memberName}>{commission.member.name}</span>
                        <span className={styles.memberEmail}>{commission.member.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.typeBadge} ${TYPE_COLORS[commission.type] || ''}`}>
                        {commission.type_label}
                      </span>
                    </td>
                    <td>
                      {commission.source_member_name || '-'}
                      {commission.source_order_number && (
                        <span className={styles.orderNumber}>
                          #{commission.source_order_number}
                        </span>
                      )}
                    </td>
                    <td>
                      {commission.cv_base ? formatCurrency(commission.cv_base) : '-'}
                    </td>
                    <td>
                      {commission.percentage ? `${commission.percentage}%` : '-'}
                    </td>
                    <td>
                      <span className={commission.amount >= 0 ? styles.amountPositive : styles.amountNegative}>
                        {formatCurrency(commission.amount)}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(commission.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginação */}
          {data && data.pagination.total > limit && (
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, data.pagination.total)} de {data.pagination.total}
              </span>
              <div className={styles.pageButtons}>
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={styles.pageBtn}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.pagination.hasMore}
                  className={styles.pageBtn}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
