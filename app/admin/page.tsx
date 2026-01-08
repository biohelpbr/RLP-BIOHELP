/**
 * Painel Admin
 * SPEC: Seção 6.6 - GET /admin
 * Design: Clean, sem emojis, baseado no frontend Biohelp
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  shopify_sync?: {
    last_sync_status: string | null
    last_sync_at: string | null
    last_sync_error: string | null
  } | null
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
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
}

export default function AdminPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [search])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

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

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'ok':
      case 'synced':
        return (
          <span className={`${styles.statusBadge} ${styles.statusSynced}`}>
            {Icons.check}
            <span>Sincronizado</span>
          </span>
        )
      case 'pending':
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            {Icons.clock}
            <span>Pendente</span>
          </span>
        )
      case 'failed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusFailed}`}>
            {Icons.alert}
            <span>Falhou</span>
          </span>
        )
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            {Icons.clock}
            <span>Pendente</span>
          </span>
        )
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
            <h1>Parceiras</h1>
            <p>{members.length} membros cadastrados</p>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <div className={styles.searchIcon}>{Icons.search}</div>
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
              <div className={styles.emptyIcon}>{Icons.users}</div>
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
                      <Link href={`/admin/members/${member.id}`} className={styles.memberName}>
                        {member.name}
                      </Link>
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
                        <span className={styles.noSponsor}>—</span>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(member.shopify_sync?.last_sync_status)}
                      {member.shopify_sync?.last_sync_error && (
                        <span title={member.shopify_sync.last_sync_error} className={styles.errorInfo}>
                          {Icons.info}
                        </span>
                      )}
                    </td>
                    <td>{formatDate(member.created_at)}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <Link href={`/admin/members/${member.id}`} className={styles.viewBtn}>
                          {Icons.eye}
                          <span>CV</span>
                        </Link>
                        <button
                          className={styles.resyncBtn}
                          onClick={() => handleResync(member.id)}
                          disabled={syncingId === member.id}
                        >
                          <span className={syncingId === member.id ? styles.spinning : ''}>
                            {Icons.refresh}
                          </span>
                          <span>Resync</span>
                        </button>
                      </div>
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
