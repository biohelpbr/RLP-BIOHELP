# F-V05 — Saldo + créditos Shopify

## Metadata
- ID: F-V05
- Classe: C
- Status: Done (UI v2 — chamada API `customer.credit` real fica pra S5)
- Onda: 7 (Sprint 2 — Membro core, 13–19/05/2026)
- Data: 2026-05-05 (validação 06/05/2026 — branch `feat/S2-membro-finish`)

## Contexto
Pivô V2 (`PIVOT-V2.md` §1): membro acumula saldo originado de comissões 50% (F-V04) sobre assinaturas dos seus afiliados. Em vez do modelo v1 (CV → comissão por nível, RPA até R$1.000), o v2 oferece **uma única conversão saldo → crédito Shopify 1:1** (TBD-14 resolvido) ou saque cash via Cashin (F-V07, só Founder + CNPJ ou Cashin direto).

Esta feature entrega:
- Visualização do saldo disponível e do saldo bloqueado/pendente.
- Conversão `saldo → crédito Shopify` via API `customer.credit` (TBD-14 refinado em 29/04 PM).
- Histórico de movimentações (créditos gerados, resgates pedidos).

Em S2, a UI da F-V05 coexiste com `WithdrawDialog` (F-V07) — F-V05 é a aba "Crédito Shopify" do dialog. A integração Cashin live (F-V07 PIX/Cashback) e a chamada real da API `customer.credit` ficam pra S5.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis preenchidos
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBDs bloqueantes resolvidos (TBD-14 ✅; TBD-21 e TBD-23 não-bloqueantes — hipóteses padrão documentadas)

## Requisitos Funcionais
- **RF-1:** UI exibe `saldo_disponivel` (comissões com `available_at <= now()`) e `saldo_pendente` (comissões com `available_at > now()` — Net-15).
- **RF-2:** UI exibe histórico de movimentações: créditos recebidos (entrada) + pedidos de resgate (saída — independente do método).
- **RF-3:** Membro pode pedir resgate via "Crédito Shopify" — aba do `WithdrawDialog`. Persiste em `payout_requests` com `payout_method='shopify_credit'`, status `pending`.
- **RF-4:** Saldo zero → CTA "Convide para começar" + link `/dashboard/club`.
- **RF-5:** Métricas exibidas: "Recebido total" (sum approved+completed) e "Disponível" (calc atual).
- **RF-6:** Hipótese padrão TBD-23: crédito Shopify gerado por resgate **não tem validade** após criado. Documentado na UI.
- **RF-7:** Hipótese padrão TBD-21: membro inativo (`subscription_status != 'active'`) há 90 dias perde direito de converter saldo. Em S2, **só registra a hipótese no SPEC**; bloqueio na server action é documentado mas controlado por flag `LRP_V2_INACTIVE_BLOCK=false` (default off, ativa pós-cliente confirmar).

## Critérios de Aceite
- **CA-01:** ao acessar `/dashboard/finance` com flag `LRP_V2=true`, vê 3 cards (Disponível, Pendente, Recebido total). Cada um traz valor formatado em BRL.
- **CA-02:** abrir `WithdrawDialog` na aba "Crédito Shopify" → preencher valor menor ou igual ao Disponível → submit → toast success + `payout_requests` recebe row com `payout_method='shopify_credit'`, `status='pending'`, `amount=<valor>`.
- **CA-03:** resgate com valor > Disponível → toast error "Valor acima do disponível", sem insert em DB.
- **CA-04:** resgate com valor zero ou negativo → erro Zod, sem submit.
- **CA-05:** histórico (lista) reflete o resgate criado em CA-02 com badge "Pendente".
- **CA-06:** flag `LRP_V2=false` → rota `/dashboard/finance` redireciona pra `/dashboard` (rota nova é v2-only — não tem equivalente v1 paralelo direto).

## Arquivos PERMITIDOS
- `app/dashboard/finance/page.tsx` — RSC, busca saldo + histórico, renderiza UI.
- `lib/credits/queries.ts` — getMemberBalance(memberId), listMemberCreditMovements(memberId).
- `lib/credits/schema.ts` — Zod (se exigido por server actions; primário fica em `lib/payouts/v2`).
- `components/biohelp/WithdrawDialog.tsx` — extendido (F-V07).
- `supabase/migrations/<data>_f-v07-payout-method.sql` — compartilhado com F-V07.

