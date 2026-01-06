/**
 * Painel Admin
 * SPEC: Seção 6.6 - GET /admin
 * Design: Estilo roxo/violeta com sidebar
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Member {
  id: string
  name: string
  email: string
  ref_code: string
  status: string
  created_at: string
  sponsor?: {
    name: string
    ref_code: string
  }
  shopify_sync_status?: string
  shopify_error?: string
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [search])

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      
      const response = await fetch(`/api/admin/members?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResync = async (memberId: string) => {
    setSyncingId(memberId)
    try {
      const response = await fetch(`/api/admin/members/${memberId}/resync-shopify`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchMembers()
      }
    } catch (error) {
      console.error('Erro ao resync:', error)
    } finally {
      setSyncingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'synced':
        return <span className={`${styles.statusBadge} ${styles.statusSynced}`}>Sincronizado</span>
      case 'pending':
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pendente</span>
      case 'failed':
        return <span className={`${styles.statusBadge} ${styles.statusFailed}`}>Falhou</span>
      default:
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pendente</span>
    }
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
            <li className={`${styles.navItem} ${styles.navItemActive}`}>
              <Link href="/admin">
                <span className={styles.navIcon}>👥</span>
                <span>Parceiras</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>🔗</span>
                <span>Rede</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>📦</span>
                <span>Produtos</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/admin">
                <span className={styles.navIcon}>⚙️</span>
                <span>Configurações</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/">
                <span className={styles.navIcon}>🚪</span>
                <span>Sair</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Parceiras</h1>
            <p>{members.length} membros cadastrados</p>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por e-mail, nome ou ref_code..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          {isLoading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : members.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>Nenhum membro encontrado</h3>
              <p>Os membros cadastrados aparecerão aqui.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Ref Code</th>
                  <th>Sponsor</th>
                  <th>Shopify</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <span className={styles.memberName}>{member.name}</span>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <code className={styles.refCode}>{member.ref_code}</code>
                    </td>
                    <td>
                      {member.sponsor ? (
                        <div className={styles.sponsorInfo}>
                          <span className={styles.sponsorName}>{member.sponsor.name}</span>
                          <span className={styles.sponsorCode}>{member.sponsor.ref_code}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(member.shopify_sync_status)}
                      {member.shopify_error && (
                        <span title={member.shopify_error} style={{ cursor: 'help', marginLeft: '4px' }}>
                          ⓘ
                        </span>
                      )}
                    </td>
                    <td>{formatDate(member.created_at)}</td>
                    <td>
                      <button
                        className={styles.resyncBtn}
                        onClick={() => handleResync(member.id)}
                        disabled={syncingId === member.id}
                      >
                        {syncingId === member.id ? '⏳' : '🔄'} Resync
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
