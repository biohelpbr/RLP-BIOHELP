# F-V07b — Cashin live (sandbox)

## Metadata
- ID: F-V07b (sub-feature de F-V07)
- Classe: D (provider externo de pagamento + admin-only endpoint)
- Status: Draft → S5
- Onda: 7 (S5)
- Data: 2026-05-06

## Contexto
PIVOT-V2 TBD-19 ✅: Cashin é provider escolhido para PIX/cashback. F-V07 (S2) deixou a UI funcional + persistência `pending`. Esta sub-feature em S5 conecta o backend ao Cashin **em sandbox apenas** — credenciais de produção pendem do cliente.

**Decisão de design:** interface agnóstica (`CashinClient` interface) pra permitir mock/sandbox/prod com troca por env var (`CASHIN_MODE=mock|sandbox|live`). Em S5, default `mock` no `.env.local` exemplo + sandbox quando admin tem env real.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Anti-SPEC §11 (`lib/payouts/v2` agnóstico) citada
- [x] TBD-1/TBD-2 não bloqueiam (S5 trata estrutura, não cálculo de comissão)

## Requisitos Funcionais
- **RF-1:** Interface `CashinClient` em `lib/payouts/v2/cashin.ts` com métodos `transfer({amount, pixKey, payoutId})` e `getStatus(transactionId)`.
- **RF-2:** 3 implementações:
  - `MockCashinClient`: retorna sucesso fake imediato (default em dev).
  - `SandboxCashinClient`: chamada HTTP real ao endpoint sandbox da Cashin com auth Bearer.
  - `LiveCashinClient`: idem sandbox mas com base URL prod (placeholder, requer creds).
- **RF-3:** Factory `getCashinClient()` baseada em `process.env.CASHIN_MODE`.
- **RF-4:** Função `transferPayout(payoutId)` em `lib/payouts/v2/transfer.ts`:
  - Valida `payout.status === 'pending'` e `payout.payout_method === 'pix'`.
  - Chama `client.transfer(...)`.
  - Atualiza `payout_requests` com `status='processing'`, `transaction_id=<retorno>`.
  - Em caso de erro, status→`pending` (retry possível) + log.
- **RF-5:** Endpoint `app/api/payouts/cashin/transfer/[id]/route.ts`:
  - Apenas admin (validação via `getCurrentMember()` + lookup em `roles`).
  - POST chama `transferPayout(id)`.
  - Retorna 200 com `{status, transaction_id}` ou 4xx/5xx.
- **RF-6:** Endpoint `app/api/webhooks/cashin/status/route.ts`:
  - Recebe webhook do Cashin com status update.
  - Sandbox: assinatura pode ser HMAC ou token simples (a definir com doc Cashin — placeholder usa token compartilhado em env).
  - Atualiza `payout_requests.status` para `paid`/`failed` baseado no payload.
- **RF-7:** Gate `LRP_V2_CASHIN_LIVE=false` no `.env.local`. Endpoint retorna 503 quando OFF.

## Critérios de Aceite
- **CA-01:** Mock client transfer → status virá `processing`. e2e via curl.
- **CA-02:** Sandbox client com `CASHIN_MODE=sandbox` + creds env → faz request real (mockado em testes via interceptor).
- **CA-03:** Endpoint admin-only — usuário comum chamando POST → 403.
- **CA-04:** Webhook status `paid` → row vira `paid`.
- **CA-05:** Webhook status `failed` → row vira `pending` (permite retry).
- **CA-06:** Flag OFF → endpoint 503 + log "cashin disabled".

## Arquivos PERMITIDOS
- `lib/payouts/v2/cashin.ts`
- `lib/payouts/v2/transfer.ts`
- `app/api/payouts/cashin/transfer/[id]/route.ts`
- `app/api/webhooks/cashin/status/route.ts`
- `.env.local` (CASHIN_MODE, CASHIN_API_TOKEN, LRP_V2_CASHIN_LIVE)
- `.env.example`

## Arquivos PROIBIDOS (Anti-SPEC)
- `lib/payouts/constants.ts` (v1) — não estender.
- Webhook v1 ativos (Anti-SPEC §4).
- `lib/cv/*`, `lib/commissions/*` (legado v1).

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | curl POST endpoint mock → 200 | manual | TODO | … |
| CA-02 | Sandbox call structured (mock fetch) | unit | TODO | … |
| CA-03 | Auth check em route handler | unit | TODO | … |
| CA-04 | Webhook paid → status=paid | integration | TODO | … |
| CA-05 | Webhook failed → status=pending | integration | TODO | … |
| CA-06 | Flag OFF → 503 | smoke | TODO | … |

## Rollback
- Revert do PR.
- Endpoint endpoints novos não tocam tabelas existentes (apenas update status). Se row foi atualizada incorretamente, admin marca manualmente.
- Flag `LRP_V2_CASHIN_LIVE=false` desliga endpoint em runtime.
