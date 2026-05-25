# Runbook — Webhook Guru (Digital Manager Guru)

> Fonte canônica: https://docs.digitalmanager.guru/developers/webhooks
> Pesquisado em: 2026-05-22 (Claude, sessão paralela à implementação F-V19)
> Plataforma: **Digital Manager Guru** (Brasil) — não confundir com `gurupay.eu` (Europa) ou `help.getguru.com` (knowledge base).

## TL;DR — Diferenças entre SPEC F-V19 e a API real do Guru

| Item | SPEC F-V19 assumiu | API Guru real | Impacto |
|---|---|---|---|
| Autenticação webhook | HMAC `X-Guru-Signature` | **Não tem HMAC.** Validação é via campo `api_token` **no body JSON** | 🔴 ALTO — re-escrever `lib/subscriptions/providers/guru.ts` |
| Header de idempotência | (não definido) | `X-Request-ID` (string única por dispatch) | 🟡 MÉDIO — usar como `event_id` no `guru_webhook_events` |
| Formato do payload | `{ event_id, event_type, data }` | `{ api_token, webhook_type, id, ... campos no root }` | 🔴 ALTO — Zod inteiro precisa mudar |
| Discriminator de evento | `event_type` (string) | `webhook_type` (`subscription` \| `transaction` \| `e-ticket`) + `last_status` ou `status` | 🔴 ALTO — switch precisa mudar |
| 5 eventos assumidos (`subscription.created`, `subscription.renewed`, `subscription.cancelled`, `subscription.refunded`, `transaction.approved`) | "Eventos" não existem como entidade. Guru envia **um único POST por mudança de status** | A semântica vira: filtrar por `webhook_type='subscription' AND last_status IN (...)` ou `webhook_type='transaction' AND status='refunded'` | 🔴 ALTO — re-mapear lógica |
| `data.metadata.external_id` para passar nosso token | **Não existe campo `metadata.external_id` documentado.** Guru aceita só UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), `sck` e `src` | 🟡 PRECISA CONFIRMAR LOGANDO se aceita custom params arbitrários | 🟡 ALTO — usar `utm_term` ou `sck` como hack para carregar `pre_registration_token` |
| URL canônica do checkout | `https://pay.guru.com.br/<offer_id>` | Doc oficial mostra `https://clkdmg.site/subscribe/<uuid>` | 🟡 PRECISA CONFIRMAR LOGANDO o formato real da oferta do cliente |
| Pré-população de email/nome/CPF na URL | Assumido suportado | 🟡 PRECISA CONFIRMAR LOGANDO — não documentado publicamente | 🟡 ALTO — se não suportar, lead precisa redigitar |

## Autenticação (não-HMAC)

Guru **não usa HMAC**. O que existe:

1. **`api_token` no body JSON** — string única por config de webhook no painel. Recebida em todo payload, no nível raiz: `payload.api_token`.
2. **`X-Request-ID` no header** — string única por dispatch (use para idempotência).
3. Sem `X-Guru-Signature` ou similar.

### Como validar autenticidade

```ts
// lib/subscriptions/providers/guru.ts
function isAuthenticGuruWebhook(payload: unknown): boolean {
  const parsed = z.object({ api_token: z.string().min(1) }).safeParse(payload);
  if (!parsed.success) return false;
  return parsed.data.api_token === process.env.GURU_WEBHOOK_API_TOKEN;
}
```

> ⚠️ Renomear env var de `GURU_WEBHOOK_SECRET` (SPEC) para `GURU_WEBHOOK_API_TOKEN` (mais fiel à doc Guru).

### Idempotência

Use `X-Request-ID` (header) como `event_id` no `guru_webhook_events`. Cada dispatch tem um ID único — retries do Guru reusam o mesmo `X-Request-ID`.

## Headers enviados pelo Guru

| Header | Conteúdo | Uso |
|---|---|---|
| `X-Request-ID` | UUID único por dispatch | idempotência |
| `Content-Type` | `application/json` | sempre |
| (não há) `X-Guru-Signature` | — | — |

## Tipos de webhook (`webhook_type`)

| Tipo | Quando dispara |
|---|---|
| `transaction` | Mudança de status de venda avulsa OU primeira cobrança de assinatura |
| `subscription` | Mudança de status de assinatura |
| `e-ticket` | (não usado no F-V19) |

> Importante: **um pagamento de plano dispara DOIS webhooks**: um `transaction` (status=approved) e um `subscription` (last_status=active ou started). Tratar idempotentemente.

## Status de transação (`status` em `webhook_type=transaction`)

