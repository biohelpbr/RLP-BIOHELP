# Runbook — Separação Admin × Parceira (subdomínios)

> Registrado 2026-05-31 após investigação pré-go-live F-V19. Descreve como o painel
> separa admin de parceira, quirks conhecidos e o fix do redirect loop (PR #11).

## Modelo de separação (2 camadas)

1. **Subdomínio (middleware.ts):**
   - `admin.bio-help.com` (`isAdminDomain`): qualquer rota ≠ `/admin` (e ≠ `/login`, `/auth/*`, `/welcome`) → redireciona pra `/admin`.
   - `painel.bio-help.com` (`isPainelDomain`): rota que começa com `/admin` (≠ `/admin-login`) → redireciona pra `/dashboard`.
   - `protectedRoutes = ['/dashboard','/admin']` exigem **auth** (qualquer usuário logado). **Middleware NÃO checa role.**
2. **Role check por página (a proteção real):** TODA página admin V2 faz
   `if (!(await isCurrentUserAdmin())) redirect('/dashboard')`
   (`lib/supabase/server.ts` → auth.users → members → roles). `app/admin/layout.tsx` e
   `app/(member)/layout.tsx` são passthrough — o guard está nas pages.

**Conclusão da investigação 31/05:** não há vazamento de dados cross-role. Cookies são
host-only por subdomínio (sessão no painel não vale no admin e vice-versa).

## Quirk 1 — `/admin-login` é tratado como rota protegida
`protectedRoutes` usa `pathname.startsWith('/admin')`, e `'/admin-login'.startsWith('/admin')`
é `true`. Logo um usuário **não autenticado** em `/admin-login` é mandado pra `/login`
(mesma tela OTP V2Login, então funciona). Cuidado ao mexer em `protectedRoutes` pra não
quebrar isso sem querer.

## Quirk 2 — Conta admin é também `member` (ver F-V21 no TODO)
ADMIN001/ADMIN002/HOUSE têm member row (estrutural: admin é resolvido via auth→member→role).
Efeitos: `ref_code` deles é tecnicamente usável como sponsor (`createPreRegistration` só
bloqueia sponsor `cancelled`); aparecem em `/admin/community` como "pending". Não infla
"Ativos" (subscription_status pending). Não-bloqueador; tracking em F-V21.

## Redirect loop (RESOLVIDO — PR #11)
**Sintoma:** parceira (não-admin) **autenticada** em `admin.bio-help.com` → `/admin` →
`ERR_TOO_MANY_REDIRECTS`. Causa: guard de `/admin` manda `/dashboard`; middleware do
domínio admin manda `/dashboard` de volta pra `/admin` → loop.
**Fix:** no domínio admin, `/dashboard` de usuário autenticado redireciona pro painel
(host absoluto `https://painel.bio-help.com/dashboard`). Só afeta `admin.*`; preview
`*.vercel.app` não dispara (logo, valida-se em produção, não na preview).
**Teste (local, next dev + curl com Host spoof):**
```
curl -H "Host: admin.bio-help.com" -H "Cookie: sb-...=<parceira>" localhost:3000/dashboard
# -> 307 https://painel.bio-help.com/dashboard  (sem loop)
```
