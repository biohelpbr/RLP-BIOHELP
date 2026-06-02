# F-V24 — Cancelamento / estorno (Guru → corta acesso RLP + Shopify)

**Classe:** D (assinatura/pagamento/acesso — produção-crítico) · **Status:** ⏳ Pendente (backlog, P1) · **Registrado:** 2026-06-02 (call BioHelp&FlowCode)

## Origem
Call 02/06 (Gabriel + Léo). Quando um cliente desiste, o Gabriel cancela/estorna no **Guru**, mas no **RLP o membro continua ativo** (mantém acesso). Precisa sincronizar o cancelamento e dar uma forma manual no admin.

## Regra de negócio (definida na call)
- **Cancelamento imediato** (com estorno) → **corta o acesso na hora** (`subscription_status` → cancelado/inativo + remove acesso Shopify).
- **Cancelamento só da renovação** (não renova no próximo ciclo) → **mantém o acesso até o fim do ciclo**; status muda no fim do período.

## Escopo
1. **Webhook Guru de cancelamento/estorno** (estende `app/api/webhooks/guru/route.ts`): ao receber evento de cancelamento/refund do Guru, aplica a regra acima — imediato corta já, renovação agenda corte no fim do ciclo. Sempre dentro de `if (isV2Enabled())` + try/catch isolado (Anti-SPEC §4 — falha não derruba 200).
2. **Cancelamento manual no admin** (`/admin/community/[id]`): botões "Cancelar assinatura (imediato)" e "Cancelar renovação", como fallback quando o admin precisa agir direto. Server action atualiza `subscription_status` + revoga Shopify.
3. **Revogação de acesso Shopify**: remover tag/acesso do customer (espelha o que o sync de ativação faz, ao contrário).

### Fora de escopo
- Estorno financeiro em si (feito no Guru pelo Gabriel — o RLP só reage ao evento/ação).

## Contrato de arquivos (proposto)
- `app/api/webhooks/guru/route.ts` (edição — novo branch de evento cancelamento).
- `lib/subscriptions/actions.ts` (edição — `cancelSubscriptionImmediate`, `cancelRenewal`).
- `lib/shopify/customer.ts` (edição — revogar acesso/tag).
- `app/admin/community/[id]/page.tsx` (edição — botões + confirmação).
- `supabase/migrations/<data>_f-v24-cancel.sql` — colunas `subscription_cancel_at`, `canceled_at`, `cancel_reason`, `cancel_type` em `members` (se não existirem).

## Critérios de aceite (rascunho)
- CA-1 Webhook Guru "cancelamento imediato/estorno" → membro fica inativo na hora + perde acesso Shopify.
- CA-2 Webhook Guru "cancela renovação" → membro mantém acesso até `subscription_cancel_at` (fim do ciclo); corte automático depois.
- CA-3 Admin cancela manualmente (imediato) em `/admin/community/[id]` → mesmo efeito do CA-1, com confirmação.
- CA-4 Admin cancela renovação manual → mantém acesso até o fim do ciclo.
- CA-5 Falha no hook nunca derruba o 200 do webhook (try/catch isolado).
- CA-6 Não-admin não executa cancelamento manual.

## Dependências / TBDs abertos
- **TBD:** nomes/payload dos eventos de cancelamento e estorno do **Guru** (precisa doc/credenciais — confirmar com o fluxo F-V19). Sem isso o webhook não consegue mapear o evento.
- **TBD:** como o RLP sabe o "fim do ciclo" (data de renovação) — vem no payload do Guru ou calculado?
- Liga com F-V19 (webhook Guru) e F-V03 (`subscription_status`).

## DoR (pendente)
- [ ] Eventos/payload de cancelamento e refund do Guru documentados.
- [ ] Definir fonte da data de fim de ciclo.
- [ ] Confirmar mecanismo de revogação de acesso na Shopify.
