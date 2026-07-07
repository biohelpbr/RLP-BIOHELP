# F-V35 — Programa de Afiliados (loja)

Status: Em desenvolvimento · Início: 2026-07-06 · Branch: `feat/F-V35-afiliados-loja`
Classe: D (módulo novo, financeiro, atrás de flag, migration aditiva)

## Objetivo

Programa de afiliados para vendas da **loja** (independente do Programa de Indicação).
Cada membro é afiliado; o cupom dele é o próprio `ref_code` (`BH00…`). Venda pelo cupom/link
é atribuída ao afiliado, comissionada por faixa de GMV, com perpétua ao Originador.

## Premissas travadas (respostas do cliente)

- **Cupom = `ref_code` do membro** (BH00…). É a chave de atribuição (já é a convenção do sistema — 430/433 membros são BH…).
- **Link do afiliado** = link de desconto nativo do Shopify (`/discount/BH00…`), sem UTM, sem mexer no tema.
- **Base:** comissão e GMV sobre o **valor líquido** (com os 10% / preço do combo).
- **Faixas de GMV mensal:** até R$9.999,99 → 10%; R$10.000+ → 15%.
- **Perpétua:** 10% ao **Afiliado Originador** (1º afiliado do cliente), só se já atingiu **R$50k** de GMV (destrava permanente; perde após 3 meses sem venda).
- **Comissão da venda** → Afiliado **Atual**; **perpétua** → **Originador**.
- **Autocompra não gera comissão** (afiliado usando o próprio cupom).
- **Conflito link+cupom:** o **cupom** que leva (resposta do Gabe).
- **Combos (opção A):** o combo **carrega o cupom** (pra atribuir); "sem 10%" resolvido no **preço** (combo cadastrado +10%, cupom nivela). Combos vendidos **só via link de afiliado**.
- **Comissão de CV de loja antiga: DESLIGADA** (F-V34, flag `STORE_CV_COMMISSION`).

## Fases

1. **Captura de atribuição (esta entrega):** ler o cupom no webhook `orders/paid`, ligar ao afiliado (`ref_code`), gravar a venda + definir Originador. Sem cálculo de comissão ainda — é o dado que se perde se não ligar já.
2. GMV mensal + faixas + status Experience.
3. Comissão (venda + perpétua) no fechamento + saque.
4. Painel admin (GMV, Experience, Originador/Atual, ajustes).

## Contrato de arquivos (fase 1)

- `supabase/migrations/20260706_f-v35-afiliados-captura.sql` (novo) — `affiliate_sales`, `affiliate_customer_origin`.
- `lib/utils/featureFlags.ts` — flag `AFFILIATE_CAPTURE`.
- `lib/affiliates/capture.ts` (novo) — `captureAffiliateSale()`.
- `app/api/webhooks/shopify/orders/paid/route.ts` — bloco isolado que chama a captura (Anti-SPEC §4).

## Modelo de dados (fase 1)

`affiliate_sales` — 1 linha por venda atribuída a um afiliado:
- shopify_order_id, order_id (interno), affiliate_member_id, buyer_member_id (null),
  customer_email, coupon_code, gross_amount, is_self_purchase, reference_month, created_at.
- UNIQUE(shopify_order_id, affiliate_member_id) — idempotência.

`affiliate_customer_origin` — 1 linha por cliente (first-touch):
- customer_email (unique), originador_member_id, first_shopify_order_id, created_at.

## Rollout (nada quebra)

- Flag `AFFILIATE_CAPTURE` default **OFF**. Deploy inerte.
- A captura só **grava em tabelas novas** — não toca CV/comissão/pedido existentes. Bloco isolado try/catch → nunca derruba o 200.
- Ligar a flag cedo pra **acumular histórico** (dado que se perde). Sem pagar nada ainda.

## Critérios de Aceite (fase 1)

- CA-01: migration idempotente aplica as 2 tabelas.
- CA-02: flag OFF → webhook não grava nada de afiliado (comportamento atual).
- CA-03: flag ON + pedido com cupom = ref_code de afiliado → 1 linha em `affiliate_sales` (idempotente por pedido).
- CA-04: 1ª compra de um cliente por um afiliado → 1 linha em `affiliate_customer_origin` (Originador). Compras seguintes não sobrescrevem.
- CA-05: cupom = ref_code do próprio comprador → `is_self_purchase=true`.
- CA-06: cupom `CREATINA-*` (ou código sem afiliado) → ignorado, nada gravado.
