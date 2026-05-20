# Runbook — Rollback (produção)

## Quando usar
- Feature D quebrou prod.
- Webhook orders/paid começou a retornar 500.
- Hook v2 derrubou resposta de webhook v1 (regressão Anti-SPEC §4).

## Rollback de código (Vercel)
1. Vercel → Deployments → escolher deploy anterior estável → **"Promote to Production"**.
2. Confirmar: `curl https://rlp-biohelp.vercel.app/api/health` retorna 200.
3. Logar incidente em `docs/wiki/log.md` com tipo `[BUGFIX]` ou `[INCIDENT]`.

## Rollback de migration Supabase
**Nunca usar `supabase db reset`.** Em vez disso:

1. Localizar o bloco "Rollback" comentado no topo da migration que causou problema.
2. Criar **nova migration reversa** (`YYYYMMDD_revert_<slug>.sql`) com o SQL do rollback.
3. Aplicar via Supabase MCP (`mcp__supabase__apply_migration`).
4. Validar com SELECT que o schema voltou ao esperado.
5. Atualizar `docs/contracts/CONTRACTS.md` §3.

## Rollback de feature flag
- Toggle `LRP_V2=false` no painel Vercel (env vars de prod).
- Redeploy automático em ~30s.
- Membros caem de volta para v1 (UI v1 + rotas v1).

## Pós-rollback
- Registrar incidente em `docs/wiki/log.md`.
- Criar runbook específico em `docs/wiki/runbooks/` se for bug recorrente.
- Reabrir Feature Contract da feature D em questão, atualizar matriz de validação com o que falhou, retomar fix em branch nova.
