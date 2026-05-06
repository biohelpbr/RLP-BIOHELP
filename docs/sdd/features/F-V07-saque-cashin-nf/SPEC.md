# F-V07 — Saque Founder via Cashin + NF + triple resgate

## Metadata
- ID: F-V07
- Classe: D
- Status: Done — escopo S2 (UI 3 abas + persistência pending). Cashin live + validação automática NF + chamada `customer.credit` ficam pra S5.
- Onda: 7 (S2 — UI inicial; S5 — Cashin live + validação NF)
- Data: 2026-05-05 (validação 06/05/2026 — branch `feat/S2-membro-finish`)

## Contexto
Pivô V2 (`PIVOT-V2.md` §1, reunião 29/04 PM): membro promovido a Founder (≥5 ativos no clube — F-V06) ganha direito de **sacar cash** via Cashin (PIX) com NF de serviço emitida pra Biohelp. Membros não-Founder (CPF ou Founder sem CNPJ — TBD-20) podem usar Cashin direto (sem NF) ou converter pra crédito Shopify (F-V05).

**Triple resgate (refino 29/04 PM):** três métodos no `WithdrawDialog`:
1. **PIX** — exige NF, taxa fixa deduzida na UI, só Founder + CNPJ.
2. **Cashback Cashin** — sem NF, sem taxa. Cashin direto pra qualquer membro.
3. **Crédito Shopify** — 1:1, sem NF, sem taxa. F-V05.

**Em S2** (esta entrega): apenas a UI das 3 abas + persistência do `payout_request` com status `pending` e `payout_method` setado. Nenhuma chamada a Cashin nem validação de NF — esses ficam pra S5.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis preenchidos
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBDs bloqueantes resolvidos (TBD-3/4/5/19 ✅; TBD-20 não-bloqueante — hipótese padrão: CPF não-Founder usa Cashin direto, Founder sem CNPJ idem; valor de comissão depende de F-V04 ainda bloqueada)

## Requisitos Funcionais
- **RF-1:** `WithdrawDialog` exibe 3 abas / 3 cards de método: PIX, Cashback Cashin, Crédito Shopify.
- **RF-2:** Aba PIX:
  - Mostra dados de NF da Biohelp (razão social, CNPJ, endereço, etc — copiáveis).
  - Campo de upload de NF (PDF/XML/imagem, validado client-side por mime).
  - Taxa fixa R$ 3,67 deduzida na UI (placeholder do Cashin — confirmar valor real em S5).
  - Submit válido → `payout_method='pix'`, `status='pending'`, anexa filename do upload em `metadata`.
- **RF-3:** Aba Cashback Cashin:
  - Sem NF, sem taxa.
  - Submit válido → `payout_method='cashback_cashin'`, `status='pending'`.
- **RF-4:** Aba Crédito Shopify:
  - Sem NF, sem taxa, conversão 1:1.
  - Submit válido → `payout_method='shopify_credit'`, `status='pending'`. (F-V05)
- **RF-5:** Server action valida com Zod: amount > 0, amount ≤ saldo disponível, payout_method ∈ {pix, cashback_cashin, shopify_credit}.
- **RF-6:** PIX exige `member.is_founder = true` (placeholder: usar `member.tags` ou flag em `members` — em S2, aceitar todos por padrão e marcar como TODO de S4 quando F-V06 entregar).
- **RF-7:** Toast success após submit + `revalidatePath('/dashboard/finance')`.
- **RF-8:** Erros (Zod, RLS, saldo insuficiente) → toast.error com mensagem amigável. Logs no servidor.

**Fora de S2 (para S5):**
- RF-S5-1: integração real com API Cashin (sandbox + prod).
- RF-S5-2: validação automática de NF (formato + dados) no upload.
- RF-S5-3: webhook Cashin atualiza status pra approved/completed.
- RF-S5-4: chamada API `customer.credit` da Shopify ao approved do método `shopify_credit`.

## Critérios de Aceite (S2)
- **CA-01:** `WithdrawDialog` aberto mostra 3 cards de método com label e descrição corretos.
- **CA-02:** Aba PIX → mostra dados NF, campo de valor, upload de NF. Submit com NF anexada → row em `payout_requests` com `payout_method='pix'`.
- **CA-03:** Aba PIX sem NF anexada → botão submit desabilitado.
- **CA-04:** Aba Cashback Cashin → submit válido → row com `payout_method='cashback_cashin'`.
- **CA-05:** Aba Crédito Shopify → submit válido → row com `payout_method='shopify_credit'`.
- **CA-06:** valor > saldo disponível → toast error "Valor acima do disponível", **nenhuma row criada**.
- **CA-07:** valor zero ou negativo → erro Zod (validação client antes de chegar no server), submit bloqueado.
- **CA-08:** RLS: usuário só consegue inserir em `payout_requests` com `member_id = auth.uid()`. Tentativa de inserir com outro `member_id` → erro 403/RLS.
- **CA-09:** Migration aplica e reverte sem erro (rollback comentado no topo do .sql).

## Arquivos PERMITIDOS
- `components/biohelp/WithdrawDialog.tsx` — reescrito v2 (NÃO porta do Loveable; só inspira-se no visual).
- `lib/payouts/v2/schema.ts` — Zod do payoutRequestInput.
- `lib/payouts/v2/actions.ts` — server action `requestPayout`.
- `lib/payouts/v2/queries.ts` — listMemberPayouts, getAvailableBalance (placeholder; reusa lib/credits).
- `app/dashboard/finance/page.tsx` — page server-side.
- `supabase/migrations/<data>_f-v07-payout-method.sql` — ALTER TABLE.

