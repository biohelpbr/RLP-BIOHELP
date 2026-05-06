import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type AvatarSize = "sm" | "md" | "lg" | "xl"

interface BHAvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  showStatus?: boolean
  isActive?: boolean
  className?: string
}

const sizes: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
}

const statusSizes: Record<AvatarSize, string> = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
}

const sizePx: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

function getInitials(n: string) {
  return n
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const BHAvatar: React.FC<BHAvatarProps> = ({
  name,
  src,
  size = "md",
  showStatus = false,
  isActive = false,
  className,
}) => {
  const px = sizePx[size]

  return (
    <div className={cn("relative inline-flex", className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className={cn("rounded-full object-cover ring-2 ring-border", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold bh-gradient-purple text-primary-foreground",
            sizes[size],
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            statusSizes[size],
            isActive ? "bg-success" : "bg-muted-foreground",
          )}
          aria-label={isActive ? "Ativa" : "Inativa"}
        />
      )}
    </div>
  )
}
