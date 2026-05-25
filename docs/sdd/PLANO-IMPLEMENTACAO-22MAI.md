# PLANO DE IMPLEMENTAÇÃO — Fluxo Pré-cadastro → Guru → LRP → Shopify

**Data:** 22/05/2026
**Janela:** 12h00 → 15h00 (call de validação com cliente)
**Origem:** Call 20/05/2026 + Miro do Mateus (https://miro.com/app/board/uXjVHTgAvfc=/)
**SPEC formal:** [F-V19 SPEC](features/F-V19-fluxo-guru-pre-cadastro/SPEC.md)

> **Prompt acionável pra próxima sessão.** Use como input pra Claude Code / Codex / Cursor com instrução: "Implemente F-V19 conforme `docs/sdd/PLANO-IMPLEMENTACAO-22MAI.md` + SPEC em `docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md`. Comece pelo Passo 1."

---

## ⚠️ CORREÇÕES PÓS-RUNBOOK 22/05 (LER ANTES DE QUALQUER CÓDIGO)

Sessão paralela pesquisou a doc oficial do Digital Manager Guru. **3 divergências críticas vs este plano:**

**Fonte canônica:** [docs/wiki/runbooks/webhook-guru-debug.md](../wiki/runbooks/webhook-guru-debug.md) — schema Zod completo + classifyGuruEvent() prontos pra colar.

### O que muda no Passo 2 (URL builder em `createPreRegistration`)

**ERRADO (no código abaixo):**
```ts
const params = new URLSearchParams({
  email, name, cpf, phone,
  external_id: token,        // ❌ Guru não tem campo custom external_id
  utm_source: "lrp",
  utm_campaign: sponsor.ref_code,
})
```

**CERTO:**
```ts
const params = new URLSearchParams({
  email, name, cpf, phone,    // 🟡 pré-população não documentada — confirmar logando
  utm_source: "lrp",
  utm_medium: "pre_registration",
  utm_campaign: sponsor.ref_code,
  utm_term: token,            // ✅ hack: passamos o pre_registration_token aqui; Guru ecoa em source.utm_term no webhook
})
```

URL base também muda: doc oficial mostra `https://clkdmg.site/subscribe/<offer_uuid>` em vez de `pay.guru.com.br/<id>`. 🟡 Léo precisa confirmar URL real copiando do painel.

### O que muda no Passo 5 (`lib/subscriptions/providers/guru.ts` + webhook handler)

**Substituir TODO o conteúdo de `lib/subscriptions/providers/guru.ts` pelo schema Zod CORRIGIDO em `docs/wiki/runbooks/webhook-guru-debug.md` §"Schema Zod CORRIGIDO" (linhas 110-283 do runbook).**

Pontos-chave:
- **SEM HMAC.** Autenticação via campo `api_token` **no body JSON** (não em header).
- **Renomear env:** `GURU_WEBHOOK_SECRET` → `GURU_WEBHOOK_API_TOKEN`. Atualizar todas as referências.
- **Schema é discriminated union** em `webhook_type` (`subscription` | `transaction`).
- **Sem `event_type` discreto.** Eventos de domínio são derivados via `classifyGuruEvent(payload)` (função do runbook). 4 domain events: `subscription_activated`, `subscription_renewed`, `subscription_canceled`, `subscription_expired` + 1 transação `transaction_refunded`.
- **Distinção activated vs renewed:** por `charged_times` (1 → activated; 2+ → renewed). NÃO há evento `renewed` no Guru.
- **Idempotência:** usar header `X-Request-ID` como `event_id` em `guru_webhook_events`.
- **`external_id` chega via `source.utm_term`** (não `metadata.external_id`).

### O que muda no Passo 5 (`/api/webhooks/guru/route.ts`)

```ts
// ❌ ANTES (errado):
if (!verifyGuruHmac(raw, sig)) return 401
const evt = parsed.data
switch (evt.event_type) {
  case "subscription.created": ...
  case "subscription.renewed": ...
  ...
}

// ✅ DEPOIS (certo):
const reqId = req.headers.get("x-request-id") ?? crypto.randomUUID()
const payload = verifyGuruWebhook(JSON.parse(raw))  // valida api_token no body
if (!payload) return 401
// idempotência por reqId
await supabase.from("guru_webhook_events").insert({
  event_id: reqId,
  event_type: `${payload.webhook_type}.${payload.webhook_type === 'subscription' ? payload.last_status : payload.status}`,
  payload,
})
const domain = classifyGuruEvent(payload)
switch (domain.kind) {
  case "subscription_activated": ... markSubscriptionPaid + extendSubscription
  case "subscription_renewed":   ... extendSubscription
  case "subscription_canceled":  ... cancelAutoRenew
  case "subscription_expired":   ... cancelSubscription
  case "transaction_refunded":   ... notify admin (manual)
  case "noop":                   ... ignore
}
```

### O que muda no Passo 5 (`/api/dev/simulate-guru/route.ts`)

Mock precisa gerar payload no **formato real** (não no formato `{event_id, event_type, data}` do plano original). Veja exemplo dentro do runbook §"Schema Zod" — basicamente:

```ts
const event = {
  api_token: process.env.GURU_WEBHOOK_API_TOKEN,
  webhook_type: "subscription",
  id: `sub_${Date.now()}`,
  last_status: body.last_status ?? "started",
  subscriber: { id: `sber_${Date.now()}`, email: body.email },
  product: { id: "prod_mock", offer: { id: "offer_mock" } },
  charged_times: body.charged_times ?? 1,
  source: { utm_term: body.external_id, utm_source: "lrp" },
  dates: { started_at: Math.floor(Date.now()/1000) },
}
// NÃO precisa assinar HMAC — só envia o body com api_token correto
const res = await fetch(`${baseUrl}/api/webhooks/guru`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-request-id": event.id },
  body: JSON.stringify(event),
})
```

### O que muda no `.env.example`

```diff
- GURU_WEBHOOK_SECRET=dev_secret_change_in_prod
+ GURU_WEBHOOK_API_TOKEN=dev_token_change_in_prod
```

### 7 gaps confirmar pós-call

Ver `docs/wiki/runbooks/webhook-guru-debug.md` §"Gaps a confirmar logando". O principal pra hoje: **`utm_term` ecoa no webhook?** — confirmar com 1 transação real após a call (Léo loga no painel).

---

---

## 0. Setup (5 min)

```bash
cd c:\Users\edusp\Projetos_App_Desktop\RLP-bio_help
git status                                                # confirma branch atual
git checkout -b feat/F-V19-fluxo-guru-pre-cadastro       # parte da branch atual (feat/feedback-pos-demo-20mai)
```

Adicionar ao `.env.local` (NÃO commitar valores reais):

```bash
# F-V19 — Guru webhook + Shopify sync
GURU_WEBHOOK_SECRET=dev_secret_change_in_prod
GURU_OFFER_ID_CLUBE_MENSAL=placeholder-leo-confirmara
SHOPIFY_VAR_ASSINATURA_CLUBE=placeholder-leo-criara-produto
SHOPIFY_SUBSCRIPTION_SYNC_LIVE=false                      # liga só quando Shopify variant existir
DEV_SIMULATE_GURU=true                                    # habilita /api/dev/simulate-guru
LRP_V2_GURU_FLOW=true                                     # ativa rota /convite/[ref_code]
```

> **Credenciais Guru reais** (eduardo.sousa@flowcode.cc) — NÃO logue automaticamente nesta sessão. Use só pra estudo manual da API depois do MVP.

---

## 1. Migration (10 min)

Arquivo: `supabase/migrations/20260522_f-v19-pre-cadastro-guru.sql`

```sql
-- F-V19: Fluxo pré-cadastro Guru → LRP → Shopify
-- Rollback:
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_auto_renew;
--   ALTER TABLE members DROP COLUMN IF EXISTS subscription_expires_at;
--   ALTER TABLE members DROP COLUMN IF EXISTS pre_registered_at;
--   ALTER TABLE members DROP COLUMN IF EXISTS guru_subscriber_id;
--   ALTER TABLE orders DROP COLUMN IF EXISTS is_subscription_clone;
--   DROP INDEX IF EXISTS idx_members_subscription_expires_at;
--   DROP INDEX IF EXISTS idx_members_guru_subscriber_id;
--   DROP TABLE IF EXISTS guru_webhook_events;
--   DROP TABLE IF EXISTS notifications;

-- 1. Members: timestamps e refs externos
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pre_registered_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS guru_subscriber_id text NULL;

COMMENT ON COLUMN members.subscription_expires_at IS 'F-V19: quando assinatura expira (now+1y após Guru paid). NULL se nunca pagou.';
COMMENT ON COLUMN members.subscription_auto_renew IS 'F-V19: false após subscription.cancelled do Guru. Cron diário inativa se expires_at < now() AND auto_renew=false.';
COMMENT ON COLUMN members.pre_registered_at IS 'F-V19: quando lead entrou na lista de espera (antes do checkout Guru).';
COMMENT ON COLUMN members.guru_subscriber_id IS 'F-V19: id externo da assinatura no Guru. Idempotência de webhook.';

CREATE INDEX IF NOT EXISTS idx_members_subscription_expires_at
  ON members (subscription_expires_at)
  WHERE subscription_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_members_guru_subscriber_id
  ON members (guru_subscriber_id)
  WHERE guru_subscriber_id IS NOT NULL;

-- 2. Orders: distinguir pedido fake (clone Guru) de pedido Shopify real
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_subscription_clone boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN orders.is_subscription_clone IS 'F-V19: true quando pedido é espelho LRP de assinatura Guru (R$0, tag subscriber).';

-- 3. Tabela de webhook Guru (idempotência + auditoria)
CREATE TABLE IF NOT EXISTS guru_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  error text NULL
);

COMMENT ON TABLE guru_webhook_events IS 'F-V19: auditoria + idempotência de webhooks Guru. event_id UNIQUE bloqueia reprocessamento.';

CREATE INDEX IF NOT EXISTS idx_guru_webhook_events_event_type
  ON guru_webhook_events (event_type, received_at DESC);

ALTER TABLE guru_webhook_events ENABLE ROW LEVEL SECURITY;

-- Apenas service_role lê/escreve (igual auth_audit)
DROP POLICY IF EXISTS guru_webhook_events_service_role ON guru_webhook_events;
CREATE POLICY guru_webhook_events_service_role ON guru_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Tabela de notificações (mínimo MVP — A5/U6 ainda em discussão)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role text NOT NULL CHECK (recipient_role IN ('admin', 'member')),
  recipient_member_id uuid NULL REFERENCES members(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NULL,
  href text NULL,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'F-V19/A5/U6: notificações in-app (sininho). recipient_role=admin → todos admins; recipient_role=member → apenas o member.';

CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread
  ON notifications (created_at DESC)
  WHERE recipient_role = 'admin' AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_member_unread
  ON notifications (recipient_member_id, created_at DESC)
  WHERE recipient_role = 'member' AND read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_admin_select ON notifications;
CREATE POLICY notifications_admin_select ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM roles r WHERE r.member_id = (
        SELECT id FROM members WHERE auth_user_id = auth.uid()
      ) AND r.role = 'admin'
    )
  );

DROP POLICY IF EXISTS notifications_member_select ON notifications;
CREATE POLICY notifications_member_select ON notifications
  FOR SELECT TO authenticated
  USING (
    recipient_role = 'member'
    AND recipient_member_id = (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS notifications_service_role_all ON notifications;
CREATE POLICY notifications_service_role_all ON notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

Aplicar via MCP:
```
mcp__supabase__apply_migration  ref=ikvwzfbkbwpiewhkumrj  name="f-v19-pre-cadastro-guru"  query=<conteúdo acima>
```

---

## 2. Lib subscriptions — actions + queries (15 min)

`lib/subscriptions/actions.ts` — **adicionar** (sem mexer no que existe):

```typescript
import { z } from "zod"

export const PreRegistrationSchema = z.object({
  ref_code: z.string().regex(/^BH\d{5}$/),
  name: z.string().min(3).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(10),
  cpf: z.string().regex(/^\d{11}$/),  // só dígitos
  accepted_terms: z.literal(true),
})

export type PreRegistrationInput = z.infer<typeof PreRegistrationSchema>

export type PreRegistrationResult =
  | { ok: true; member_id: string; transaction_token: string; guru_redirect_url: string }
  | { ok: false; error: string }

export async function createPreRegistration(
  input: PreRegistrationInput
): Promise<PreRegistrationResult> {
  const parsed = PreRegistrationSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Dados inválidos." }

  const supabase = createServiceClient()

  // 1. Resolve sponsor
  const { data: sponsor } = await supabase
    .from("members")
    .select("id, ref_code, subscription_status, name")
    .eq("ref_code", parsed.data.ref_code)
    .maybeSingle()

  if (!sponsor) return { ok: false, error: "Sponsor não encontrado." }
  if (sponsor.subscription_status === "cancelled") {
    return { ok: false, error: "Este link não está mais ativo." }
  }

  // 2. Idempotência: já existe member pendente com esse email + sponsor?
  const { data: existing } = await supabase
    .from("members")
    .select("id, guru_subscriber_id")
    .eq("email", parsed.data.email)
    .eq("sponsor_id", sponsor.id)
    .maybeSingle()

  let memberId: string
  let token: string

  if (existing) {
    memberId = existing.id
    token = existing.guru_subscriber_id ?? crypto.randomUUID()
    // Renova token se necessário
    if (!existing.guru_subscriber_id) {
      await supabase
        .from("members")
        .update({ guru_subscriber_id: token })
        .eq("id", memberId)
    }
  } else {
    // 3. Gera ref_code novo
    const { data: refCodeData } = await supabase.rpc("generate_next_ref_code")
    const refCode = refCodeData ?? `BH${String(Date.now()).slice(-5).padStart(5, "0")}`

    token = crypto.randomUUID()

    const { data: newMember, error } = await supabase
      .from("members")
      .insert({
        ref_code: refCode,
        sponsor_id: sponsor.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        cpf: parsed.data.cpf,
        auth_user_id: null,
        subscription_status: "pending",
        pre_registered_at: new Date().toISOString(),
        guru_subscriber_id: token,
        status: "inactive",   // legado v1
        level: "membro",      // legado v1
      })
      .select("id")
      .single()

    if (error || !newMember) {
      console.error("[createPreRegistration]", error)
      return { ok: false, error: "Erro ao criar pré-cadastro." }
    }
    memberId = newMember.id

    // 4. referral_events
    await supabase.from("referral_events").insert({
      sponsor_id: sponsor.id,
      new_member_id: memberId,
      ref_code_used: sponsor.ref_code,
      kind: "pre_registration",
    })
  }

  // 5. Notifica admin
  await supabase.from("notifications").insert({
    recipient_role: "admin",
    kind: "pre_registration_created",
    title: `Novo pré-cadastro: ${parsed.data.name}`,
    body: `Convidado(a) por ${sponsor.name ?? sponsor.ref_code}. Aguardando pagamento.`,
    href: `/admin/community/${memberId}`,
  })

  // 6. Monta URL Guru
  const offerId = process.env.GURU_OFFER_ID_CLUBE_MENSAL ?? "PLACEHOLDER"
  const baseUrl = `https://pay.guru.com.br/${offerId}`
  const params = new URLSearchParams({
    email: parsed.data.email,
    name: parsed.data.name,
    cpf: parsed.data.cpf,
    phone: parsed.data.phone,
    external_id: token,
    utm_source: "lrp",
    utm_campaign: sponsor.ref_code,
  })
  const guruRedirectUrl = `${baseUrl}?${params.toString()}`

  return {
    ok: true,
    member_id: memberId,
    transaction_token: token,
    guru_redirect_url: guruRedirectUrl,
  }
}

export async function extendSubscription(
  memberId: string,
  years: number = 1
): Promise<{ ok: boolean }> {
  const supabase = createServiceClient()
  const { data: m } = await supabase
    .from("members")
    .select("subscription_expires_at")
    .eq("id", memberId)
    .single()

  const baseDate = m?.subscription_expires_at
    ? new Date(m.subscription_expires_at)
    : new Date()
  const newExpires = new Date(baseDate)
  newExpires.setFullYear(newExpires.getFullYear() + years)

  const { error } = await supabase
    .from("members")
    .update({
      subscription_expires_at: newExpires.toISOString(),
      subscription_auto_renew: true,
    })
    .eq("id", memberId)

  return { ok: !error }
}

export async function cancelAutoRenew(memberId: string): Promise<{ ok: boolean }> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("members")
    .update({ subscription_auto_renew: false })
    .eq("id", memberId)
  return { ok: !error }
}
```

`lib/subscriptions/queries.ts` — adicionar:

```typescript
export async function getMemberByExternalId(externalId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("guru_subscriber_id", externalId)
    .maybeSingle()
  return data
}

