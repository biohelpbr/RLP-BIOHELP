# Snapshot pré-backfill — 10/09/2026 22:07 (BRT)

Estado do banco ANTES de: (a) aplicar as migrations do desconto de saque e da
comissão recorrente, (b) lançar o retroativo de comissão recorrente.

## O que estava gravado

| tabela | linhas | soma |
|---|---|---|
| commission_ledger | 593 | R$ 27.150,60 |
| commission_balances | 23 | — |
| payout_requests | 4 | R$ 1.545,00 |

Tipos no ledger neste momento: `subscription_activation` (590) e `fast_track_30` (3).
Nenhum lançamento `affiliate_sale`, `affiliate_perpetual` ou `subscription_recurring`.

## Reverter o backfill (o caso comum)

Os lançamentos novos entram com `commission_type = 'subscription_recurring'`.
Apagar só eles devolve o estado exato deste snapshot — o gatilho recalcula os
saldos sozinho:

```sql
DELETE FROM commission_ledger WHERE commission_type = 'subscription_recurring';
```

## Reverter as migrations

- `20260909_saldo-desconta-saque.sql` e `20260910_comissao-recorrente-indicacao.sql`
  têm o rollback comentado no topo de cada arquivo.
- Depois de reverter a do saque, os saldos voltam a NÃO descontar saque
  (comportamento antigo: R$ 1.545 pagos aparecendo como disponíveis).

## Restaurar valores da tabela de saldo

Os saldos são derivados (gatilho recalcula a partir do ledger + payout_requests),
então apagar os lançamentos basta. Se ainda assim precisar do valor literal de
antes, `commission_balances.json` tem cada linha como estava às 22:07.

## Contexto da decisão

Comissão recorrente por indicação foi decisão do cliente (Leonardo), confirmada
em 10/09 mesmo após o alerta de que a assinatura do clube é ANUAL (R$ 1.188
parcelado em até 12x), e não mensal. HOUSE e ADMIN002 incluídos por decisão dele.

---

## O que foi executado (10/09/2026, ~22:10 BRT)

1. Migration `20260909_saldo-desconta-saque.sql` aplicada. Efeito imediato: as 4
   parceiras que já haviam sacado passaram a ter a baixa refletida — R$ 1.545
   saíram do "disponível".
2. Migration `20260910_comissao-recorrente-indicacao.sql` aplicada (libera o tipo
   `subscription_recurring`).
3. `node scripts/backfill-comissao-recorrente.mjs --commit`:
   **990 lançamentos, R$ 48.560,00**, distribuídos entre 24 parceiras.

Ledger: 593 linhas / R$ 27.150,60 → **1.583 linhas / R$ 75.710,60**.

### Critério aplicado (importante)

Conta apenas indicados com `subscription_status = 'paid'` **hoje**. Quem já
cancelou não gerou lançamento — nem pelos meses em que esteve ativo. Por isso o
total ficou em R$ 48,5k, e não nos ~R$ 54,5k do levantamento inicial, que somava
todos os que um dia pagaram. Se o cliente quiser pagar também os meses de quem
depois cancelou, é outra rodada (o script precisa da data de cancelamento).

### Conferência pós-execução

- Luana Mota: R$ 400 → **R$ 1.040** (13 meses-indicado × R$ 80)
- As 4 parceiras com saque seguem com `disponível = ganho − sacado`
- Reexecução do script acusa **R$ 0,00 a lançar** (idempotente)
