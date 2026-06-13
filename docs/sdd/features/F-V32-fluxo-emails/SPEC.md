# F-V32 — Fluxo de e-mails (automação por gatilho) v1

> Status: **SPEC** (aguarda o fluxo do cliente — passos/delays/conteúdo). Origem:
> Leonardo (BioHelp) 12/06. **Absorve o F-V30** (boas-vindas vira o passo D+0 do
> fluxo). Evolui a infra de e-mail (F-V23 Resend).

## Contexto / estado atual
- **F-V23:** disparo manual de campanha (Resend) — `lib/email/*`.
- **F-V30:** 1 e-mail de boas-vindas automático no gatilho "novo assinante"
  (`markSubscriptionPaid` quando `changed=true`), com modo off/dryrun/live +
  `welcome_email_log` + allowlist.
- **Agora:** transformar o boas-vindas numa **sequência (drip) por tempo**, a
  partir do "novo assinante".

## Decisões do cliente (12/06)
1. **Gatilho de entrada = novo assinante.** Depois, sequência por **tempo**:
   D+0, D+x, D+y… (ex.: ~4 e-mails).
2. **v1 = 1 fluxo fixo** ("novo assinante"). **v2 = autonomia** pra criar outros fluxos.
3. **Entrada v1 = novo assinante.** (criar outras entradas = v2)
4. **Para quando:** a pessoa **se descadastra** OU o fluxo **chega ao fim** (finito).
5. **Conteúdo editável no painel** já na v1 (ele faz questão).
6. **Boas-vindas = passo 1 (D+0)**, também editável.

---

## Escopo v1

### A. Modelo de dados
```sql
-- Os passos do fluxo (editáveis). v1: um fluxo único "novo assinante".
create table email_flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_key text not null default 'new_subscriber',  -- v2: vira FK a uma tabela de fluxos
  step_order int not null,            -- 1, 2, 3, 4
  delay_days int not null default 0,  -- D+0, D+3, D+7...
  subject text not null,
  body text not null,                 -- HTML/texto simples (reusa buildHtml do F-V23)
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (flow_key, step_order)
);

-- Idempotência: cada passo é enviado 1x por membro. (substitui/herda welcome_email_log)
create table email_flow_sends (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  flow_key text not null default 'new_subscriber',
  step_order int not null,
  status text not null check (status in ('sent','failed','skipped','dryrun')),
  error text,
  sent_at timestamptz not null default now(),
  unique (member_id, flow_key, step_order)
);

-- Descadastro (para o fluxo).
alter table members add column email_unsubscribed_at timestamptz null;
```
> v1 **não precisa** de tabela de enrollment: a "entrada" é `members.subscription_paid_at`;
> o progresso é derivado de `email_flow_sends`; o stop é `email_unsubscribed_at`.
> Enrollment próprio entra na v2 (múltiplos fluxos).

### B. Entrada + D+0 (reusa o gatilho do F-V30)
`markSubscriptionPaid` (onde o F-V30 já dispara) → envia o **passo D+0** (delay 0)
na hora + grava em `email_flow_sends`. É o boas-vindas, agora vindo da tabela
(editável) em vez de hardcoded.

### C. Agendador (cron) — os D+x (x>0)
Job diário (Vercel Cron, `vercel.json`) `/api/cron/email-flow`:
- Para cada membro `paid` e **não** descadastrado, e cada passo `enabled`:
  enviar se `now - subscription_paid_at >= delay_days` **e** ainda não há linha em
  `email_flow_sends` pra (member, step). Grava o envio. Isolado, idempotente.
- Respeita `WELCOME_EMAIL_MODE`/equivalente (off/dryrun/live) — herda a rede de segurança do F-V30.

### D. Descadastro (unsubscribe)
- Link `{{unsubscribe}}` no rodapé de todo e-mail do fluxo.
- Rota pública `/unsubscribe?token=…` (token assinado, **não** expõe member_id) →
  marca `email_unsubscribed_at` → fluxo para (o cron e o D+0 checam isso).

### E. Conteúdo editável (CMS)
Aba "Fluxos" em `/admin/emails` (ou nova tela): lista os passos (D+x, assunto,
corpo) com edição. Reusa `buildHtml`/`getFrom` do F-V23. Admin-only.

### F. Modo seguro (herda F-V30)
`EMAIL_FLOW_MODE` (ou reusa `WELCOME_EMAIL_MODE`) off/dryrun/live + allowlist +
log em `email_flow_sends`. Permite ensaiar (dryrun) e compra-teste antes do live.

---

## Migração do F-V30
- O boas-vindas vira `email_flow_steps` (step_order=1, delay_days=0) — conteúdo
  migrado do `lib/email/welcome.ts` (vira seed editável).
- `markSubscriptionPaid`: em vez de chamar só o welcome-hook, dispara o passo D+0
  do fluxo. O welcome-hook é absorvido/refatorado.
- `welcome_email_log` → dados migram pra `email_flow_sends` (ou convivem; decidir no plano).

## Fora de escopo (v2)
- **Construtor de múltiplos fluxos** + escolher gatilhos (a "autonomia" que o Leo
  citou em quase todas as respostas).
- Gatilhos por **evento** (cancelou, completou trilha, inatividade).
- Branching/condicional, A/B, segmentação além de "novo assinante".

## TBDs (dependem do cliente)
- **T1.** Quantos passos e os **delays** exatos? (ele disse "tipo 4 e-mails" — falta a sequência)
- **T2.** O **conteúdo** de cada e-mail (assunto + corpo) — o Leo manda.
- **T3.** O link de descadastro vale só pros e-mails do **fluxo**, ou pra todo
  e-mail de marketing do clube? (provável: todos os de marketing)
- **T4.** Frequência do cron: 1x/dia basta? (delays em dias → sim)

## Verificação (E2E)
1. Novo assinante → recebe D+0 na hora (status `sent` no `email_flow_sends`).
2. Cron roda → após o delay, manda D+x; idempotente (não duplica).
3. Descadastro → `email_unsubscribed_at` setado → não recebe o resto.
4. Fim da sequência → para (sem mais envios).
5. Admin edita o texto de um passo → o próximo envio usa o texto novo.
