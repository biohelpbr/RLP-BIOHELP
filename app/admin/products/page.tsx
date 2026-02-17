/**
 * Página de Produtos (Admin)
 * TBD-023 — Listagem de produtos da Shopify com CV
 * SDD: docs/sdd/features/admin-products/
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

interface Product {
  id: number
  title: string
  status: string
  product_type: string | null
  vendor: string | null
  image: string | null
  image_alt: string
  price: string
  sku: string | null
  inventory_quantity: number | null
  cv: number | null
  cv_configured: boolean
  variants_count: number
  created_at: string
  updated_at: string
}

interface ProductsData {
  summary: {
    total: number
    active: number
    draft: number
    archived: number
    withCV: number
    withoutCV: number
  }
  products: Product[]
}

const Icons = {
  box: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  image: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  alertTriangle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [data, setData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/products')
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar produtos')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [router])

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'draft': return 'Rascunho'
      case 'archived': return 'Arquivado'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive
      case 'draft': return styles.statusDraft
      case 'archived': return styles.statusArchived
      default: return styles.statusDraft
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Carregando produtos da loja...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span>{error}</span>
          <Link href="/admin" className={styles.retryButton}>
            Voltar ao Admin
          </Link>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const products = data?.products || []

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin" className={styles.backButton}>
            &larr; Admin
          </Link>
          <h1 className={styles.title}>Produtos da Loja</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconPurple}`}>
            {Icons.box}
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Produtos</span>
            <span className={styles.summaryValue}>{summary?.total || 0}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}>
            {Icons.check}
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Ativos</span>
            <span className={styles.summaryValue}>{summary?.active || 0}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconYellow}`}>
            {Icons.check}
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Com CV</span>
            <span className={styles.summaryValue}>{summary?.withCV || 0}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconRed}`}>
            {Icons.alertTriangle}
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Sem CV</span>
            <span className={styles.summaryValue}>{summary?.withoutCV || 0}</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <div>{Icons.box}</div>
          <p className={styles.emptyText}>Nenhum produto encontrado</p>
          <p className={styles.emptySubtext}>
            Adicione produtos na sua loja Shopify para vê-los aqui.
          </p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              {/* Image */}
              <div className={styles.productImageContainer}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.image_alt}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.productImagePlaceholder}>
                    {Icons.image}
                  </div>
                )}
                <div className={styles.productStatusOverlay}>
                  <span className={`${styles.statusBadge} ${getStatusClass(product.status)}`}>
                    {getStatusLabel(product.status)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className={styles.productInfo}>
                <h3 className={styles.productTitle}>{product.title}</h3>

                <div className={styles.productMeta}>
                  <div className={styles.productMetaRow}>
                    <span className={styles.productMetaLabel}>Preço</span>
                    <span className={styles.productPrice}>
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.sku && (
                    <div className={styles.productMetaRow}>
                      <span className={styles.productMetaLabel}>SKU</span>
                      <span className={styles.productMetaValue}>{product.sku}</span>
                    </div>
                  )}
                  {product.variants_count > 1 && (
                    <div className={styles.productMetaRow}>
                      <span className={styles.productMetaLabel}>Variantes</span>
                      <span className={styles.productMetaValue}>{product.variants_count}</span>
                    </div>
                  )}
                </div>

                {/* CV Badge */}
                <div
                  className={`${styles.cvBadge} ${product.cv_configured ? styles.cvConfigured : styles.cvMissing}`}
                >
                  <span className={`${styles.cvDot} ${product.cv_configured ? styles.cvDotConfigured : styles.cvDotMissing}`} />
                  {product.cv_configured
                    ? `CV: ${product.cv}`
                    : 'CV não configurado'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
