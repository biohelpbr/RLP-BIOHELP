/**
 * Dashboard do Membro
 * SPEC: Seção 5.1, 6.2 - GET /dashboard
 * Sprint: 1 + 2 (CV)
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

interface CVData {
  currentMonth: {
    month: string
    cv: number
    target: number
    remaining: number
    status: string
    percentage: number
  }
  // FR-17: CV separado (próprio vs rede)
  network?: {
    ownCV: number
    networkCV: number
    totalCV: number
    activeRecruits: number
  }
  history: Array<{
    month: string
    cv: number
    status: string
    ordersCount: number
  }>
}

// Ícones SVG
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
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
  shoppingBag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  externalLink: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
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
  dollarSign: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  gift: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
}

// Interface para creatina grátis (TBD-019: Cupom Individual)
interface FreeCreatineData {
  eligible: boolean
  reason: string
  month: string
  alreadyClaimed: boolean
  memberStatus: string
  currentCV: number
  couponCode: string | null
  benefit: {
    name: string
    description: string
    howToUse: string
    previewCode?: string | null
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [member, setMember] = useState<MemberData | null>(null)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [freeCreatine, setFreeCreatine] = useState<FreeCreatineData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchMemberData()
    fetchCVData()
    fetchFreeCreatine()
  }, [])

  const fetchMemberData = async () => {
    try {
      const response = await fetch('/api/members/me')
      if (response.ok) {
        const data = await response.json()
        setMember(data.member)
        
        // Verificar se é admin e redirecionar automaticamente
        if (data.isAdmin) {
          setIsAdmin(true)
          router.push('/admin')
          return
        }
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

  const fetchCVData = async () => {
    try {
      const response = await fetch('/api/members/me/cv')
      if (response.ok) {
        const data = await response.json()
        setCvData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar CV:', error)
    }
  }

  const fetchFreeCreatine = async () => {
    try {
      const response = await fetch('/api/members/me/free-creatine')
      if (response.ok) {
        const data = await response.json()
        setFreeCreatine(data)
      }
    } catch (error) {
      console.error('Erro ao carregar benefício:', error)
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

  const formatMonth = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(month) - 1]}/${year}`
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa'
      case 'inactive': return 'Inativa'
      default: return 'Pendente'
    }
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

  // CV padrão se não houver dados
  const displayCV = cvData || {
    currentMonth: {
      month: new Date().toISOString().slice(0, 7),
      cv: 0,
      target: 200,
      remaining: 200,
      status: 'pending',
      percentage: 0
    },
    history: []
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
                <span className={styles.navIcon}>{Icons.dashboard}</span>
                <span>Visão Geral</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard/network">
                <span className={styles.navIcon}>{Icons.users}</span>
                <span>Minha Rede</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard/commissions">
                <span className={styles.navIcon}>{Icons.dollarSign}</span>
                <span>Comissões</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>{Icons.shoppingBag}</span>
                <span>Vendas</span>
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/dashboard">
                <span className={styles.navIcon}>{Icons.user}</span>
                <span>Meu Perfil</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>{Icons.logout}</span>
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
            <h1>Oi, {displayMember.name.split(' ')[0]}!</h1>
            <span className={styles.badge}>
              <span className={styles.badgeDot}></span>
              Parceira
            </span>
          </div>
        </div>

        {/* CV Progress Card - Sprint 2 + Sprint 7 (FR-17) */}
        <div className={styles.cvCard}>
          <div className={styles.cvHeader}>
            <div>
              <h2 className={styles.cvTitle}>Meu CV do Mês</h2>
              <p className={styles.cvSubtitle}>{formatMonth(displayCV.currentMonth.month)}</p>
            </div>
            <div className={styles.cvTarget}>
              <span className={styles.cvTargetLabel}>Meta</span>
              <span className={styles.cvTargetValue}>{displayCV.currentMonth.target} CV</span>
            </div>
          </div>
          
          <div className={styles.cvProgress}>
            <div className={styles.cvProgressHeader}>
              <span className={styles.cvCurrent}>{displayCV.currentMonth.cv.toFixed(0)} CV</span>
              <span className={styles.cvPercentage}>{displayCV.currentMonth.percentage.toFixed(0)}%</span>
            </div>
            <div className={styles.cvProgressBar}>
              <div 
                className={styles.cvProgressFill} 
                style={{ width: `${Math.min(displayCV.currentMonth.percentage, 100)}%` }}
              />
            </div>
            {displayCV.currentMonth.remaining > 0 && (
              <p className={styles.cvRemaining}>
                Faltam <strong>{displayCV.currentMonth.remaining.toFixed(0)} CV</strong> para ativar
              </p>
            )}
            {displayCV.currentMonth.percentage >= 100 && (
              <p className={styles.cvComplete}>
                {Icons.check} Meta atingida! Você está ativa este mês.
              </p>
            )}
          </div>
        </div>

        {/* CV da Rede - Sprint 7 (FR-17) */}
        {displayCV.network && (
          <div className={styles.networkCVCard}>
            <h3 className={styles.networkCVTitle}>CV da Minha Rede</h3>
            <div className={styles.networkCVGrid}>
              <div className={styles.networkCVItem}>
                <span className={styles.networkCVLabel}>Meu CV</span>
                <span className={styles.networkCVValue}>{displayCV.network.ownCV.toFixed(0)}</span>
              </div>
              <div className={styles.networkCVItem}>
                <span className={styles.networkCVLabel}>CV da Rede</span>
                <span className={styles.networkCVValue}>{displayCV.network.networkCV.toFixed(0)}</span>
              </div>
              <div className={styles.networkCVItem}>
                <span className={styles.networkCVLabel}>CV Total</span>
                <span className={styles.networkCVValueHighlight}>{displayCV.network.totalCV.toFixed(0)}</span>
              </div>
              <div className={styles.networkCVItem}>
                <span className={styles.networkCVLabel}>Indicados Ativos</span>
                <span className={styles.networkCVValue}>{displayCV.network.activeRecruits}</span>
              </div>
            </div>
          </div>
        )}

        {/* Creatina Grátis - Sprint 7 (TBD-019: Cupom Individual Mensal) */}
        {freeCreatine && (
          <div className={`${styles.benefitCard} ${freeCreatine.eligible ? styles.benefitCardEligible : freeCreatine.alreadyClaimed ? styles.benefitCardClaimed : styles.benefitCardIneligible}`}>
            <div className={styles.benefitIcon}>
              {Icons.gift}
            </div>
            <div className={styles.benefitContent}>
              <h3 className={styles.benefitTitle}>Creatina Grátis do Mês</h3>
              {freeCreatine.couponCode ? (
                <>
                  <p className={styles.benefitStatus}>Seu cupom está pronto!</p>
                  <div className={styles.couponCodeWrapper}>
                    <code className={styles.couponCode}>{freeCreatine.couponCode}</code>
                    <button 
                      onClick={async () => {
                        if (freeCreatine.couponCode) {
                          await navigator.clipboard.writeText(freeCreatine.couponCode)
                        }
                      }}
                      className={styles.couponCopyBtn}
                      title="Copiar cupom"
                    >
                      {Icons.copy}
                    </button>
                  </div>
                  <p className={styles.benefitDescription}>
                    Use este cupom no checkout da loja para obter sua creatina grátis. 
                    Válido para 1 uso neste mês.
                  </p>
                </>
              ) : freeCreatine.eligible ? (
                <>
                  <p className={styles.benefitStatus}>Disponível!</p>
                  <p className={styles.benefitDescription}>
                    Você tem direito a 1 unidade de creatina grátis este mês. 
                    Seu cupom está sendo gerado...
                  </p>
                </>
              ) : freeCreatine.alreadyClaimed ? (
                <>
                  <p className={styles.benefitStatusUsed}>Já utilizado</p>
                  <p className={styles.benefitDescription}>
                    Você já utilizou sua creatina grátis em {formatMonth(freeCreatine.month)}. 
                    O benefício renova no próximo mês!
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.benefitStatusInactive}>Indisponível</p>
                  <p className={styles.benefitDescription}>
                    {freeCreatine.reason}. Atinja 200 CV para desbloquear este benefício!
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${displayCV.currentMonth.status === 'active' ? styles.statCardGreen : styles.statCardYellow}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Status de Ativação</span>
              <span className={styles.statIcon}>{Icons.zap}</span>
            </div>
            <div className={styles.statValue}>{getStatusLabel(displayCV.currentMonth.status)}</div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardPurple}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>CV Acumulado</span>
              <span className={styles.statIcon}>{Icons.trendingUp}</span>
            </div>
            <div className={styles.statValue}>{displayCV.currentMonth.cv.toFixed(0)}</div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Meu Código</span>
              <span className={styles.statIcon}>{Icons.link}</span>
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
              {copied ? Icons.check : Icons.copy}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <a 
            href={process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.shopBtn}
          >
            {Icons.externalLink}
            <span>Ir para a loja</span>
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
              <span className={`${styles.infoValue} ${styles.statusBadge} ${displayCV.currentMonth.status === 'active' ? styles.statusActive : styles.statusPending}`}>
                {displayCV.currentMonth.status === 'active' ? (
                  <>{Icons.check} Ativo</>
                ) : (
                  <>{Icons.clock} Pendente</>
                )}
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

        {/* CV History - Sprint 2 */}
        {displayCV.history.length > 0 && (
          <div className={styles.historyCard}>
            <h3 className={styles.historyTitle}>Histórico de CV</h3>
            <div className={styles.historyTable}>
              <div className={styles.historyHeader}>
                <span>Mês</span>
                <span>CV</span>
                <span>Pedidos</span>
                <span>Status</span>
              </div>
              {displayCV.history.map((item, index) => (
                <div key={index} className={styles.historyRow}>
                  <span>{formatMonth(item.month)}</span>
                  <span className={styles.historyCV}>{item.cv.toFixed(0)}</span>
                  <span>{item.ordersCount}</span>
                  <span className={`${styles.historyStatus} ${item.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
