# F-V14 — Vendas manuais do membro (CRM leve)

## Metadata
- ID: F-V14
- Classe: C
- Status: Draft
- Onda: 7 (Sprint 2 — Membro core, 13–19/05/2026)
- Data: 2026-05-05

## Contexto
Reunião 29/04 PM: o membro vende fora do canal Shopify (presencial, indicação direta). Precisa de um CRM leve dentro do painel pra registrar leads e vendas concretizadas — tudo manual. Métricas (clientes ativos, produtos vendidos no mês, receita gerada) derivam só do que ele preenche. Sem rastreio automático.

## Definition of Ready
- [x] RFs definidos
- [ ] CAs testáveis preenchidos
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [ ] TBDs bloqueantes resolvidos (TBD-25 não bloqueia início — hipótese padrão documentada)

## Requisitos Funcionais
- **RF-1:** Membro pode registrar **lead** (potencial cliente): nome, telefone/email, produto-alvo, observação.
- **RF-2:** Membro pode registrar **venda concretizada**: nome do cliente, produto, quantidade, valor pago, forma de pagamento, data.
- **RF-3:** Painel exibe métricas derivadas: nº de clientes ativos, nº de produtos vendidos no mês, receita gerada no mês, ticket médio.
- **RF-4:** Lista de "oportunidades" — leads com mais de 30 dias sem retorno → flag pra reabordagem.
- **RF-5:** Membro vê **preço sugerido** do produto (definido pelo admin em F-V16). Preço de custo é admin-only.
- **RF-6:** Cada venda registrada vincula-se a um produto cadastrado pelo admin (F-V16 / Products) via FK.

## Critérios de Aceite (esboço — refinar antes de codar)
- CA-01: criar lead com nome+telefone obrigatórios; preview na lista imediato.
- CA-02: criar venda exige produto da lista admin; validação Zod.
- CA-03: cards de métricas atualizam ao criar/deletar venda.
- CA-04: lead com `last_contact_at` > 30 dias aparece em "Oportunidades".
- CA-05: RLS — membro só vê os próprios leads/vendas; admin vê todos via view.
- CA-06: lead/venda visível para o membro independente do flag `LRP_V2` (recurso novo, sem equivalente v1).

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

## Matriz de Validação (preencher no QA)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | … | manual | ⏳ | … |
| CA-02 | … | manual+Zod | ⏳ | … |
| CA-03 | … | manual | ⏳ | … |
| CA-04 | … | unit (cron-like) | ⏳ | … |
| CA-05 | … | RLS test (curl com 2 tokens) | ⏳ | … |
| CA-06 | … | flag toggle | ⏳ | … |

## Loveable — elementos descartados
- `Order` type com `commissionType`, `commissionPercent`, `cv` — modelo v1.
- `mockOrders` — dataset v1.
- Página `partner/Orders.tsx` no Loveable mostra comissão por venda — substituir por **preço sugerido vs preço de venda**.
