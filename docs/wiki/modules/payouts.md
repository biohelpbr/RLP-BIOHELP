# Module: payouts

> F-V05 + F-V07 + **F-V20** — triple resgate alinhado à Política Financeira Nutrition Club.

## Responsabilidade
- Saldo do membro (F-V05).
- Resgate em 3 modalidades com aprovação manual admin (F-V07 + F-V20).
- Cashin live com 3 modos (mock/sandbox/live) via `CASHIN_MODE` (F-V07b).
- Validação automática de NF (F-V07c).
- **F-V20:** dados bancários persistidos em `members`, janela de segurança 7d após alteração, snapshot em `payout_requests` no INSERT.

## Modalidades (F-V20, labels Lovable + Política)
| IDs DB (mantidos do v1) | Label v2 | Taxa | Imposto | Mínimo |
|---|---|---|---|---|
| `shopify_credit` | **Crédito na loja** (RECOMENDADO) | 0 | 0 | 0 |
| `cashback_cashin` | **Pessoa Física (RPA)** | R$ 7,50 | INSS 11% + IRRF 7,5% | R$ 500 |
| `pix` | **Pessoa Jurídica (NF)** | R$ 7,50 | 0 (responsável é o emissor) | R$ 500 |

## Arquivos principais
- `lib/payouts/v2/schema.ts` — labels + constantes (`PAYOUT_FIXED_FEE_BRL`, `PAYOUT_INSS_RATE`, `PAYOUT_IRRF_RATE`, `PAYOUT_MIN_AMOUNT_BRL`, `BANK_DATA_LOCK_DAYS`) + `computePayoutBreakdown` helper + `memberBankDataSchema` (Zod).
- `lib/payouts/v2/actions.ts` — `requestPayout` server action com regras política (mínimo, person_type match, janela 7d, snapshot bancário).
- `lib/payouts/v2/queries.ts` — `PayoutRequestRow` expandido (`gross_amount`, `net_amount`, `tax_amount`).
- `lib/payouts/v2/cashin/*` — interface agnóstica `CashinClient`.
- `lib/payouts/v2/nfe-validator.ts` — validação F-V07c.
- `lib/credits/*` — chamada `customer.credit` Shopify (F-V05).
- `lib/members/profile-actions.ts` — `updateMemberBankData` action.
- `components/biohelp/WithdrawDialog.tsx` — UI Lovable (3 cards, breakdown condicional, CTA pro perfil quando dados faltam, mensagem persistente de crédito gerado, sem "bruto" no PJ).
- `components/biohelp/PayoutRulesDialog.tsx` — modal Regras do Resgate (F-V20).
- `app/dashboard/finance/{page,FinanceClient}.tsx` — header + botão Regras + tabela histórico.
- `app/dashboard/profile/{page,BankDataForm}.tsx` — seção Dados Bancários (PF/PJ toggle).

## Tabela `members` — colunas F-V20
`bank_name`, `bank_agency`, `bank_account`, `bank_account_type`, `bank_pix_key`, `bank_holder_name`, `bank_contact_phone`, `person_type` (pf/pj com CHECK), `document_number` (CPF/CNPJ), `bank_data_updated_at`.

## SPECs relevantes
- F-V05: `docs/sdd/features/F-V05-saldo-creditos/SPEC.md`
- F-V07: `docs/sdd/features/F-V07-saque-cashin-nf/SPEC.md`
- F-V07b: `docs/sdd/features/F-V07b-cashin-live/SPEC.md`
- F-V07c: `docs/sdd/features/F-V07c-nfe-validator/SPEC.md`
- **F-V20:** `docs/sdd/features/F-V20-politica-financeira-lovable/SPEC.md`

## Anti-SPEC aplicável
- Item 11: provider de pagamento — interface agnóstica em `lib/payouts/v2/` (não acoplar Cashin diretamente).

## Estado atual
- ✅ F-V05 UI Done; chamada `customer.credit` real pendente.
- ✅ F-V07 UI Done (triple resgate).
- ✅ F-V07b Cashin mock+sandbox Done; live pendente credenciais.
- ✅ F-V07c NFe validator Done.
- ✅ **F-V20 Done (2026-06-01)** — alinhamento Política Financeira + UI Lovable, E2E 22/22 PASS.
- ⏳ Dados fiscais Biohelp ainda hardcoded em WithdrawDialog (TBD-27).
