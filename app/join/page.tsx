/**
 * Página de Cadastro
 * SPEC: Seção 6.3 - GET /join
 * Design: Clean, sem emojis, baseado no frontend Biohelp
 */

'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

// Ícones SVG
const Icons = {
  alertTriangle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
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
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  alertCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  userPlus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
}

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const refCode = searchParams.get('ref')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/members/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          ref_code: refCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setError('Este e-mail já está cadastrado')
        } else if (data.code === 'INVALID_REF') {
          setError('Código de referência inválido')
        } else {
          setError(data.message || 'Erro ao criar conta')
        }
        return
      }

      // Sucesso - redireciona para dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = 
    formData.name.trim() && 
    formData.email.trim() && 
    formData.password && 
    formData.confirmPassword

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Card principal */}
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>B</div>
            <h1 className={styles.title}>Criar conta</h1>
            <p className={styles.subtitle}>Preencha seus dados para começar</p>
          </div>

          {/* Alerta se não tiver ref */}
          {!refCode && (
            <div className={styles.alert}>
              <span className={styles.alertIcon}>{Icons.alertTriangle}</span>
              <div>
                <strong>Atenção</strong>
                <p>Você precisa de um link de convite para se cadastrar.</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nome completo</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.user}</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Como devemos te chamar?"
                  className={styles.input}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>E-mail</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.mail}</span>
                <input
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  className={styles.input}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Senha</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.lock}</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmar senha</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>{Icons.lock}</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Digite a senha novamente"
                  className={styles.input}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                {Icons.alertCircle}
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar minha conta'}
              {!isLoading && <span className={styles.btnIcon}>{Icons.arrowRight}</span>}
            </button>
          </form>

          {/* Link de login */}
          <p className={styles.loginLink}>
            Já tem uma conta?{' '}
            <Link href="/login">Fazer login</Link>
          </p>

          {/* Info do sponsor */}
          {refCode && (
            <div className={styles.sponsorInfo}>
              <span className={styles.sponsorIcon}>{Icons.userPlus}</span>
              <span>Convidado por: <strong>{refCode}</strong></span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