export async function getExpiredSubscriptions(now = new Date()) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("members")
    .select("id, sponsor_id, email, name")
    .eq("subscription_status", "paid")
    .eq("subscription_auto_renew", false)
    .lt("subscription_expires_at", now.toISOString())
  return data ?? []
}
```

---

## 3. Rota `/r/[slug]` — dual lookup events + members (10 min)

`app/r/[slug]/route.ts` — **MODIFICAR** mantendo F-V15 intacto. Após a verificação de evento, adicionar:

```typescript
// Existing event lookup ...
const event = await getEventBySlug(slug)

if (event && event.status === "published") {
  // ... código atual do evento — mantém
  return res
}

// F-V19: fallback — slug é ref_code de sponsor?
if (process.env.LRP_V2_GURU_FLOW === "true") {
  const service = createServiceClient()
  const { data: sponsor } = await service
    .from("members")
    .select("ref_code, subscription_status")
    .eq("ref_code", slug)
    .maybeSingle()

  if (sponsor && sponsor.subscription_status !== "cancelled") {
    const url = new URL(`/convite/${sponsor.ref_code}`, req.url)
    const res = NextResponse.redirect(url, 302)
    res.cookies.set("ref", sponsor.ref_code, {
      path: "/",
      maxAge: 7 * 24 * 3600,
      sameSite: "lax",
      httpOnly: false,
    })
    return res
  }
}

