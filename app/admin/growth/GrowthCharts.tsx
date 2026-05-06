"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BHCard } from "@/components/biohelp"
import type { GrowthMonthRow } from "@/lib/admin/growth"

interface GrowthChartsProps {
  history: GrowthMonthRow[]
  projection: GrowthMonthRow[]
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

export function GrowthCharts({ history, projection }: GrowthChartsProps) {
  const cutoffMonth = projection[0]?.month
  const data = [...history, ...projection].map((row) => ({
    ...row,
    isProjection: projection.some((p) => p.month === row.month),
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BHCard variant="elevated" className="space-y-3">
        <h2 className="text-lg font-semibold">Membros novos / mês</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              {cutoffMonth && (
                <ReferenceLine
                  x={cutoffMonth}
                  stroke="hsl(var(--accent))"
                  strokeDasharray="4 4"
                  label={{ value: "projeção", position: "top", fontSize: 10 }}
                />
              )}
              <Bar dataKey="newMembers" name="Novos membros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BHCard>

      <BHCard variant="elevated" className="space-y-3">
        <h2 className="text-lg font-semibold">Receita vs Resgates (R$)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={fmtBRL}
              />
              <Tooltip
                formatter={(v: number) => fmtBRL(v)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              {cutoffMonth && (
                <ReferenceLine
                  x={cutoffMonth}
                  stroke="hsl(var(--accent))"
                  strokeDasharray="4 4"
                />
              )}
              <Line
                type="monotone"
                dataKey="revenue"
                name="Receita (vendas manuais F-V14)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="payouts"
                name="Resgates pagos"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </BHCard>
    </div>
  )
}
