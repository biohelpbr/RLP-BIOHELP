/**
 * Dashboard do Membro (/dashboard)
 * SPEC: Seção 5.1, 6.2 - Dashboard v1 mínimo
 * Sprint: 1
 * 
 * Exibe:
 * - Nome, e-mail, sponsor, ref_code
 * - Link de convite
 * - CTA para loja
 * 
 * NÃO exibe (fora do Sprint 1):
 * - CV
 * - Comissões
 * - Níveis
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import styles from './page.module.css'

// URL da loja Shopify (TBD-004 pendente - usar env var)
const STORE_URL = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://biohelp.com.br'

interface MemberData {
  id: string
  name: string
  email: string
  ref_code: string
  sponsor_name: string | null
  sponsor_ref_code: string | null
  status: string
  created_at: string
  shopify_sync_status: string | null
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isNewMember, setIsNewMember] = useState(false)

  // Verificar se é um novo membro (veio do cadastro)
  useEffect(() => {
    const newParam = searchParams.get('new')
    if (newParam === '1') {
      setIsNewMember(true)
    }
  }, [searchParams])

  // Buscar dados do membro
  useEffect(() => {
    async function fetchMember() {
      try {
        const response = await fetch('/api/members/me')
        
        if (!response.ok) {
          if (response.status === 401) {
            // Não autenticado - redirecionar para login
            router.push('/login')
            return
          }
          throw new Error('Erro ao carregar dados')
        }
        
        const data = await response.json()
        setMember(data.member)
      } catch (err) {
        console.error('Fetch member error:', err)
        setError('Não foi possível carregar seus dados. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [router])

  // Gerar link de convite
  const inviteLink = member 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${member.ref_code}`
    : ''

  // Copiar link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // Ir para loja
  const handleGoToStore = () => {
    window.open(STORE_URL, '_blank')
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!member) {
    return null
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🌿</span>
            <span className={styles.logoText}>Biohelp</span>
          </div>
          <nav className={styles.nav}>
            <a href="/login" className={styles.logoutLink}>Sair</a>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {/* Boas-vindas para novo membro */}
        {isNewMember && (
          <div className={`${styles.welcomeBanner} animate-fade-in`}>
            <span className={styles.welcomeIcon}>🎉</span>
            <div>
              <strong>Bem-vindo(a) ao programa!</strong>
              <p>Sua conta foi criada com sucesso. Agora você tem acesso a benefícios exclusivos.</p>
            </div>
          </div>
        )}

        {/* Greeting */}
        <div className={styles.greeting}>
          <h1>Olá, {member.name.split(' ')[0]}!</h1>
          <p className={styles.greetingSubtitle}>
            Seu painel de membro Biohelp
          </p>
        </div>

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {/* Card: Dados do membro */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>👤</span>
                Seus dados
              </h2>
            </div>
            <div className={styles.cardBody}>
              <dl className={styles.dataList}>
                <div className={styles.dataItem}>
                  <dt>Nome</dt>
                  <dd>{member.name}</dd>
                </div>
                <div className={styles.dataItem}>
                  <dt>E-mail</dt>
                  <dd>{member.email}</dd>
                </div>
                <div className={styles.dataItem}>
                  <dt>Quem te indicou</dt>
                  <dd>
                    {member.sponsor_name ? (
                      <>
                        {member.sponsor_name}
                        <span className={styles.sponsorCode}>({member.sponsor_ref_code})</span>
                      </>
                    ) : (
                      <span className={styles.noSponsor}>Sem indicação</span>
                    )}
                  </dd>
                </div>
                <div className={styles.dataItem}>
                  <dt>Membro desde</dt>
                  <dd>{new Date(member.created_at).toLocaleDateString('pt-BR')}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Card: Link de convite */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🔗</span>
                Seu link de convite
              </h2>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardDescription}>
                Compartilhe este link com amigos e familiares para convidá-los a fazer parte do programa.
              </p>
              
              <div className={styles.inviteLinkBox}>
                <code className={styles.inviteLink}>{inviteLink}</code>
                <button 
                  onClick={handleCopyLink}
                  className={`btn btn-secondary ${styles.copyBtn}`}
                  aria-label="Copiar link"
                >
                  {copied ? (
                    <>
                      <span>✓</span> Copiado!
                    </>
                  ) : (
                    <>
                      <span>📋</span> Copiar
                    </>
                  )}
                </button>
              </div>

              <div className={styles.refCodeBadge}>
                <span>Seu código:</span>
                <strong>{member.ref_code}</strong>
              </div>
            </div>
          </div>

          {/* Card: CTA Loja */}
          <div className={`${styles.card} ${styles.cardHighlight}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🛒</span>
                Compre como membro
              </h2>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardDescription}>
                Aproveite preços exclusivos na nossa loja. Faça login com o mesmo e-mail 
                que você usou aqui para desbloquear os benefícios.
              </p>
              
              <button 
                onClick={handleGoToStore}
                className={`btn btn-primary ${styles.storeBtn}`}
              >
                <span>🛍️</span>
                Ir para a loja
              </button>
              
              <p className={styles.storeNote}>
                Dica: Use o e-mail <strong>{member.email}</strong> para fazer login na loja
              </p>
            </div>
          </div>
        </div>

        {/* Status de sync (debug - apenas se failed) */}
        {member.shopify_sync_status === 'failed' && (
          <div className={styles.syncWarning}>
            <span>⚠️</span>
            <p>
              Houve um problema ao sincronizar sua conta com a loja. 
              Entre em contato com o suporte se os benefícios não aparecerem.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Biohelp © {new Date().getFullYear()} — Programa de Fidelidade</p>
      </footer>
    </div>
  )
}

// Loading fallback
function DashboardLoading() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.spinner} />
      <p>Carregando...</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}

