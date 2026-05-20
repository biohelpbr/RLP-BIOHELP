# Module: payouts

> F-V05 + F-V07 — triple resgate (Cashin / Crédito Shopify 1:1 / PIX+NF).

## Responsabilidade
- Saldo do membro (F-V05).
- Resgate em 3 métodos com aprovação manual admin (F-V07).
- Cashin live com 3 modos (mock/sandbox/live) via `CASHIN_MODE` (F-V07b).
- Validação automática de NF (F-V07c).

## Arquivos principais
- `lib/payouts/v2/schema.ts` — `PayoutMethodSchema` (`pix` | `cashback_cashin` | `shopify_credit`).
- `lib/payouts/v2/cashin/*` — interface agnóstica `CashinClient` (mock/sandbox/live).
- `lib/payouts/v2/nfe-validator.ts` — validação F-V07c.
- `lib/credits/*` — chamada `customer.credit` Shopify (F-V05).
- `components/biohelp/WithdrawDialog.tsx` — UI triple resgate (3 abas).

## SPECs relevantes
- F-V05: `docs/sdd/features/F-V05-saldo-creditos/SPEC.md`
- F-V07: `docs/sdd/features/F-V07-saque-cashin-nf/SPEC.md`
- F-V07b: `docs/sdd/features/F-V07b-cashin-live/SPEC.md`
- F-V07c: `docs/sdd/features/F-V07c-nfe-validator/SPEC.md`

## Anti-SPEC aplicável
- Item 11: provider de pagamento — interface agnóstica em `lib/payouts/v2/` (não acoplar Cashin diretamente).

## Estado atual
- ✅ F-V05 UI Done; chamada `customer.credit` real pendente.
- ✅ F-V07 UI Done (triple resgate).
- ✅ F-V07b Cashin mock+sandbox Done; live pendente credenciais.
- ✅ F-V07c NFe validator Done.
- ⏳ Dados fiscais Biohelp ainda hardcoded em WithdrawDialog (TBD-27).