return NextResponse.json({ error: "Não encontrado." }, { status: 404 })
```

---

## 4. Página `/convite/[ref_code]` (20 min)

`app/convite/[ref_code]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { ConviteForm } from "./ConviteForm"
import { CONVITE_COPY } from "@/lib/copy/convite"

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ ref_code: string }>
}) {
  const { ref_code } = await params

  const supabase = createServiceClient()
  const { data: sponsor } = await supabase
    .from("members")
    .select("ref_code, name, subscription_status")
    .eq("ref_code", ref_code)
    .maybeSingle()

  if (!sponsor || sponsor.subscription_status === "cancelled") notFound()

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-amber-700 font-medium">
            {CONVITE_COPY.eyebrow}
          </p>
          <h1 className="text-3xl font-bold mt-2 leading-tight">
            Você foi convidado(a) por{" "}
            <span className="text-amber-800">{sponsor.name ?? sponsor.ref_code}</span>
          </h1>
          <p className="mt-4 text-gray-600">{CONVITE_COPY.headline_body}</p>
        </header>

        <section className="bg-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <h2 className="text-lg font-semibold mb-4">{CONVITE_COPY.form_title}</h2>
          <ConviteForm refCode={sponsor.ref_code} sponsorName={sponsor.name ?? sponsor.ref_code} />
        </section>

        <p className="text-xs text-gray-500 text-center mt-6">{CONVITE_COPY.disclaimer}</p>
      </div>
    </main>
  )
}
```

`app/convite/[ref_code]/ConviteForm.tsx` (use client) — form com 5 campos + máscaras + chamada à server action `createPreRegistration` → recebe `guru_redirect_url` → `window.location.href = guru_redirect_url`.

`lib/copy/convite.ts`:

```typescript
export const CONVITE_COPY = {
  eyebrow: "Clube Biohelp LRP",
  headline_body:
    "Faça parte do programa de recompensas Biohelp e tenha acesso a preços de clube + comissão por cada pessoa que você indicar.",
  form_title: "Complete seus dados para continuar",
  disclaimer: "Seus dados estão protegidos e serão usados apenas para criar sua conta e processar sua assinatura.",
}
```

---

## 5. Webhook Guru + simulate dev (30 min)

`lib/subscriptions/providers/guru.ts`:

```typescript
import { z } from "zod"
import crypto from "crypto"

