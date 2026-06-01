# F-V20 — Prompt E2E para outra sessão Claude Code CLI

> **Como usar:** abra outra instância do Claude Code (`claude` na CLI ou na extensão) no mesmo workspace, e cole TUDO entre as duas linhas `═══` abaixo como sua primeira mensagem. A sessão tem instruções suficientes para rodar o teste sem ler histórico nenhum.

═══════════════════════════════════════════════════════════════════════════════

## Tarefa: Teste E2E da Feature F-V20 (Resgate alinhado à Política Financeira)

Você está numa sessão **nova e isolada** do Claude Code rodando em
`C:\Users\edusp\Projetos_App_Desktop\RLP-bio_help`. Outra sessão acabou de
implementar a feature F-V20 na branch `feat/F-V20-politica-financeira-lovable`,
que alinha o fluxo de Resgate à Política Financeira Nutrition Club Biohelp e à
UI do Lovable. Sua tarefa é validar a implementação ponto-a-ponto e devolver
um **relatório em markdown** com PASS/FAIL por critério e evidências.

### Contexto do que F-V20 mudou

1. **Política e taxas**:
   - Crédito na loja (`shopify_credit`): **sem custo**, sem mínimo
   - Pessoa Física RPA (`cashback_cashin`): **R$ 7,50** + INSS 11% + IRRF 7,5%, **mín R$ 500**
   - Pessoa Jurídica NF (`pix`): **R$ 7,50**, **mín R$ 500**, NF obrigatória, sem imposto retido

2. **Dados bancários agora moram em `members`** (migration `20260531_f-v20-member-bank-data.sql`).
   Colunas novas: `bank_name`, `bank_agency`, `bank_account`, `bank_account_type`,
   `bank_pix_key`, `bank_holder_name`, `bank_contact_phone`, `person_type` (pf/pj),
   `document_number` (CPF/CNPJ), `bank_data_updated_at`.

3. **Janela de segurança**: 7 dias após alterar dados bancários antes de liberar
   novo saque (constante `BANK_DATA_LOCK_DAYS` em `lib/payouts/v2/schema.ts`).

4. **Arquivos tocados** (todos commitados em `de7e351`):
   - `supabase/migrations/20260531_f-v20-member-bank-data.sql` ← já aplicada via MCP
   - `lib/payouts/v2/schema.ts` `actions.ts` `queries.ts`
   - `lib/members/profile-actions.ts`
   - `components/biohelp/WithdrawDialog.tsx` `PayoutRulesDialog.tsx` `index.ts`
   - `app/dashboard/finance/page.tsx` `FinanceClient.tsx`
   - `app/dashboard/profile/page.tsx` `BankDataForm.tsx`

### Preparação

```powershell
# 1. Confirme branch
git rev-parse --abbrev-ref HEAD   # deve estar em feat/F-V20-politica-financeira-lovable
git log --oneline -1              # de7e351 feat(F-V20): ...

# 2. Confirme migration aplicada no Supabase remoto
# (Use mcp__supabase__execute_sql para rodar:)
#   SELECT column_name FROM information_schema.columns
#   WHERE table_name='members' AND column_name LIKE 'bank_%' ORDER BY column_name;
# Deve listar bank_account, bank_account_type, bank_agency, bank_contact_phone,
# bank_data_updated_at, bank_holder_name, bank_name, bank_pix_key.

# 3. Garanta env LRP_V2=true em .env.local
# (Sem isso, /dashboard/finance e /dashboard/profile redirecionam pra /dashboard.)

# 4. Suba o dev server em background
npm run dev   # roda em http://localhost:3000
# (Use `run_in_background: true` no Bash tool e espere o sinal "Ready in")
```

### Member de teste

Você precisa de **um membro com saldo disponível** pra testar resgate. Use SQL
direto no Supabase via MCP para identificar:

```sql
-- Member com saldo > R$ 500 (cobre o mínimo PF/PJ)
SELECT m.id, m.email, m.name,
       cb.available_balance, cb.total_earned
FROM members m
JOIN commission_balances cb ON cb.member_id = m.id
WHERE cb.available_balance > 500
ORDER BY cb.available_balance DESC
LIMIT 5;
```

