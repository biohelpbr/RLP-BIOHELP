# Risk Classification — Biohelp LRP

> Espelho dos critérios do manual `.claude/harness-v3.2-manual.html` §7, adaptado ao projeto.

## Classes

### A — Trivial
- Typo, layout, ajuste sem contrato.
- Sem teste obrigatório. Merge direto em main permitido.
- Modo: Fast Fix ou Standard.

### B — Normal
- CRUD simples, endpoint não crítico, UI nova, refactor isolado sem impacto em contrato público.
- Feature Contract inline no `TODO.md`. CI N1. Branch `feat/F-VNN-<slug>` obrigatória.
- Modo: Standard.

### C — Crítico
- Auth (Supabase Auth, magic link, SSO).
- Payout / Comissão / Saldo / Crédito Shopify.
- Permissões / RLS policies.
- Dados sensíveis (members, payouts, NF, dados fiscais).
- Modo: Deep Work. Feature Contract detalhado. CI N2 (N1 + integration test do CA + revisão humana sugerida).

### D — Produção
- Migration Supabase aplicada em prod.
- Deploy real (Vercel push).
- Env var nova em prod.
- Webhook financeiro (Cashin, Shopify orders/paid, Asaas legado).
- RLS policy alterada.
- Mudança de feature flag default em prod.
- Modo: Production. Feature Contract + `docs/plans/cursor-brief.md` (se Cursor Agent for usado) + rollback escrito + feature flag + staging via Vercel preview deploy + smoke test.
- CI N3.

## Desempates

1. Toca produção / banco real / envs → **D**.
2. Envolve auth / dinheiro / permissões / dados sensíveis → **C**.
3. Cria/altera contrato público (API, schema Zod, webhook payload) → **mínimo B**.
4. Código isolado sem contrato → **A**.
5. Em dúvida, escolha a classe **mais alta**.

## Auto-reclassificação

Feature B virou C/D no meio (ex.: começou CRUD, virou migration; começou UI, virou hook de webhook) → **PARE, atualize SPEC, peça aprovação humana**. Suba a classe, nunca desça.

## CI alvo por classe

| Classe | CI alvo | Comandos atuais |
|---|---|---|
| A | N1 | `npm run lint` |
| B | N1 + 1 teste do CA principal | `npm run lint && npx tsc --noEmit && node test-*-relevante.mjs` |
| C | N2 (N1 + integration + contract) | acima + integration manual com curl/supabase MCP + screenshot |
| D | N3 (N2 + e2e + smoke + migration validation + Vercel preview check) | acima + Playwright manual + Vercel preview + smoke HTTP |
