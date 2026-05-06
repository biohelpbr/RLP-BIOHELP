# F-V15 — Eventos admin (criação + funil + link/tag)

## Metadata
- ID: F-V15
- Classe: C
- Status: Draft
- Onda: 7 (Sprint 4 — Eventos+Academy, 27/05–02/06/2026)
- Data: 2026-05-05

## Contexto
Reunião 29/04 PM: admin precisa criar eventos (presenciais ou online), atrelar um link de adesão, medir funil (topo → WhatsApp → presentes → convertidos) e gerar tag automática em quem comprar pelo link/período. Substitui o conceito legado de "cron mensal de cupom de creatina" — pode absorver F-V13.

## Definition of Ready
- [x] RFs definidos
- [ ] CAs testáveis preenchidos
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBD-24 não bloqueia início (hipótese padrão: gratuito + tag)

## Requisitos Funcionais
- **RF-1:** Admin cria evento com: nome, descrição, data início, data fim, online/presencial, local (se presencial), link de adesão único (gerado pelo sistema), produtos elegíveis ao bônus.
- **RF-2:** Sistema mantém métricas do evento: pessoas no topo de funil (visitas no link), pessoas no WhatsApp (manual ou via integração), pessoas presentes (admin marca), pessoas convertidas (compra pelo link/período).
- **RF-3:** Quem clicar no link e comprar dentro do período + produtos elegíveis recebe **tag automática** (`evento:<slug>`) no `shopify_customers`.
- **RF-4:** Painel admin lista eventos passados/correntes/futuros, custo total declarado pelo admin, retorno (receita gerada vs custo).
- **RF-5:** Quando flag `LRP_V2=true`, evento substitui cupom mensal de creatina (F-V13). Cron `generate-creatine-coupons` desligado.

## Critérios de Aceite (esboço)
- CA-01: criar evento com data fim < data início → erro Zod.
- CA-02: link de adesão é único (`/r/evt-<nanoid>`).
- CA-03: comprou pelo link no período + produto elegível → tag aplicada via webhook.
- CA-04: admin marca presença manual; contador atualiza.
- CA-05: admin define custo, sistema mostra receita gerada e ROI.
- CA-06: flag `LRP_V2=false` → tela inexistente; flag ON → tela ativa.

## Arquivos PERMITIDOS
- `app/admin/events/page.tsx` — lista
- `app/admin/events/new/page.tsx` — formulário
- `app/admin/events/[id]/page.tsx` — detalhe + funil + métricas
- `app/r/[slug]/route.ts` — handler de adesão (registra clique, redireciona)
- `lib/events/queries.ts`
- `lib/events/actions.ts`
- `lib/events/schema.ts`
- `lib/events/tag-on-conversion.ts` — chamado pelo webhook `orders/paid`
- `supabase/migrations/<data>_f-v15-events.sql`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não tocar webhook `app/api/webhooks/shopify/orders/paid` direto — adicionar handler novo via composição (Anti-SPEC §4).
- Não usar mock `mockTopCustomers` do Loveable.
- Não importar `Event` de qualquer lib v1 (não existe — está sendo criado novo).

## TBDs
- **TBD-24** *(não-bloqueante, hipótese padrão):* eventos gratuitos; bônus de ativação = tag + posicionamento no ranking. Entry-fee fica TBD pra v2.1.

## Plano de implementação
1. Branch `feat/F-V15-eventos-admin`.
2. Migration: tabelas `events` (id, name, description, start_at, end_at, mode, location, slug, cost, created_at), `event_eligible_products` (event_id, product_id), `event_visits` (id, event_id, ref_code?, ip, user_agent, visited_at), `event_attendances` (event_id, member_id, attended).
3. Handler `/r/[slug]/route.ts` registra visita + cookie `evt=<slug>` por 7 dias + redireciona.
4. No webhook `orders/paid`: se cookie `evt=<slug>` ativo + produto elegível → aplica tag.
5. Painel admin com 3 abas: ativo, passado, futuro.
6. Tela detalhe com funil visual + ROI.

## Matriz de Validação (a preencher)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 a CA-06 | … | misto | ⏳ | … |

## Loveable — elementos descartados
- Página `admin/Events.tsx` está com mocks v1; portar **layout** mas reescrever fluxo de dados.
