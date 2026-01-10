'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Commission {
  id: string
  member: {
    id: string
    name: string
    email: string
    level: string
  }
  type: string
  type_label: string
  amount: number
  cv_base: number | null
  percentage: number | null
  source_member_name: string | null
  source_order_number: string | null
  network_level: number | null
  description: string | null
  created_at: string
}

interface CommissionsResponse {
  commissions: Commission[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  summary: {
    total_amount: number
    by_type: Record<string, number>
  }
}

// Cores para tipos de comissão
const TYPE_COLORS: Record<string, string> = {
  fast_track_30: 'bg-amber-100 text-amber-800',
  fast_track_20: 'bg-amber-100 text-amber-800',
  perpetual: 'bg-emerald-100 text-emerald-800',
  bonus_3_level_1: 'bg-purple-100 text-purple-800',
  bonus_3_level_2: 'bg-purple-100 text-purple-800',
  bonus_3_level_3: 'bg-purple-100 text-purple-800',
  leadership: 'bg-blue-100 text-blue-800',
  royalty: 'bg-rose-100 text-rose-800',
  adjustment: 'bg-gray-100 text-gray-800',
  reversal: 'bg-red-100 text-red-800'
}

export default function AdminCommissionsPage() {
  const router = useRouter()
  const [data, setData] = useState<CommissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedType, setSelectedType] = useState<string>('')
  const [page, setPage] = useState(0)
  const limit = 50

  // Buscar comissões
  useEffect(() => {
    async function fetchCommissions() {
      setLoading(true)
      try {
        let url = `/api/admin/commissions?month=${selectedMonth}&limit=${limit}&offset=${page * limit}`
        if (selectedType) {
          url += `&type=${selectedType}`
        }
        
        const res = await fetch(url)
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/dashboard')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar comissões')
        const responseData = await res.json()
        setData(responseData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchCommissions()
  }, [router, selectedMonth, selectedType, page])

  // Formatar valor em BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Gerar opções de mês (últimos 12 meses)
  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-semibold mb-2">Erro</h2>
          <p className="text-red-300">{error}</p>
          <Link href="/admin" className="mt-4 inline-block text-emerald-400 hover:underline">
            ← Voltar ao Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar
              </Link>
              <h1 className="text-2xl font-bold text-white">Gestão de Comissões</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  setPage(0)
                }}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {getMonthOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  setPage(0)
                }}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todos</option>
                <option value="fast_track_30">Fast-Track 30%</option>
                <option value="fast_track_20">Fast-Track 20%</option>
                <option value="perpetual">Perpétua</option>
                <option value="bonus_3_level_1">Bônus 3 - Nível 1</option>
                <option value="bonus_3_level_2">Bônus 3 - Nível 2</option>
                <option value="bonus_3_level_3">Bônus 3 - Nível 3</option>
                <option value="leadership">Leadership</option>
                <option value="royalty">Royalty</option>
                <option value="adjustment">Ajuste</option>
                <option value="reversal">Reversão</option>
              </select>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-500"></div>
                <span>Carregando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumo */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
              <span className="text-emerald-300 text-sm font-medium block mb-1">Total do Período</span>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.summary.total_amount)}
              </p>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <span className="text-slate-400 text-sm font-medium block mb-1">Registros</span>
              <p className="text-2xl font-bold text-white">
                {data.pagination.total}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <span className="text-amber-300 text-sm font-medium block mb-1">Fast-Track</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency((data.summary.by_type['fast_track_30'] || 0) + (data.summary.by_type['fast_track_20'] || 0))}
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <span className="text-emerald-300 text-sm font-medium block mb-1">Perpétua</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(data.summary.by_type['perpetual'] || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Tabela de Comissões */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm bg-slate-700/50">
                  <th className="px-4 py-3 font-medium">Membro</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">CV Base</th>
                  <th className="px-4 py-3 font-medium">%</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Nenhuma comissão encontrada neste período</p>
                    </td>
                  </tr>
                ) : (
                  data?.commissions.map((commission) => (
                    <tr key={commission.id} className="text-white hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{commission.member.name}</p>
                          <p className="text-sm text-slate-400">{commission.member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[commission.type] || 'bg-slate-100 text-slate-800'}`}>
                          {commission.type_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {commission.source_member_name || '-'}
                        {commission.source_order_number && (
                          <span className="text-slate-500 text-xs ml-1">
                            (#{commission.source_order_number})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {commission.cv_base ? formatCurrency(commission.cv_base) : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {commission.percentage ? `${commission.percentage}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={commission.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(commission.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-sm">
                        {formatDate(commission.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data && data.pagination.total > limit && (
            <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, data.pagination.total)} de {data.pagination.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.pagination.hasMore}
                  className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