Se não houver, faça um **seed temporário** via SQL pra inflar
`commission_balances.available_balance` desse membro escolhido a R$ 2.000 (e
**reverta no final** — registre no relatório). Migrate `available_balance` é
derivado; talvez seja preciso inserir row em `commission_ledger` com
`available_at < now() - 16 days`. Investigue antes de fazer.

### Como logar como esse membro

A app usa Supabase Auth com magic link. Em ambiente de desenvolvimento, o
caminho mais simples é gerar um magic link via Supabase Admin API (ou simular
a sessão direto). Tente em ordem:

1. **Via Supabase MCP** (preferido): use a Admin API para gerar um session token
   para o `auth_user_id` do member e injetar o cookie no Playwright.
2. **Via simulate-guru endpoint**: se existir `/api/dev/login-as` ou similar,
   use. Procure por endpoints de DX no projeto.
3. **Fallback manual**: peça ao usuário humano para fazer login e te avisar
   "ok logado" (espere com `ScheduleWakeup` ou simplesmente pause e termine
   marcando esses cenários como SKIPPED).

### Matriz de Validação (preencha no relatório)

| # | Critério | Como testar | Resultado |
|---|----------|-------------|-----------|
| 1 | Migration aplicada | SQL: confirmar 9 colunas novas em `members` | PASS/FAIL |
| 2 | `/dashboard/finance` renderiza | Navegar e tirar screenshot | PASS/FAIL |
| 3 | Header "Resultado & Resgate" + Stat cards (Disponível / Pendente / Recebido) | Snapshot do DOM | PASS/FAIL |
| 4 | Botão "Regras" visível | Clicar e validar modal abre com 3 seções (Crédito/PF/PJ) | PASS/FAIL |
| 5 | Tabela "Histórico de resgates" com colunas Data/Modalidade/Bruto/Descontos/Líquido/Status | Snapshot | PASS/FAIL |
| 6 | Dialog Resgate abre via "Resgatar" | Clicar | PASS/FAIL |
| 7 | 3 cards (Crédito loja "Recomendado" / PF (RPA) / PJ (NF)) | Snapshot do dialog | PASS/FAIL |
| 8 | Tab **Crédito**: breakdown mostra "Sem custos" + "Crédito gerado" igual ao valor solicitado | Mudar valor pra R$ 100 e ler breakdown via `[data-testid='payout-net']` | PASS/FAIL |
| 9 | Tab **Crédito**: botão "Gerar crédito" (não "Solicitar resgate") | Snapshot botão | PASS/FAIL |
| 10 | Tab **Crédito**: NÃO mostra warning de R$ 500 mesmo com R$ 10 | Digitar 10, verificar ausência de `[data-testid='min-warning']` | PASS/FAIL |
| 11 | Tab **PF (RPA)**: valor < R$ 500 mostra warning inline `[data-testid='min-warning']` | Digitar 200 | PASS/FAIL |
| 12 | Tab **PF (RPA)**: breakdown mostra "Taxas e impostos (INSS + IRRF)" + "Custo do resgate -R$ 7,50" | Digitar 1000, validar números: INSS = 110, IRRF = 75, fee = 7,50, líquido = 807,50 | PASS/FAIL |
| 13 | Tab **PJ (NF)**: label do campo não tem "(bruto)" | Snapshot label | PASS/FAIL |
| 14 | Tab **PJ (NF)**: breakdown mostra só "Custo do resgate" (sem INSS/IRRF) | Snapshot | PASS/FAIL |
| 15 | Tab **PJ (NF)**: dados pra emissão da NF (Razão Social, CNPJ, etc.) + botão copiar | Snapshot | PASS/FAIL |
| 16 | Tab **PJ (NF)**: upload de NF obrigatório (botão "Solicitar resgate" desabilitado sem arquivo) | Snapshot disabled state | PASS/FAIL |
| 17 | Quando member sem dados bancários abre tab PF/PJ → mostra CTA `[data-testid='bank-setup-prompt']` com link pro perfil | Snapshot | PASS/FAIL |
| 18 | `/dashboard/profile` tem seção "Dados Bancários" com toggle PF/PJ + 7 campos | Navegar e snapshot | PASS/FAIL |
| 19 | Salvar dados bancários (PF, CPF 11 dígitos) → toast OK + persistência via SQL | Preencher form, submeter, depois `SELECT person_type, bank_name, bank_data_updated_at FROM members WHERE id=...` | PASS/FAIL |
| 20 | Após salvar, warning de janela 7d aparece no profile + bloqueia novo saque PF/PJ no actions | Tentar `requestPayout` server action via dev — deve retornar erro com data | PASS/FAIL |
| 21 | Solicitar **Crédito** R$ 50 com sucesso → mensagem persistente `[data-testid='credit-success-msg']` + row criada em `payout_requests` com `payout_method='shopify_credit'`, `status='pending'`, `net_amount=50`, `tax_amount=0` | Submeter + SELECT | PASS/FAIL |
| 22 | CI N1 verde: `npm run lint`, `npx tsc --noEmit`, `npm run build` | Rodar e capturar tail | PASS/FAIL |

