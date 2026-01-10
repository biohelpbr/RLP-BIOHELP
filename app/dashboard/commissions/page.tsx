'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MemberCommissionsResponse, CommissionDetailsResponse } from '@/types/database'
import styles from './page.module.css'

// Labels para tipos de comissão
const TYPE_LABELS: Record<string, string> = {
  fast_track_30: 'Fast-Track 30%',
  fast_track_20: 'Fast-Track 20%',
  perpetual: 'Comissão Perpétua',
  bonus_3_level_1: 'Bônus 3 - Nível 1',
  bonus_3_level_2: 'Bônus 3 - Nível 2',
  bonus_3_level_3: 'Bônus 3 - Nível 3',
  leadership: 'Leadership Bônus',
  royalty: 'Royalty',
  adjustment: 'Ajuste Manual',
  reversal: 'Reversão'
}

// Mapeamento de tipo para classe CSS
const getTypeBadgeClass = (type: string): string => {
  if (type.startsWith('fast_track')) return styles.typeBadgeFastTrack
  if (type === 'perpetual') return styles.typeBadgePerpetual
  if (type.startsWith('bonus_3')) return styles.typeBadgeBonus3
  if (type === 'leadership') return styles.typeBadgeLeadership
  if (type === 'royalty') return styles.typeBadgeRoyalty
  return styles.typeBadgeDefault
}

// Ícones SVG
const Icons = {
  dollar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 18V6"/>
    </svg>
  ),
  trendUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="m19 9-5 5-4-4-3 3"/>
    </svg>
  )
}

