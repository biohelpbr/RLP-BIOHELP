/**
 * Página de Cadastro (/join)
 * SPEC: Seção 5.1, 6.1 - Fluxo cadastro com link
 * Sprint: 1
 * 
 * Captura ref da querystring e permite cadastro
 */

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import styles from './page.module.css'

// Tipos de erro do backend
const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: 'Este e-mail já está cadastrado. Tente fazer login.',
  INVALID_REF: 'O código de convite é inválido ou expirou.',
  NO_REF_BLOCKED: 'É necessário um link de convite para se cadastrar.',
  VALIDATION_ERROR: 'Por favor, verifique os dados informados.',
  INTERNAL_ERROR: 'Ocorreu um erro. Tente novamente em alguns instantes.',
}

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

function JoinForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const ref = searchParams.get('ref')
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showNoRefWarning, setShowNoRefWarning] = useState(false)

  // Verificar se tem ref na URL
  useEffect(() => {
    if (!ref) {
      setShowNoRefWarning(true)
    }
  }, [ref])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const response = await fetch('/api/members/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          ref: ref || null,
          utm: {
            source: utmSource || undefined,
            medium: utmMedium || undefined,
            campaign: utmCampaign || undefined,
          },
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = ERROR_MESSAGES[data.error] || data.message || 'Erro desconhecido'
        setErrors({ general: errorMessage })
        return
      }
      
      // Sucesso! Redirecionar para dashboard
      router.push(data.redirect || '/dashboard')
      
    } catch (error) {
      console.error('Join error:', error)
      setErrors({ general: 'Erro de conexão. Verifique sua internet e tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Decoração de fundo */}
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
      </div>

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🌿</span>
              <span className={styles.logoText}>Biohelp</span>
            </div>
            <h1 className={styles.title}>Junte-se a nós</h1>
            <p className={styles.subtitle}>
              Crie sua conta e faça parte do programa de fidelidade
            </p>
          </div>

          {/* Aviso sem ref */}
          {showNoRefWarning && (
            <div className={`alert alert-error ${styles.alertBox}`}>
              <strong>Atenção:</strong> Você precisa de um link de convite para se cadastrar. 
              Peça a quem te indicou o link correto.
            </div>
          )}

          {/* Erro geral */}
          {errors.general && (
            <div className={`alert alert-error ${styles.alertBox} animate-fade-in`}>
              {errors.general}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Nome */}
            <div className="input-group">
              <label htmlFor="name" className="input-label">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="Como devemos te chamar?"
                autoComplete="name"
                disabled={isLoading}
              />
              {errors.name && (
                <span className={styles.fieldError}>{errors.name}</span>
              )}
            </div>

            {/* Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && (
                <span className={styles.fieldError}>{errors.email}</span>
              )}
            </div>

            {/* Senha */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className={styles.fieldError}>{errors.confirmPassword}</span>
              )}
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading || showNoRefWarning}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Criando sua conta...
                </>
              ) : (
                'Criar minha conta'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p>
              Já tem uma conta?{' '}
              <a href="/login" className={styles.link}>
                Fazer login
              </a>
            </p>
          </div>

          {/* Indicação de quem convidou */}
          {ref && (
            <div className={styles.refBadge}>
              <span className={styles.refIcon}>👋</span>
              <span>Convidado por: <strong>{ref}</strong></span>
            </div>
          )}
        </div>

        {/* Benefícios */}
        <aside className={styles.benefits}>
          <h2 className={styles.benefitsTitle}>Por que participar?</h2>
          <ul className={styles.benefitsList}>
            <li>
              <span className={styles.benefitIcon}>💚</span>
              <div>
                <strong>Preços exclusivos</strong>
                <p>Acesse valores especiais para membros</p>
              </div>
            </li>
            <li>
              <span className={styles.benefitIcon}>🎁</span>
              <div>
                <strong>Indique e ganhe</strong>
                <p>Convide amigos e seja recompensado</p>
              </div>
            </li>
            <li>
              <span className={styles.benefitIcon}>⭐</span>
              <div>
                <strong>Benefícios crescentes</strong>
                <p>Quanto mais ativo, mais vantagens</p>
              </div>
            </li>
          </ul>
        </aside>
      </main>
    </div>
  )
}

// Loading fallback para Suspense
function JoinLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Carregando...</p>
      </div>
    </div>
  )
}

// Componente principal com Suspense para useSearchParams
export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoading />}>
      <JoinForm />
    </Suspense>
  )
}

