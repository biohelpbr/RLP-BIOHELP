# F-V07b — Matriz de Validação (S5)

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | Mock client transfer → status processing | unit | ✅ | `test-f-v07b-cashin-mock.mjs` (lógica replicada inline). Lógica em `lib/payouts/v2/cashin.ts:36-48`. |
| CA-02 | Sandbox mode chama HTTP real | unit/inspeção | ✅ | Implementação `SandboxCashinClient` faz `fetch(POST /v1/transfers)` com Bearer auth. Não testado contra endpoint real (cred ausente — `CASHIN_API_TOKEN=""`). Estrutura agnóstica conforme Anti-SPEC §11. |
| CA-03 | Endpoint admin-only | inspeção | ✅ | `app/api/payouts/cashin/transfer/[id]/route.ts:23-28` — `isCurrentUserAdmin()` retorna 403 se não admin. |
| CA-04 | Webhook paid → status=paid | inspeção | ✅ | `lib/payouts/v2/transfer.ts:applyCashinStatusUpdate` mapeia `paid|completed → 'paid'`. |
| CA-05 | Webhook failed → status=pending (retry) | inspeção | ✅ | Mesma função: `failed|rejected → 'pending'`. |
| CA-06 | Flag OFF → 503 | inspeção | ✅ | Endpoint primeiro check é `LRP_V2_CASHIN_LIVE !== "true"` → 503. Mesma lógica em webhook receiver. |

**Status geral:**
- 🟢 **Mock** funciona standalone (rodável em dev sem cred).
- 🟡 **Sandbox** estruturado mas não testado vs endpoint real — aguarda credenciais.
- 🔴 **Live** placeholder herda de Sandbox; URL/token devem vir do cliente.

**Bloqueio:** credenciais de sandbox/produção da Cashin pendem do cliente (TBD-19 está ✅ resolvido — provider escolhido — mas o onboarding de creds via Léo não chegou). `CASHIN_MODE=mock` mantém o fluxo dev funcional.

**Próximo:** quando creds chegarem, mudar `CASHIN_MODE=sandbox` no env, rodar primeiro transfer real via curl admin endpoint, validar webhook receiver.
