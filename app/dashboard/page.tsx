/**
 * Dashboard do Membro
 * SPEC: Seção 5.1, 6.2 - GET /dashboard
 * Sprint: 1
 * 
 * Página protegida - requer autenticação via Supabase Auth
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface MemberData {
  id: string
  name: string
  email: string
  ref_code: string
  status: string
  sponsor?: {
    name: string
    ref_code: string
  }
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [member, setMember] = useState<MemberData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchMemberData()
  }, [])

  const fetchMemberData = async () => {
    try {
      const response = await fetch('/api/members/me')
      if (response.ok) {
        const data = await response.json()
        setMember(data.member)
      } else if (response.status === 401) {
        // Não autenticado - redireciona para login
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getInviteLink = () => {
    if (typeof window === 'undefined' || !member) return ''
    return `${window.location.origin}/join?ref=${member.ref_code}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  if (isLoading) {
    return <div className={styles.loading}>Carregando...</div>
  }

  // Dados de demonstração se não houver membro
  const displayMember = member || {
    id: 'demo',
    name: 'Marina Silva',
    email: 'marina@exemplo.com',
    ref_code: 'MARINA123',
    status: 'active',
    sponsor: { name: 'João Sponsor', ref_code: 'JOAO1' },
    created_at: new Date().toISOString()
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.logoIcon}>B</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Biohelp</span>
              <span className={styles.logoSubtitle}>Nutrition Club</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={`${styles.navItem} ${styles.navItemActive}`}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>📊</span>
                <span>Visão Geral</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>👥</span>
                <span>Minha Rede</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>🛒</span>
                <span>Vendas</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>👤</span>
                <span>Meu Perfil</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {getInitials(displayMember.name)}
          </div>
          <div className={styles.headerInfo}>
            <h1>
              Oi, {displayMember.name.split(' ')[0]}!
              <span>👋</span>
            </h1>
            <span className={styles.badge}>
              <span className={styles.badgeDot}></span>
              Parceira
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Status de Ativação</span>
              <span className={styles.statIcon}>⚡</span>
            </div>
            <div className={styles.statValue}>Ativa</div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardPurple}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Indicados</span>
              <span className={styles.statIcon}>👥</span>
            </div>
            <div className={styles.statValue}>0</div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardYellow}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Meu Código</span>
              <span className={styles.statIcon}>🔗</span>
            </div>
            <div className={styles.statValue}>{displayMember.ref_code}</div>
          </div>
        </div>

        {/* Invite Card */}
        <div className={styles.inviteCard}>
          <h2 className={styles.inviteTitle}>Link de convite</h2>
          
          <div className={styles.inviteLinkWrapper}>
            <div className={styles.inviteLink}>
              {getInviteLink() || `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${displayMember.ref_code}`}
            </div>
            <button onClick={copyToClipboard} className={styles.copyBtn}>
              {copied ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </div>

          <a 
            href={process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.shopBtn}
          >
            🛍️ Ir para a loja
          </a>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Meus Dados</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Nome</span>
              <span className={styles.infoValue}>{displayMember.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValue}>{displayMember.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={styles.infoValue}>
                {displayMember.status === 'active' ? '✅ Ativo' : '⏳ Pendente'}
              </span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Meu Sponsor</h3>
            {displayMember.sponsor ? (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Nome</span>
                  <span className={styles.infoValue}>{displayMember.sponsor.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Código</span>
                  <span className={styles.infoValue}>{displayMember.sponsor.ref_code}</span>
                </div>
              </>
            ) : (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Sem sponsor</span>
                <span className={styles.infoValue}>—</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
