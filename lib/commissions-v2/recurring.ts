import { createServiceClient } from "@/lib/supabase/server"

/**
 * Comissão recorrente de indicação (regra do cliente, 09/09/26).
 *
 * O padrinho recebe por MÊS enquanto a pessoa indicada mantém a assinatura:
 * R$80 pelos 20 primeiros indicados (ordem de ativação) e R$40 do 21º em
 * diante — mesma faixa da regra original de 26/05, que pagava só na ativação.
 *
 * O que conta: a ativação + cada aniversário mensal já vencido. Indicada que
 * ativou em 19/06, hoje 10/09 → 19/06, 19/07 e 19/08 vencidos = 3 meses;
 * 19/09 ainda não venceu.
 *
 * Idempotência: a chave é (padrinho, indicado, mês). Cada execução relê o que
 * já existe no ledger e lança só o que falta — rodar duas vezes no mesmo dia
 * não duplica, e o cron diário cobre os aniversários de todos os dias do mês
 * (rodar só no dia 1º atrasaria quem ativou no dia 19).
 *
 * Só entra indicada com subscription_status='paid' hoje. Quem cancelou para de
 * gerar meses novos, mas o que já foi lançado permanece — é histórico pago.
 */

const TETO_FAIXA_1 = 20
const VALOR_FAIXA_1 = 80
const VALOR_FAIXA_2 = 40

export interface RecurringRunSummary {
  ok: boolean
  committed: boolean
  sponsors: number
  rows: number
  total: number
  error?: string
}

interface LinhaLedger {
  member_id: string
  source_member_id: string
  source_order_id: null
  commission_type: "subscription_recurring"
  amount: number
  cv_base: number
  percentage: number
  network_level: number
  reference_month: string
  available_at: string
  description: string
}

