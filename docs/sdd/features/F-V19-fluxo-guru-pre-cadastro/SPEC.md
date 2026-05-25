# F-V19 — Fluxo Pré-cadastro → Guru → LRP → Shopify

## Metadata
- **ID:** F-V19
- **Classe:** D (toca webhook produção-crítico Anti-SPEC §4 + cria customer/order na Shopify Anti-SPEC §2 + introduz webhook receiver novo que ainda vai pra produção)
- **Status:** Draft → Demo MVP 22/05/2026
- **Onda:** 2 (Foundation v2) — destrava cadastro real do Live de 01/06/2026
- **Data:** 2026-05-22 (correções pós-runbook 22/05 12h45)
- **Origem:** Call cliente 20/05/2026 09h33-10h27 — fluxo desenhado no Miro pelo Mateus (https://miro.com/app/board/uXjVHTgAvfc=/)

> **⚠️ ATENÇÃO — RF-4, RF-7, RF-8 desta SPEC têm DIVERGÊNCIAS com a API real do Guru.** Sessão paralela pesquisou doc oficial em 22/05 e gerou correções consolidadas em [docs/wiki/runbooks/webhook-guru-debug.md](../../../wiki/runbooks/webhook-guru-debug.md). Diff resumido em [docs/sdd/PLANO-IMPLEMENTACAO-22MAI.md §"CORREÇÕES PÓS-RUNBOOK"](../../PLANO-IMPLEMENTACAO-22MAI.md). Pontos: (1) sem HMAC — api_token no body; (2) sem event_type discreto — webhook_type + last_status + classifyGuruEvent(); (3) sem external_id — usar utm_term. Implementador: ler o runbook antes do Passo 5.

## Contexto

Cliente vai fazer Live no **dia 01/06/2026** e precisa do fluxo end-to-end pronto: sponsor compartilha link → lead clica → preenche form → vai pro checkout Guru → paga → cai logado no LRP como member ativo. Hoje o LRP está em `LRP_V2=false` em prod e o webhook Shopify orders/paid tem hook F-V03 que marca `subscription_paid` por heurística de produto Shopify. **Esse caminho deixa de existir** — Guru passa a ser a fonte da assinatura, Shopify recebe apenas o "espelho" (customer + pedido fake p/ liberar preço de clube via tag).

Fluxo desenhado pelo Mateus na call (Miro):

```
[Sponsor copia link] → [divulga na live] → [Lead clica /r/<sponsor_ref>]
  ↓
[Landing dinâmica com nome do sponsor + form]
  ↓
[Submit] → 2 caminhos paralelos:
  ├─ USER PATH:  Checkout Guru (email/nome pré-populados) → paga → redirect /welcome?tx=X&email=Y → auto-login → dashboard
  └─ DATA PATH:  member criado no LRP com subscription_status='pending' (lista de espera)
  ↓
[Webhook Guru subscription.paid] →
  - subscription_status='paid' + subscription_expires_at = now() + 1 ano
  - cria/atualiza Shopify customer + pedido-clone (R$0, tag 'subscriber:<data>')
  - dispara F-V18 recompute do sponsor (active_count++)
  ↓
[Webhook Guru subscription.renewed] → estende expires_at +1 ano
[Webhook Guru subscription.cancelled] → marca auto_renew=false (LRP só não renova na data)
[Webhook Guru subscription.refunded]  → cancelamento MANUAL no admin (Gabriel: "eu fazia manualmente")
[Cron diário]   → membros com expires_at < now() viram subscription_status='cancelled' + remove tag Shopify
```

**Decisões fechadas na call (transcrição 04:00–32:00):**

| Decisão | Fonte |
|---|---|
| Checkout do Guru, sem formulário do Guru (Léo já desligou) | Léo 04:35 |
| Pré-form dentro do LRP/Flowcode (não Cakto, não Ganho de Peso) | Mateus 13:45 |
| Página pré-cadastro mostra "Você foi convidado por <Sponsor>" + form dinâmico | Mateus 11:38 |
| Lead vira member inativo no LRP (lista de espera) antes do pagamento | Mateus 17:13, Gabriel 18:03 |
| Após pagar Guru: redirect leva parâmetros (email, CPF, telefone, nome, transactionID) na URL → auto-login | Mateus 19:09 |
| LRP cria customer + pedido fake no Shopify (tag subscriber) | Mateus 21:09, Gabriel 22:05 |
| Comissão dispara apenas quando vira ativo (não no pré-cadastro) | Mateus 20:20, Logística 20:17 |
| Renovação: redundância webhook + API. LRP é o ponto central. | Mateus 31:16, Gabriel 32:00 |
| LRP guarda expires_at; cron inativa sozinho se Guru não renovar | Mateus 31:16 |
| Cancelamento de renovação ≠ inativação imediata | Mateus 29:50 |
| Reembolso = cancelamento manual no admin | Gabriel 30:55 |

## Anti-SPEC aplicada
- §1 `members.sponsor_id` — preservado, é exatamente o vínculo que estamos populando.
- §2 `shopify_customers`/tags — vamos **adicionar** rows e tag `subscriber:<data>`. Não alterar tags existentes.
- §3 `orders`/`order_items` — vamos inserir pedidos com `is_subscription_clone=true` (nova coluna nullable) sem afetar histórico fiscal real.
- §4 Webhook Shopify orders/paid — **não tocar**. Webhook Guru é novo endpoint próprio.
- §6 Migrations idempotentes com rollback comentado.
- §11 Provider Guru fica em `lib/subscriptions/providers/guru.ts` com interface agnóstica (igual `lib/payouts/v2/`) — facilita troca futura (Cakto, Hotmart, etc).

## Definition of Ready
- [x] RFs definidos abaixo
- [x] CAs testáveis (Matriz de Validação no fim)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBDs bloqueantes resolvidos na call 20/05:
  - TBD-1/TBD-2 (comissão %) ainda abertos, mas **não bloqueiam F-V19** — comissão dispara DEPOIS do paid, F-V19 só marca paid.
  - TBD-7 (integração Guru) → resolvido: Guru → LRP direto via webhook próprio, NÃO mais via Shopify.
- [x] Hipóteses padrão registradas (ver §RF abaixo)

## Requisitos Funcionais

### RF-1 — Schema (migration `20260522_f-v19-pre-cadastro-guru.sql`)
- ADD COLUMN `members.subscription_expires_at timestamptz NULL` — quando expira (calculado +1 ano da última compra).
- ADD COLUMN `members.subscription_auto_renew boolean NOT NULL DEFAULT true` — false após `subscription.cancelled` do Guru.
- ADD COLUMN `members.pre_registered_at timestamptz NULL` — quando entrou no pré-cadastro (lista de espera).
- ADD COLUMN `members.guru_subscriber_id text NULL` — id externo da assinatura Guru (idempotência).
- ADD COLUMN `orders.is_subscription_clone boolean NOT NULL DEFAULT false` — flag pra distinguir pedidos-fake (clone) de pedidos reais Shopify.
- NEW TABLE `guru_webhook_events` (id, event_id text UNIQUE, event_type text, payload jsonb, received_at timestamptz, processed_at timestamptz NULL, error text NULL).
- INDEX `idx_members_subscription_expires_at` em (`subscription_expires_at`) WHERE `subscription_status='paid'`.
- INDEX `idx_members_guru_subscriber_id` em (`guru_subscriber_id`) WHERE `guru_subscriber_id IS NOT NULL`.
- RLS: `guru_webhook_events` apenas service_role (igual `auth_audit`).

### RF-2 — Rota `/r/[ref_code]` (referral landing)
- `app/r/[slug]/route.ts` HOJE responde **apenas** evento F-V15. Vamos transformar em handler dual:
  1. Lookup primeiro em `events.slug` (mantém F-V15 — Anti-SPEC §4 webhook orders/paid depende dessa rota).
  2. Se não achou, lookup `members.ref_code = <slug>`. Se achou: redireciona pra **`/convite/[ref_code]`** (landing pré-cadastro v2 — server component).
  3. Se não achou nada: 404 (comportamento atual mantido).
- Cria cookie `ref=<ref_code>` Path=/ Max-Age=7d SameSite=Lax pra fallback em caso de bypass do form.

### RF-3 — Página `/convite/[ref_code]` (landing pré-cadastro)
- Server component. Busca sponsor por `ref_code`, retorna 404 se inexistente OU `subscription_status='cancelled'` (TBD-8 hipótese padrão: inativo bloqueia novos cadastros).
- Renderiza:
  - Headline: "Você foi convidado(a) por **<sponsor.name>**"
  - Subheadline: descrição do clube
  - Formulário inline (`'use client'` form component):
    - Nome completo (required, min 3)
    - Email (required, RFC)
    - WhatsApp (required, mask BR)
    - CPF (required, mask + checksum)
    - Aceito termos (required)
  - Botão "Continuar para pagamento" → server action.
- Design: shadcn + tokens existentes do Loveable import. Texto institucional vem de `lib/copy/convite.ts` (constante exportada, edição fácil pelo cliente depois).
- Inspiração visual: i-green (link enviado pelo Léo) — 2 etapas, headline de boas-vindas, badge do sponsor.

### RF-4 — Server Action `createPreRegistration`
- Localização: `lib/subscriptions/actions.ts` (adicionar — namespace `subscriptions` cobre tanto a marcação paid quanto o pré-cadastro).
- Input Zod: `{ ref_code, name, email, phone, cpf, accepted_terms: true }`.
- Comportamento:
  1. Busca sponsor por `ref_code` (404 se não existe).
  2. Verifica idempotência por email: se já existe member com esse email + sponsor_id, reusa (não duplica).
  3. Cria `members` row com `auth_user_id=NULL`, `subscription_status='pending'`, `pre_registered_at=now()`, `sponsor_id=<sponsor.id>`. `ref_code` gerado normal (formato BH00001 sequencial).
  4. Insere row em `referral_events` (tabela já existe — `kind='pre_registration'`).
  5. Gera `transaction_token` UUID temporário, salva em `members.guru_subscriber_id` (placeholder até webhook Guru sobrescrever) OU em coluna `pre_registration_token` se preferir manter limpo.
  6. Retorna `{ ok: true, redirect_url: '<URL Guru com query params>' }`.
- URL Guru (Mateus 09:00–10:00): `https://pay.guru.com.br/<offer_id>?email=<email>&name=<name>&cpf=<cpf>&phone=<phone>&utm_source=lrp&utm_campaign=<sponsor.ref_code>&external_id=<transaction_token>`.
- `<offer_id>` vem de env `GURU_OFFER_ID_CLUBE_MENSAL` (placeholder hoje, Léo confirma valor).

### RF-5 — Página `/welcome` (pós-checkout Guru)
- `app/welcome/page.tsx`. Server component que recebe query params do redirect Guru: `email`, `cpf`, `phone`, `name`, `transaction_id` (renomeado: `tx`), `external_id` (= `pre_registration_token`).
- Server action `claimPreRegistration({ external_id, transaction_id })`:
  1. Busca member por `external_id`. Se não achou: erro "transação não encontrada — fale com o suporte".
  2. Verifica se `subscription_status='paid'` já. Se sim: faz auto-login direto.
  3. Se ainda `pending`: chama `markSubscriptionPaid(member.id)` (idempotente — já existe em `lib/subscriptions/actions.ts`) + seta `subscription_expires_at = now() + 1 year` + `guru_subscriber_id = transaction_id`.
  4. Cria auth.user no Supabase via `supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata: { member_id } })` se ainda não existe.
  5. Liga `members.auth_user_id = <auth.user.id>`.
  6. Gera magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email })` e redireciona o browser pro link → cliente cai logado em `/dashboard`.
  7. Dispara `syncCustomerToShopify` + cria pedido-clone (próxima RF) em background.

### RF-6 — Sync Shopify (customer + pedido-clone)
- `lib/shopify/subscription-sync.ts` (novo). Função `syncSubscriptionToShopify({ member, transaction_id })`:
  1. `syncCustomerToShopify` (já existe em `lib/shopify/customer.ts`) — passa email, firstName, refCode, sponsorRefCode, tag `subscriber:<YYYY-MM-DD>` (data de expiração).
  2. Cria pedido fake via Shopify Admin GraphQL `draftOrderCreate` + `draftOrderComplete`:
     - lineItem: produto "Assinatura Clube" (variant id em env `SHOPIFY_VAR_ASSINATURA_CLUBE`)
     - financialStatus: `paid`
     - tags: `lrp:subscription, lrp:guru-tx-<transaction_id>`
     - note: `Espelho LRP de assinatura Guru ${transaction_id}`
     - lê variant id de env (placeholder agora, Léo cria produto no Shopify Admin).
  3. Insere row em `orders` com `is_subscription_clone=true`, `shopify_order_id=<id retornado>`, `total_amount=0`, `member_id=<member.id>`.
- **No MVP de hoje (22/05):** essa função existe mas **não chama a API real** — apenas faz `console.info('[SUBSCRIPTION_SYNC] would call:', payload)` + insere o row local em `orders`. Variável `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=false` default off. Liga em `true` na próxima sessão quando Léo confirmar variant id do produto fake no Shopify Admin.

### RF-7 — Webhook `/api/webhooks/guru` (recebe eventos Guru)
- `app/api/webhooks/guru/route.ts` (novo). POST handler:
  1. Valida HMAC header `X-Guru-Signature` contra `GURU_WEBHOOK_SECRET` (env).
  2. Parse body → `{ event_id, event_type, data }`.
  3. Idempotência: insere em `guru_webhook_events` com `ON CONFLICT (event_id) DO NOTHING`. Se conflito, retorna 200 (já processado).
  4. Switch por `event_type`:
     - `subscription.created` / `transaction.approved`: busca member por `external_id` (do `data.metadata.external_id`) OU por email. Chama `markSubscriptionPaid` + seta `expires_at = now() + 1 year` + `guru_subscriber_id = data.subscriber_id`. Dispara sync Shopify.
     - `subscription.renewed`: estende `expires_at = now() + 1 year`. Atualiza tag Shopify (`subscriber:<nova-data>`).
     - `subscription.cancelled` (renovação cancelada): seta `auto_renew=false`. **Não inativa agora** — cron diário inativa na expires_at se auto_renew=false.
     - `transaction.refunded` / `subscription.refunded`: loga e cria notificação pro admin (não inativa automático — Gabriel 30:55: cancelamento por reembolso é manual).
  5. Marca `guru_webhook_events.processed_at = now()` no fim.
  6. Tratamento de erro: pattern §10 (Anti-SPEC §4) — try/catch por evento; falha em 1 evento não derruba o endpoint.

### RF-8 — Endpoint de desenvolvimento `/api/dev/simulate-guru` (DEMO 22/05)
- `app/api/dev/simulate-guru/route.ts`. **Só disponível quando `NODE_ENV !== 'production'` OU env `DEV_SIMULATE_GURU=true`**.
- POST `{ event_type, external_id, transaction_id, email }` → invoca o handler `/api/webhooks/guru` interno com payload fake assinado.
- Usado pelo botão "Simular pagamento" na página `/convite/[ref_code]/aguardando` (next to dev mode banner).
- **Remoção:** quando Guru real estiver integrado, deletar essa rota. Item no TODO §4.

### RF-9 — Cron diário `inactivate-expired-subscriptions`
- `app/api/cron/inactivate-expired-subscriptions/route.ts`. Vercel Cron diário às 03:00 BRT.
- Pseudo:
  ```sql
  UPDATE members
  SET subscription_status='cancelled'
  WHERE subscription_status='paid'
    AND subscription_expires_at < now()
    AND subscription_auto_renew = false;
  ```
- Para cada member afetado: chama `onMemberStatusChange` (já existe) pra recomputar tag F-V18 do sponsor + remover tag `subscriber` do Shopify (via `syncCustomerToShopify`).
- Gate: respeita `CRON_DISABLED_V2` (Anti-SPEC). Em prod com `LRP_V2=false` o cron retorna 200 sem fazer nada.

### RF-10 — Notificações (mínimo MVP)
- `lib/notifications/` (novo namespace, shells em A5+U6 pending). Pra esta feature: gera 2 notificações in-app no admin:
  1. `pre_registration_created` (info — alguém entrou na lista de espera).
  2. `subscription_paid` (success — assinatura confirmada, sponsor ganhou ativo).
- **Decisão A5+U6 não foi fechada ainda** — Gabriel vai listar notificações mínimas. Pra MVP de hoje: cria a tabela `notifications` + um component `<NotificationBell/>` no header admin + endpoint `/api/notifications` que lista as do admin logado. Email/WhatsApp fica pra próxima sessão.

## Critérios de Aceite

| CA | Descrição |
|---|---|
| CA-01 | Migration aplica idempotente (re-rodar não erra). `guru_webhook_events` aceita insert. |
| CA-02 | `GET /r/<sponsor_ref>` (sponsor existente) redireciona 302 para `/convite/<sponsor_ref>`. Cookie `ref` setado. |
| CA-03 | `GET /r/<event_slug>` (evento F-V15 existente) continua redirecionando pro evento (não quebrou F-V15). |
| CA-04 | `GET /convite/<sponsor_ref>` renderiza nome do sponsor no H1 + form com 5 campos. 404 se sponsor não existe ou cancelled. |
| CA-05 | Submit do form com dados válidos cria `members` com `subscription_status='pending'`, `sponsor_id` correto, retorna `redirect_url` com query params Guru. |
| CA-06 | Submit duplicado (mesmo email + sponsor) reusa o member existente (idempotente). |
| CA-07 | `POST /api/dev/simulate-guru` com `event_type='subscription.created'` chama handler interno → member fica `paid` + `expires_at` populado + `auth_user_id` criado + redirect pra magic link funciona. |
| CA-08 | `POST /api/webhooks/guru` com HMAC inválido retorna 401. |
| CA-09 | `POST /api/webhooks/guru` idempotente: 2 chamadas com mesmo `event_id` → segunda retorna 200 sem reprocessar. |
| CA-10 | `subscription.renewed` estende `expires_at` em +1 ano (acumulando, não resetando). |
| CA-11 | `subscription.cancelled` seta `auto_renew=false` mas member continua `paid`. |
| CA-12 | Cron com membro `expires_at < now()` E `auto_renew=false` → member vira `cancelled` + sponsor perde 1 ativo na view F-V18. |
| CA-13 | Cron com `LRP_V2=false` retorna 200 sem fazer nada (Anti-SPEC gate). |
| CA-14 | F-V18 recompute dispara após `markSubscriptionPaid` (ver hook em `lib/subscriptions/actions.ts:50`). |
| CA-15 | Shopify sync **logado** (mock) imprime payload esperado no console quando `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=false`. |
| CA-16 | Notificação `subscription_paid` aparece no admin após webhook simulate. |

## Arquivos PERMITIDOS
- `supabase/migrations/20260522_f-v19-pre-cadastro-guru.sql` (nova)
- `app/r/[slug]/route.ts` (modificar — adiciona lookup secundário em `members.ref_code`)
- `app/convite/[ref_code]/page.tsx` (novo)
- `app/convite/[ref_code]/ConviteForm.tsx` (novo — `'use client'`)
- `app/welcome/page.tsx` (novo)
- `app/welcome/actions.ts` (novo — `claimPreRegistration`)
- `app/api/webhooks/guru/route.ts` (novo)
- `app/api/dev/simulate-guru/route.ts` (novo — DEV only)
- `app/api/cron/inactivate-expired-subscriptions/route.ts` (novo)
- `lib/subscriptions/actions.ts` (modificar — adiciona `createPreRegistration` + `extendSubscription` + `cancelAutoRenew`)
- `lib/subscriptions/providers/guru.ts` (novo — HMAC verify + types)
- `lib/subscriptions/queries.ts` (modificar — adiciona `getExpiredSubscriptions`, `getMemberByExternalId`)
- `lib/shopify/subscription-sync.ts` (novo — mock-aware via `SHOPIFY_SUBSCRIPTION_SYNC_LIVE` env)
- `lib/copy/convite.ts` (novo — texto institucional editável)
- `lib/notifications/index.ts` (novo — shell)
- `lib/notifications/actions.ts` (novo — `createNotification`)
- `components/notifications/NotificationBell.tsx` (novo)
- `components/layouts/AdminShell.tsx` (modificar — adiciona header bar com `<NotificationBell />`; pluga via SSR-fetched items pra fechar CA-16 UI. Aprovado em 2026-05-25 fora do feature contract original)
- `vercel.json` (modificar — adiciona cron `inactivate-expired-subscriptions`)
- `.env.example` (modificar — adiciona `GURU_WEBHOOK_SECRET`, `GURU_OFFER_ID_CLUBE_MENSAL`, `SHOPIFY_VAR_ASSINATURA_CLUBE`, `SHOPIFY_SUBSCRIPTION_SYNC_LIVE`, `DEV_SIMULATE_GURU`)

## Arquivos PROIBIDOS (Anti-SPEC)
- `app/api/webhooks/shopify/orders/paid/route.ts` — NÃO alterar. Hook F-V03 continua, mas vai virar "no-op" via flag (ver §Pós-MVP).
- `members.sponsor_id` valores existentes — Anti-SPEC §1.
- `lib/cv/*` — Anti-SPEC §12 (legado v1).
- Migrations já aplicadas — Anti-SPEC §6.
- Tags Shopify existentes nos customers de produção — Anti-SPEC §2 (só adicionar, nunca remover).

## Plano de implementação — MVP demo 22/05 (3h)

### Fase 1 — Schema + endpoints internos (45 min)
1. Branch já existe: `feat/feedback-pos-demo-20mai`. Criar branch nova: `feat/F-V19-fluxo-guru-pre-cadastro` a partir dela.
2. Migration `20260522_f-v19-pre-cadastro-guru.sql` (idempotente, rollback comentado).
3. Aplicar via `mcp__supabase__apply_migration` ref `ikvwzfbkbwpiewhkumrj`.
4. `lib/subscriptions/queries.ts` + `actions.ts` (createPreRegistration, extendSubscription, cancelAutoRenew, getMemberByExternalId).

### Fase 2 — Landing + form (45 min)
5. `app/r/[slug]/route.ts` modificar — lookup dual events / members.ref_code.
6. `app/convite/[ref_code]/page.tsx` + ConviteForm — usa `lib/copy/convite.ts`.
7. Smoke local: abrir `/r/BH00001` → confirmar redirect → form renderiza.

### Fase 3 — Mock Guru + welcome + auto-login (45 min)
8. `app/api/dev/simulate-guru/route.ts` — handler dev only.
9. `app/api/webhooks/guru/route.ts` — handler real (HMAC + idempotência + switch).
10. `app/welcome/page.tsx` + actions — claimPreRegistration + magic link.
11. Botão "Simular pagamento" na página `/convite/<ref>/aguardando` (apenas se `DEV_SIMULATE_GURU=true`).

### Fase 4 — Notificações mínimas + cron stub (30 min)
12. `lib/notifications/` shell + tabela + `NotificationBell` no header admin.
13. `app/api/cron/inactivate-expired-subscriptions/route.ts` — stub funcional (CA-12 e CA-13 cobertos).

### Fase 5 — Smoke E2E + demo prep (15 min)
14. Rodar `npm run dev` localmente.
15. Fluxo completo: `/r/BH00001` → form → simula pagamento → `/welcome` → auto-login → `/dashboard` mostra novo member ativo.
16. Capturar screenshots pra apresentar se a internet falhar na call.

## Plano pós-demo (próxima sessão, classe D real)

### Onda 1 — Guru real (após estudo da API)
- Logar no Guru com credenciais Léo (`eduardo.sousa@flowcode.cc`) — fora desta sessão automatizada.
- Documentar payload real de `subscription.created`/`renewed`/`cancelled` em `docs/wiki/runbooks/webhook-guru-debug.md`.
- Configurar webhook real no painel Guru apontando pra `https://rlp-biohelp.vercel.app/api/webhooks/guru`.
- Setar `GURU_WEBHOOK_SECRET` no Vercel.
- Validar HMAC com 1 transação real em sandbox.

### Onda 2 — Shopify sync real
- Léo cria produto "Assinatura Clube" no Shopify Admin com variant id.
- Setar `SHOPIFY_VAR_ASSINATURA_CLUBE` + `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=true` no Vercel.
- Smoke: 1 transação Guru → checa Shopify Admin → customer criado + tag `subscriber:<data>` + draft order completed.

### Onda 3 — F-V03 cleanup
- Hook em `lib/subscriptions/hook-on-order-paid.ts` (que marca paid via produto Shopify) vira no-op via flag `LRP_V2_GURU_FLOW=true`.
- Migra logica residual ou remove de vez em F-V12.

### Onda 4 — Painel admin pré-cadastros
- `/admin/pre-registrations` lista members com `subscription_status='pending'` há mais de 24h (lead que não converteu).
- Botão "Reenviar link" gera novo magic link → email.

## Matriz de Validação (demo 22/05 — MVP)

> Atualizada 25/05/2026 com evidências da implementação. 14/16 ✅ verdes, 2 ◐ parciais.

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | apply_migration MCP retorna success | migration | ✅ | Migration aplicada via MCP (Step 1). 4 colunas members, 1 coluna orders, 2 tabelas novas, 5 índices, 6 policies. |
| CA-02 | `/r/<sponsor_ref>` → 302 `/convite/<ref>` + cookie `ref=` | smoke | ✅ | `curl -sI /r/IaUZqzPe` → 302 Location:/convite/IaUZqzPe + Set-Cookie:ref=IaUZqzPe (Step 3, re-verificado pós-power-outage) |
| CA-03 | `/r/<event_slug>` → rota F-V15 inalterada | smoke regress | ✅ | Evento temporário `fv19-smoke-22mai-delete-me` inserido → curl → 302 Location:/ + Set-Cookie:evt= (Step 3, cleanup executado) |
| CA-04 | Landing renderiza nome do sponsor + form 5 campos | manual | ✅ | Screenshot `convite-IaUZqzPe-landing.png`. H1 = "Membro Teste", 5 campos + checkbox + botão disabled. 404 se sponsor cancelled. (Step 4) |
| CA-05 | Submit → member pending + sponsor_id + URL Guru | manual SQL | ✅ | DB row criada com subscription_status=pending, sponsor_id correto, redirect_url retornado com utm_term=<token> (Step 5 E2E) |
| CA-06 | 2 submits mesmo email → 1 member (idempotente) | manual SQL | ✅ | createPreRegistration:139-160 lookup por email+sponsor_id, reusa existente (Step 3) |
| CA-07 | simulate-guru → member paid → auto-login → /dashboard | manual | ✅ | E2E completo: form → simulate activated → /welcome → cookie setado → /dashboard logged in BH00007 (Step 6) |
| CA-08 | api_token inválido → 401 (adaptado: sem HMAC no Guru) | smoke | ✅ | POST /api/webhooks/guru com token errado → 401 "Invalid signature" (Step 5 T2) |
| CA-09 | Replay mesmo X-Request-ID → 200 already_processed | smoke | ✅ | 2ª chamada com mesmo X-Request-ID → 200 already_processed, 0 side-effects (Step 5 T1) |
| CA-10 | kind=renewed (charged_times=2) → expires +1y | manual SQL | ✅ | expires 2028→2029 após simulate renewed (Step 5 T5) |
| CA-11 | kind=canceled → auto_renew=false, status=paid | manual SQL | ✅ | auto_renew=false, subscription_status permanece paid (Step 5 T6) |
| CA-12 | Cron com expires_at<now() + auto_renew=false → cancelled | manual SQL | ✅ | candidates=1, inactivated=1, member.subscription_status=cancelled (Step 6) |
| CA-13 | Gate CRON_DISABLED_V2/LRP_V2 → skip | static | ◐ | Código trivial 2 linhas em route.ts:42-50. Runtime não exercido — restart cycle desproporcional pro ganho. Fechar em QA pré-produção. |
| CA-14 | View member_active_affiliate_count ++1 após activated | indireto | ◐ | markSubscriptionPaid:58 chama onMemberStatusChange (F-V18 hook confirmado no trace). Contagem view não medida explicitamente. Fechar com query SQL em QA. |
| CA-15 | `[SUBSCRIPTION_SYNC mock]` nos logs | manual | ✅ | Apareceu 3x nos logs do dev server durante simulate (Step 5) |
| CA-16 | Sininho admin com badge + dropdown | manual | ✅ | Screenshots `e2e-admin-bell.png` + `e2e-admin-bell-open.png`. Badge "2 novas", dropdown: "Assinatura confirmada" + "Novo pré-cadastro" (Step 6) |

## Rollback (D)

1. **Frontend:** Vercel rollback (deploy anterior) ou flag `LRP_V2_GURU_FLOW=false` em `lib/utils/featureFlags.ts` → `/r/[slug]` volta a só responder eventos F-V15 (lookup `members.ref_code` envolvido em `if isV2GuruFlowEnabled()`).
2. **Webhook Guru:** desativar no painel Guru (apontar pra `/api/webhooks/guru-disabled` que retorna 410).
3. **DB:** migration tem rollback comentado:
   ```sql
   ALTER TABLE members DROP COLUMN IF EXISTS subscription_auto_renew;
   ALTER TABLE members DROP COLUMN IF EXISTS subscription_expires_at;
   ALTER TABLE members DROP COLUMN IF EXISTS pre_registered_at;
   ALTER TABLE members DROP COLUMN IF EXISTS guru_subscriber_id;
   ALTER TABLE orders DROP COLUMN IF EXISTS is_subscription_clone;
   DROP INDEX IF EXISTS idx_members_subscription_expires_at;
   DROP INDEX IF EXISTS idx_members_guru_subscriber_id;
   DROP TABLE IF EXISTS guru_webhook_events;
   ```
4. **Cron:** desabilita em `vercel.json` (comment line) + `CRON_DISABLED_V2=true`.

## Decisões fechadas (sai do PERGUNTAS-CALL-20MAI.md)

Esta SPEC fecha os seguintes itens do `docs/sdd/PERGUNTAS-CALL-20MAI.md`:

- **§4 Próximos passos Flowcode** → coberto integralmente nesta SPEC.
- **TBD-7** (integração Guru) → confirma abordagem **Guru → LRP direto via webhook próprio**, NÃO mais via Shopify (revisa decisão de 29/04). Atualiza `PIVOT-V2.md` §4.2.
- **Triple resgate** (F-V07): inalterado, esta feature não toca payouts.
- Cashin: confirmado **manual via planilha** nos primeiros 2-3 meses (mensagem do Léo no WhatsApp 22/05). Integração real Cashin permanece em F-V07b/F-V07c — não bloqueia F-V19.

Ainda **dependentes** (bloqueiam features adjacentes, não F-V19):
- **1.1 + 1.2** (números comissão + impostos) → bloqueiam F-V04, não F-V19.
- **1.3** (mockup minha comunidade) → bloqueia U2/U3.
- **1.4** (dados NF Biohelp) → bloqueia F-V07c.

## Referências
- Miro board: https://miro.com/app/board/uXjVHTgAvfc=/?share_link_id=179524680787
- Transcrição: anexo na conversa 22/05/2026.
- WhatsApp Gabriel 22/05 — planilha "Ass Líquido" + nota do Léo sobre Cashin manual.
- Exemplo visual i-green: https://digital.igreenenergy.com.br/?id=138584&sendcontract=true
- Credenciais Guru: enviadas pelo Léo via WhatsApp 22/05 — **NÃO commitar**, ficar em `.env.local` do desenvolvedor.
