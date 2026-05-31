# F-V20 — Resgate alinhado à Política Financeira Nutrition Club + UI Lovable

## Metadata

- **ID:** F-V20
- **Classe:** D (migration + dados sensíveis + payout flow)
- **Status:** MVP em PR — aguarda QA / E2E
- **Onda:** S6 (paralela a F-V19, pre go-live 01/06)
- **Data:** 2026-05-31
- **Branch:** `feat/F-V20-politica-financeira-lovable`
- **Commit:** `de7e351`

## Contexto

Daily call 29/05/2026 (Léo + Mateus + Gabi + Eduardo) revisou a "Política
Financeira Nutrition Club" v1 (docx em `documentos_projeto_iniciais_MD/`) e a
UI do Lovable (preview `id-preview--c6cd387c-...lovable.app`). Decisões:

1. Crédito na loja vira modalidade **recomendada** (sem custo, sem mínimo,
   sem imposto).
2. PF (RPA) e PJ (NF) com taxa **R$ 7,50** + mínimo **R$ 500**.
3. PF retém **INSS 11% + IRRF 7,5%**. PJ sem retenção (responsabilidade do
   emissor).
4. **Dados bancários** saem do dialog de saque e vão pro **/profile**
   (persistência) — autopreenchem o dialog.
5. **Janela de 7 dias** após alterar dados bancários antes de novo saque
   (Política §5).
6. **Titularidade**: CPF/CNPJ informado nos dados bancários precisa bater
   com `members.document_number`.
7. Modal **"Regras do resgate"** explica as 3 modalidades.
8. Botão **"Gerar crédito"** (não "Solicitar resgate") no crédito + mensagem
   **persistente** após gerar.
9. **Sem "(bruto)"** no label de valor da modalidade PJ.

## Definition of Ready

- [x] RFs vinculados (Política §1-7 + Lovable mockups capturados)
- [x] CAs claros e testáveis (ver Matriz E2E)
- [x] Classe D confirmada (migration + RLS + dados sensíveis)
- [x] Arquivos prováveis listados (ver Plano)
- [x] Anti-SPEC v2 §1-13 verificada
- [x] TBDs bloqueantes resolvidos (cliente alinhou na call 29/05)

## Requisitos Funcionais

- **RF-1** Modalidades nomeadas conforme Política e Lovable:
  - `shopify_credit` → "Crédito na loja" (RECOMENDADO)
  - `cashback_cashin` → "Pessoa Física (RPA)"
  - `pix` → "Pessoa Jurídica (NF)"
- **RF-2** Cálculo de líquido: `Crédito = bruto`; `PF = bruto - 11% - 7,5% - 7,50`;
  `PJ = bruto - 7,50`.
- **RF-3** Mínimo R$ 500 em PF e PJ; sem mínimo em Crédito; mensagem inline
  abaixo do campo se digitar menos.
- **RF-4** Dados bancários persistidos em `members` (9 colunas novas).
- **RF-5** Resgate em PF/PJ exige `members.person_type` compatível +
  dados bancários completos.
- **RF-6** Snapshot de dados bancários em `payout_requests` na hora do INSERT
  (auditoria — mudança futura no perfil não altera pedido emitido).
- **RF-7** Janela de 7 dias após `bank_data_updated_at` bloqueia novos saques
  PF/PJ (action retorna erro com data de liberação).
- **RF-8** Modal "Regras do resgate" disponível no header do dialog + no botão
  ao lado de "Resgatar" no `/finance`.
- **RF-9** Botão de submit: "Gerar crédito" no crédito; "Solicitar resgate" em PF/PJ.
- **RF-10** Crédito gerado mostra **mensagem persistente** (`<div data-testid="credit-success-msg">`),
  não toast efêmero.
- **RF-11** PJ esconde "(bruto)" no label do campo; PF mantém.
- **RF-12** Histórico de resgates em tabela com colunas
  `Data / Modalidade / Bruto / Descontos / Líquido / Status`.

## Critérios de Aceite

Ver matriz completa em `E2E-PROMPT.md` (22 critérios).

Resumo dos CAs principais:

- **CA-01** Migration aplicada idempotente, 9 colunas em `members`.
- **CA-02** Schema Zod (`memberBankDataSchema`) valida PF=11 CPF / PJ=14 CNPJ.
- **CA-03** `computePayoutBreakdown` retorna valores corretos por modalidade
  (Crédito sem custo; PF com INSS+IRRF+fee; PJ só fee).