### Critérios de aceite extras (Anti-SPEC v2)

- Sem ALTER em `sponsor_id`, `shopify_customers`, `orders`, `ref_code`. Confirme com:
  ```sql
  SELECT pg_get_functiondef(pg_proc.oid)
  FROM pg_proc WHERE proname LIKE '%bank%' LIMIT 5;
  -- (deve retornar vazio ou só funções DBA, nada do F-V20)
  ```
- Migration é idempotente: rode a query SQL da migration de novo e confirme sem erro
  (use `mcp__supabase__execute_sql` com o conteúdo do arquivo .sql).
- Build passa: `npm run build` sem ERROR.

### Formato do relatório

Devolva um único arquivo markdown em
`docs/sdd/features/F-V20-politica-financeira-lovable/E2E-RESULT.md` com:

```markdown
# F-V20 — Relatório E2E

**Data:** YYYY-MM-DD HH:mm
**Branch:** feat/F-V20-politica-financeira-lovable
**Commit:** <sha>
**Member de teste:** <id> / <email>
**Saldo manipulado?:** sim/não — se sim, descreva e reverta

## Resumo

X PASS / Y FAIL / Z SKIPPED

## Matriz preenchida

(tabela com resultado + evidência por critério)

## Bugs encontrados

| # | Critério | Descrição | Severidade | Reproduz? |

## Reversões aplicadas

(lista de seeds revertidos, dados de teste apagados etc.)

## Próximos passos sugeridos

(1-3 itens curtos pra quem for fazer merge)
```

### Regras de execução

- **NÃO MERGE** a branch. Você só valida.
- **NÃO ALTERE** código de produção. Se achar bug, descreva no relatório.
- **NÃO PUSHE** nada. Use só `git status` / `git log` localmente.
- Para alterações de teste em DB, use SQL temporário + sempre reverta no final.
- Em caso de bloqueio que dependa do usuário humano (login interativo, decisão
  sobre seed): pause, deixe critério como `SKIPPED — aguarda decisão humana` e
  siga com os outros critérios que dão pra automatizar.
- Limite tempo total: 30 min. Se passar disso, finalize o relatório com o que tiver.

### Ambiente

- OS: Windows 11 + PowerShell (use sintaxe PS)
- Node: existente no projeto
- Supabase MCP disponível (use para SQL e migrations)
- Playwright MCP disponível (use para navegação)

Tudo claro? Comece pela preparação (passos 1-3), depois ataque a matriz na ordem.

═══════════════════════════════════════════════════════════════════════════════

## Notas pra você (sessão atual) — não mande pra outra sessão

- O endpoint de "login-as" não existe no projeto hoje. A outra sessão vai
  precisar usar a Admin API do Supabase pra gerar uma session ou pedir ajuda
  humana. O prompt já cobre os 3 caminhos.
- Se quiser facilitar a outra sessão, considere antes:
  - Criar `app/api/dev/login-as/route.ts` guardado por `NODE_ENV !== 'production'`
  - Ou subir uma row de teste em `members` com email controlado
- O member da Lovable preview (Marina Santos) é só mock-frontend, não tem
  conta no Supabase de produção.
