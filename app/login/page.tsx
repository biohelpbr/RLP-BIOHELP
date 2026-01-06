/**
 * Página de Login
 * SPEC: Seção 6.2 - GET /login
 * Design: Estilo roxo/violeta baseado nas referências
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'parceira' | 'admin'>('parceira')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulação de login - redireciona para dashboard
    setTimeout(() => {
      if (activeTab === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }, 1000)
  }

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
          Entre no Nutrition Club
        </h1>
        
        <p className={styles.subtitle}>
          Você no controle do seu ritmo.
        </p>

        {/* Card de login */}
        <div className={styles.card}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'parceira' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('parceira')}
            >
              Sou Parceira
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'admin' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Sou Admin Biohelp
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Campo de email */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Seu e-mail</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✉️</span>
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Enviar link de acesso'}
              <span className={styles.btnArrow}>→</span>
            </button>
          </form>

          {/* Info box */}
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>✨</span>
            <div>
              <strong>Versão Demo</strong>
              <p>O link de acesso é simulado. Clique em "Enviar link de acesso" para visualizar o painel.</p>
            </div>
          </div>
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