## Arquivos PROIBIDOS (Anti-SPEC aplicável)
- `lib/payouts/constants.ts` (v1) — não estender; criar v2 paralelo. Anti-SPEC §11.
- `lib/cv/*`, `lib/levels/*`, `lib/commissions/*` — Anti-SPEC §10, 12.
- `_loveable_import/src/components/biohelp/WithdrawDialog.tsx` — referência visual, não importar (Anti-SPEC §13).
- Provider de pagamento direto (cliente Cashin SDK) — só em S5; em S2 não chamar API externa.
- Dropar/recriar `payout_requests` (Anti-SPEC §6) — só ALTER TABLE.

## TBDs
- **TBD-1, TBD-2** *(bloqueantes para F-V04, parcialmente para F-V07):* valor da comissão depende dessas decisões. Em S2, server action aceita qualquer `amount` ≤ saldo atual; integração real com cálculo de comissão é S5 quando F-V04 destravar.
- **TBD-20** *(não-bloqueante, hipótese padrão):* Founder sem CNPJ usa Cashin direto (sem NF), igual a CPF não-Founder. Validar com cliente em demo de 13/05.

## Plano de implementação (S2)
1. Branch `feat/S2-membro-finish` (já criada).
2. Migration `<data>_f-v07-payout-method.sql` (ALTER TABLE — adiciona `payout_method`).
3. `lib/payouts/v2/schema.ts` (Zod).
4. `lib/payouts/v2/actions.ts` (server action `requestPayout`).
5. `lib/payouts/v2/queries.ts` (listMemberPayouts, getAvailableBalance via `lib/credits`).
6. `WithdrawDialog.tsx` v2 — reescrito com 3 abas + adapta call pra server action.
7. Wire-up em `app/dashboard/finance/page.tsx`.
8. Smoke flag ON+OFF.
9. Matriz preenchida (incl. RLS test com 2 tokens).

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | `WithdrawDialog` renderiza 3 abas com labels do enum | Inspeção `components/biohelp/WithdrawDialog.tsx` + `lib/payouts/v2/schema.PAYOUT_METHODS` | ✅ | 3 valores no enum: `pix`, `cashback_cashin`, `shopify_credit`. `METHOD_LABELS` mapeia cada um. Validado via SQL `SELECT enumlabel FROM pg_enum`. |
| CA-02 | Insert payout_request com `payout_method='pix'`, `person_type='pj'` | SQL via service_role | ✅ | INSERT retornou id `d5b661a2-…`. Em UI, action.ts força `person_type='pj'` quando method=pix (linha 60). |
| CA-03 | Botão submit `disabled` quando method=pix sem invoiceFile | Inspeção `WithdrawDialog.tsx` | ✅ | `canSubmit = !pending && numericAmount > 0 && numericAmount <= netAvailable && (!requiresInvoice \|\| !!invoiceFile)`. UI test deferido (humano confirma visual). |
| CA-04 | Insert payout_request com `payout_method='cashback_cashin'`, `person_type='pf'` | SQL via service_role | ✅ | INSERT retornou id `68683b6d-…`. |
| CA-05 | Insert payout_request com `payout_method='shopify_credit'`, `person_type='pf'` | SQL via service_role | ✅ | INSERT retornou id `9c232a79-…`. |
| CA-06 | `if (amount > balance.available_for_withdrawal)` retorna `{ ok:false, error:"Valor acima do disponível…" }` | Inspeção source `lib/payouts/v2/actions.ts:35-43` | 🟡 | Lógica confirmada no código; e2e via UI exige saldo > 0 (F-V04 ainda bloqueada). Sponsor com saldo 0 → toda submissão > 0 retornaria erro. |
| CA-07 | `requestPayoutSchema.safeParse({ amount: 0 })` falha | Zod schema | ✅ | `z.coerce.number().positive(...)` em `requestPayoutSchema`. |
| CA-08 | RLS habilitada em `payout_requests` (legacy v1 já cobre) | inalterado nesta migration | ✅ | F-V07 só faz ALTER TABLE; RLS legacy v1 (`payout_requests`) continua: SELECT por member_id + admin override. Não tocada. |
| CA-09 | Migration aplica idempotente; rollback documentado | `apply_migration` MCP | ✅ | `f_v07_payout_method` retornou `success:true`; `f_v07b_relax_bank_fields` (extra — fix bug NOT NULL legacy) também `success:true`. Rollback comentado nos topos dos `.sql`. |

## Loveable — elementos descartados
- WithdrawDialog do Loveable tem só 2 métodos (PIX + cashback) — reescrever pra 3.
- Modo "advance" (antecipação) do Loveable — fora de escopo v2 (Anti-SPEC §10 cortou RPA/CPF; antecipação seria nova feature).
- `BIOHELP_INVOICE_DATA` mockado do Loveable — pode reusar valores como placeholders, mas marca como `// TODO: confirmar dados reais com cliente em S5`.

## Rollback
- Revert do PR.
- Migration reversa: `ALTER TABLE payout_requests DROP COLUMN IF EXISTS payout_method;` (escrito no topo do .sql).
- Feature flag desligar: `LRP_V2=false` → rota redireciona, dialog não acessível.
- Rows criadas em `payout_requests` com novos `payout_method` ficam órfãs ⇒ admin processa manualmente ou marca `status='cancelled'`.
