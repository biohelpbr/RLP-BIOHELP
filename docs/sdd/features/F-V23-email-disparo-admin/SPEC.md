# F-V23 — Disparo de e-mail nativo no admin (Resend Pro)

**Classe:** C (outward-facing — envio em massa pra base real; exige confirmação antes de disparo) · **Status:** 🚧 Implementado (branch `feat/F-V23-email-disparo`, em PR) · **Registrado:** 2026-06-02 · **Implementado:** 2026-06-03

> **Infra confirmada (02/06):** Resend **Pro** ativo; domínio **`mail.bio-help.com` verificado** (DKIM+SPF+return-path OK — NÃO faltava DKIM, estava no subdomínio `mail.`); From dos códigos alinhado. Spam dos códigos = domínio novo + volume + limite diário (resolvido pelo Pro), não DNS. API key dedicada `rlp-biohelp-app` criada (Sending access). Pendente: setar `RESEND_API_KEY`/`RESEND_FROM` na Vercel + webhook do Resend (`RESEND_WEBHOOK_SECRET`).

## Origem
Call 02/06 (Léo + Gabriel). Hoje a Biohelp não tem ferramenta de disparo de e-mail própria — manda pela Shopify. Léo quer disparar comunicados pela própria gestão (admin do RLP): "subiu vídeo novo → dispara", "vai ter live → dispara". **Foi o ponto classificado como mais urgente.** Resend já foi feito **upgrade pro Pro** (50k/mês, sem limite diário) em 02/06.

## Escopo
Tela no admin pra compor e disparar e-mail pra base, lendo os e-mails direto do banco (sem subir lista), com **segmentação** e **status de envio espelhado** no admin.

### Inclui
- **Compositor:** assunto + corpo (HTML simples/markdown) + remetente nomeado ("Biohelp") + reply-to.
- **Segmentação:** todos · ativos (`subscription_status='paid'`) · cancelados · **não-renovados** (pro fluxo de renovação de assinatura — "foi sucesso / não foi sucesso").
- **Disparo via Resend** (SDK `resend`) em lotes (batch ≤100/call), puxando os destinatários da query do segmento.
- **Status espelhado no admin:** entregue / erro / bounce por destinatário (via webhook do Resend `email.delivered`/`email.bounced` ou polling), além do dashboard do Resend.
- **Guarda-rail outward-facing:** botão "enviar teste pra mim" + **confirmação explícita** antes do disparo real pra base (Anti-SPEC: ação outward-facing).

### Fora de escopo (deste F)
- Editor visual rico / templates elaborados (v1 = HTML/markdown simples).
- Automação por evento (ex: auto-disparo ao subir vídeo) — futuro.
- Configuração de DNS/DKIM (é tarefa de infra — ver §Dependências).

## Contrato de arquivos (proposto)
- `supabase/migrations/<data>_f-v23-email-campaigns.sql` — `email_campaigns` + `email_campaign_recipients`.
- `lib/email/{resend,schema,queries,actions}.ts` — cliente Resend + Zod + CRUD + disparo.
- `app/api/webhooks/resend/route.ts` — recebe eventos de entrega/bounce (HMAC).
- `app/admin/emails/{page,new/page,[id]/page}.tsx` + `EmailComposer.tsx`.
- `components/layouts/AdminSidebar.tsx` (item "E-mails"). Env: `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_WEBHOOK_SECRET`.

## Modelo de dados (proposto)
- `email_campaigns`: id, subject, body, from_label, segment (`all|active|canceled|not_renewed`), status (`draft|sending|sent|failed`), total, sent_count, error_count, created_by, created_at, sent_at.
- `email_campaign_recipients`: campaign_id, member_id, email, status (`queued|sent|delivered|bounced|failed`), resend_message_id, error, updated_at.

## Critérios de aceite (rascunho)
- CA-1 Admin compõe e-mail, escolhe segmento, vê a **contagem de destinatários** antes de enviar.
- CA-2 "Enviar teste pra mim" entrega só pro admin.
- CA-3 Disparo real exige confirmação; envia pra todos do segmento (lotes), sem subir lista.
- CA-4 Status por destinatário aparece no admin (entregue/erro/bounce).
- CA-5 Segmentos (ativos/cancelados/não-renovados) filtram corretamente pela base.
- CA-6 Não-admin não acessa `/admin/emails` nem dispara.

## Dependências / riscos
- **DKIM/SPF do Resend no Cloudflare** (ver `docs/wiki/context/F-V22.md` §follow-ups e memória `project_email_deliverability`) — **sem isso, mesmo no Pro os e-mails caem no spam.** Pré-requisito pra disparo em massa valer a pena.
- Definir **From** e domínio verificado (ex: `comunidade@bio-help.com`).
- Outward-facing: nunca disparar real sem confirmação humana (Anti-SPEC).

## DoR (pendente)
- [ ] From/domínio definido + DKIM configurado.
- [ ] Confirmar campos de segmento (o que é "não-renovado" no schema atual).
- [ ] Variant id / webhook secret do Resend.
