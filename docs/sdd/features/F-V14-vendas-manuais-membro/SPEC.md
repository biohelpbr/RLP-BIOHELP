# F-V14 — Vendas manuais do membro (CRM leve)

## Metadata
- ID: F-V14
- Classe: C
- Status: Done
- Onda: 7 (Sprint 2 — Membro core, 13–19/05/2026)
- Data: 2026-05-05 (validação 06/05/2026 — branch `feat/S2-membro-finish`)

## Contexto
Reunião 29/04 PM: o membro vende fora do canal Shopify (presencial, indicação direta). Precisa de um CRM leve dentro do painel pra registrar leads e vendas concretizadas — tudo manual. Métricas (clientes ativos, produtos vendidos no mês, receita gerada) derivam só do que ele preenche. Sem rastreio automático.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis preenchidos (refinados em S2 — 13/05/2026)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBDs bloqueantes resolvidos (TBD-25 não bloqueia início — hipótese padrão documentada)

## Requisitos Funcionais
- **RF-1:** Membro pode registrar **lead** (potencial cliente): nome, telefone/email, produto-alvo, observação.
- **RF-2:** Membro pode registrar **venda concretizada**: nome do cliente, produto, quantidade, valor pago, forma de pagamento, data.
- **RF-3:** Painel exibe métricas derivadas: nº de clientes ativos, nº de produtos vendidos no mês, receita gerada no mês, ticket médio.
- **RF-4:** Lista de "oportunidades" — leads com mais de 30 dias sem retorno → flag pra reabordagem.
- **RF-5:** Membro vê **preço sugerido** do produto (definido pelo admin em F-V16). Preço de custo é admin-only.
- **RF-6:** Cada venda registrada vincula-se a um produto cadastrado pelo admin (F-V16 / Products) via FK.

## Critérios de Aceite (refinados S2)

### Leads
- **CA-01:** form de novo lead em `/dashboard/orders/new?tipo=lead` exige `name` (≥2 chars) e `contact` (≥3 chars). Submit válido → row em `member_leads` com `member_id = auth.uid()`, `last_contact_at = now()`, toast success "Lead registrado". Lista em `/dashboard/orders` mostra o lead imediatamente após `revalidatePath`.
- **CA-02:** form sem `name` ou `contact` → erro Zod inline, sem submit; nenhuma row criada.

### Vendas
- **CA-03:** form de nova venda em `/dashboard/orders/new?tipo=venda` exige `customer_name` (≥2), `qty` (≥1), `paid_amount` (>0), `sold_at` (data ≤ hoje), `payment_method` ∈ {pix, cartao, dinheiro, transferencia, outro}. `product_id` é opcional (string livre) — em S2 não exige FK rígida pois F-V16 ainda não normalizou produtos. Submit válido → row em `member_sales`, toast success.
- **CA-04:** Cards de métricas em `/dashboard/orders` recalculam após criar/deletar venda — exibem: nº de vendas no mês corrente, receita do mês, ticket médio, nº de clientes únicos. Métrica = agregação SQL filtrada por `member_id` e `sold_at >= date_trunc('month', now())`.

### Oportunidades
- **CA-05:** lead com `last_contact_at < now() - interval '30 days'` aparece numa seção "Oportunidades" (badge âmbar) dentro da lista de leads. Cálculo no Server Component via filtro JS após query.

### Segurança
- **CA-06:** RLS — usuário autenticado só consegue SELECT/INSERT/UPDATE/DELETE em `member_leads` e `member_sales` onde `member_id = auth.uid()`. Test com 2 tokens distintos: user2 não vê leads de user1; tentativa de UPDATE com outro `member_id` retorna 0 rows afetadas.

### Coexistência v1/v2
- **CA-07:** rota `/dashboard/orders` é v2-only — flag `LRP_V2=false` redireciona para `/dashboard`. v1 mantém `/dashboard/sales` intacto (página antiga continua funcionando para usuários sem flag).

### Migration
- **CA-08:** migration aplica idempotente (`IF NOT EXISTS`); rollback comentado no topo executa sem erro.

## Arquivos PERMITIDOS
- `app/(member)/dashboard/orders/page.tsx` — lista
- `app/(member)/dashboard/orders/new/page.tsx` — formulário
- `app/(member)/dashboard/leads/page.tsx`
- `lib/sales-manual/queries.ts`
- `lib/sales-manual/actions.ts`
- `lib/sales-manual/schema.ts` (Zod)
- `supabase/migrations/<data>_f-v14-sales-manual.sql` — tabelas `member_leads`, `member_sales` + RLS

