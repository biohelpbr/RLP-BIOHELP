'use client'

/**
 * Página Minha Rede - Sprint 3
 * 
 * Exibe a rede do membro com:
 * - Estatísticas da rede
 * - Árvore visual (NetworkTree)
 * - Card de nível (LevelCard)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberNetworkResponse } from '@/types/database'
import NetworkTree from '@/app/components/NetworkTree'
import LevelCard from '@/app/components/LevelCard'
import styles from './page.module.css'

export default function NetworkPage() {
  const router = useRouter()
  const [data, setData] = useState<MemberNetworkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNetworkData()
  }, [])

  const fetchNetworkData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members/me/network')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar dados da rede')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Carregando sua rede...</span>
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
          <button onClick={fetchNetworkData} className={styles.retryButton}>
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
          ← Voltar
        </button>
        <h1 className={styles.title}>Minha Rede</h1>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.stats.total_members}</span>
            <span className={styles.statLabel}>Total na Rede</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.stats.active_members}</span>
            <span className={styles.statLabel}>Ativos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>📊</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.member.cv_rede.toLocaleString()}</span>
            <span className={styles.statLabel}>CV da Rede</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{data.member.cv_pessoal}</span>
            <span className={styles.statLabel}>CV Pessoal</span>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className={styles.mainGrid}>
        {/* Coluna esquerda - Nível */}
        <div className={styles.sideColumn}>
          <LevelCard />
          
          {/* Resumo por nível */}
          <div className={styles.levelSummary}>
            <h3 className={styles.sectionTitle}>Por Nível de Profundidade</h3>
            {Object.entries(data.stats.by_level).map(([depth, stats]) => (
              <div key={depth} className={styles.levelRow}>
                <span className={styles.levelDepth}>N{depth}</span>
                <div className={styles.levelBar}>
                  <div 
                    className={styles.levelBarActive}
                    style={{ 
                      width: stats.total > 0 
                        ? `${(stats.active / stats.total) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
                <span className={styles.levelCount}>
                  {stats.active}/{stats.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna principal - Árvore */}
        <div className={styles.mainColumn}>
          <h2 className={styles.sectionTitle}>Árvore da Rede</h2>
          
          {data.network.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🌱</span>
              <h3>Sua rede está começando!</h3>
              <p>
                Compartilhe seu link de indicação para começar a construir sua rede.
              </p>
            </div>
          ) : (
            <NetworkTree
              network={data.network}
              rootMemberId={data.member.id}
              rootMemberName={data.member.name}
            />
          )}
        </div>
      </div>
    </div>
  )
}

