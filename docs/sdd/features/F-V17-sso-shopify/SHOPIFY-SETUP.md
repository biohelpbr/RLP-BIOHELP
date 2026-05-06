# F-V17 — Setup do SSO Shopify (App Proxy)

> Passo a passo pra ativar o login automático Shopify → Painel Biohelp via App Proxy.
> Caminho escolhido: **App Proxy** (Multipass exige plano Plus, que a loja Biohelp não tem).

## 1. Pré-requisitos

- App privado/custom já instalado na loja `biohelp-dev.myshopify.com`.
- `SHOPIFY_API_KEY` e `SHOPIFY_API_SECRET` configurados no `.env.local` e na Vercel.
- App `Biohelp LRP` aprovado para a loja com escopo `read_customers,write_customers,read_orders`.

## 2. Configurar App Proxy no Partner Dashboard

1. Acesse: https://partners.shopify.com → Apps → Biohelp LRP → **App setup**.
2. Role até **App proxy** e clique em **Edit**.
3. Preencha:
   - **Sub-path prefix:** `apps`
   - **Sub-path:** `clube`
   - **Proxy URL:** `https://rlp-biohelp.vercel.app/api/sso/shopify`
4. Salve.

Resultado: link público `https://biohelp-dev.myshopify.com/apps/clube` proxia para nosso endpoint Next.js.

## 3. Adicionar link no tema da loja

No theme editor da Shopify (Online Store → Themes → Customize):

```liquid
{% if customer %}
  <a href="/apps/clube">Acessar Clube Biohelp</a>
{% endif %}
```

Ou via menu de navegação: adicionar item com URL `/apps/clube`.

## 4. Ativar a flag

No `.env.local` (dev) e na Vercel (prod):

```
LRP_V2_SSO=true
```

Default é `false` — endpoint redireciona pra `/login` enquanto flag estiver desligada (rollout gradual).

## 5. Smoke test

### A. Cliente logado + member existente
1. Logue-se na storefront com email que tem member correspondente.
2. Clique no link `/apps/clube`.
3. **Esperado:** redirect pra `/dashboard` autenticado em <2s.

### B. Cliente logado + member ausente
1. Logue-se na storefront com email que NÃO tem member.
2. Clique no link.
3. **Esperado:** redirect pra `/join`.

### C. Cliente sem login na Shopify
1. Acesse `/apps/clube` sem login.
2. **Esperado:** redirect pra `/login`.

### D. Tentativa direta no endpoint (sem proxy Shopify)
1. `curl https://rlp-biohelp.vercel.app/api/sso/shopify`.
2. **Esperado:** HTTP 403 `{"error":"Invalid signature"}` (assinatura ausente).

## 6. Auditoria

Toda tentativa fica em `auth_audit`. Query útil pra debug:

```sql
SELECT created_at, outcome, email, details
FROM auth_audit
WHERE source = 'shopify_app_proxy'
ORDER BY created_at DESC
LIMIT 50;
```

## 7. Rollback

Para desligar o SSO:
1. `LRP_V2_SSO=false` na Vercel.
2. Remover link `/apps/clube` do tema (opcional — endpoint redireciona pra login enquanto flag ON está down).

## 8. Riscos / TBDs

- **Sessão Supabase** vs **sessão Shopify** são independentes. Logout no painel não desloga da Shopify (e vice-versa). Documentado e aceito.
- **Magic link expira em 1h** (default Supabase). Se cliente clica no link e demora pra ser redirecionado, recebe erro. Mitigação: redirect imediato.
- **TBD-F-V17-1:** Confirmar com cliente se eles querem que SSO crie member automaticamente caso não exista (auto-join via webhook customers/create já registrado, então member deve já existir antes de fazer login na storefront).
