/**
 * Landing Page
 * SPEC: Seção 6.1 - GET / (landing simples ou redirect)
 * TBD-007: Comportamento exato pendente - usando landing simples por enquanto
 */

import Link from 'next/link'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>

      <main className={styles.main}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🌿</span>
          <span className={styles.logoText}>Biohelp</span>
        </div>

        <h1 className={styles.title}>
          Programa de Fidelidade
        </h1>

        <p className={styles.subtitle}>
          Faça parte da nossa comunidade e aproveite benefícios exclusivos
        </p>

        <div className={styles.actions}>
          <Link href="/login" className={styles.btnPrimary}>
            Entrar
          </Link>
          <Link href="/join" className={styles.btnSecondary}>
            Criar conta
          </Link>
        </div>

        <p className={styles.note}>
          Para criar uma conta, você precisa de um link de convite de um membro existente.
        </p>
      </main>
    </div>
  )
}