export const GuruEventSchema = z.object({
  event_id: z.string(),
  event_type: z.enum([
    "subscription.created",
    "subscription.renewed",
    "subscription.cancelled",
    "subscription.refunded",
    "transaction.approved",
  ]),
  data: z.object({
    subscriber_id: z.string().optional(),
    transaction_id: z.string().optional(),
    email: z.string().email().optional(),
    metadata: z.object({
      external_id: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough(),
})

export type GuruEvent = z.infer<typeof GuruEventSchema>

export function verifyGuruHmac(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.GURU_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export function signGuruPayload(body: string): string {
  const secret = process.env.GURU_WEBHOOK_SECRET ?? "dev_secret_change_in_prod"
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}
```

`app/api/webhooks/guru/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { GuruEventSchema, verifyGuruHmac } from "@/lib/subscriptions/providers/guru"
import { markSubscriptionPaid, extendSubscription, cancelAutoRenew } from "@/lib/subscriptions/actions"
import { getMemberByExternalId } from "@/lib/subscriptions/queries"
import { syncSubscriptionToShopify } from "@/lib/shopify/subscription-sync"

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get("x-guru-signature")

  if (!verifyGuruHmac(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let parsed
  try {
    parsed = GuruEventSchema.safeParse(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }

  const evt = parsed.data
  const supabase = createServiceClient()

  // Idempotência
  const { error: insertErr } = await supabase
    .from("guru_webhook_events")
    .insert({ event_id: evt.event_id, event_type: evt.event_type, payload: evt as any })

  if (insertErr) {
    // unique_violation → already processed
    if (insertErr.code === "23505") {
      return NextResponse.json({ success: true, message: "already_processed" })
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  try {
    const externalId = evt.data.metadata?.external_id
    const email = evt.data.email
    const subscriberId = evt.data.subscriber_id ?? evt.data.transaction_id

    // Lookup member
    let member = externalId ? await getMemberByExternalId(externalId) : null
    if (!member && email) {
      const { data } = await supabase.from("members").select("*").eq("email", email).maybeSingle()
      member = data
    }
    if (!member) {
      await supabase.from("guru_webhook_events")
        .update({ processed_at: new Date().toISOString(), error: "member_not_found" })
        .eq("event_id", evt.event_id)
      return NextResponse.json({ success: false, reason: "member_not_found" })
    }

    switch (evt.event_type) {
      case "subscription.created":
      case "transaction.approved": {
        const paidRes = await markSubscriptionPaid(member.id)
        if (paidRes.ok) {
          await extendSubscription(member.id, 1)
          if (subscriberId) {
            await supabase
              .from("members")
              .update({ guru_subscriber_id: subscriberId })
              .eq("id", member.id)
          }
          await supabase.from("notifications").insert({
            recipient_role: "admin",
            kind: "subscription_paid",
            title: `Assinatura confirmada: ${member.name ?? member.email}`,
            href: `/admin/community/${member.id}`,
          })
          // Sync Shopify (background, mock-aware)
          syncSubscriptionToShopify({
            memberId: member.id,
            transactionId: subscriberId ?? evt.event_id,
          }).catch(err => console.error("[guru-webhook] shopify sync failed", err))
        }
        break
      }
      case "subscription.renewed": {
        await extendSubscription(member.id, 1)
        syncSubscriptionToShopify({
          memberId: member.id,
          transactionId: subscriberId ?? evt.event_id,
        }).catch(err => console.error("[guru-webhook] shopify sync renewed", err))
        break
      }
      case "subscription.cancelled": {
        await cancelAutoRenew(member.id)
        break
      }
      case "subscription.refunded": {
        await supabase.from("notifications").insert({
          recipient_role: "admin",
          kind: "subscription_refunded",
          title: `Reembolso recebido: ${member.name ?? member.email}`,
          body: "Cancelar a assinatura manualmente no painel se necessário.",
          href: `/admin/community/${member.id}`,
        })
        break
      }
    }

    await supabase.from("guru_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", evt.event_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[guru-webhook] error", err)
    await supabase.from("guru_webhook_events")
      .update({ processed_at: new Date().toISOString(), error: String(err) })
      .eq("event_id", evt.event_id)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
```

`app/api/dev/simulate-guru/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { signGuruPayload } from "@/lib/subscriptions/providers/guru"

export async function POST(req: NextRequest) {
  if (process.env.DEV_SIMULATE_GURU !== "true") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 })
  }

  const body = await req.json()
  const event = {
    event_id: body.event_id ?? `dev_${Date.now()}`,
    event_type: body.event_type ?? "subscription.created",
    data: {
      subscriber_id: body.subscriber_id ?? `sub_${Date.now()}`,
      transaction_id: body.transaction_id ?? `tx_${Date.now()}`,
      email: body.email,
      metadata: { external_id: body.external_id },
    },
  }
  const payload = JSON.stringify(event)
  const sig = signGuruPayload(payload)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
  const res = await fetch(`${baseUrl}/api/webhooks/guru`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-guru-signature": sig },
    body: payload,
  })
  const json = await res.json().catch(() => ({}))
  return NextResponse.json({ simulated: event, response: json, status: res.status })
}
```

---

## 6. Página `/welcome` + auto-login (15 min)

`app/welcome/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { claimPreRegistration } from "./actions"

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ external_id?: string; tx?: string; email?: string }>
}) {
  const { external_id, tx, email } = await searchParams

  if (!external_id) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="text-gray-600 mt-2">Procure o suporte com seu comprovante de compra.</p>
        </div>
      </main>
    )
  }

  const result = await claimPreRegistration({ external_id, transaction_id: tx ?? null, email: email ?? null })

  if (!result.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-gray-600 mt-2">{result.error}</p>
        </div>
      </main>
    )
  }

  // Auto-login via magic link
  redirect(result.magic_link_url)
}
```

`app/welcome/actions.ts`:

```typescript
"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { markSubscriptionPaid, extendSubscription } from "@/lib/subscriptions/actions"
import { getMemberByExternalId } from "@/lib/subscriptions/queries"

type ClaimResult =
  | { ok: true; magic_link_url: string }
  | { ok: false; error: string }

export async function claimPreRegistration(input: {
  external_id: string
  transaction_id: string | null
  email: string | null
}): Promise<ClaimResult> {
  const supabase = createServiceClient()
  const member = await getMemberByExternalId(input.external_id)

  if (!member) return { ok: false, error: "Pré-cadastro não encontrado. Aguarde alguns segundos e atualize." }

  // Se webhook Guru ainda não chegou, mark paid mesmo assim (idempotente)
  if (member.subscription_status !== "paid") {
    const res = await markSubscriptionPaid(member.id)
    if (!res.ok) return { ok: false, error: "Erro ao ativar assinatura. Suporte." }
    await extendSubscription(member.id, 1)
  }

  // Auth user (criar se não existe)
  let authUserId = member.auth_user_id
  if (!authUserId) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: member.email,
      email_confirm: true,
      user_metadata: { member_id: member.id, ref_code: member.ref_code },
    })
    if (error) return { ok: false, error: `Erro ao criar usuário: ${error.message}` }
    authUserId = created.user.id
    await supabase.from("members").update({ auth_user_id: authUserId }).eq("id", member.id)
  }

  // Magic link
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: member.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
  })
  if (linkErr || !linkData?.properties?.action_link) {
    return { ok: false, error: "Erro ao gerar link de login. Suporte." }
  }

  return { ok: true, magic_link_url: linkData.properties.action_link }
}
```

---

## 7. Shopify sync (mock-aware) (10 min)

`lib/shopify/subscription-sync.ts`:

```typescript
import { createServiceClient } from "@/lib/supabase/server"
import { syncCustomerToShopify } from "./customer"

