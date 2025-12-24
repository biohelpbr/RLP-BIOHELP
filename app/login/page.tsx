/**
 * Página de Login (/login)
 * SPEC: Seção 5.2, 6.1 - Fluxo login
 * Sprint: 1 (placeholder - auth será implementada em task separada)
 */

import Link from 'next/link'
import styles from './page.module.css'

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🌿</span>
              <span className={styles.logoText}>Biohelp</span>
            </div>
            <h1 className={styles.title}>Bem-vindo de volta</h1>
            <p className={styles.subtitle}>
              Entre na sua conta para acessar seus benefícios
            </p>
          </div>

          {/* Placeholder - Auth será implementada */}
          <div className={styles.placeholder}>
            <p>🚧 Login em construção</p>
            <p className={styles.placeholderNote}>
              A autenticação será implementada na próxima task (Supabase Auth)
            </p>
          </div>

          <div className={styles.footer}>
            <p>
              Não tem uma conta?{' '}
              <Link href="/join" className={styles.link}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

