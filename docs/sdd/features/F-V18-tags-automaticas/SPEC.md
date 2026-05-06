# F-V18 — Tags automáticas Líder (≥5) / Influenciador (≥40)

## Metadata
- ID: F-V18
- Classe: B
- Status: Draft
- Onda: 7 (Sprint 3 — Admin core, 20–26/05/2026)
- Data: 2026-05-05

## Contexto
Reunião 29/04 PM (minuto 18:37–19:33): regra simples de classificação automática de membros por nº de afiliados ativos no clube:
- ≥ 5 ativos → tag `lider`
- ≥ 40 ativos → tag `influenciador`

Léo: "que daí vai ficar mais fácil um pouco a nossa vida depois lá a gente pode aperfeiçoar isso, mas eu acho que para o início agora a gente nÃ£o viu, é tem cinco pessoas líder, tem 40 já influenciador". Convive com tag `FOUNDER` da F-V06 (Founder@5 — mesmo critério mínimo do Líder, mas Founder requer assinatura paga + opção de saque NF; Líder é só o gatilho de comunicação/destaque).

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis (definidos)
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] Dependência: contagem de "afiliados ativos" depende de F-V03 (status ativo = subscription_paid). Antes de F-V03 estar live, contagem fica 0.

## Requisitos Funcionais
- **RF-1:** Trigger ou cron diário aplica/remove tags `lider` e `influenciador` em `members.tags` (jsonb ou array) baseado em `count_active_affiliates`.
- **RF-2:** "Afiliado ativo" = membro N1 (sponsor_id = M.id) com `subscription_status = 'paid'` (F-V03).
- **RF-3:** Sistema não remove tag manualmente aplicada pelo admin (separar tags `auto:` de tags `manual:`).
- **RF-4:** Tags refletem em `app/admin/community` (filtros, badges).
- **RF-5:** Tags `lider`/`influenciador` são informativas — **não** desbloqueiam saque cash (isso é Founder + CNPJ + NF — F-V06/F-V07).

## Critérios de Aceite
- CA-01: membro M com 5 afiliados ativos → tag `auto:lider` aplicada na próxima execução do cron.
- CA-02: membro M com 40 afiliados ativos → tag `auto:influenciador` aplicada (e mantém `auto:lider`).
- CA-03: membro M cai pra 4 ativos → tag `auto:lider` removida; tag `auto:influenciador` removida se aplicável.
- CA-04: tag `manual:vip` aplicada pelo admin → cron não remove.
- CA-05: filtro de comunidade por `auto:lider` retorna lista correta.
- CA-06: idempotência — rodar cron 2× seguidos não duplica tags.

## Arquivos PERMITIDOS
- `lib/tags/auto-classifier.ts`
- `app/api/cron/auto-tags/route.ts` — endpoint chamado por Vercel Cron (diário)
- `vercel.json` — adicionar entry de cron
- `supabase/migrations/<data>_f-v18-tags-auto.sql` — alterar `members.tags` se ainda não for jsonb; criar view `member_active_affiliate_count`

## Arquivos PROIBIDOS (Anti-SPEC)
- Não tocar `members.sponsor_id` (Anti-SPEC §1).
- Não usar tipo `PartnerRank` do Loveable (níveis v1).
- Não substituir tag `FOUNDER` por `lider` — são conceitos paralelos.

## Plano de implementação
1. Branch `feat/F-V18-tags-automaticas`.
2. Migration: garantir `members.tags jsonb default '[]'`; view `member_active_affiliate_count` agregando.
3. `lib/tags/auto-classifier.ts` — função `recompute(memberId?)`. Se `memberId` undefined → recompute all.
4. Cron diário às 03:00 UTC.
5. Hook em F-V03 — quando `subscription_status` muda, dispara `recompute(sponsor_id)` (não esperar cron).
6. UI badges em F-V16 (Comunidade).

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 a CA-06 | … | unit + integration | ⏳ | … |

## Loveable — elementos descartados
- `PartnerRank: PARTNER | LEADER | DIRECTOR | HEAD` — substituir por tags v2 (`auto:lider`, `auto:influenciador`, `FOUNDER`).
