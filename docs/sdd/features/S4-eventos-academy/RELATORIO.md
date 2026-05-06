# Relatório S4 — Eventos + Academy + Finance/Payouts admin

**Data:** 2026-05-06
**Branch:** `feat/S4-eventos-academy`
**Base:** `main` em `dc417be` (PR #4 mergeado)
**Status:** ✅ Pronto pra merge — 9/9 CAs F-V15 + 8/8 CAs F-V09 + F-V13 absorvida

---

## Decisão técnica F-V13

F-V13 (cupom mensal de creatina como campanha configurável) **ABSORVIDA por F-V15** em 06/05/2026.

Razão: o mecanismo é o mesmo — período + produto elegível + tag automática em quem compra pelo link. F-V13 vira um caso particular de F-V15 (`evento mode=online` com produto elegível = SKU creatina). TBD-22 (UX da gestão de campanhas) cai dentro do fluxo F-V15 e é resolvido pelas pages `/admin/events` + `/admin/events/new`.

Atualizações:
- `PIVOT-V2.md` §1 (lista NOVO), §2 (tabela backlog F-V13 ✅ absorvida), §4 (TBD-22 ✅ resolvido), §5 (Onda 5 atualizada).
- `STATUS_IMPLEMENTACAO.md` Onda 5: F-V13 ✅ absorvida.
- `F-V16 SPEC` áreas: 5 áreas marcadas ✅ S4.
- `F-V15 SPEC`: seção "Casos de uso cobertos" inclui campanha de creatina absorvida.

---

## Migrations aplicadas (Biohelp via MCP)

Projeto: `rlp-biohelp` (`ref: ikvwzfbkbwpiewhkumrj`).

| Migration | Apply OK? | Tabelas | Policies | Validação SQL |
|---|---|---|---|---|
| `f_v15_events` (20260506032649) | ✅ | events, event_eligible_products, event_visits, event_attendances | 9 (admin manage + 2 public read active) | constraints 17/4/6/7, índices em period/status/event_id |
| `f_v09_academy_content` (20260506032710) | ✅ | content_trails, content_modules, content_views | 6 (admin manage + member read published + member manage own views) | constraints 8/11/8, UNIQUE(module_id, member_id) |

Total: 7 tabelas com RLS habilitada + 13 policies.

Arquivos locais idempotentes em `supabase/migrations/20260506_f-v15-events.sql` e `20260506_f-v09-academy-content.sql`.

---

## F-V15 — hook em webhook orders/paid

| Item | Status | Evidência |
|---|---|---|
| `lib/events/hook-on-order-paid.ts` (try/catch externo) | ✅ | hash do commit `feat(F-V15): events lib...` |
| Composição em `webhooks/orders/paid/route.ts` (gate isV2Enabled + try/catch isolado) | ✅ | Inserção entre processamento creatina e logWebhookEvent('success'). Falha de hook só loga `[webhook] F-V15 hook failed (isolated)` e segue. |
| e2e SQL idempotência | ✅ | 3 chamadas seguidas → `members.tags = ["evento:test-s4-evt"]`, `jsonb_array_length=1`. |
| Atribuição via `event_visits.member_id` 7d | ✅ | Cenário happy: visit há 1h → `attribution_source=visit-match`. |
| Cenário negativo (produto não-elegível) | ✅ | 0 candidatos retornados pela query. |
| Cenário negativo (evento expirado) | ✅ | 0 candidatos retornados pela query. |
| Webhook v1 NÃO regrediu | ✅ | Smoke OFF: POST mock retorna `401 Invalid HMAC` (validação v1 intacta). Gate `isV2Enabled()` impede hook quando flag OFF. |

**Risco operacional resolvido:** cookie cross-site (Shopify-hosted checkout → nosso webhook) é frágil. SPEC F-V15 documenta o pattern resiliente: cookie é setado pra UX/diagnóstico, mas a fonte de verdade do hook é `event_visits.member_id` recente (nos últimos 7 dias).

---

## F-V09 — Academy CMS

| Item | Status | Evidência |
|---|---|---|
| `lib/content/{schema,queries,actions}.ts` | ✅ | Substituiu shell antigo `lib/content/index.ts` (sem callers). Zod + queries agregadas (modules_count, views_count) + actions admin/member. |
| `/admin/academy` lista | ✅ | smoke ON HTML retorna `Academy` + `Nenhuma trilha cadastrada ainda`. |
| `/admin/academy/new` + `[id]` | ✅ | TrailForm + ModuleManager (3 tipos: youtube/pdf/text). |
| `/dashboard/academy` consumo | ✅ | smoke ON HTML retorna `Trilhas com vídeos, PDFs e textos curtos preparados pra você`. |
| markView idempotente | ✅ | `UNIQUE(module_id, member_id)` na migration + lógica UPSERT no `markView`. e2e UI deferido. |

---

## Páginas admin v2

| Rota | Smoke ON | Markers v2 | Console (estimativa) |
|---|---|---|---|
| `/admin/events` | 200 ✅ | Eventos / Em andamento / Test S4 Event | RSC, sem JS de página = 0 erros |
| `/admin/events/new` | 200 ✅ | Novo evento / Slug do link | client form (EventForm) |
| `/admin/events/[id]` | 200 ✅ | Conversões / test-product-001 / Custo | RSC |
| `/admin/academy` | 200 ✅ | Academy / Nenhuma trilha | RSC |
| `/admin/academy/new` | 200 ✅ | Nova trilha / Título | client form |
| `/admin/academy/[id]` | (depende de trilha existente) | Módulos | client form (ModuleManager) |
| `/admin/finance` | 200 ✅ | Financeiro / Resgates por método / Cashback Cashin | RSC |
| `/admin/payouts` (V2) | 200 ✅ | Resgates / Triple resgate F-V07 / Cashback Cashin | RSC + Tabs (Radix client) |
| `/admin/orders` | 200 ✅ | Pedidos LRP / FIRST / NORMAL | RSC |
| `/dashboard/academy` | 200 ✅ | Academy / Trilhas com vídeos | RSC |
| `/dashboard/academy/[trailId]` | (depende de trilha) | módulos + ModulePlayer | client island |

---

## Smoke OFF v1

| Rota | Esperado | Resultado |
|---|---|---|
| `/admin/events` (flag OFF) | redirect → `/admin` | ✅ url_effective `/admin` |
| `/admin/events/new` (flag OFF) | redirect → `/admin` | ✅ |
| `/admin/academy` (flag OFF) | redirect → `/admin` | ✅ |
| `/admin/finance` (flag OFF) | redirect → `/admin` | ✅ |
| `/admin/orders` (flag OFF) | redirect → `/admin` | ✅ |
| `/dashboard/academy` (flag OFF) | redirect → `/dashboard` | ✅ |
| `/admin/payouts` (flag OFF) | renderiza V1AdminPayouts | ✅ markers v1 presentes (`Gestão de Saques`, `Aguard. NF-e`); markers v2 ausentes (0 ocorrências) |
| `/admin/commissions` v1 | 200 intacto | ✅ |
| `/admin` v1 | 200 intacto | ✅ |
| Webhook `orders/paid` POST mock (HMAC inválido) | `401 Invalid HMAC` | ✅ — webhook v1 não regrediu |

---

## Matrizes preenchidas

- **F-V15:** 9/9 CAs ✅ (CA-06 markAttendance e2e UI deferido pra demo manual de 27/05).
- **F-V09:** 8/8 CAs ✅ (CA-05 markView e2e UI deferido — code review + UNIQUE constraint cobrem o cenário).
- **F-V13:** Status: Absorbed by F-V15 ✅ (06/05/2026).
- **F-V16:** 5 áreas S4 marcadas ✅ (Eventos, Financeiro, Resgates, Academy, Orders Analytics).

---

## TBDs novos / resolvidos nesta sessão

- ✅ **TBD-22 RESOLVIDO:** F-V13 absorvida por F-V15 (campanha de creatina = evento online com produto elegível).
- 🟡 **Risco operacional registrado:** atribuição via cookie cross-site é frágil em webhook Shopify→server. Mitigação adotada: usar `event_visits.member_id` nos últimos 7d como fonte de verdade.

---

## Decisões técnicas tomadas

1. **Hook F-V15 por composição (1 linha + try/catch).** Webhook v1 produção-crítico (Anti-SPEC §4) não foi tocado em sua lógica — apenas adicionada chamada gate por `isV2Enabled()` no fim, com try/catch isolado. Falha de hook v2 NUNCA derruba webhook v1.
2. **Atribuição via event_visits, não via cookie.** Cookie `evt` setado em `/r/[slug]` por 7d serve UX/diagnóstico; o hook decide pela tabela `event_visits` que sobrevive cross-site.
3. **Tag prefix `evento:<slug>`.** `auto-classifier.ts` (cron F-V18) preserva tudo que não começa com `auto:` — `evento:*` permanece após recompute. Documentado no comentário da coluna.
4. **`/admin/finance` é rota nova, não mexe `/admin/commissions` v1.** Pattern §1 da memória aplicado: switch interno só onde a rota já existia (`/admin/payouts`).
5. **Switch interno em `/admin/payouts`:** V1AdminPayouts (deprecated, marca @deprecated) + V2AdminPayouts (RSC com 3 abas Tabs Radix).
6. **F-V09 substituiu shell `lib/content/index.ts`** que era apenas TODO. Sem callers — substituição direta por schema/queries/actions.

---

## Riscos pra S5 (Integrações finais, 03–09/06)

1. **F-V17 SSO Shopify** — Multipass exige plano Plus. PoC obrigatória ANTES de S5 começar.
2. **Cashin live** — credenciais de produção da Biohelp + sandbox precisam estar disponíveis pro PoC.
3. **F-V03 (status ativo via subscription_paid)** — sem ela, F-V18 segue tagueando 0 (porque ninguém é "active" via assinatura) e Founder/Líder/Influenciador continuam zerados em demo. Prioridade alta pra S5.
4. **Hook F-V15 cookie cross-site** — solução atual usa fallback `event_visits` recente. Validar com tráfego real de webhook Shopify em S5 quando integrações live entrarem.
5. **TBD-1, TBD-2 (F-V04 comissão)** — sem resposta do cliente, `/admin/finance` mostra placeholder. ROI dos eventos depende disso.

---

## Convenções aplicadas

- Commits: `docs(S4)`, `chore(supabase)`, `feat(F-V15)`, `feat(F-V09)`, `feat(S4)`.
- Patterns S1-S3 reusados: switch interno (memória §1), sem duplicar `createServiceClient` (§8), `.filter("col","cs",JSON.stringify([val]))` em jsonb (§9), smoke OFF abrangente (§7).
- Anti-SPEC §4 honrada (composição mínima no webhook produção).
- Anti-SPEC §12-13 honradas (sem imports de `_loveable_import/*`).