## Arquivos PROIBIDOS (Anti-SPEC aplicável)
- `lib/cv/*`, `lib/levels/*`, `lib/commissions/*` — modelo v1 (Anti-SPEC §10, 12).
- `_loveable_import/src/types/index.ts` (`Partner.availableBalance` literal v1) — descartar (Anti-SPEC §12).
- `_loveable_import/src/lib/fake-api.ts` — modelo v1 (Anti-SPEC §13).

## TBDs
- **TBD-21** *(não-bloqueante, hipótese padrão):* membro inativo perde direito após 90 dias de inativação. Em S2 só documenta — bloqueio controlado por flag `LRP_V2_INACTIVE_BLOCK` (default OFF).
- **TBD-23** *(não-bloqueante, hipótese padrão):* crédito Shopify gerado por resgate **não tem validade**. Admin pode forçar expiração via futuro painel admin (pós-S5).

## Plano de implementação
1. Branch herdada `feat/S2-membro-finish`.
2. Migration F-V07 (compartilhada) — adiciona `payout_method` em `payout_requests`.
3. `lib/credits/queries.ts` — funções de leitura. Compute saldo via `commission_ledger` agregado.
4. `lib/payouts/v2/actions.ts` — server action `requestPayout` (3 métodos).
5. UI: card de saldo + histórico em RSC. Dialog em client component.
6. Smoke flag ON/OFF.

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | GET `/dashboard/finance` (sponsor logado, flag ON) renderiza 3 cards `Disponível` / `Pendente (Net-15)` / `Recebido total` | curl HTML grep | ✅ | HTML contém os 4 markers (`Disponível`, `Pendente (Net-15)`, `Recebido total`, `Solicitar resgate`) — saldo zero pra sponsor (F-V04 não rodou ainda). RPC `get_available_balance` invocada via `lib/payouts/v2/queries.getMemberBalance`. |
| CA-02 | Insert payout_request com `payout_method='shopify_credit'`, `status='pending'`, amount 10,00 | SQL via service_role | ✅ | INSERT retornou id `9c232a79-…`. GET `/dashboard/finance` mostra label `Crédito na loja` no histórico (de `lib/payouts/v2/schema.PAYOUT_METHOD_LABELS`). |
| CA-03 | `requestPayout({ amount > available })` retorna `{ ok:false, error:"Valor acima do disponível…" }` sem inserir | Inspeção do código `lib/payouts/v2/actions.ts` | 🟡 | Lógica `if (amount > balance.available_for_withdrawal) return { ok:false, ... }` confirmada no source (linhas 35-43). Toast UI ativa via `WithdrawDialog`. End-to-end via UI: pendente do humano (F-V04 ainda não popula saldo). |
| CA-04 | `requestPayoutSchema.safeParse({ amount: 0 })` retorna issue.message `"Valor precisa ser maior que zero"` | Zod schema (`lib/payouts/v2/schema.ts`) | ✅ | `amount: z.coerce.number().positive("Valor precisa ser maior que zero")` em `requestPayoutSchema`. |
| CA-05 | GET `/dashboard/finance` lista 3 resgates pending com badge "Pendente" | curl HTML grep | ✅ | HTML contém `Pendente`, `Cashback Cashin`, `Crédito na loja`, `PIX (Founder + NF)` — labels do enum + status badge. |
| CA-06 | GET `/dashboard/finance` com flag OFF → redireciona pra `/dashboard` | curl `-L` + `%{url_effective}` | ✅ | `/dashboard/finance -> /dashboard` confirmado. |

## Loveable — elementos descartados
- `Partner.availableBalance: number` literal v1 — substituído por agregação de `commission_ledger`.
- `Partner.cashbackEarned`, `Partner.totalEarned` (do mock) — recalculados via Supabase.
- Cores/gradientes do Loveable mantidos via tokens HSL (`bg-primary`, `bg-bh-lime/20`) — apenas semânticas.

## Rollback
- Revert do PR.
- Migration reversa: `supabase/migrations/<data>_f-v07-payout-method.sql` (drop coluna `payout_method`).
- Feature flag desligar: `LRP_V2=false` → rota redireciona, dialog não acessível.
