"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeft,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { BHAvatar } from "@/components/biohelp"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  matchStart?: boolean
  external?: boolean
}

const SHOP_LOGIN_URL =
  process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL || "https://account.bio-help.com"

const partnerNavItems: NavItem[] = [
  { title: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
  { title: "Acesso à Loja", href: "/dashboard/store", icon: ShoppingCart, matchStart: true },
  { title: "Login na Loja", href: SHOP_LOGIN_URL, icon: LogIn, external: true },
  { title: "Academy", href: "/dashboard/academy", icon: GraduationCap, matchStart: true },
  { title: "Minhas Vendas", href: "/dashboard/orders", icon: ShoppingBag, matchStart: true },
  { title: "Minha Comunidade", href: "/dashboard/club", icon: Users, matchStart: true },
  { title: "Resultado & Resgate", href: "/dashboard/finance", icon: Wallet, matchStart: true },
  { title: "Meu Perfil", href: "/dashboard/profile", icon: UserIcon, matchStart: true },
]

interface PartnerSidebarProps {
  memberName: string
  memberSubtitle?: string
  isActive?: boolean
}

export function PartnerSidebar({
  memberName,
  memberSubtitle = "Membro do clube",
  isActive = false,
}: PartnerSidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  const isItemActive = (item: NavItem) =>
    item.matchStart ? pathname.startsWith(item.href) : pathname === item.href

  const NavBody = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex items-center px-4 py-6 border-b border-sidebar-border",
          collapsed && !mobile ? "justify-center px-2" : "justify-start",
        )}
      >
        {collapsed && !mobile ? (
          <div className="w-10 h-10 rounded-xl bh-gradient-purple flex items-center justify-center text-primary-foreground font-bold">
            B
          </div>
        ) : (
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={200}
            height={56}
            priority
            className="h-8 w-auto"
          />
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {partnerNavItems.map((item) => {
          const active = isItemActive(item)
          const Icon = item.icon
          const className = cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            active
              ? "bg-primary text-primary-foreground bh-shadow-md"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && !mobile && "justify-center px-2",
          )
          const content = (
            <>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobile) && (
                <span className="font-medium text-sm flex items-center gap-1.5">
                  {item.title}
                  {item.external && <ExternalLink className="w-3 h-3" />}
                </span>
              )}
            </>
          )
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => mobile && setSidebarOpen(false)}
                className={className}
              >
                {content}
              </a>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              {content}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          "p-4 border-t border-sidebar-border",
          collapsed && !mobile && "px-2",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && !mobile && "justify-center",
          )}
        >
          <BHAvatar name={memberName} size="md" showStatus isActive={isActive} />
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{memberName}</p>
              <p className="text-xs text-muted-foreground">{memberSubtitle}</p>
            </div>
          )}
        </div>
        {(!collapsed || mobile) && (
          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <NavBody />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center bh-shadow-sm hover:bh-shadow-md transition-all z-50"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <Image
          src="/logo-oficial.png"
          alt="Biohelp Nutrition Club"
          width={200}
          height={56}
          priority
          className="h-7 w-auto"
        />
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <NavBody mobile />
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}
