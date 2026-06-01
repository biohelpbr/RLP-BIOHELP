"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CalendarHeart,
  ChevronLeft,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  TrendingUp,
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
}

// Sidebar admin v2. Itens "Alertas" e "Configurações" comentados como pós-MVP
// (conforme PIVOT-V2.md §7 — Léo confirmou em 29/04 PM).
const adminNavItems: NavItem[] = [
  { title: "Visão Geral", href: "/admin", icon: LayoutDashboard },
  { title: "Comunidade", href: "/admin/community", icon: Users },
  { title: "Crescimento", href: "/admin/growth", icon: TrendingUp },
  { title: "Consumo", href: "/admin/consumption", icon: ShoppingBag },
  { title: "Produtos", href: "/admin/products", icon: Package },
  { title: "Eventos", href: "/admin/events", icon: CalendarHeart },
  { title: "Financeiro", href: "/admin/finance", icon: DollarSign },
  { title: "Resgates", href: "/admin/payouts", icon: Wallet },
  { title: "Academy", href: "/admin/academy", icon: GraduationCap },
  // Pós-MVP: Alertas, Configurações.
]

interface AdminSidebarProps {
  adminName: string
  adminSubtitle?: string
}

export function AdminSidebar({
  adminName,
  adminSubtitle = "Equipe Biohelp",
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  const isItemActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const NavBody = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex items-center px-4 py-6 border-b border-sidebar-border",
          collapsed && !mobile ? "justify-center px-2" : "flex-col items-start gap-1",
        )}
      >
        {collapsed && !mobile ? (
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
          <>
            <Image
              src="/logo-oficial.png"
              alt="Biohelp Nutrition Club"
              width={200}
              height={56}
              priority
              className="h-7 w-auto"
            />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Painel Admin
            </p>
          </>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const active = isItemActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground bh-shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && !mobile && "justify-center px-2",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobile) && (
                <span className="font-medium text-sm">{item.title}</span>
              )}
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
          <BHAvatar name={adminName} size="md" />
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{adminName}</p>
              <p className="text-xs text-muted-foreground">{adminSubtitle}</p>
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

      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex flex-col gap-0.5">
          <Image
            src="/logo-oficial.png"
            alt="Biohelp Nutrition Club"
            width={200}
            height={56}
            priority
            className="h-6 w-auto"
          />
          <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
            Painel Admin
          </span>
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SheetTitle className="sr-only">Menu Admin</SheetTitle>
            <NavBody mobile />
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}
