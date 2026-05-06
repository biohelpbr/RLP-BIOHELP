"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PeriodValue = "all" | "month" | "quarter" | "semester" | "year"

export const PERIOD_OPTIONS: { value: PeriodValue; label: string; months: number | null }[] = [
  { value: "all", label: "Desde o início", months: null },
  { value: "month", label: "Último mês", months: 1 },
  { value: "quarter", label: "Último trimestre", months: 3 },
  { value: "semester", label: "Último semestre", months: 6 },
  { value: "year", label: "Último ano", months: 12 },
]

export function periodLabel(period: PeriodValue): string {
  return PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "Desde o início"
}

interface PeriodFilterProps {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  className?: string
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ value, onChange, className }) => (
  <div className={className}>
    <Select value={value} onValueChange={(v) => onChange(v as PeriodValue)}>
      <SelectTrigger className="w-[200px]">
        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)
