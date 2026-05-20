# SPEC — Biohelp LRP v2

> **Espelho consolidado.** Fonte de verdade técnica efetiva:
> - `docs/sdd/PIVOT-V2.md` (visão, backlog, Anti-SPEC).
> - `docs/sdd/features/F-VNN-<slug>/SPEC.md` (SPEC detalhada por feature, com CAs, contratos, hooks).
> - Zod inline em `lib/*` (contratos executáveis).
>
> Em conflito entre este SPEC e a fonte → **a fonte prevalece**.
> Este arquivo serve à conformidade Harness v3.2 §4 (`docs/specs/SPEC.md`).

## 1. Objetivo

Documentar de forma consolidada o **o que o sistema faz** (visão técnica) e as restrições não-funcionais que governam toda a v2, com ponteiros para as SPECs por feature.

## 2. RFs (Requisitos Funcionais)

Agregados das 18 SPECs em `docs/sdd/features/F-VNN-*/SPEC.md`. Cada feature carrega seus RFs detalhados:

| Feature | RFs principais (resumo) | SPEC |
|---|---|---|
| F-V01 | Cadastro só com ref válido (link ou código). House Account bloqueada quando `LRP_V2=true`. | (sem pasta dedicada — RFs inline em PIVOT-V2 e implementação `lib/members/`) |
| F-V02 | Webhook Shopify identifica produto-assinatura (mapeamento por `product_id` / `variant_id`) e emite evento `subscription_paid`. | (PIVOT-V2 §2 — sprint S5) |
| F-V03 | Status do membro = subscription_paid mais recente do shopify_customer associado. Status sobrevive a refund. | `features/F-V03-status-via-assinatura/SPEC.md` |
| F-V04 | Comissão 50% sobre assinatura paga do convidado. Crédito automático no saldo do sponsor direto (1 nível). | (bloqueada — TBD-1/2) |
| F-V05 | Conversão saldo → Crédito Shopify 1:1 com chamada `customer.credit` da Admin API. | `features/F-V05-saldo-creditos/SPEC.md` |
| F-V06 | Promoção a Founder ao atingir ≥5 ativos no clube. Definitiva (TBD-12 hipótese padrão). | (parcial — TBD-12) |
| F-V07 | Saque triple: Cashin / Crédito Shopify / PIX+NF. Validação NF automática (F-V07c). | `features/F-V07-saque-cashin-nf/SPEC.md`, `features/F-V07b-cashin-live/SPEC.md`, `features/F-V07c-nfe-validator/SPEC.md` |
| F-V08 | Ranking de Founders por nº de pessoas no clube (critério inicial — TBD-26). | (sem pasta dedicada) |
| F-V09 | CMS de Academy: módulos com aulas (vídeo + texto), ModulePlayer no membro. | `features/F-V09-academy-cms/SPEC.md` |
| F-V10 | Link WhatsApp Founder no rodapé. | (bloqueada — TBD-16) |
| F-V11 | Membro vê sponsor + indicados N1 apenas. Sem profundidade. | `features/F-V11-visao-restrita-rede/SPEC.md` |
| F-V14 | Lead → conversão para venda manual atrelada à parceira. Sem efeito financeiro (info apenas). | `features/F-V14-vendas-manuais-membro/SPEC.md` |
| F-V15 | Admin cria eventos com link de atribuição (`/r/[slug]`). Funil: views → cadastros → vendas. | `features/F-V15-eventos-admin/SPEC.md` |
| F-V16 | Painel admin 9 áreas (V-Geral, Comunidade c/ tags, Crescimento, Consumo, Produtos, Eventos, Financeiro, Resgates, Academy). | `features/F-V16-painel-admin-completo/SPEC.md` |
| F-V17 | SSO Shopify via App Proxy (HMAC). Multipass descartado (loja sem Plus). | `features/F-V17-sso-shopify/SPEC.md` |
| F-V18 | Cron diário às 03:00 UTC + invalidação ao mudar status calcula tags Líder/Influenciador. | `features/F-V18-tags-automaticas/SPEC.md` |

## 3. CAs (Critérios de Aceite)

Agregados das SPECs por feature. Não duplicar aqui — ver cada SPEC.

