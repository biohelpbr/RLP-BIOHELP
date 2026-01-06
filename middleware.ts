/**
 * Middleware de autenticação
 * SPEC: Seção 6.2, 6.3 - Proteção de rotas autenticadas
 * Sprint: 1
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/admin']

// Rotas públicas (não requerem auth)
const publicRoutes = ['/', '/login', '/join']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh da sessão
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Verificar se é rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Se rota protegida e não autenticado, redireciona para login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se autenticado e tentando acessar login/join, não interferir
  // O redirecionamento será feito pelo frontend após o login
  // Isso permite que o login redirecione corretamente para /admin ou /dashboard
  if (user && pathname === '/login') {
    // Verificar se há um redirect pendente na query string
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo && (redirectTo === '/admin' || redirectTo === '/dashboard')) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // Se não há redirect específico, deixar o frontend decidir
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

