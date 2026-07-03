/**
 * F-V34/F-V35 — Simulador de comissão (dry-run, SEM banco).
 *
 * Funções PURAS que reproduzem exatamente as regras de comissão pra o cliente
 * validar os cenários sem tocar em dado real. Os mesmos números aqui são os que
 * o sistema paga na ativação/venda real.
 *
 * Fonte das regras: doc "Nutrition Club V2" + respostas do cliente (03/07):
 *   - Indicação V1: R$80 até a 20ª indicação, R$40 a partir da 21ª.
 *   - Indicação V2: R$400 ao indicador direto (sempre) + R$200 ao avô SE Builder.
 *   - Afiliado: faixa por GMV mensal (10% até 9.999,99; 15% de 10k+); sobre o
 *     líquido (com 10% aplicado). Perpétua 10% ao Originador, se já destravou 50k.
 */

// ---------- Indicação (clube) ----------

export const V1_FIRST = 80
export const V1_AFTER = 40
export const V1_THRESHOLD = 20
export const V2_DIRECT = 400
export const V2_BUILDER = 200

export interface IndicacaoInput {
  model: "v1" | "v2"
  /** ativos diretos do indicador ANTES desta indicação (só V1) */
  activeCount: number
  /** o avô (indicador do indicador) é Builder? (só V2) */
  avoIsBuilder: boolean
}

export interface IndicacaoResult {
  direto: number
  avo: number
  biohelp: number
  linhas: { quem: string; valor: number }[]
}

export function simulateIndicacao(input: IndicacaoInput): IndicacaoResult {
  if (input.model === "v1") {
    const valor = input.activeCount < V1_THRESHOLD ? V1_FIRST : V1_AFTER
    return {
      direto: valor,
      avo: 0,
      biohelp: 0,
      linhas: [{ quem: `Indicador direto (${input.activeCount + 1}ª indicação)`, valor }],
    }
  }
  // V2
  const avo = input.avoIsBuilder ? V2_BUILDER : 0
  const biohelp = input.avoIsBuilder ? 0 : V2_BUILDER
  const linhas = [{ quem: "Indicador direto", valor: V2_DIRECT }]
  if (input.avoIsBuilder) linhas.push({ quem: "Avô (Builder)", valor: V2_BUILDER })
  else linhas.push({ quem: "Biohelp (avô não é Builder)", valor: V2_BUILDER })
  return { direto: V2_DIRECT, avo, biohelp, linhas }
}

// ---------- Afiliado (loja) ----------

export const AFF_TIER_1_PCT = 10 // até 9.999,99 de GMV
export const AFF_TIER_2_PCT = 15 // 10.000+ de GMV
export const AFF_TIER_2_MIN = 10_000
export const AFF_PERPETUAL_UNLOCK = 50_000
export const AFF_PERPETUAL_PCT = 10

export function affiliateTierPct(gmvMonth: number): number {
  return gmvMonth < AFF_TIER_2_MIN ? AFF_TIER_1_PCT : AFF_TIER_2_PCT
}

export interface AfiliadoInput {
  /** GMV acumulado do afiliado ATUAL no mês (define a faixa) */
  gmvMonthAtual: number
  /** valor líquido da venda (já com os 10% de desconto / preço do combo) */
  saleNet: number
  /** o Originador é diferente do Atual? (recompra via outro afiliado) */
  temOriginador: boolean
  /** o Originador já destravou a perpétua (>= 50k de GMV histórico)? */
  originadorDestravou: boolean
}

export interface AfiliadoResult {
  tierPct: number
  comissaoVenda: number
  comissaoPerpetua: number
  total: number
  linhas: { quem: string; base: string; valor: number }[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function simulateAfiliado(input: AfiliadoInput): AfiliadoResult {
  const tierPct = affiliateTierPct(input.gmvMonthAtual)
  const comissaoVenda = round2(input.saleNet * (tierPct / 100))

  let comissaoPerpetua = 0
  const linhas: AfiliadoResult["linhas"] = [
    { quem: "Afiliado Atual (venda)", base: `${tierPct}% de R$${input.saleNet}`, valor: comissaoVenda },
  ]

  if (input.temOriginador && input.originadorDestravou) {
    comissaoPerpetua = round2(input.saleNet * (AFF_PERPETUAL_PCT / 100))
    linhas.push({
      quem: "Afiliado Originador (perpétua)",
      base: `${AFF_PERPETUAL_PCT}% de R$${input.saleNet}`,
      valor: comissaoPerpetua,
    })
  } else if (input.temOriginador && !input.originadorDestravou) {
    linhas.push({
      quem: "Afiliado Originador (perpétua)",
      base: "Originador ainda não destravou 50k",
      valor: 0,
    })
  }

  return {
    tierPct,
    comissaoVenda,
    comissaoPerpetua,
    total: round2(comissaoVenda + comissaoPerpetua),
    linhas,
  }
}
