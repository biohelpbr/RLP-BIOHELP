import * as React from "react"
import { cn } from "@/lib/utils"
import { BHCard } from "./BHCard"

type BHStatVariant = "default" | "primary" | "accent" | "success" | "warning"

interface BHStatProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    positive: boolean
  }
  variant?: BHStatVariant
  className?: string
}

const variantStyles: Record<BHStatVariant, string> = {
  default: "bg-card",
  primary: "bg-primary/5",
  accent: "bg-accent/20",
  success: "bg-success/10",
  warning: "bg-warning/10",
}

const iconStyles: Record<BHStatVariant, string> = {
  default: "text-muted-foreground bg-muted",
  primary: "text-primary bg-primary/10",
  accent: "text-accent-foreground bg-accent/30",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
}

export const BHStat: React.FC<BHStatProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}) => (
  <BHCard className={cn(variantStyles[variant], className)}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive",
            )}
          >
            <span>{trend.positive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {icon && <div className={cn("p-3 rounded-xl", iconStyles[variant])}>{icon}</div>}
    </div>
  </BHCard>
)
