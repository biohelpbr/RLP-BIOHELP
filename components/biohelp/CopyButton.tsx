"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  value: string
  label?: string
  variant?: "secondary" | "outline" | "ghost" | "default"
  size?: "sm" | "default" | "lg"
  className?: string
  /** Mensagem temporária após copiar. Default: "Copiado!" */
  copiedLabel?: string
}

export function CopyButton({
  value,
  label = "Copiar",
  variant = "secondary",
  size = "default",
  className,
  copiedLabel = "Copiado!",
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}
