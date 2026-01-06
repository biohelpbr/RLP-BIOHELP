/**
 * Página de Login
 * SPEC: Seção 5.2, 6.2 - GET /login
 * Sprint: 1
 * 
 * Autentica via Supabase Auth
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

// Ícones SVG
const Icons = {
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  alertCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setError(data.message || 'Erro ao fazer login')
        setIsLoading(false)
        return
      }

      // Redireciona para dashboard ou admin
      router.push(data.redirect || '/dashboard')
      router.refresh()
      
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro de conexão. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>B</div>
        </div>

        {/* Título */}
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>Acesse sua conta</p>

        {/* Card de login */}
        <div className={styles.card}>
          <form onSubmit={handleSubmit}>
            {/* Mensagem de erro */}
            {error && (
              <div className={styles.errorBox}>
                {Icons.alertCircle}
                <p>{error}</p>
              </div>
            )}

            {/* Campo de email */}
            <div className={styles.formGroup}>
              <label className={styles.label}>E-mail</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.mail}</span>
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de senha */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Senha</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.lock}</span>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
              <span className={styles.btnIcon}>{Icons.arrowRight}</span>
            </button>
          </form>
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