- **CA-04** Mínimo R$ 500 valida no client (warning inline) e no server
  (action retorna erro).
- **CA-05** Sem dados bancários → CTA pro perfil no dialog (`bank-setup-prompt`).
- **CA-06** Sem `person_type` compatível → CTA pro perfil.
- **CA-07** Janela 7d → bloqueia novo saque, mostra data de liberação.
- **CA-08** Crédito → mensagem persistente após sucesso.
- **CA-09** PJ → upload de NF obrigatório.
- **CA-10** Tabela histórico com 6 colunas no formato Lovable.
- **CA-11** Modal Regras do Resgate disponível em 2 lugares.
- **CA-12** CI N1 verde (lint + tsc + build).

## Arquivos PERMITIDOS

- `supabase/migrations/20260531_f-v20-member-bank-data.sql` ← nova
- `lib/payouts/v2/schema.ts` ← atualiza
- `lib/payouts/v2/actions.ts` ← atualiza
- `lib/payouts/v2/queries.ts` ← atualiza (expand row type)
- `lib/members/profile-actions.ts` ← adiciona `updateMemberBankData`
- `components/biohelp/PayoutRulesDialog.tsx` ← novo
- `components/biohelp/WithdrawDialog.tsx` ← refator
- `components/biohelp/index.ts` ← exporta PayoutRulesDialog
- `app/dashboard/finance/page.tsx` ← passa bankData + tabela nova
- `app/dashboard/finance/FinanceClient.tsx` ← botão Regras + textos
- `app/dashboard/profile/page.tsx` ← integra BankDataForm
- `app/dashboard/profile/BankDataForm.tsx` ← novo

## Arquivos PROIBIDOS (Anti-SPEC v2 aplicável)

- `members.sponsor_id`, `ref_code` (Anti-SPEC §1, §7)
- `shopify_customers` (Anti-SPEC §2)
- `orders`, `order_items` (Anti-SPEC §3)
- Webhooks Shopify em `app/api/webhooks/shopify/*` (Anti-SPEC §4)
- RLS policies existentes em `members` (Anti-SPEC §5) — *cobre as colunas
  novas via `members_update_own_or_admin` sem ALTER necessária*
- Migrations já aplicadas (Anti-SPEC §6) — só adiciona nova
- Tipos/mocks v1 do Loveable (Anti-SPEC §12-13)

## Plano de implementação

1. ✅ Branch `feat/F-V20-politica-financeira-lovable`
2. ✅ Migration idempotente + rollback no comentário
3. ✅ Schema (labels + constantes + breakdown helper)
4. ✅ Actions (regras política + snapshot bancário)
5. ✅ Profile-actions (updateMemberBankData)
6. ✅ PayoutRulesDialog + WithdrawDialog refator
7. ✅ FinanceClient + page (tabela nova)
8. ✅ BankDataForm + profile page (seção nova)
9. ✅ Queries.ts (row type expandido)
10. ✅ CI N1 (lint + tsc + build) verde
11. ⏳ E2E em outra sessão CLI (`E2E-PROMPT.md`)
12. ⏳ Merge após QA verde

## Matriz de Validação

Ver `E2E-PROMPT.md` (22 critérios). Sessão de QA preenche
`E2E-RESULT.md` com PASS/FAIL/evidência por critério.

## Rollback

Como reverter se der ruim em produção:

1. `git revert de7e351` (revert do commit; preserva histórico)
2. Aplicar rollback da migration manualmente (SQL no comentário do arquivo
   `20260531_f-v20-member-bank-data.sql`) — drops das 10 colunas + índice +
   constraint. **Atenção:** perde dados bancários gravados após a aplicação.
3. Feature flag de fallback: `LRP_V2=false` em produção desativa toda a
   rota `/dashboard/finance` v2 (redireciona pra `/dashboard`).

## Notas

- **F-V07 e F-V07b** continuam válidos — F-V20 não remove código, só amplia
  e refina UX. `payout_requests` mantém colunas bancárias (snapshot).
- **`COMMISSION_TAX_RATE`** (15% legado) **não foi removido** — pode ser usado
  por código v1 ainda. Em F-V12 (cleanup), avaliar deprecação.
- **CPF no checkout pré-cadastro** (decisão da mesma call 29/05) é parte de
  **F-V19**, não desta feature.
