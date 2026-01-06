/**
 * Página de Cadastro
 * SPEC: Seção 6.3 - GET /join
 * Design: Estilo roxo/violeta baseado nas referências
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

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
      {/* Decoração de fundo */}
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />
      </div>

      <div className={styles.wrapper}>
        {/* Card principal */}
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>B</div>
            <h1 className={styles.title}>Criar conta</h1>
          </div>

          {/* Alerta se não tiver ref */}
          {!refCode && (
            <div className={styles.alert}>
              <span className={styles.alertIcon}>⚠️</span>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>E-mail</label>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Senha</label>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmar senha</label>
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

            {error && (
              <div className={styles.error}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar minha conta'}
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
              <span className={styles.sponsorIcon}>👋</span>
              <span>Convidado por: <strong>{refCode}</strong></span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