export default function CommissionsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<MemberCommissionsResponse | null>(null)
  const [details, setDetails] = useState<CommissionDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showDetails, setShowDetails] = useState(false)

  // Buscar resumo de comissões
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/members/me/commissions')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar comissões')
        const data = await res.json()
        setSummary(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [router])

  // Buscar detalhes quando expandir
  useEffect(() => {
    if (!showDetails) return
    
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/members/me/commissions/details?month=${selectedMonth}`)
        if (!res.ok) throw new Error('Erro ao carregar detalhes')
        const data = await res.json()
        setDetails(data)
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err)
      }
    }
    fetchDetails()
  }, [showDetails, selectedMonth])

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

  // Formatar mês (evita problemas de timezone)
  const formatMonth = (monthStr: string) => {
    const normalized = monthStr.substring(0, 7)
    const [year, month] = normalized.split('-').map(Number)
    const date = new Date(year, month - 1, 15)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Carregando suas comissões...</span>
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
        <h1 className={styles.title}>Minhas Comissões</h1>
      </header>

      {/* Balance Cards */}
      <div className={styles.balanceGrid}>
        {/* Disponível */}
        <div className={styles.balanceCardPrimary}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconGreen}`}>
              {Icons.dollar}
            </div>
            <span className={styles.balanceLabelPrimary}>Disponível</span>
          </div>
          <p className={styles.balanceValuePrimary}>
            {formatCurrency(summary?.balance.available ?? 0)}
          </p>
        </div>

        {/* Total Ganho */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconGray}`}>
              {Icons.trendUp}
            </div>
            <span className={styles.balanceLabel}>Total Ganho</span>
          </div>
          <p className={styles.balanceValue}>
            {formatCurrency(summary?.balance.total_earned ?? 0)}
          </p>
        </div>

        {/* Total Sacado */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconGray}`}>
              {Icons.wallet}
            </div>
            <span className={styles.balanceLabel}>Total Sacado</span>
          </div>
          <p className={styles.balanceValue}>
            {formatCurrency(summary?.balance.total_withdrawn ?? 0)}
          </p>
        </div>

        {/* Pendente */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={`${styles.balanceIcon} ${styles.balanceIconYellow}`}>
              {Icons.clock}
            </div>
            <span className={styles.balanceLabel}>Em Análise</span>
          </div>
          <p className={styles.balanceValue}>
            {formatCurrency(summary?.balance.pending ?? 0)}
          </p>
        </div>
      </div>

      {/* Month Card */}
      <div className={styles.monthCard}>
        <h2 className={styles.monthTitle}>Comissões do Mês Atual</h2>
        
        <div className={styles.monthGrid}>
          {/* Fast-Track */}
          <div className={`${styles.monthTypeCard} ${styles.monthTypeFastTrack}`}>
            <span className={`${styles.monthTypeLabel} ${styles.monthTypeLabelFastTrack}`}>Fast-Track</span>
            <p className={styles.monthTypeValue}>
              {formatCurrency(summary?.current_month.fast_track ?? 0)}
            </p>
          </div>

          {/* Perpétua */}
          <div className={`${styles.monthTypeCard} ${styles.monthTypePerpetual}`}>
            <span className={`${styles.monthTypeLabel} ${styles.monthTypeLabelPerpetual}`}>Perpétua</span>
            <p className={styles.monthTypeValue}>
              {formatCurrency(summary?.current_month.perpetual ?? 0)}
            </p>
          </div>

          {/* Bônus 3 */}
          <div className={`${styles.monthTypeCard} ${styles.monthTypeBonus3}`}>
            <span className={`${styles.monthTypeLabel} ${styles.monthTypeLabelBonus3}`}>Bônus 3</span>
            <p className={styles.monthTypeValue}>
              {formatCurrency(summary?.current_month.bonus_3 ?? 0)}
            </p>
          </div>

          {/* Leadership */}
          <div className={`${styles.monthTypeCard} ${styles.monthTypeLeadership}`}>
            <span className={`${styles.monthTypeLabel} ${styles.monthTypeLabelLeadership}`}>Leadership</span>
            <p className={styles.monthTypeValue}>
              {formatCurrency(summary?.current_month.leadership ?? 0)}
            </p>
          </div>

          {/* Royalty */}
          <div className={`${styles.monthTypeCard} ${styles.monthTypeRoyalty}`}>
            <span className={`${styles.monthTypeLabel} ${styles.monthTypeLabelRoyalty}`}>Royalty</span>
            <p className={styles.monthTypeValue}>
              {formatCurrency(summary?.current_month.royalty ?? 0)}
            </p>
          </div>
        </div>

        {/* Total do Mês */}
        <div className={styles.monthTotal}>
          <span className={styles.monthTotalLabel}>Total do Mês</span>
          <span className={styles.monthTotalValue}>
            {formatCurrency(summary?.current_month.total ?? 0)}
          </span>
        </div>
      </div>

      {/* Details Card */}
      <div className={styles.detailsCard}>
        <div className={styles.detailsHeader}>
          <h2 className={styles.detailsTitle}>Detalhes das Comissões</h2>
          <div className={styles.detailsControls}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.select}
            >
              {summary?.history?.map((h) => {
                const monthKey = h.month.substring(0, 7)
                return (
                  <option key={h.month} value={monthKey}>
                    {formatMonth(h.month)}
                  </option>
                )
              })}
              {(!summary?.history || summary.history.length === 0) && (
                <option value={selectedMonth}>
                  {formatMonth(selectedMonth)}
                </option>
              )}
            </select>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={styles.button}
            >
              {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </button>
          </div>
        </div>

        {showDetails && details && (
          <div>
            {details.commissions.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>{Icons.empty}</div>
                <p className={styles.emptyText}>Nenhuma comissão neste período</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Origem</th>
                    <th>CV Base</th>
                    <th>%</th>
                    <th>Valor</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {details.commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td>
                        <span className={`${styles.typeBadge} ${getTypeBadgeClass(commission.type)}`}>
                          {TYPE_LABELS[commission.type] || commission.type}
                        </span>
                      </td>
                      <td>
                        {commission.source_member_name || '-'}
                        {commission.source_order_number && (
                          <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '4px' }}>
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
                      <td style={{ fontSize: '0.8125rem', opacity: 0.7 }}>
                        {formatDate(commission.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Histórico Resumido */}
        {!showDetails && summary?.history && summary.history.length > 0 && (
          <div className={styles.historyList}>
            {summary.history.map((month) => {
              const monthKey = month.month.substring(0, 7)
              return (
                <div 
                  key={month.month}
                  className={styles.historyItem}
                  onClick={() => {
                    setSelectedMonth(monthKey)
                    setShowDetails(true)
                  }}
                >
                  <span className={styles.historyMonth}>
                    {formatMonth(month.month)}
                  </span>
                  <span className={styles.historyTotal}>
                    {formatCurrency(month.total)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {!showDetails && (!summary?.history || summary.history.length === 0) && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{Icons.empty}</div>
            <p className={styles.emptyText}>Nenhuma comissão registrada ainda</p>
            <p className={styles.emptySubtext}>
              As comissões aparecerão aqui quando você ou sua rede fizerem compras.
            </p>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>Tipos de Comissão</h3>
        <div className={styles.infoGrid}>
          <div className={`${styles.infoItem} ${styles.infoItemFastTrack}`}>
            <h4 className={`${styles.infoItemTitle} ${styles.infoItemTitleFastTrack}`}>Fast-Track</h4>
            <p className={styles.infoItemText}>
              30% nos primeiros 30 dias, 20% nos próximos 30 dias sobre compras de indicados diretos.
            </p>
          </div>
          <div className={`${styles.infoItem} ${styles.infoItemPerpetual}`}>
            <h4 className={`${styles.infoItemTitle} ${styles.infoItemTitlePerpetual}`}>Comissão Perpétua</h4>
            <p className={styles.infoItemText}>
              De 5% a 15% sobre compras da rede, dependendo do seu nível.
            </p>
          </div>
          <div className={`${styles.infoItem} ${styles.infoItemBonus3}`}>
            <h4 className={`${styles.infoItemTitle} ${styles.infoItemTitleBonus3}`}>Bônus 3</h4>
            <p className={styles.infoItemText}>
              R$250 a R$8.000 por formar redes de 3 parceiras ativas.
            </p>
          </div>
          <div className={`${styles.infoItem} ${styles.infoItemLeadership}`}>
            <h4 className={`${styles.infoItemTitle} ${styles.infoItemTitleLeadership}`}>Leadership Bônus</h4>
            <p className={styles.infoItemText}>
              3% (Diretora) ou 4% (Head) sobre CV da rede.
            </p>
          </div>
          <div className={`${styles.infoItem} ${styles.infoItemRoyalty}`}>
            <h4 className={`${styles.infoItemTitle} ${styles.infoItemTitleRoyalty}`}>Royalty</h4>
            <p className={styles.infoItemText}>
              3% sobre a rede de Heads que você formou.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
