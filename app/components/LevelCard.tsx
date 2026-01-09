'use client'

/**
 * Componente LevelCard - Sprint 3
 * 
 * Exibe o nível atual do membro e progresso para o próximo nível
 */

import { useState, useEffect } from 'react'
import type { MemberLevelResponse, MemberLevel, LevelRequirement } from '@/types/database'
import styles from './LevelCard.module.css'

interface LevelCardProps {
  compact?: boolean
}

// Cores por nível de liderança
const LEVEL_COLORS: Record<MemberLevel, string> = {
  membro: '#6b7280',
  parceira: '#10b981',
  lider_formacao: '#f59e0b',
  lider: '#3b82f6',
  diretora: '#8b5cf6',
  head: '#ec4899'
}

// Nomes amigáveis
const LEVEL_NAMES: Record<MemberLevel, string> = {
  membro: 'Membro',
  parceira: 'Parceira',
  lider_formacao: 'Líder em Formação',
  lider: 'Líder',
  diretora: 'Diretora',
  head: 'Head'
}

// Ícones por nível
const LEVEL_ICONS: Record<MemberLevel, string> = {
  membro: '👤',
  parceira: '🌱',
  lider_formacao: '🌿',
  lider: '🌳',
  diretora: '👑',
  head: '💎'
}

export default function LevelCard({ compact = false }: LevelCardProps) {
  const [data, setData] = useState<MemberLevelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLevelData()
  }, [])

  const fetchLevelData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members/me/level')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de nível')
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
      <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>{error || 'Erro ao carregar'}</div>
      </div>
    )
  }

  const currentLevel = data.current.level
  const nextLevel = data.progress.next_level
  const levelColor = LEVEL_COLORS[currentLevel]

  // Calcular progresso geral (média dos requisitos atendidos)
  const progressPercentage = nextLevel && data.progress.requirements.length > 0
    ? Math.round(
        (data.progress.requirements.filter(r => r.met).length / 
         data.progress.requirements.length) * 100
      )
    : 100

  if (compact) {
    return (
      <div 
        className={`${styles.card} ${styles.compact}`}
        style={{ '--level-color': levelColor } as React.CSSProperties}
      >
        <span className={styles.levelIcon}>{LEVEL_ICONS[currentLevel]}</span>
        <span className={styles.levelName}>{LEVEL_NAMES[currentLevel]}</span>
      </div>
    )
  }

  return (
    <div 
      className={styles.card}
      style={{ '--level-color': levelColor } as React.CSSProperties}
    >
      {/* Cabeçalho com nível atual */}
      <div className={styles.header}>
        <div className={styles.currentLevel}>
          <span className={styles.levelIconLarge}>{LEVEL_ICONS[currentLevel]}</span>
          <div className={styles.levelInfo}>
            <span className={styles.levelLabel}>Seu Nível</span>
            <span className={styles.levelTitle}>{LEVEL_NAMES[currentLevel]}</span>
          </div>
        </div>
        {data.current.since && (
          <span className={styles.since}>
            Desde {new Date(data.current.since).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Progresso para próximo nível */}
      {nextLevel && (
        <div className={styles.progress}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              Próximo: {LEVEL_NAMES[nextLevel]}
            </span>
            <span className={styles.progressPercent}>{progressPercentage}%</span>
          </div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Requisitos */}
          <div className={styles.requirements}>
            {data.progress.requirements.map((req, index) => (
              <RequirementItem key={index} requirement={req} />
            ))}
          </div>
        </div>
      )}

      {/* Se já é Head */}
      {!nextLevel && (
        <div className={styles.maxLevel}>
          <span className={styles.maxLevelIcon}>🏆</span>
          <span className={styles.maxLevelText}>
            Você atingiu o nível máximo!
          </span>
        </div>
      )}

      {/* Histórico recente */}
      {data.history.length > 0 && (
        <div className={styles.history}>
          <span className={styles.historyTitle}>Histórico Recente</span>
          {data.history.slice(0, 3).map((entry, index) => (
            <div key={index} className={styles.historyItem}>
              <span className={styles.historyDate}>
                {new Date(entry.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className={styles.historyReason}>{entry.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de requisito individual
function RequirementItem({ requirement }: { requirement: LevelRequirement }) {
  const percentage = Math.min(
    Math.round((requirement.current / requirement.required) * 100),
    100
  )

  return (
    <div className={`${styles.requirement} ${requirement.met ? styles.met : ''}`}>
      <div className={styles.reqHeader}>
        <span className={styles.reqName}>
          {requirement.met ? '✓' : '○'} {requirement.name}
        </span>
        <span className={styles.reqValue}>
          {formatValue(requirement.current)} / {formatValue(requirement.required)}
        </span>
      </div>
      <div className={styles.reqBar}>
        <div 
          className={styles.reqFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Formatar valores grandes
function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

