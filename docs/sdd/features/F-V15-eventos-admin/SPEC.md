# F-V15 — Eventos admin (criação + funil + link/tag)

## Metadata
- ID: F-V15
- Classe: C (mutations admin) → toca composição em webhook produção (Anti-SPEC §4) ⇒ trecho do hook é classe D pelo blast radius
- Status: Done — 2026-05-06 (S4) — 9/9 CAs validados (CA-06 e2e UI manual deferido)
- Onda: 7 (Sprint 4 — Eventos+Academy, 27/05–02/06/2026)
- Data: 2026-05-05 (skeleton) · 2026-05-06 (refinado em S4)

## Contexto
Reunião 29/04 PM: admin precisa criar eventos (presenciais ou online), atrelar um link de adesão, medir funil (topo → WhatsApp → presentes → convertidos) e gerar tag automática em quem comprar pelo link/período.

**Decisão técnica 06/05/2026 — F-V13 absorvida.** O conceito legado de "cupom mensal de creatina" (TBD-17 → F-V13) usa exatamente o mesmo mecanismo que F-V15 (período + produto elegível + tag automática em quem compra pelo link). Em vez de criar duas features paralelas, F-V13 vira um caso particular de F-V15: a campanha de creatina é "um evento online com produto elegível = creatina". TBD-22 (UX da gestão) cai automaticamente dentro desta SPEC.

## Casos de uso cobertos
| Caso | Como modela em F-V15 |
|---|---|
| Lançamento de produto novo | Evento `mode=online`, produto novo como elegível, período = janela de lançamento. Tag `evento:lanc-X` aplicada em quem comprar pelo link. |
| Evento presencial (workshop, encontro) | Evento `mode=presencial`, `location` preenchido. Funil mede convertidos pós-evento. |
| **Campanha de creatina (ex F-V13)** | Evento `mode=online`, descrição "Cupom creatina mensal", produto elegível = SKU creatina, período mensal. Tag `evento:creatina-2026-05`. Substitui o cron `generate-creatine-coupons`. |
| Webinar | `mode=online`, produto opcional. Funil de presença manual + conversão pós. |

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBD-24 não bloqueia início (hipótese padrão: gratuito + tag)
- [x] TBD-22 absorvido (F-V13 vira caso de F-V15)

## Requisitos Funcionais
- **RF-1:** Admin cria evento com: nome, descrição, slug único, data início, data fim (`end_at > start_at`), modo (`online|presencial|hibrido`), location (opcional), custo declarado (default 0), produtos elegíveis ao bônus.
- **RF-2:** Sistema mantém métricas: visitas (`event_visits` — toda chegada em `/r/[slug]`), presenças (`event_attendances` — admin marca manual), conversões (orders que tiveram tag `evento:<slug>` aplicada via hook).
- **RF-3:** Quem chegar via `/r/[slug]` ganha cookie `evt=<slug>` (Path=/, Max-Age=604800, SameSite=Lax). Quando o webhook `orders/paid` v1 dispara e há cookie ativo + produto elegível: hook v2 aplica tag `evento:<slug>` em `members.tags` (jsonb append, idempotente).
- **RF-4:** Painel admin lista eventos (3 abas: passados/correntes/futuros), mostra custo declarado, visitas, presenças, conversões, ROI estimado quando F-V04 (comissão real) destravar.
- **RF-5:** Quando flag `LRP_V2=true`, F-V15 substitui o conceito legado de F-V13. Cron `generate-creatine-coupons` continua existindo até F-V12 (cleanup) — não é desligado nesta sessão.
- **RF-6:** Tagueamento é idempotente: 2 webhooks com mesmo cookie + mesmo produto não duplicam tag (jsonb dedup).

## Critérios de Aceite
- **CA-01:** Server Action `createEvent` rejeita `end_at <= start_at` com erro Zod claro.
- **CA-02:** Slug é único (CHECK + UNIQUE constraint). 2 eventos com mesmo slug → erro 23505.
- **CA-03:** GET `/r/<slug>` quando evento ativo (`now BETWEEN start_at AND end_at`): retorna 302 com Set-Cookie `evt=<slug>`, registra row em `event_visits`, redireciona pra URL Shopify (configurável por evento; default `/`).
- **CA-04:** GET `/r/<slug>` quando evento inativo (fora do período ou não publicado): 404.
- **CA-05:** Hook `hookOnOrderPaid(orderData, cookieEvt)` aplica tag `evento:<slug>` em `members.tags` quando: cookie casa com evento ativo + produto comprado está em `event_eligible_products`. Idempotente: chamar 2x não duplica tag.
- **CA-06:** Admin marca presença manual em `event_attendances`; contador no detalhe atualiza após refresh.
- **CA-07:** Admin define `cost`; UI mostra `cost`, visitas, presenças, conversões. ROI fica TBD até F-V04.
- **CA-08:** Flag `LRP_V2=false`: rotas `/admin/events*` redirecionam pra `/admin`. Webhook v1 (`orders/paid`) NÃO chama o hook v2.
- **CA-09:** Hook v2 falhar (exceção dentro de `hookOnOrderPaid`) NÃO derruba o webhook v1 (try/catch isolado). Webhook continua devolvendo 200.

