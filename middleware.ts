/**
 * Middleware de autenticação
 * SPEC: Seção 6.2, 6.3 - Proteção de rotas autenticadas
 * Sprint: 1
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/admin', '/trocar-senha']

// Rotas públicas (não requerem auth)
const publicRoutes = ['/', '/login', '/join', '/auth/callback', '/admin-login']

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
  const hostname = request.headers.get('host') ?? ''

  // Separação de domínios: admin.bio-help.com só serve /admin e /admin-login
  // painel.bio-help.com serve tudo EXCETO /admin
  const isAdminDomain = hostname.startsWith('admin.')
  const isPainelDomain = hostname.startsWith('painel.')

  // Parceira autenticada (não-admin) que o guard de /admin jogou pra /dashboard:
  // no domínio admin, /dashboard cairia de volta em /admin (regra abaixo), o guard
  // de novo em /dashboard → loop (ERR_TOO_MANY_REDIRECTS). Manda pro painel (host
  // absoluto) pra quebrar o ciclo. Só afeta admin.bio-help.com (isAdminDomain).
  if (isAdminDomain && pathname === '/dashboard' && user) {
    return NextResponse.redirect(new URL('/dashboard', 'https://painel.bio-help.com'))
  }

  if (isAdminDomain && !pathname.startsWith('/admin') && pathname !== '/login' && !pathname.startsWith('/auth/') && pathname !== '/welcome') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (isPainelDomain && pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // F-V28: troca de senha obrigatória após login com senha provisória.
  // Enquanto `app_metadata.must_reset_password` estiver setada, qualquer rota
  // autenticada é desviada pra /trocar-senha (a flag é limpa ao salvar a nova).
  const mustReset = user?.app_metadata?.must_reset_password === true
  if (
    user &&
    mustReset &&
    pathname !== '/trocar-senha' &&
    !pathname.startsWith('/auth/')
  ) {
    return NextResponse.redirect(new URL('/trocar-senha', request.url))
  }

  // Verificar se é rota protegida.
  // F-V19 hotfix 01/06: usar match exato OU prefixo com barra final, pra evitar
  // que /admin-login (rota pública) seja incorretamente classificado como
  // protegido porque `/admin-login`.startsWith('/admin') === true.
  const isProtectedRoute = protectedRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  // Se rota protegida e não autenticado, redireciona para login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se autenticado e tentando acessar login/join, não interferir
  if (user && pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo && (redirectTo === '/admin' || redirectTo === '/dashboard')) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    if (isAdminDomain) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
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

