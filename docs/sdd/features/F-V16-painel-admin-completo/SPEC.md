# F-V16 — Painel admin completo (9 áreas)

## Metadata
- ID: F-V16
- Classe: B (visual + reads) → vira C nas áreas com mutations (Products, Finance)
- Status: Draft
- Onda: 7 (Sprints 3-4, 20/05–02/06/2026)
- Data: 2026-05-05

## Contexto
Reunião 29/04 PM: cliente apresentou layout admin completo com 9 áreas ativas. Esta SPEC é **agregadora** — cada área tem sub-SPEC ou é coberta por feature específica. Define a estrutura comum, navegação, e qual área puxa de qual lib.

## Áreas e dependências
| Área | Rota | Feature subjacente | Sub-SPEC | Status |
|---|---|---|---|---|
| Visão Geral | `/admin` | F-V16 (esta) | — | ✅ S3 (06/05/2026) |
| Comunidade | `/admin/community` | F-V16 + F-V18 (tags auto) | F-V18 SPEC | ✅ S3 (06/05/2026) |
| Crescimento | `/admin/growth` | F-V16 (gráficos + projeção) | — | ✅ S3 (06/05/2026) |
| Consumo | `/admin/consumption` | F-V16 (Shopify reads + admin manual) | — | ✅ S3 (06/05/2026) |
| Produtos | `/admin/products` | F-V16 (já existe; refator layout + preço sugerido + custo) | — | ✅ S3 (06/05/2026) |
| Eventos | `/admin/events` | F-V15 | F-V15 SPEC | ✅ S4 (06/05/2026) |
| Financeiro | `/admin/finance` | F-V04 (comissões) + F-V05 (saldo) + F-V16 | F-V04 SPEC + F-V05 SPEC | ✅ S4 (06/05/2026) — placeholder F-V04 |
| Resgates | `/admin/payouts` | F-V07 | F-V07 SPEC | ✅ S4 (06/05/2026) — switch v1/v2 |
| Academy | `/admin/academy` | F-V09 | F-V09 SPEC | ✅ S4 (06/05/2026) |
| Orders Analytics | `/admin/orders` | F-V16 | — | ✅ S4 (06/05/2026) |

## Definition of Ready
- [x] RFs definidos
- [ ] CAs testáveis (esboço)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [ ] Dependência: F-V03 (status ativo) e F-V05 (saldo) precisam estar funcionais pra dados reais; antes disso, áreas mostram zeros ou estados vazios.

## Requisitos Funcionais
- **RF-1:** Layout `app/admin/layout.tsx` com sidebar do AdminLayout (Loveable) — server component, sidebar é client island.
- **RF-2:** Visão Geral mostra: total membros, ativos, novos no mês, churn 90d, receita do mês, comissões pagas mês, payouts mês, breakdown por status (pre-Founder / Founder / Inativo) — substitui breakdown por rank v1.
- **RF-3:** Crescimento: gráfico mensal (membros novos, receita, comissões) usando Recharts. Projeção linear 3 meses à frente.
- **RF-4:** Consumo: lista de produtos com qty vendida, receita, contribuição líquida (admin-only), preço sugerido — pull do Shopify Admin API + leitura `member_sales` (F-V14).
- **RF-5:** Comunidade: lista de membros com filtro por status + tag (Líder/Influenciador/Founder via F-V18).
- **RF-6:** Toda área respeita `LRP_V2` flag — fora do flag, redireciona pra layout v1 atual.
- **RF-7:** Apenas usuários com `app_metadata.role === 'admin'` podem acessar — middleware + RLS.

## Critérios de Aceite (esboço)
- CA-01: usuário não-admin → 403 em todas as rotas `/admin/*`.
- CA-02: Visão Geral consome `lib/admin/overview-v2.ts` (a criar) — dados refletem estado real do Supabase.
- CA-03: gráficos Recharts renderizam (sem hidration mismatch entre RSC e client).
- CA-04: Consumo mostra produtos do Shopify; preço de custo só visível pra admin (RLS).
- CA-05: comunidade filtra por tag — query agrega `members` + `affiliate_counts` (view).
- CA-06: paginação em listas grandes (>50 itens).

## Arquivos PERMITIDOS
- `app/admin/layout.tsx` (novo Server Component + sidebar client)
- `app/admin/page.tsx` (Visão Geral) — substitui current
- `app/admin/community/page.tsx` (+`[id]`)
- `app/admin/growth/page.tsx`
- `app/admin/consumption/page.tsx`
- `app/admin/products/page.tsx` (refator do existente)
- `app/admin/orders/page.tsx` (analytics)
- `lib/admin/overview-v2.ts`
- `lib/admin/community.ts`
- `lib/admin/growth.ts`
- `lib/admin/consumption.ts`
- `components/admin/*` (sidebar, period filter, charts)
- `supabase/migrations/<data>_admin-views.sql` (views agregadas se necessário)

## Arquivos PROIBIDOS (Anti-SPEC)
- Não modificar `app/admin/page.tsx` v1 quando flag OFF — manter caminho de compatibilidade até F-V12.
- Não importar tipos `AdminOverview` do Loveable (`breakdownByRank` é v1).
- Não tocar middleware de auth sem PR separado.

## Plano de implementação
Sprint 3 (S3 do CRONOGRAMA-V2):
1. Layout admin novo + sidebar client.
2. Visão Geral com queries reais.
3. Comunidade (depende F-V18 ter contagem de afiliados).
4. Crescimento + Consumo + Produtos refator.

Sprint 4 (S4):
5. OrdersAnalytics.
6. Polimento + paginação + filtros.

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 a CA-06 | … | misto | ⏳ | … |

## Loveable — elementos descartados
- `AdminOverview.breakdownByRank` — substituir por `breakdownByStatus`.
- `AdminOverview.totalCVMonth` — remover.
- Mock `mockAdminOverview` — descartar.
- Sidebar items "Alertas" e "Configurações" — fora do MVP (Léo confirmou em 29/04 minuto 24:31).
