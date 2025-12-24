/**
 * Página Admin (/admin)
 * SPEC: Seção 5.3, 6.3 - Admin lista/busca membros
 * Sprint: 1
 * 
 * Funcionalidades:
 * - Lista de membros com paginação
 * - Busca por email/ref_code
 * - Ver sponsor
 * - Resync Shopify
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Member {
  id: string
  name: string
  email: string
  ref_code: string
  status: string
  created_at: string
  sponsor: {
    id: string
    name: string
    ref_code: string
  } | null
  shopify_sync: {
    last_sync_status: string
    last_sync_at: string | null
    last_sync_error: string | null
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resyncingId, setResyncingId] = useState<string | null>(null)

  // Buscar membros
  const fetchMembers = useCallback(async (page = 1, searchQuery = '') => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/admin/members?${params}`)
      
      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar membros')
      }

      const data = await response.json()
      setMembers(data.members)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Não foi possível carregar os membros')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Carregar membros inicialmente
  useEffect(() => {
    // Setar cookie de admin para testes (TODO: substituir por auth real)
    document.cookie = 'is_admin=true; path=/'
    fetchMembers()
  }, [fetchMembers])

  // Buscar com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers(1, search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchMembers])

  // Resync Shopify
  const handleResync = async (memberId: string) => {
    setResyncingId(memberId)
    
    try {
      const response = await fetch(`/api/admin/members/${memberId}/resync-shopify`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.ok) {
        // Recarregar lista para ver novo status
        fetchMembers(pagination.page, search)
        alert('Sync realizado com sucesso!')
      } else {
        alert(`Sync falhou: ${data.error || data.message}`)
      }
    } catch (err) {
      console.error('Resync error:', err)
      alert('Erro ao executar sync')
    } finally {
      setResyncingId(null)
    }
  }

  // Status badge
  const getSyncStatusBadge = (sync: Member['shopify_sync']) => {
    if (!sync) return <span className={styles.badgePending}>Pendente</span>
    
    switch (sync.last_sync_status) {
      case 'ok':
        return <span className={styles.badgeSuccess}>OK</span>
      case 'failed':
        return <span className={styles.badgeError}>Falhou</span>
      default:
        return <span className={styles.badgePending}>Pendente</span>
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🌿</span>
            <span className={styles.logoText}>Biohelp Admin</span>
          </div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navLink}>Sair</a>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>Membros</h1>
          <p className={styles.subtitle}>
            {pagination.total} membro{pagination.total !== 1 ? 's' : ''} cadastrado{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Busca */}
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por e-mail, nome ou ref_code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className={styles.clearBtn}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className={styles.errorBox}>
            {error}
            <button onClick={() => fetchMembers(pagination.page, search)}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <span>Carregando...</span>
          </div>
        )}

        {/* Tabela */}
        {!loading && !error && (
          <>
            <div className={styles.tableWrapper}>
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
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyRow}>
                        {search ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td className={styles.nameCell}>
                          <strong>{member.name}</strong>
                        </td>
                        <td>{member.email}</td>
                        <td>
                          <code className={styles.refCode}>{member.ref_code}</code>
                        </td>
                        <td>
                          {member.sponsor ? (
                            <span className={styles.sponsorInfo}>
                              {member.sponsor.name}
                              <code>{member.sponsor.ref_code}</code>
                            </span>
                          ) : (
                            <span className={styles.noSponsor}>—</span>
                          )}
                        </td>
                        <td>
                          {getSyncStatusBadge(member.shopify_sync)}
                          {member.shopify_sync?.last_sync_error && (
                            <span 
                              className={styles.errorHint}
                              title={member.shopify_sync.last_sync_error}
                            >
                              ⓘ
                            </span>
                          )}
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <button
                            onClick={() => handleResync(member.id)}
                            disabled={resyncingId === member.id}
                            className={styles.resyncBtn}
                            title="Resync Shopify"
                          >
                            {resyncingId === member.id ? (
                              <span className={styles.miniSpinner} />
                            ) : (
                              '🔄'
                            )}
                            Resync
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => fetchMembers(pagination.page - 1, search)}
                  disabled={pagination.page <= 1}
                  className={styles.pageBtn}
                >
                  ← Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchMembers(pagination.page + 1, search)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={styles.pageBtn}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

