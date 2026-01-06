/**
 * Landing Page
 * SPEC: Seção 6.1 - GET / (landing simples ou redirect)
 * Design: Estilo roxo/violeta baseado nas referências
 */

import Link from 'next/link'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Decoração de fundo */}
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
        <div className={styles.bgBlob3} />
      </div>

      <main className={styles.main}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>B</div>
        </div>

        {/* Título */}
        <h1 className={styles.title}>
          Biohelp LRP
        </h1>

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
            <label className={styles.label}>Seu e-mail</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>✉️</span>
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
            <span className={styles.btnArrow}>→</span>
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