Padrões transversais (válidos para qualquer feature B/C/D):
- CA-T1: Toda chamada Supabase respeita RLS (não usar `service_role` em context de membro logado).
- CA-T2: Toda chamada Shopify Admin usa `lib/shopify/admin.ts` (rate limit + retry centralizados).
- CA-T3: Todo hook em webhook Shopify v2 está dentro de `if (isV2Enabled())` + try/catch isolado, **nunca derruba 200**.
- CA-T4: Toda migration é idempotente (`CREATE … IF NOT EXISTS`, `ALTER … IF NOT EXISTS`) e tem rollback comentado no topo.
- CA-T5: Toda nova rota `/api/*` valida payload via Zod antes de tocar DB.

## 4. Restrições não-funcionais

- **RLS** ativo em todas as tabelas com dado de membro (`members`, `payouts`, `commissions`, `subscriptions`, `events`, `leads`, `manual_sales`, `notifications`).
- **HMAC obrigatório** em todo webhook entrante (Shopify, Cashin, App Proxy).
- **Idempotência** em todos os webhooks (chave única por `order_id`/`payout_id`/`event_id`) e crons (`processed_at`/`run_id`).
- **Migrations** idempotentes com rollback comentado. Aplicar via Supabase MCP em prod.
- **Performance:** < 3s para operações de visão restrita de rede; < 5s para queries do painel admin (cache cliente via Tanstack Query).
- **Feature flag `LRP_V2`** como switch master. Default `false` em prod até go-live.
- **Try/catch isolado** em todo hook v2 dentro de fluxo v1 — falha v2 nunca corrompe resposta 200 do webhook v1 (Anti-SPEC §4).

## 5. Stack

- **App:** Next.js 14.2 (App Router, Server Components, Server Actions, Route Handlers).
- **DB + Auth:** Supabase Postgres + Auth + RLS. Magic link.
- **Shopify:** Admin API GraphQL 2024-10 + Webhooks HMAC.
- **Cashin:** PIX cash (3 modos: mock / sandbox / live via `CASHIN_MODE`).
- **SSO:** Shopify App Proxy HMAC (loja sem Plus — Multipass descartado).
- **Crons:** Vercel Cron via `vercel.json`.

## 6. Anti-SPEC v2 (sagrada — espelho de `docs/sdd/PIVOT-V2.md` §3)

NÃO mexer sem autorização explícita do humano:

1. Tabela `members.sponsor_id` — vínculo de patrocínio é dado vivo de produção.
2. Tabela `shopify_customers` e tags atuais — preço de clube depende delas.
3. Tabelas `orders` e `order_items` — histórico fiscal.
4. Webhooks Shopify ativos em produção (`/api/webhooks/shopify/orders/*`).
5. RLS policies existentes — só alterar em feature classe D com Anti-SPEC explícita.
6. Migrations já aplicadas — nunca reverter; sempre criar nova migration.
7. `ref_code` de membros existentes — formato `BH00001` mantém; não regenerar.
8. House Account — descontinuada no v2 (TBD-10 resolvido 29/04/2026). Código congelado até onda 6 / F-V12.
9. Cupom mensal de creatina — escopo alterado (TBD-17 resolvido 29/04). Vira sistema de campanhas via F-V15.
10. RPA / CPF / limite R$1.000 — descontinuado v2 (TBD-18). Não expor em UI v2. Removido em F-V12.
11. Provider de pagamento — interface agnóstica em `lib/payouts/v2/` (Cashin/PIX).
12. Tipos e mocks v1 do Loveable (`_loveable_import/src/types/`, `lib/fake-api.ts`) — nunca importar pro código de produção.
13. Pasta `_loveable_import/` — gitignored, referência visual apenas.

> Em conflito entre este arquivo e `docs/sdd/PIVOT-V2.md` §3, **PIVOT-V2.md prevalece** (fonte canônica).

## 7. Decisões de TBD

Lista resolvidos + abertos: `docs/sdd/PIVOT-V2.md` §4.

## 8. Cronograma

`docs/sdd/CRONOGRAMA-V2.md` (S1–S5 + buffer + go-live 11/06/2026).