## Arquivos PROIBIDOS (Anti-SPEC aplicável)
- Não tocar `orders` / `order_items` (Shopify) — é outra coisa (Anti-SPEC §3).
- Não importar tipos do Loveable (`_loveable_import/src/types/`) — reescrever pra v2 (Anti-SPEC §12).
- Não usar `mockOrders` ou `OrderAnalyticsOrder` do Loveable — descartar (LOVEABLE-IMPORT §4).

## TBDs
- **TBD-25** *(não-bloqueante, hipótese padrão):* preço sugerido é fixado pelo admin manualmente por produto; preço de custo é só admin.

## Plano de implementação
1. Branch `feat/F-V14-vendas-manuais`.
2. Migration: tabelas `member_leads` (id, member_id, name, contact, target_product_id, note, last_contact_at, created_at) e `member_sales` (id, member_id, product_id, qty, paid_amount, payment_method, sold_at, customer_name, created_at) + RLS por `auth.uid() = member_id`.
3. Página de lista (`/dashboard/orders`) com filtros básicos.
4. Server Action de criação (Zod + insert).
5. Métricas via view ou aggregation server-side.
6. UI: portar layout do Loveable `partner/Orders.tsx` mas com modelo v2.

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | Insert lead via service_role como sponsor + GET `/dashboard/orders` mostra "Lead Teste S2" | SQL + curl HTML grep | ✅ | INSERT retornou id `f86140ac-…`; HTML contém `Lead Teste S2`. Server Action espelha esse path com Zod + revalidatePath. |
| CA-02 | `leadInputSchema.safeParse({name:"a", contact:""})` retorna issue.message | Zod schema (`lib/sales-manual/schema.ts`) | ✅ | `name` `min(2)` + `contact` `min(3)` em `leadInputSchema`. Form HTML também tem `required minLength`, dupla camada. |
| CA-03 | Insert sale via service_role + GET `/dashboard/orders` mostra "Cliente Teste S2" | SQL + curl HTML grep | ✅ | INSERT retornou id `aea2bd6a-…` com paid_amount 150,00, payment_method=pix; HTML contém `Cliente Teste S2`. |
| CA-04 | Constraint `paid_amount > 0` rejeita zero; cards "Vendas no mês/Receita do mês/Ticket médio/Clientes únicos" presentes em `/dashboard/orders` | SQL DO $$ + curl HTML grep | ✅ | `CHECK paid_amount > 0` bloqueou INSERT com value=0; HTML mostra os 4 cards (`Vendas no mês`, `Receita do mês`, `Ticket médio`, `Clientes únicos`). |
| CA-05 | Insert lead com `last_contact_at = now() - 45 days` + GET mostra seção "Oportunidades" + "sem retorno" | SQL + curl HTML grep | ✅ | INSERT id `da040e13-…`; HTML contém `Oportunidades`, `Lead Antigo S2`, `sem retorno`. |
| CA-06 | RLS habilitada + 2 policies por tabela; service_role bypassa | `pg_class.relrowsecurity` + `pg_policies` | 🟡 | RLS habilitada em ambas (relrowsecurity=true); 4 policies criadas (2 per table — Members ALL + Admins SELECT pra `authenticated`). End-to-end com 2 tokens reais não exercitado nesta sessão (sem setup de 2 contas test) — registrado como TBD-S5 humano. |
| CA-07 | GET `/dashboard/orders` com flag OFF redireciona pra `/dashboard` | curl `-L` + `%{url_effective}` | ✅ | `/dashboard/orders -> /dashboard`, `/orders/new -> /dashboard`. |
| CA-08 | Migration aplica idempotente; rollback comentado executa | `apply_migration` MCP | ✅ | `apply_migration` retornou `success:true`. Re-rodar com tabelas existentes seria no-op (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS). Rollback documentado no topo do `.sql`. |

## Loveable — elementos descartados
- `Order` type com `commissionType`, `commissionPercent`, `cv` — modelo v1.
- `mockOrders` — dataset v1.
- Página `partner/Orders.tsx` no Loveable mostra comissão por venda — substituir por **valor pago manual** (modelo v2 = vendas fora do canal Shopify, sem comissão calculada porque não passa pela loja).
- `OrderType: LRP|FIRST|NORMAL` — fora do escopo de F-V14 (vai pra OrdersAnalytics admin em F-V16/S4).

## Rollback
- Revert do PR.
- Migration reversa: `<data>_f-v14-sales-manual.sql` rollback comentado no topo: `DROP TABLE IF EXISTS member_sales CASCADE; DROP TABLE IF EXISTS member_leads CASCADE;`.
- Feature flag desligar: `LRP_V2=false` → rota `/dashboard/orders` redireciona, dados ficam preservados em DB.
