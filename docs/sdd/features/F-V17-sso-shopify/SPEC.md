# F-V17 — SSO Shopify → Painel (sem duplo login)

## Metadata
- ID: F-V17
- Classe: D
- Status: Approved (S5 — App Proxy escolhido; loja Biohelp não tem Plus)
- Onda: 7 (Sprint 5 — Integrações finais, 03–09/06/2026)
- Data: 2026-05-06 (refinada)

## Decisão de implementação (S5)
**Caminho escolhido: Shopify App Proxy.**

Razão: Multipass é exclusivo do plano Shopify Plus. A loja Biohelp atual está em plano Standard (confirmado via `SHOPIFY_STORE_DOMAIN=biohelp-dev.myshopify.com` no env e ausência de header `X-Shopify-Plus`). App Proxy funciona em qualquer plano, exige apenas que o app esteja instalado na loja, e usa HMAC sobre query string com `SHOPIFY_API_SECRET` (já no env).

**Fluxo:**
1. Cliente logado na Shopify clica em link interno tipo `https://biohelp-dev.myshopify.com/apps/clube` (configurado no Partner Dashboard como App Proxy → `/api/sso/shopify/proxy`).
2. Shopify proxy adiciona `signature` + `logged_in_customer_id` + `shop` na query string.
3. Nosso endpoint valida a `signature` (HMAC SHA256 dos params alfabeticamente) com `SHOPIFY_API_SECRET`.
4. Se válido + `logged_in_customer_id` presente → busca `shopify_customers` table → encontra `member_id` → cria magic-link Supabase via Admin API → redireciona pra `/dashboard?auth=<token>`.
5. Se sem `logged_in_customer_id` (cliente Shopify não logada) → redireciona pra `/login`.
6. Se member não encontrado → redireciona pra `/join` (F-V01).

## Contexto
Reunião 29/04 PM (minuto 03:33–05:14): cliente quer que a usuária logada na Shopify clique no atalho "clube" e caia direto em `/dashboard` sem novo login. Wink mencionou implementação análoga puxando dado do Stripe pra Cliente. Mateus citou sessão memorizada no navegador, mas Léo deixou claro: **não pode haver duplo login**.

## Definition of Ready
- [x] RFs definidos
- [ ] CAs testáveis
- [ ] **Validação técnica obrigatória ANTES de codar:**
  - [ ] Confirmar se loja usa **Customer Accounts (Classic)** ou **New Customer Accounts** da Shopify.
  - [ ] Avaliar **Multipass** (premium feature, depende do plano da loja).
  - [ ] Avaliar **App Proxy** + verificação de assinatura HMAC (rota da Shopify chama nosso backend).
  - [ ] Decidir entre: (a) Multipass token na URL → Supabase Auth `signInWithIdToken`, (b) App Proxy → criar magic link interno.
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada

## Requisitos Funcionais
- **RF-1:** Cliente logada na Shopify clica no link de acesso ao painel; servidor Next valida origem da Shopify (HMAC ou Multipass token); se válido, faz login automático no Supabase com o `email` e redireciona pra `/dashboard`.
- **RF-2:** Se token inválido/expirado → cai pra `/login` com mensagem de erro.
- **RF-3:** Se a usuária Shopify não tem `member` correspondente no Supabase → redireciona pra `/join?ref=<sponsor>` (F-V01).
- **RF-4:** Auditoria: log de cada SSO (sucesso/falha) em `auth_audit` ou similar — pra debug de fricção.
- **RF-5:** Funcionalidade atrás de `LRP_V2`. Quando OFF, link da Shopify aponta pro `/login` direto (comportamento v1).

## Critérios de Aceite (esboço — refinar pós-PoC)
- CA-01: Multipass token válido + email existente em `members` → redireciona pra `/dashboard` em <2s.
- CA-02: Multipass token expirado → erro 401 + redirect login.
- CA-03: Email Shopify sem member correspondente → redirect `/join` com `ref` se houver cookie.
- CA-04: HMAC inválido em App Proxy → 403.
- CA-05: 100 SSOs simulados em ambiente de teste — sem race condition de criação de sessão.
- CA-06: Logout no painel não invalida sessão Shopify (e vice-versa) — escopo separado.

## Arquivos PERMITIDOS
- `app/api/sso/shopify/route.ts` — endpoint que recebe Multipass/App Proxy
- `lib/sso/multipass.ts` (decode + verify) ou `lib/sso/app-proxy.ts` (verify HMAC)
- `lib/sso/handler.ts` — orquestra: verificação → busca member → login Supabase → redirect
- `supabase/migrations/<data>_auth-audit.sql` — tabela `auth_audit`
- Configuração na Shopify Admin (instalação de app privado / Multipass) — fora do repo, documentar passos em `docs/sdd/features/F-V17-sso-shopify/SHOPIFY-SETUP.md`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não mexer em `lib/supabase/server.ts` sem PR separado (auth tocando produção).
- Não tocar `middleware.ts` raiz sem aprovação humana.
- Não armazenar Multipass secret em código — só em env var (`SHOPIFY_MULTIPASS_SECRET`).

## Riscos críticos (classe D)
- **Hijacking de sessão:** Multipass token usado em outro contexto. Mitigação: TTL curto (60s), bind por IP/user-agent.
- **Plano Shopify**: Multipass exige plano Plus. Se loja não for Plus, fallback obrigatório pra App Proxy.
- **Race condition** entre logout de uma aba e login pelo SSO em outra.
- **GDPR/LGPD**: SSO transmite email — verificar consentimento.

## Plano de implementação
1. **PoC primeiro** — não criar SPEC final sem validar em ambiente de teste com a loja Biohelp real (Wink/Gabi).
2. Se Multipass OK → branch `feat/F-V17-sso-shopify-multipass`.
3. Se App Proxy → branch `feat/F-V17-sso-shopify-app-proxy`.
4. Testar com 3 cenários: usuária ativa, usuária expirada, email não-cadastrado.
5. Rollout gradual: flag `LRP_V2_SSO=false` por default, 1 semana com 5 usuárias internas, depois global.

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 a CA-06 | … | end-to-end | ⏳ | … |

## Loveable — elementos descartados
- Login screen Loveable mostra "Versão Demo — link simulado". Substituir por fluxo real Supabase + opção SSO Shopify.
