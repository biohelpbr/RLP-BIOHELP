import * as React from "react"
import { cn } from "@/lib/utils"

type BHCardVariant = "default" | "elevated" | "gradient" | "glass"

interface BHCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BHCardVariant
  hover?: boolean
}

const variants: Record<BHCardVariant, string> = {
  default: "bg-card border border-border",
  elevated: "bg-card border border-border bh-shadow-lg",
  gradient: "bh-gradient-card border border-border/50",
  glass: "bh-glass border border-border/30",
}

export const BHCard = React.forwardRef<HTMLDivElement, BHCardProps>(
  ({ className, variant = "default", hover = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variants[variant],
        hover && "hover:bh-shadow-xl hover:-translate-y-1 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
BHCard.displayName = "BHCard"