type SyncInput = { memberId: string; transactionId: string }

export async function syncSubscriptionToShopify(input: SyncInput): Promise<{ ok: boolean }> {
  const live = process.env.SHOPIFY_SUBSCRIPTION_SYNC_LIVE === "true"
  const supabase = createServiceClient()
  const { data: member } = await supabase
    .from("members")
    .select("id, email, name, ref_code, subscription_expires_at")
    .eq("id", input.memberId)
    .single()

  if (!member) return { ok: false }

  const expiresIso = member.subscription_expires_at
    ? member.subscription_expires_at.slice(0, 10)
    : ""
  const tag = `subscriber:${expiresIso}`

  const payload = {
    email: member.email,
    firstName: member.name?.split(" ")[0] ?? "",
    refCode: member.ref_code,
    sponsorRefCode: null,  // já estava sincronizado no cadastro do member
    level: "membro",
    status: "active",
    extraTags: [tag, "lrp:subscription", `lrp:guru-tx-${input.transactionId}`],
  }

  if (!live) {
    console.info("[SUBSCRIPTION_SYNC mock]", JSON.stringify(payload, null, 2))
    // Insere row local em orders pra refletir no admin
    await supabase.from("orders").insert({
      shopify_order_id: `mock_${input.transactionId}`,
      member_id: member.id,
      customer_email: member.email,
      total_amount: 0,
      total_cv: 0,
      currency: "BRL",
      status: "paid",
      paid_at: new Date().toISOString(),
      is_subscription_clone: true,
      shopify_data: { mock: true, payload },
    })
    return { ok: true }
  }

  // LIVE: chama Shopify
  await syncCustomerToShopify(payload as any)
  // TODO próxima sessão: draftOrderCreate + draftOrderComplete pra criar pedido fake.
  return { ok: true }
}
```

---

## 8. Cron diário (10 min)

`app/api/cron/inactivate-expired-subscriptions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getExpiredSubscriptions } from "@/lib/subscriptions/queries"
import { cancelSubscription } from "@/lib/subscriptions/actions"

