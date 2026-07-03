"use client"

import { useState } from "react"
import { Crown, Users, ShoppingBag } from "lucide-react"
import { BHCard } from "@/components/biohelp"
import {
  simulateIndicacao,
  simulateAfiliado,
  affiliateTierPct,
} from "@/lib/commissions-v2/simulate"

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function SimuladorComissao() {
  // Indicação
  const [model, setModel] = useState<"v1" | "v2">("v2")
  const [activeCount, setActiveCount] = useState(0)
  const [avoBuilder, setAvoBuilder] = useState(true)
  const ind = simulateIndicacao({ model, activeCount, avoIsBuilder: avoBuilder })

  // Afiliado
  const [gmv, setGmv] = useState(12000)
  const [saleNet, setSaleNet] = useState(100)
  const [temOrig, setTemOrig] = useState(false)
  const [origDestravou, setOrigDestravou] = useState(false)
  const aff = simulateAfiliado({
    gmvMonthAtual: gmv,
    saleNet,
    temOriginador: temOrig,
    originadorDestravou: origDestravou,
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Indicação */}
      <BHCard variant="elevated">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-primary" /> Indicação (clube)
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Modelo</label>
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              {(["v1", "v2"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`px-3 py-1.5 text-sm font-medium ${
                    model === m ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  {m === "v1" ? "V1 (R$80/R$40)" : "V2 (R$400)"}
                </button>
              ))}
            </div>
          </div>

          {model === "v1" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Indicações ativas antes desta ({activeCount} → esta é a {activeCount + 1}ª)
              </label>
              <input
                type="number"
                min={0}
                value={activeCount}
                onChange={(e) => setActiveCount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={avoBuilder}
                onChange={(e) => setAvoBuilder(e.target.checked)}
              />
              <Crown className="h-4 w-4 text-primary" /> O avô (quem indicou o indicador) é Builder
            </label>
          )}

          <div className="space-y-1 rounded-lg bg-muted/50 p-3">
            {ind.linhas.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{l.quem}</span>
                <span className="font-semibold">{brl(l.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </BHCard>

      {/* Afiliado */}
      <BHCard variant="elevated">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-5 w-5 text-primary" /> Afiliado (loja)
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                GMV do mês (faixa: {affiliateTierPct(gmv)}%)
              </label>
              <input
                type="number"
                min={0}
                value={gmv}
                onChange={(e) => setGmv(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Venda líquida (R$)</label>
              <input
                type="number"
                min={0}
                value={saleNet}
                onChange={(e) => setSaleNet(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={temOrig} onChange={(e) => setTemOrig(e.target.checked)} />
            Recompra via OUTRO afiliado (há Originador diferente)
          </label>
          {temOrig && (
            <label className="ml-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={origDestravou}
                onChange={(e) => setOrigDestravou(e.target.checked)}
              />
              Originador já destravou a perpétua (≥ R$50k GMV)
            </label>
          )}

          <div className="space-y-1 rounded-lg bg-muted/50 p-3">
            {aff.linhas.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {l.quem} <span className="text-xs">({l.base})</span>
                </span>
                <span className="font-semibold">{brl(l.valor)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-1 text-sm font-bold">
              <span>Total</span>
              <span>{brl(aff.total)}</span>
            </div>
          </div>
        </div>
      </BHCard>
    </div>
  )
}
