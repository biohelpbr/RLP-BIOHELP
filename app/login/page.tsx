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
          <form onSubmit={handleSubmit}>
            {/* Mensagem de erro */}
            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

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
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de senha */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Sua senha</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
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
              <span className={styles.btnArrow}>→</span>
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
