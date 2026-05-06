'use client'

/**
 * DirectReportsList — lista os indicados diretos (N1) do membro (Pivô V2 / F-V11).
 *
 * No modelo v2 não há mais árvore multinível, então o membro vê só seu N1.
 * Sem CV, sem nível — só o essencial: nome, código, status, data.
 */

import styles from './DirectReportsList.module.css'
import type { DirectReport } from '@/types/database'

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

const statusLabel = (status: DirectReport['status']): string => {
  if (status === 'active') return 'Ativa'
  if (status === 'pending') return 'Pendente'
  return 'Inativa'
}

export default function DirectReportsList({ reports }: { reports: DirectReport[] }) {
  if (reports.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🌱</span>
        <h3>Sua rede está começando!</h3>
        <p>Compartilhe seu link de indicação para trazer pessoas pro seu clube.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Status</th>
            <th>Cadastrada em</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td className={styles.name}>{r.name}</td>
              <td className={styles.refCode}>{r.ref_code}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles[`status_${r.status}`]}`}>
                  {statusLabel(r.status)}
                </span>
              </td>
              <td className={styles.date}>{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
