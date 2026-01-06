/**
 * Landing Page
 * SPEC: Seção 6.1 - GET / (landing simples ou redirect)
 * Design: Clean, sem emojis, baseado no frontend Biohelp
 */

import Link from 'next/link'
import styles from './page.module.css'

// Ícones SVG
const Icons = {
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
}

export default function HomePage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>B</div>
        </div>

        {/* Título */}
        <h1 className={styles.title}>Biohelp LRP</h1>
        <p className={styles.subtitle}>Portal de Parceiras</p>

        {/* Card de login */}
        <div className={styles.card}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <Link href="/login" className={`${styles.tab} ${styles.tabActive}`}>
              Sou Parceira
            </Link>
            <Link href="/admin" className={styles.tab}>
              Sou Admin Biohelp
            </Link>
          </div>

          {/* Form simplificado */}
          <div className={styles.formGroup}>
            <label className={styles.label}>E-mail</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>{Icons.mail}</span>
              <input 
                type="email" 
                placeholder="seu@email.com"
                className={styles.input}
                disabled
              />
            </div>
          </div>

          <Link href="/login" className={styles.btnPrimary}>
            Entrar na minha conta
            <span className={styles.btnIcon}>{Icons.arrowRight}</span>
          </Link>

        </div>

        {/* Link de cadastro */}
        <p className={styles.registerLink}>
          Ainda não tem conta?{' '}
          <Link href="/join">Cadastre-se aqui</Link>
        </p>

        {/* Footer */}
        <footer className={styles.footer}>
          © 2025 Biohelp Nutrition. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  )
}