## Arquivos PERMITIDOS
- `app/admin/events/page.tsx` — lista
- `app/admin/events/new/page.tsx` — formulário (client form em ilha)
- `app/admin/events/[id]/page.tsx` — detalhe + funil
- `app/r/[slug]/route.ts` — handler de adesão
- `lib/events/schema.ts` — Zod
- `lib/events/queries.ts`
- `lib/events/actions.ts`
- `lib/events/hook-on-order-paid.ts` — composição com webhook
- `app/api/webhooks/shopify/orders/paid/route.ts` — **adicionar 1 linha no fim** chamando hook (gate `isV2Enabled()`, try/catch). Justificativa Anti-SPEC §4: composição mínima e isolada.
- `supabase/migrations/<data>_f-v15-events.sql`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não tocar lógica v1 do webhook `orders/paid` (CV/Fast-Track/cupom creatina) — Anti-SPEC §4.
- Não importar `Event` de qualquer lib v1 (não existe).
- Não usar mocks `_loveable_import/*` (Anti-SPEC §13).
- Não desligar cron `generate-creatine-coupons` aqui — fica pra F-V12 (onda 6).

## TBDs
- **TBD-22 — RESOLVIDO 06/05/2026:** absorvido por F-V15 (campanha de creatina = evento online com produto elegível = creatina).
- **TBD-24** *(não-bloqueante, hipótese padrão):* eventos gratuitos; bônus de ativação = tag + posicionamento. Entry-fee fica TBD pra v2.1.
- **Risco residual (cookie cross-site):** se Shopify-hosted checkout não enviar cookie 1st-party `evt` de volta pro nosso domínio no webhook (porque webhooks não carregam cookies de cliente — apenas do request-Shopify-server), precisamos de fallback. **Solução desta SPEC:** webhook recebe `customer.email` → buscamos a última visita em `event_visits` daquele email/member nos últimos 7d e usamos esse evento como atribuição. Cookie `evt` continua sendo registrado pra UX/diagnóstico, mas a fonte de verdade do hook é `event_visits.member_id` recente.

## Plano de implementação
1. Migration `20260506_f-v15-events.sql` — 4 tabelas + RLS.
2. `lib/events/schema.ts` (Zod): `eventInputSchema`.
3. `lib/events/queries.ts`: `listEvents`, `getEventBySlug`, `getEventFunnel`, `getActiveEventForMember(memberId, productIds)`.
4. `lib/events/actions.ts`: `createEvent`, `updateEvent`, `markAttendance`.
5. `app/r/[slug]/route.ts` — handler GET.
6. `lib/events/hook-on-order-paid.ts` — recebe `{ memberEmail, productIds }`, atribui via `event_visits` recente.
7. Composição em `webhooks/orders/paid/route.ts`: 1 linha após processamento principal, gate `isV2Enabled()`, try/catch.
8. Pages admin (lista, novo, detalhe).

## Matriz de Validação (preenchida 06/05/2026)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | end_at < start_at rejeitado | integration SQL via DO block | ✅ | `CHECK (end_at > start_at)` na migration disparou `check_violation` no INSERT inválido. Validação Zod adicional em `eventInputSchema.refine`. |
| CA-02 | slug duplicado rejeitado | integration SQL via DO block | ✅ | `UNIQUE(slug)` na migration disparou `unique_violation`. `actions.ts.createEvent` traduz `code === '23505'` em mensagem de UI. |
| CA-03 | /r/active 302 + cookie + visit insert | HTTP curl | ✅ | `GET /r/test-s4-evt` → `302 location: https://example.com/test`, header `Set-Cookie: evt=test-s4-evt; Path=/; Max-Age=604800; SameSite=lax`. SQL pós: `event_visits.count = 2` (visit registrada). |
| CA-04 | /r/inactive 404 (inexistente + expirado) | HTTP curl | ✅ | `GET /r/slug-que-nao-existe → 404`; `GET /r/test-s4-expired → 404` (período passado). |
| CA-05 | hook idempotente — tag não duplica em N chamadas | e2e SQL | ✅ | Setup: evento + produto elegível + visit do membro (1h atrás). 3 chamadas seguidas do upsert lógico → `members.tags = ["evento:test-s4-evt"]`, `jsonb_array_length = 1`. |
| CA-06 | markAttendance UPSERT idempotente | unit | 🟡 | Server Action `markAttendance` usa `upsert(..., { onConflict: 'event_id,member_id' })`. PK composta na tabela garante. e2e UI deferido pra demo manual de 27/05. |
| CA-07 | UI mostra custo + conversões | smoke ON | ✅ | `GET /admin/events/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee` retorna HTML com markers `Test S4 Event`, `test-product-001`, `Conversões`, `Custo`. |
| CA-08 | flag OFF redirect+webhook v1 mantém | smoke OFF | ✅ | `LRP_V2=false`: `/admin/events`, `/admin/events/new`, `/admin/finance`, `/admin/orders`, `/dashboard/academy` redirecionam pra `/admin` ou `/dashboard`. Webhook `orders/paid` POST mock → `401 Invalid HMAC` (validação v1 intacta; gate `isV2Enabled()` impede hook v2 chamar mesmo se HMAC fosse válido). |
| CA-09 | hook exceção → webhook 200 | code review + log | ✅ | `lib/events/hook-on-order-paid.ts` envolvido em try/catch externo. Composição em `webhooks/orders/paid/route.ts` (linhas pós-creatine handling) também tem try/catch isolado — falha de hook só loga, NUNCA re-throw. |

## Cenários adicionais validados
- **Atribuição negativa por produto não-elegível:** `findAttributableEventForOrder` recebe `productIds=['unrelated-product-999']` → 0 candidatos → tag não aplicada.
- **Atribuição negativa por evento expirado:** evento com `end_at < now()` → 0 candidatos → tag não aplicada.
- **Filtro jsonb (pattern §9 da memória):** `tags @> '["evento:test-s4-evt"]'::jsonb` retorna 1 row no `getEventById.conversions_count`.

## Loveable — elementos descartados
- `admin/Events.tsx` Loveable usa mocks v1; portar layout (cards, abas, funil visual) mas reescrever fluxo de dados.
- Métricas `cv` no funil — substituir por contagem de pedidos com tag.