const mesRef = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`

/**
 * Quando a comissão de um mês fica liberada pra saque: Net-15 = dia 15 do mês
 * SEGUINTE ao mês de referência.
 *
 * ATENÇÃO: hoje este valor é SOBRESCRITO no insert. O trigger BEFORE INSERT
 * `set_commission_available_at` (20260119_sprint5_payout_updates.sql) recalcula
 * available_at a partir de created_at, sem checar se já veio preenchido. Isso
 * está certo pra comissão lançada no próprio mês, mas erra em lançamento
 * retroativo: o backfill de 10/09 lançou julho e agosto — já vencidos — com
 * liberação em 15/10, travando R$26.520 (reportado em 21/09, corrigido por
 * scripts/corrige-carencia-backfill.mjs).
 *
 * Mantido aqui de propósito: passa a valer assim que o trigger ganhar o guard
 * `IF NEW.available_at IS NULL` (migration pendente). Até lá, o cron só lança
 * o mês corrente, onde trigger e esta fórmula coincidem.
 */
function liberacaoNet15(referenceMonth: string): string {
  const [ano, mes] = referenceMonth.slice(0, 7).split("-").map(Number)
  const mesSeguinte = mes === 12 ? 1 : mes + 1
  const anoSeguinte = mes === 12 ? ano + 1 : ano
  return `${anoSeguinte}-${String(mesSeguinte).padStart(2, "0")}-15T00:00:00Z`
}

/**
 * Meses devidos por uma assinatura: a ativação e cada aniversário já vencido.
 * Usa o dia da ativação; num mês sem esse dia (31 → fev) o Date normaliza pro
 * mês seguinte, aceitável aqui porque só contamos vencimentos passados.
 */
function mesesDevidos(inicio: Date, hoje: Date): Date[] {
  const meses: Date[] = []
  const d = new Date(inicio)
  while (d <= hoje) {
    meses.push(new Date(d))
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return meses
}

/** Lê tudo paginando — o PostgREST corta em 1000 linhas por resposta. */
async function lerTudo<T>(
  supabase: ReturnType<typeof createServiceClient>,
  tabela: string,
  colunas: string,
  filtro?: (q: never) => never,
): Promise<T[]> {
  const out: T[] = []
  for (let off = 0; ; off += 1000) {
    let q = supabase.from(tabela).select(colunas).order("id", { ascending: true }).range(off, off + 999)
    if (filtro) q = (filtro as unknown as (x: typeof q) => typeof q)(q)
    const { data, error } = await q
    if (error) throw new Error(`${tabela}: ${error.message}`)
    const bloco = (data ?? []) as T[]
    out.push(...bloco)
    if (bloco.length < 1000) return out
  }
}

export async function runRecurringCommissions(
  opts: { commit: boolean } = { commit: false },
): Promise<RecurringRunSummary> {
  const base: RecurringRunSummary = {
    ok: true,
    committed: false,
    sponsors: 0,
    rows: 0,
    total: 0,
  }

  try {
    const supabase = createServiceClient()
    const hoje = new Date()

    type Membro = {
      id: string
      name: string | null
      sponsor_id: string | null
      subscription_status: string | null
      subscription_paid_at: string | null
    }
    type Lancamento = {
      member_id: string
      source_member_id: string | null
      reference_month: string | null
    }

    const membros = await lerTudo<Membro>(
      supabase,
      "members",
      "id, name, sponsor_id, subscription_status, subscription_paid_at",
    )
    const ledger = await lerTudo<Lancamento>(
      supabase,
      "commission_ledger",
      "id, member_id, source_member_id, reference_month",
      ((q: never) =>
        (q as unknown as { in: (c: string, v: string[]) => never }).in("commission_type", [
          "subscription_activation",
          "subscription_recurring",
        ])) as never,
    )

    // Chave da idempotência: padrinho + indicado + mês.
    const jaLancado = new Set<string>()
    for (const l of ledger) {
      if (l.source_member_id && l.reference_month) {
        jaLancado.add(`${l.member_id}|${l.source_member_id}|${String(l.reference_month).slice(0, 7)}`)
      }
    }

    const porPadrinho = new Map<string, Membro[]>()
    for (const m of membros) {
      if (m.subscription_status !== "paid" || !m.sponsor_id || !m.subscription_paid_at) continue
      const lista = porPadrinho.get(m.sponsor_id) ?? []
      lista.push(m)
      porPadrinho.set(m.sponsor_id, lista)
    }
    // A ordem de ativação define quem está dentro dos 20 primeiros.
    for (const lista of Array.from(porPadrinho.values())) {
      lista.sort(
        (a: Membro, b: Membro) =>
          new Date(a.subscription_paid_at!).getTime() - new Date(b.subscription_paid_at!).getTime(),
      )
    }

    const novas: LinhaLedger[] = []
    const sponsorsTocados = new Set<string>()

    for (const [sponsorId, indicados] of Array.from(porPadrinho.entries())) {
      indicados.forEach((ind: Membro, i: number) => {
        const valor = i < TETO_FAIXA_1 ? VALOR_FAIXA_1 : VALOR_FAIXA_2
        for (const mes of mesesDevidos(new Date(ind.subscription_paid_at!), hoje)) {
          const ref = mesRef(mes)
          if (jaLancado.has(`${sponsorId}|${ind.id}|${ref.slice(0, 7)}`)) continue
          sponsorsTocados.add(sponsorId)
          novas.push({
            member_id: sponsorId,
            source_member_id: ind.id,
            source_order_id: null,
            commission_type: "subscription_recurring",
            amount: valor,
            cv_base: 0,
            percentage: 0,
            network_level: 1,
            reference_month: ref,
            available_at: liberacaoNet15(ref),
            description: `Mensalidade indicação — ${ind.name ?? ind.id} — ${ref.slice(0, 7)}`,
          })
        }
      })
    }

    base.sponsors = sponsorsTocados.size
    base.rows = novas.length
    base.total = novas.reduce((s, l) => s + l.amount, 0)

    if (!opts.commit || novas.length === 0) return base

    for (let i = 0; i < novas.length; i += 500) {
      const { error } = await supabase.from("commission_ledger").insert(novas.slice(i, i + 500))
      if (error) throw new Error(`insert: ${error.message}`)
    }
    base.committed = true
    return base
  } catch (e) {
    return { ...base, ok: false, error: e instanceof Error ? e.message : "erro desconhecido" }
  }
}
