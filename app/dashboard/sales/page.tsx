/**
 * Página de Vendas do Membro
 * SPEC: Seção 13.5, 13.6, 14.4
 * SDD: docs/sdd/features/sales-page/
 * 
 * Exibe pedidos próprios e vendas da rede (N1)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

interface OrderItem {
  id: string
  title: string
  quantity: number
  price: number
  cv_value: number
}

interface OrderRecord {
  id: string
  shopify_order_id: string
  shopify_order_number: string
  customer_email: string
  total_amount: number
  total_cv: number
  currency: string
  status: string
  paid_at: string | null
  created_at: string
  items: OrderItem[]
}

interface NetworkOrder extends OrderRecord {
  member_name: string
  member_ref_code: string
}

interface OrdersData {
  summary: {
    own: {
      totalOrders: number
      totalCV: number
      totalAmount: number
    }
    network: {
      totalOrders: number
      totalCV: number
      totalAmount: number
      totalMembers: number
    }
  }
  ownOrders: OrderRecord[]
  networkOrders: NetworkOrder[]
}

// Ícones SVG
const Icons = {
  shoppingBag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  trendUp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
}

export default function SalesPage() {
  const router = useRouter()
  const [data, setData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'own' | 'network'>('own')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/members/me/orders')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar vendas')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [router])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'refunded': return 'Reembolsado'
      case 'cancelled': return 'Cancelado'
      default: return 'Pendente'
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid': return styles.statusPaid
      case 'refunded': return styles.statusRefunded
      case 'cancelled': return styles.statusCancelled
      default: return styles.statusPending
    }
  }

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'paid': return styles.statusDotPaid
      case 'refunded': return styles.statusDotRefunded
      case 'cancelled': return styles.statusDotCancelled
      default: return styles.statusDotPending
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Carregando suas vendas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>!</span>
          <span>{error}</span>
          <Link href="/dashboard" className={styles.retryButton}>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const ownOrders = data?.ownOrders || []
  const networkOrders = data?.networkOrders || []

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backButton}>
          &larr; Voltar
        </Link>
        <h1 className={styles.title}>Minhas Vendas</h1>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {/* Total Pedidos */}
        <div className={styles.summaryCardPrimary}>
          <div className={styles.summaryHeader}>
            <div className={`${styles.summaryIcon} ${styles.summaryIconPurple}`}>
              {Icons.shoppingBag}
            </div>
            <span className={styles.summaryLabelPrimary}>Total de Pedidos</span>
          </div>
          <p className={styles.summaryValuePrimary}>
            {(summary?.own.totalOrders || 0) + (summary?.network.totalOrders || 0)}
          </p>
          <p className={styles.summarySubtext}>
            {summary?.own.totalOrders || 0} próprios + {summary?.network.totalOrders || 0} da rede
          </p>
        </div>

        {/* CV Total */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}>
              {Icons.trendUp}
            </div>
            <span className={styles.summaryLabel}>CV Total Gerado</span>
          </div>
          <p className={styles.summaryValue}>
            {((summary?.own.totalCV || 0) + (summary?.network.totalCV || 0)).toFixed(0)}
          </p>
          <p className={styles.summarySubtext}>
            {(summary?.own.totalCV || 0).toFixed(0)} próprio + {(summary?.network.totalCV || 0).toFixed(0)} rede
          </p>
        </div>

        {/* Rede */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={`${styles.summaryIcon} ${styles.summaryIconBlue}`}>
              {Icons.users}
            </div>
            <span className={styles.summaryLabel}>Rede (N1)</span>
          </div>
          <p className={styles.summaryValue}>
            {summary?.network.totalMembers || 0}
          </p>
          <p className={styles.summarySubtext}>
            indicados diretos com pedidos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'own' ? styles.tabActive : ''}`}
          onClick={() => { setActiveTab('own'); setExpandedOrder(null) }}
        >
          Minhas Compras
          <span className={styles.tabBadge}>{ownOrders.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'network' ? styles.tabActive : ''}`}
          onClick={() => { setActiveTab('network'); setExpandedOrder(null) }}
        >
          Vendas da Rede
          <span className={styles.tabBadge}>{networkOrders.length}</span>
        </button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {activeTab === 'own' ? (
          ownOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>{Icons.empty}</div>
              <p className={styles.emptyText}>Nenhum pedido encontrado</p>
              <p className={styles.emptySubtext}>
                Quando você fizer compras na loja, elas aparecerão aqui com detalhes de CV.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 24 }}></th>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Itens</th>
                  <th>Valor</th>
                  <th>CV</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ownOrders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className={styles.tableRowClickable}
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td>
                        <span className={`${styles.expandArrow} ${expandedOrder === order.id ? styles.expandArrowOpen : ''}`}>
                          {Icons.chevronRight}
                        </span>
                      </td>
                      <td>
                        <span className={styles.orderNumber}>
                          #{order.shopify_order_number || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.date}>
                          {formatDate(order.paid_at || order.created_at)}
                        </span>
                      </td>
                      <td>{order.items.length} item(ns)</td>
                      <td>
                        <span className={styles.amount}>
                          {formatCurrency(order.total_amount)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.cvValue}>
                          {(order.total_cv || 0).toFixed(0)} CV
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                          <span className={`${styles.statusDot} ${getStatusDotClass(order.status)}`} />
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                    {expandedOrder === order.id && order.items.length > 0 && (
                      <tr key={`${order.id}-items`} className={styles.itemsRow}>
                        <td colSpan={7}>
                          <div className={styles.itemsContainer}>
                            <div className={styles.itemsList}>
                              {order.items.map((item) => (
                                <div key={item.id} className={styles.itemRow}>
                                  <span className={styles.itemTitle}>{item.title}</span>
                                  <span className={styles.itemQty}>x{item.quantity}</span>
                                  <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
                                  <span className={styles.itemCV}>{(item.cv_value || 0).toFixed(0)} CV</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )
        ) : (
          networkOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>{Icons.users}</div>
              <p className={styles.emptyText}>Nenhuma venda na sua rede</p>
              <p className={styles.emptySubtext}>
                Quando seus indicados fizerem compras, as vendas aparecerão aqui.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 24 }}></th>
                  <th>Membro</th>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>CV</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {networkOrders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className={styles.tableRowClickable}
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td>
                        <span className={`${styles.expandArrow} ${expandedOrder === order.id ? styles.expandArrowOpen : ''}`}>
                          {Icons.chevronRight}
                        </span>
                      </td>
                      <td>
                        <span className={styles.memberName}>
                          {order.member_name}
                        </span>
                        <span className={styles.memberRef}>
                          ({order.member_ref_code})
                        </span>
                      </td>
                      <td>
                        <span className={styles.orderNumber}>
                          #{order.shopify_order_number || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.date}>
                          {formatDate(order.paid_at || order.created_at)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.amount}>
                          {formatCurrency(order.total_amount)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.cvValue}>
                          {(order.total_cv || 0).toFixed(0)} CV
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                          <span className={`${styles.statusDot} ${getStatusDotClass(order.status)}`} />
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                    {expandedOrder === order.id && order.items.length > 0 && (
                      <tr key={`${order.id}-items`} className={styles.itemsRow}>
                        <td colSpan={7}>
                          <div className={styles.itemsContainer}>
                            <div className={styles.itemsList}>
                              {order.items.map((item) => (
                                <div key={item.id} className={styles.itemRow}>
                                  <span className={styles.itemTitle}>{item.title}</span>
                                  <span className={styles.itemQty}>x{item.quantity}</span>
                                  <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
                                  <span className={styles.itemCV}>{(item.cv_value || 0).toFixed(0)} CV</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
