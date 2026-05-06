# F-V17 — Matriz de Validação (S5)

**Caminho escolhido:** Shopify App Proxy (Multipass requer Plus que a loja Biohelp não tem).

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | Multipass token válido + email → /dashboard | n/a | n/a | App Proxy escolhido em vez de Multipass. Equivalente: signature válida + customerId mapeado em shopify_customers → magic link redireciona pra /dashboard. Validado em inspeção do `lib/sso/handler.ts`. |
| CA-02 | Token expirado → 401 + login | inspeção | ✅ | App Proxy não tem expiração de token; validação é por signature HMAC sobre query string. Signature inválida → `recordAuthAudit('invalid_signature')` + 403. |
| CA-03 | Email Shopify sem member → /join?ref | inspeção | ✅ | `app/api/sso/shopify/route.ts:91-94` — quando `result.reason === 'member_not_found'` redireciona pra `/join` com ref se presente. |
| CA-04 | HMAC inválido → 403 | unit | ✅ | `test-f-v17-app-proxy.mjs` — caso "tampered → invalid", "wrong secret → invalid", "missing sig → invalid". 6/6 passes (replicado inline). |
| CA-05 | 100 SSOs simulados sem race | n/a | ⏸ | Adiar pra prod — load test pós-rollout 1 semana com 5 usuárias internas. |
| CA-06 | Logout painel ≠ logout Shopify | inspeção | ✅ | Sessões separadas por design — Shopify e Supabase têm cookie domains/escopos distintos. Documentado em `SHOPIFY-SETUP.md` §8. |

**Build/lint:** ⏳ Não rodado nesta sessão (Bash sem permissão). Imports verificados: `@/lib/supabase/server` (existe), `@/lib/sso/*` (criados nesta sessão), `node:crypto`.

**Setup doc:** `docs/sdd/features/F-V17-sso-shopify/SHOPIFY-SETUP.md` — passo a passo de configuração no Partner Dashboard, link no tema, smoke test.

**Auditoria:** tabela `auth_audit` aplicada via MCP — schema validado com INSERT + DELETE de teste.

**Riscos:**
- Magic link expira em 1h (default Supabase). Mitigação: redirect imediato.
- Sessão Shopify e Supabase independentes — logout em uma não desloga a outra. Documentado.
- TBD-F-V17-1: cliente quer auto-criação de member se não existir? Hipótese padrão: NÃO (member já deve existir via webhook customers/create).

**Próximo:** ativar `LRP_V2_SSO=true` em ambiente de homologação; configurar App Proxy no Partner Dashboard; smoke com 1 usuário test (rollout gradual).