export async function GET(req: NextRequest) {
  // Vercel cron auth
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (process.env.CRON_DISABLED_V2 === "true" || process.env.LRP_V2 !== "true") {
    return NextResponse.json({ skipped: true, reason: "cron_disabled_v2" })
  }

  const expired = await getExpiredSubscriptions()
  const results: Array<{ id: string; ok: boolean }> = []

  for (const m of expired) {
    const res = await cancelSubscription(m.id)
    results.push({ id: m.id, ok: res.ok })
  }

  return NextResponse.json({ inactivated: results.length, results })
}
```

Adicionar em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/inactivate-expired-subscriptions",
      "schedule": "0 6 * * *"
    }
  ]
}
```

(Comma-separated com crons existentes — não substituir o array todo.)

---

## 9. Notification Bell (10 min)

`components/notifications/NotificationBell.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

type Notification = { id: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null }

export function NotificationBell({ role }: { role: "admin" | "member" }) {
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/notifications?role=${role}`)
      .then(r => r.json())
      .then(j => setItems(j.items ?? []))
  }, [role])

  const unread = items.filter(i => !i.read_at).length

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-2 hover:bg-gray-100 rounded-full">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto z-50">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nenhuma notificação.</p>
          ) : items.map(n => (
            <a key={n.id} href={n.href ?? "#"} className={`block p-3 border-b hover:bg-gray-50 ${!n.read_at ? "bg-amber-50" : ""}`}>
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-gray-600 mt-1">{n.body}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

`app/api/notifications/route.ts` — GET com role + admin RLS check + retorna últimas 20.

Injetar `<NotificationBell role="admin" />` no header do `/admin/*` layout.

---

## 10. Smoke E2E (10 min)

Roteiro:

1. **Migration ok:**
   ```bash
   # Via MCP supabase apply_migration
   ```
2. **Sponsor existente:** pegar 1 ref_code real (ex: BH00001) — `SELECT ref_code, name FROM members LIMIT 1;`
3. **Browser:**
   - Abrir `http://localhost:3000/r/BH00001` → redirect pra `/convite/BH00001`
   - Preencher form com email novo (ex: `teste-demo@flowcode.cc`)
   - Submit → vai redirecionar pra Guru — INTERCEPTAR (`Ctrl+C` ou abrir devtools network e cancelar)
   - Pegar `external_id` da URL: `https://pay.guru.com.br/PLACEHOLDER?...&external_id=<TOKEN>`
   - Chamar simulate:
     ```bash
     curl -X POST http://localhost:3000/api/dev/simulate-guru \
       -H "content-type: application/json" \
       -d '{"event_type":"subscription.created","external_id":"<TOKEN>","email":"teste-demo@flowcode.cc"}'
     ```
   - Abrir `http://localhost:3000/welcome?external_id=<TOKEN>&tx=tx_xxx&email=teste-demo@flowcode.cc`
   - Deve redirecionar pro magic link → cair logado em `/dashboard`
4. **Validar no DB:**
   ```sql
   SELECT email, subscription_status, subscription_expires_at, auth_user_id FROM members WHERE email = 'teste-demo@flowcode.cc';
   SELECT * FROM guru_webhook_events ORDER BY received_at DESC LIMIT 3;
   SELECT * FROM notifications WHERE recipient_role = 'admin' ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM orders WHERE is_subscription_clone = true ORDER BY paid_at DESC LIMIT 3;
   ```
5. **Validar F-V18 (tag sponsor):**
   - Sponsor agora deveria ter +1 no `active_count`.
   - `SELECT * FROM member_active_affiliate_count WHERE member_id = '<sponsor.id>';`

---

## 11. Checklist final pra demo (5 min)

- [ ] Migration aplicada (CA-01)
- [ ] `/r/BH00001` redirect (CA-02)
- [ ] `/r/<evento>` continua funcionando (CA-03 regressão)
- [ ] `/convite/BH00001` renderiza nome do sponsor (CA-04)
- [ ] Form cria member pending (CA-05, CA-06)
- [ ] Simulate-guru → member paid + auto-login funciona (CA-07)
- [ ] HMAC inválido → 401 (CA-08)
- [ ] Idempotência webhook (CA-09)
- [ ] Notificação aparece no sininho admin (CA-16)
- [ ] Console log do Shopify sync mock (CA-15)
- [ ] Screenshots tirados pra backup

---

## 12. Roteiro da call 15h

1. **Recap (1 min):** "Implementei o fluxo do Miro até a ativação. Renovação e cancelamento estão no webhook receiver. Sync Shopify e Guru real ficam pra próxima sessão, mas a engrenagem inteira já está conectada."
2. **Demo (5 min):**
   - Abro `/r/<sponsor>` → mostro landing dinâmica.
   - Preencho form → vou pro checkout Guru (intercepto e simulo o pagamento via botão dev).
   - Caio em `/welcome` → auto-login → `/dashboard`.
   - Mostro no admin: +1 ativo na rede do sponsor + notificação no sininho.
3. **Próximos passos (2 min):**
   - Estudar API Guru com credenciais que Léo enviou.
   - Configurar webhook real no painel Guru.
   - Léo cria produto "Assinatura Clube" no Shopify Admin + envia variant id.
   - Ligar `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=true`.
   - Testar 1 transação real em sandbox antes da Live 01/06.

---

## 13. Continuação pós-call (não tente hoje)

- **Estudo API Guru** (1-2h): logar em https://app.gurupay.com.br com `eduardo.sousa@flowcode.cc` → settings/webhooks → documentar formato real de payload + lista de event_types.
- **Webhook produção:** configurar URL `https://rlp-biohelp.vercel.app/api/webhooks/guru` + secret real no Vercel.
- **Shopify produto fake:** Léo cria + envia variant id.
- **F-V03 deprecation:** hook em `lib/subscriptions/hook-on-order-paid.ts` vira no-op via flag.
- **Painel admin pré-cadastros:** `/admin/pre-registrations` com filtro de leads sem pagamento.
- **Vendas manuais U4:** próxima feature priorizada da PERGUNTAS-CALL-20MAI.md.