Lista completa (24 status — fonte: https://docs.digitalmanager.guru/developers/status-de-transacoes):

| Status | Descrição |
|---|---|
| `abandoned` | Abandonada |
| `analysis` | Em análise (antifraude) |
| `approved` | **Aprovada** ← dispara liberação de assinatura |
| `billet_printed` | Boleto impresso |
| `blocked` | Bloqueada |
| `canceled` | Cancelada |
| `chargeback` | Reclamada |
| `charging` | Processando pagamento |
| `completed` | Completa |
| `delayed` | Atrasada |
| `dispute` | Reembolso solicitado |
| `expired` | Expirada |
| `failed` | Erro na transferência |
| `in_recovery` | Em recuperação |
| `pending` | Pendente |
| `pending_transfer` | Transferência pendente |
| `processing` | Em processamento |
| `refunded` | **Reembolsada** ← cancelamento manual no admin |
| `rejected` | Rejeitada |
| `scheduled` | Agendada |
| `started` | Iniciada |
| `transferred` | Transferido |
| `trial` | Trial |
| `waiting_payment` | Aguardando pagamento |

## Status de assinatura (`last_status` em `webhook_type=subscription`)

Lista completa (fonte: https://docs.digitalmanager.guru/developers/status-de-assinaturas):

| Status | Descrição | Mapeamento F-V19 |
|---|---|---|
| `started` | Iniciada (primeira cobrança aceita) | `markSubscriptionPaid` + `expires_at = now() + cycle` |
| `active` | Ativa e em funcionamento | igual a `started` (idempotente) |
| `trial` | Em trial | (não usado pelo Biohelp — clube não tem trial) |
| `pastdue` | Pagamento atrasado | apenas log — Guru tenta cobrar de novo |
| `canceled` | Cancelada pelo assinante | `auto_renew=false`, **NÃO** inativa imediatamente |
| `expired` | Expirada (ciclo terminou sem renovação) | `subscription_status=cancelled` (cron já cobre via `expires_at < now()`) |
| `inactive` | Inativa | tratar igual a `expired` |

> Importante: a doc não confirma `trial_canceled` como status separado — apareceu em busca, mas não na página oficial. Assumir 7 status estáveis.

## Schema Zod CORRIGIDO (aplicar manualmente em `lib/subscriptions/providers/guru.ts`)

```ts
import { z } from 'zod';

// ─── Subschemas comuns ──────────────────────────────────────────────────────

export const GuruContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone_number: z.string().optional(),
  doc: z.string().optional(), // CPF
}).passthrough();

export const GuruProductSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  marketplace_id: z.string().optional(),
  type: z.enum(['principal', 'plan', 'orderbump', 'upsell']).optional(),
  qty: z.number().optional(),
  unit_value: z.number().optional(),
  offer: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).partial().optional(),
}).passthrough();

export const GuruSourceSchema = z.object({
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(), // ← usar como external_id se aceitar
  sck: z.string().nullable().optional(),       // ← alternativa para external_id
  src: z.string().nullable().optional(),
  pptc: z.string().nullable().optional(),
}).passthrough();

// ─── Transaction webhook ────────────────────────────────────────────────────

export const GuruTransactionStatusSchema = z.enum([
  'abandoned', 'analysis', 'approved', 'billet_printed', 'blocked',
  'canceled', 'chargeback', 'charging', 'completed', 'delayed',
  'dispute', 'expired', 'failed', 'in_recovery', 'pending',
  'pending_transfer', 'processing', 'refunded', 'rejected',
  'scheduled', 'started', 'transferred', 'trial', 'waiting_payment',
]);

export const GuruTransactionWebhookSchema = z.object({
  api_token: z.string(),
  webhook_type: z.literal('transaction'),
  id: z.string(),                    // ← transaction_id (UUID)
  status: GuruTransactionStatusSchema,
  type: z.string().optional(),       // 'principal' | 'plan' | ...
  contact: GuruContactSchema,
  product: GuruProductSchema,
  items: z.array(GuruProductSchema).optional(),
  source: GuruSourceSchema.optional(),
  payment: z.object({
    method: z.string().optional(),
    total: z.number().optional(),
    net: z.number().optional(),
  }).passthrough().optional(),
  dates: z.object({
    created_at: z.number().optional(),     // unix timestamp
    confirmed_at: z.number().nullable().optional(),
    ordered_at: z.number().optional(),
  }).passthrough().optional(),
  subscription: z.object({
    id: z.string().optional(),
    subscriber: z.object({
      id: z.string(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  checkout_url: z.string().optional(),
}).passthrough();

// ─── Subscription webhook ───────────────────────────────────────────────────

export const GuruSubscriptionStatusSchema = z.enum([
  'started', 'active', 'trial', 'pastdue',
  'canceled', 'expired', 'inactive',
]);

export const GuruSubscriptionWebhookSchema = z.object({
  api_token: z.string(),
  webhook_type: z.literal('subscription'),
  id: z.string(),                              // ← subscription_id Guru
  internal_id: z.string().optional(),
  last_status: GuruSubscriptionStatusSchema,
  subscriber: z.object({
    id: z.string(),                            // ← subscriber_id
    name: z.string().optional(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    doc: z.string().optional(),
  }).passthrough(),
  product: GuruProductSchema,
  next_product: GuruProductSchema.optional(),
  current_invoice: z.object({
    id: z.string().optional(),
    status: z.string().optional(),
    value: z.number().optional(),
    cycle: z.number().optional(),
    charge_at: z.number().nullable().optional(),
  }).passthrough().optional(),
  last_transaction: GuruTransactionWebhookSchema.partial().passthrough().optional(),
  dates: z.object({
    started_at: z.number().nullable().optional(),
    cycle_start_date: z.number().nullable().optional(),
    cycle_end_date: z.number().nullable().optional(),
    next_cycle_at: z.number().nullable().optional(),
    canceled_at: z.number().nullable().optional(),
  }).passthrough().optional(),
  payment_method: z.string().optional(),
  charged_every_days: z.number().optional(),
  charged_times: z.number().optional(),
  source: GuruSourceSchema.optional(),
}).passthrough();

// ─── Discriminated union ────────────────────────────────────────────────────

export const GuruWebhookPayloadSchema = z.discriminatedUnion('webhook_type', [
  GuruTransactionWebhookSchema,
  GuruSubscriptionWebhookSchema,
]);

export type GuruWebhookPayload = z.infer<typeof GuruWebhookPayloadSchema>;

// ─── Validação ──────────────────────────────────────────────────────────────

export function verifyGuruWebhook(body: unknown): GuruWebhookPayload | null {
  const parsed = GuruWebhookPayloadSchema.safeParse(body);
  if (!parsed.success) return null;
  if (parsed.data.api_token !== process.env.GURU_WEBHOOK_API_TOKEN) return null;
  return parsed.data;
}

// ─── Router de evento → ação F-V19 ──────────────────────────────────────────

export type GuruDomainEvent =
  | { kind: 'subscription_activated'; subscriber_id: string; subscription_id: string; email: string; external_id?: string }
  | { kind: 'subscription_canceled';  subscriber_id: string; subscription_id: string; email: string }
  | { kind: 'subscription_expired';   subscriber_id: string; subscription_id: string; email: string }
  | { kind: 'subscription_renewed';   subscriber_id: string; subscription_id: string; email: string }
  | { kind: 'transaction_refunded';   transaction_id: string; email: string }
  | { kind: 'noop' };

export function classifyGuruEvent(payload: GuruWebhookPayload): GuruDomainEvent {
  if (payload.webhook_type === 'subscription') {
    const externalId = payload.source?.utm_term ?? payload.source?.sck ?? undefined;
    switch (payload.last_status) {
      case 'started':
      case 'active':
        // Distinguir "primeira ativação" vs "renovação" por charged_times:
        if ((payload.charged_times ?? 1) === 1) {
          return { kind: 'subscription_activated', subscriber_id: payload.subscriber.id, subscription_id: payload.id, email: payload.subscriber.email, external_id: externalId };
        }
        return { kind: 'subscription_renewed', subscriber_id: payload.subscriber.id, subscription_id: payload.id, email: payload.subscriber.email };
      case 'canceled':
        return { kind: 'subscription_canceled', subscriber_id: payload.subscriber.id, subscription_id: payload.id, email: payload.subscriber.email };
      case 'expired':
      case 'inactive':
        return { kind: 'subscription_expired', subscriber_id: payload.subscriber.id, subscription_id: payload.id, email: payload.subscriber.email };
      default:
        return { kind: 'noop' };
    }
  }
  if (payload.webhook_type === 'transaction' && payload.status === 'refunded') {
    return { kind: 'transaction_refunded', transaction_id: payload.id, email: payload.contact.email };
  }
  return { kind: 'noop' };
}
```

### Notas sobre o schema

- **`.passthrough()` em todos os objetos:** Guru tem ~150 campos por payload — extrair só o que precisamos e deixar o resto passar evita break em mudança de schema da Guru.
- **`api_token` no body, não em header.** Validação acontece *após* o parse Zod, antes do switch.
- **`external_id` vem via `source.utm_term` (ou `sck`).** Não há campo `metadata.external_id` na doc. Estratégia: passar `pre_registration_token` como `utm_term` na URL do checkout. 🟡 **PRECISA CONFIRMAR LOGANDO** que o Guru ecoa esse campo de volta sem mexer.
- **Distinguir "ativação" vs "renovação"** por `charged_times`: 1ª cobrança → activated; 2ª+ → renewed. A doc não tem evento separado pra renovação.
- **Mapeamento removido:** os 5 eventos da SPEC original (`subscription.created`/`renewed`/`cancelled`/`refunded` + `transaction.approved`) viram **4 eventos derivados** (`activated`, `renewed`, `canceled`, `expired`) + 1 transação (`refunded`).

## URL do checkout (CONFIRMAR LOGANDO)

A doc oficial mostra o formato `https://clkdmg.site/subscribe/<offer_uuid>`. A SPEC original assumia `https://pay.guru.com.br/<offer_id>` — provavelmente é um alias/redirect, mas **não está confirmado**.

🟡 **AÇÃO LOGANDO:** abrir uma oferta no painel Guru, clicar em "Link de checkout" e copiar o formato exato. Atualizar `GURU_OFFER_ID_CLUBE_MENSAL` e a URL builder no `actions.ts`.

### Parâmetros aceitos na URL (confirmados via docs)

| Parâmetro | Aceito | Uso F-V19 |
|---|---|---|
| `utm_source` | ✅ | `lrp` |
| `utm_medium` | ✅ | `pre_registration` |
| `utm_campaign` | ✅ | `<sponsor.ref_code>` |
| `utm_content` | ✅ | livre |
| `utm_term` | ✅ | **`<pre_registration_token>` (hack: passar nosso ID aqui)** |
| `sck` | ✅ | alternativa pro `utm_term` se ele for usado pra outra coisa |
| `src` | ✅ | livre |
| `email`, `name`, `cpf`, `phone` | 🟡 **NÃO documentado** | precisa testar logando — se não funcionar, lead redigita |
| `external_id` (custom) | ❌ não documentado | usar `utm_term` |

🟡 **AÇÃO LOGANDO:** testar URL `https://clkdmg.site/subscribe/<offer>?email=teste@x.com&name=Foo&utm_term=abc123` → ver se campos vêm pré-populados E se `source.utm_term` aparece no payload do webhook após pagamento.

## Como configurar webhook no painel Guru (passo a passo pós-call 15h)

Baseado em https://docs.digitalmanager.guru/configuracoes-gerais/webhook (não pegou passo a passo detalhado — extrapolado):

1. Login em https://digitalmanager.guru com credenciais do Léo (`eduardo.sousa@flowcode.cc` / senha `Flowcode`).
2. Menu lateral → **Configurações** → **Webhooks** (ou "Notificações" em algumas versões).
3. Clique em **Novo Webhook**.
4. **Nome:** `LRP Biohelp — F-V19 Subscription Sync`.
5. **URL de destino:** `https://rlp-biohelp.vercel.app/api/webhooks/guru` (produção) — em dev usar ngrok / Vercel preview.
6. **Tipo de webhook:** marcar **Vendas (transactions)** + **Assinaturas (subscriptions)**. Não marcar e-tickets.
7. **Status filtros:**
   - Para `transaction`: marcar pelo menos `approved` e `refunded`. Opcionalmente `chargeback`.
   - Para `subscription`: marcar `started`, `active`, `canceled`, `expired`. Não marcar `pastdue` (gera ruído).
8. **Produtos/ofertas associados:** selecionar apenas a oferta do clube mensal (ID a confirmar). Deixar outros produtos de fora pra não receber ruído.
9. **Envios simultâneos:** 5 (default — Vercel aguenta).
10. **api_token:** Guru gera automaticamente. Copiar e salvar em `GURU_WEBHOOK_API_TOKEN` no Vercel (env Production + Preview).
11. **Salvar.** Guru manda um POST de teste — confirmar 200 nos logs Vercel.
12. **Testar reenvio:** fazer 1 transação sandbox (pix copia-cola) → conferir que cai na rota `/api/webhooks/guru` (ver logs `mcp__supabase__get_logs`).

> 📌 **Limite:** Guru aceita até **40 webhooks por conta**. Trial gratuito = até 2.

## Retries / Timeouts (importante saber)

- **Sucesso = HTTP 200.** Qualquer outro código (exceto a lista abaixo) gera retry.
- **Padrão de retry:** até 10 tentativas em intervalos de 1 min → depois +20 tentativas em intervalos crescentes (1, 2, 3, 4+ min). Total ~30 tentativas.
- **No-retry status codes (importante!):** `0, 401, 403, 404, 406, 410, 422, 505, 506, 510, 511`.
- **Delay inicial:** Guru aguarda **5 segundos para transações**, **10 segundos para assinaturas** antes do primeiro envio (para evitar race condition com seu sistema).
- **Queue:** se você retornar 5xx, o evento volta pra fila — não há perda silenciosa.

### Implicações pro F-V19

- Retornar **200 mesmo em erro de processamento** se o erro for "membro não existe" (não vai ser resolvido com retry). Logar o erro e retornar 200.
- Retornar **5xx** se erro for transitório (DB indisponível, Shopify offline) — Guru reenviará.
- Retornar **401** se `api_token` inválido — Guru NÃO reenvia (corret behavior).
- Retornar **410** se quiser desativar o webhook (em rollback emergencial).

## Erros conhecidos / Quirks

- 🟡 **Webhook duplicado:** uma assinatura em `started` muitas vezes dispara DOIS webhooks consecutivos (status `started` → `active`). Tratar ambos como ativação idempotentemente (mesmo `subscriber.id`).
- 🟡 **Race condition transaction vs subscription:** o webhook de `transaction.approved` chega ~5s antes do `subscription.started`. Se a lógica F-V19 usa ambos, garantir que o member não vire `paid` duas vezes (idempotência por `guru_subscriber_id`).
- 🟡 **Reembolso parcial:** transações com `status=dispute` e depois `refunded` precisam de logs — Gabriel disse que cancelamento por reembolso é **manual** (apenas notificar no admin).
- 🟡 **Boleto:** se cliente pagar via boleto, há `billet_printed` antes de `approved` (1-3 dias). NÃO ativar member em `billet_printed`.
- 🟢 **`X-Request-ID` é por dispatch, não por evento de domínio.** Um mesmo dispatch retransmitido tem o mesmo `X-Request-ID`. Eventos diferentes (started vs active) têm IDs diferentes.

## Gaps — status após login no painel 25/05/2026

1. ✅ **URL do checkout:** `https://clkdmg.site/subscribe/membership-biohelp-nutrition-club` (confirmado no painel → Produtos → Biohelp Nutrition Club → Ofertas).
2. ✅ **`GURU_OFFER_ID_CLUBE_MENSAL`:** slug = `membership-biohelp-nutrition-club`. Produto "Biohelp Nutrition Club" (código 1779129698, Appmax API). ⚠️ Valor = R$1.188 anual (não R$99 mensal como na call — confirmar com Léo).
3. ✅ **Pré-população funciona:** `?email=` ✅, `?name=` ✅, `?doc=` ✅ (CPF = parâmetro `doc`, NÃO `cpf`). `?phone_number=` não testado mas provavelmente funciona (padrão Guru). Screenshot: `guru-checkout-prepopulated-test.png`.
4. 🟡 **`utm_term` ecoa no webhook:** não testável — 0 webhooks configurados na conta. Precisa criar webhook + fazer 1 transação teste.
5. 🟡 **Campo `metadata` custom:** não investigado — workaround `utm_term` é suficiente.
6. 🟡 **`api_token` escopo:** será verificado ao criar o webhook.
7. 🟡 **Sandbox:** não achei opção de sandbox no painel. Provavelmente teste real via PIX R$1 (se existir oferta de teste) ou usar a própria oferta e reembolsar.

## Referências

- [Webhooks (overview)](https://docs.digitalmanager.guru/developers/webhooks)
- [Webhook para Assinaturas](https://docs.digitalmanager.guru/developers/webhook-para-assinaturas)
- [Webhook para Transações](https://docs.digitalmanager.guru/developers/webhook-para-transacoes)
- [Status de Assinaturas](https://docs.digitalmanager.guru/developers/status-de-assinaturas)
- [Status de Transações](https://docs.digitalmanager.guru/developers/status-de-transacoes)
- [Parâmetros UTM do Checkout](https://docs.digitalmanager.guru/checkout-guru/parametros-de-rastreamento-do-checkout-utms)
- [Configuração de Webhook (Webhook overview)](https://docs.digitalmanager.guru/configuracoes-gerais/webhook)
- [FAQ Webhooks](https://docs.digitalmanager.guru/configuracoes-gerais/perguntas-frequentes-sobre-webhooks)
- [Manual API (BETA) Apiary — descontinuada 30/08/2024](https://digitalmanagerguru.docs.apiary.io/)
