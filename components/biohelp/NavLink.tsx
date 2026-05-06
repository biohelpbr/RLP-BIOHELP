"use client"

import * as React from "react"
import Link, { type LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavLinkProps = Omit<LinkProps, "href"> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    /** Match prefix do pathname em vez de igualdade exata. */
    matchStart?: boolean
    activeClassName?: string
    children: React.ReactNode
  }

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, matchStart = false, className, activeClassName, children, ...rest }, ref) => {
    const pathname = usePathname()
    const isActive = matchStart ? pathname.startsWith(href) : pathname === href

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        aria-current={isActive ? "page" : undefined}
        {...rest}
      >
        {children}
      </Link>
    )
  },
)
NavLink.displayName = "NavLink"
