'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MemberCommissionsResponse, CommissionDetailsResponse, CommissionDetail } from '@/types/database'

// Labels para tipos de comissão
const TYPE_LABELS: Record<string, string> = {
  fast_track_30: 'Fast-Track 30%',
  fast_track_20: 'Fast-Track 20%',
  perpetual: 'Comissão Perpétua',
  bonus_3_level_1: 'Bônus 3 - Nível 1',
  bonus_3_level_2: 'Bônus 3 - Nível 2',
  bonus_3_level_3: 'Bônus 3 - Nível 3',
  leadership: 'Leadership Bônus',
  royalty: 'Royalty',
  adjustment: 'Ajuste Manual',
  reversal: 'Reversão'
}

// Cores para tipos de comissão
const TYPE_COLORS: Record<string, string> = {
  fast_track_30: 'bg-amber-100 text-amber-800 border-amber-200',
  fast_track_20: 'bg-amber-100 text-amber-800 border-amber-200',
  perpetual: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  bonus_3_level_1: 'bg-purple-100 text-purple-800 border-purple-200',
  bonus_3_level_2: 'bg-purple-100 text-purple-800 border-purple-200',
  bonus_3_level_3: 'bg-purple-100 text-purple-800 border-purple-200',
  leadership: 'bg-blue-100 text-blue-800 border-blue-200',
  royalty: 'bg-rose-100 text-rose-800 border-rose-200',
  adjustment: 'bg-gray-100 text-gray-800 border-gray-200',
  reversal: 'bg-red-100 text-red-800 border-red-200'
}

export default function CommissionsPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<MemberCommissionsResponse | null>(null)
  const [details, setDetails] = useState<CommissionDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showDetails, setShowDetails] = useState(false)

  // Buscar resumo de comissões
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/members/me/commissions')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar comissões')
        const data = await res.json()
        setSummary(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [router])

  // Buscar detalhes quando expandir
  useEffect(() => {
    if (!showDetails) return
    
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/members/me/commissions/details?month=${selectedMonth}`)
        if (!res.ok) throw new Error('Erro ao carregar detalhes')
        const data = await res.json()
        setDetails(data)
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err)
      }
    }
    fetchDetails()
  }, [showDetails, selectedMonth])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-semibold mb-2">Erro</h2>
          <p className="text-red-300">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-emerald-400 hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar
              </Link>
              <h1 className="text-2xl font-bold text-white">Minhas Comissões</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Saldo Disponível */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-emerald-300 text-sm font-medium">Disponível</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(summary?.balance.available ?? 0)}
            </p>
          </div>

          {/* Total Ganho */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-slate-400 text-sm font-medium">Total Ganho</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary?.balance.total_earned ?? 0)}
            </p>
          </div>

          {/* Total Sacado */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-slate-400 text-sm font-medium">Total Sacado</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary?.balance.total_withdrawn ?? 0)}
            </p>
          </div>

          {/* Pendente */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-400 text-sm font-medium">Em Análise</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary?.balance.pending ?? 0)}
            </p>
          </div>
        </div>

        {/* Comissões do Mês */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Comissões do Mês Atual</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Fast-Track */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <span className="text-amber-300 text-sm font-medium block mb-1">Fast-Track</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.current_month.fast_track ?? 0)}
              </p>
            </div>

            {/* Perpétua */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <span className="text-emerald-300 text-sm font-medium block mb-1">Perpétua</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.current_month.perpetual ?? 0)}
              </p>
            </div>

            {/* Bônus 3 */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <span className="text-purple-300 text-sm font-medium block mb-1">Bônus 3</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.current_month.bonus_3 ?? 0)}
              </p>
            </div>

            {/* Leadership */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <span className="text-blue-300 text-sm font-medium block mb-1">Leadership</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.current_month.leadership ?? 0)}
              </p>
            </div>

            {/* Royalty */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
              <span className="text-rose-300 text-sm font-medium block mb-1">Royalty</span>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.current_month.royalty ?? 0)}
              </p>
            </div>
          </div>

          {/* Total do Mês */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between">
            <span className="text-lg font-medium text-white">Total do Mês</span>
            <span className="text-2xl font-bold text-emerald-400">
              {formatCurrency(summary?.current_month.total ?? 0)}
            </span>
          </div>
        </div>

        {/* Detalhes / Histórico */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Detalhes das Comissões</h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {summary?.history?.map((h) => (
                  <option key={h.month} value={h.month}>
                    {new Date(h.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
                {(!summary?.history || summary.history.length === 0) && (
                  <option value={selectedMonth}>
                    {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </option>
                )}
              </select>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
              </button>
            </div>
          </div>

          {showDetails && details && (
            <div className="space-y-4">
              {details.commissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Nenhuma comissão neste período</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium">Origem</th>
                        <th className="pb-3 font-medium">CV Base</th>
                        <th className="pb-3 font-medium">%</th>
                        <th className="pb-3 font-medium text-right">Valor</th>
                        <th className="pb-3 font-medium text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {details.commissions.map((commission) => (
                        <tr key={commission.id} className="text-white">
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${TYPE_COLORS[commission.type] || 'bg-slate-100 text-slate-800'}`}>
                              {TYPE_LABELS[commission.type] || commission.type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">
                            {commission.source_member_name || '-'}
                            {commission.source_order_number && (
                              <span className="text-slate-500 text-xs ml-1">
                                (#{commission.source_order_number})
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-slate-300">
                            {commission.cv_base ? formatCurrency(commission.cv_base) : '-'}
                          </td>
                          <td className="py-3 text-slate-300">
                            {commission.percentage ? `${commission.percentage}%` : '-'}
                          </td>
                          <td className="py-3 text-right font-medium">
                            <span className={commission.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {formatCurrency(commission.amount)}
                            </span>
                          </td>
                          <td className="py-3 text-right text-slate-400 text-sm">
                            {formatDate(commission.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Histórico Resumido */}
          {!showDetails && summary?.history && summary.history.length > 0 && (
            <div className="space-y-3">
              {summary.history.map((month) => (
                <div 
                  key={month.month}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedMonth(month.month)
                    setShowDetails(true)
                  }}
                >
                  <span className="text-white font-medium">
                    {new Date(month.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(month.total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!showDetails && (!summary?.history || summary.history.length === 0) && (
            <div className="text-center py-8 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Nenhuma comissão registrada ainda</p>
              <p className="text-sm mt-2">As comissões aparecerão aqui quando você ou sua rede fizerem compras.</p>
            </div>
          )}
        </div>

        {/* Info sobre tipos de comissão */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tipos de Comissão</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <h4 className="font-medium text-amber-300 mb-2">Fast-Track</h4>
              <p className="text-slate-400">30% nos primeiros 30 dias, 20% nos próximos 30 dias sobre compras de indicados diretos.</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <h4 className="font-medium text-emerald-300 mb-2">Comissão Perpétua</h4>
              <p className="text-slate-400">De 5% a 15% sobre compras da rede, dependendo do seu nível.</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <h4 className="font-medium text-purple-300 mb-2">Bônus 3</h4>
              <p className="text-slate-400">R$250 a R$8.000 por formar redes de 3 parceiras ativas.</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-medium text-blue-300 mb-2">Leadership Bônus</h4>
              <p className="text-slate-400">3% (Diretora) ou 4% (Head) sobre CV da rede.</p>
            </div>
            <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <h4 className="font-medium text-rose-300 mb-2">Royalty</h4>
              <p className="text-slate-400">3% sobre a rede de Heads que você formou.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

