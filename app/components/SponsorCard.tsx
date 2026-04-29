'use client'

/**
 * SponsorCard — exibe quem trouxe o membro pro programa (Pivô V2 / F-V11).
 *
 * Estados:
 * - sponsor === null            → topo da árvore / cadastro pela admin
 * - sponsor.is_house_account    → conta-mãe (legado v1, TBD-16)
 * - sponsor real                → mostra nome + ref_code + status
 */

import styles from './SponsorCard.module.css'
import type { SponsorInfo } from '@/types/database'

const statusLabel = (status: SponsorInfo['status']): string => {
  if (status === 'active') return 'Ativa'
  if (status === 'pending') return 'Pendente'
  return 'Inativa'
}

export default function SponsorCard({ sponsor }: { sponsor: SponsorInfo | null }) {
  if (!sponsor || sponsor.is_house_account) {
    return (
      <div className={styles.card}>
        <span className={styles.label}>Indicada por</span>
        <p className={styles.empty}>
          Você foi cadastrada pela equipe Biohelp.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <span className={styles.label}>Indicada por</span>
      <h3 className={styles.name}>{sponsor.name}</h3>
      <div className={styles.meta}>
        <span className={styles.refCode}>{sponsor.ref_code}</span>
        <span className={`${styles.statusBadge} ${styles[`status_${sponsor.status}`]}`}>
          {statusLabel(sponsor.status)}
        </span>
      </div>
    </div>
  )
}
