# F-V35 — Runbook de go-live (Programa de Afiliados)

Checklist operacional para ligar o programa de afiliados em produção. O
**desenvolvimento está concluído** (fases 1-4 + criação em massa de cupons);
o que segue é operação/deploy — depende de credenciais e ações no Vercel/Shopify.

## Estado atual (08/07/2026)
- ✅ Código do módulo na `main` (PR #51 + PR #52 mergeados): captura, GMV, comissão, painel, criação em massa de cupons.
- ✅ Migrations aplicadas em prod (affiliate_sales, affiliate_customer_origin, tipos no ledger).
- ✅ **Criação em massa de cupons rodada em prod e validada** (cliente: "parece q deu certo", 08/07).
- ⏸️ Flag `AFFILIATE_CAPTURE` = OFF → **captura ainda não grava nada**; sem ela o painel fica vazio.

## Pendentes vivos
1. ✅ **`AFFILIATE_CAPTURE=true` ligado na Vercel + redeploy** (08/07). Captura ativa.
   Verificação (Supabase SQL):
   ```sql
   select count(*) from affiliate_sales;              -- cresce conforme cupons usados
   select count(*) from affiliate_customer_origin;    -- originador first-touch
   ```
2. ✅ **Cupom desativa no cancelamento — construído** (08/07, decisão do cliente = sim).
   A desativação está centralizada em `cancelSubscription()` (`lib/subscriptions/actions.ts`),
   que é o chokepoint dos 3 caminhos de inativação: webhook Guru `subscription_expired`,
   cron `inactivate-expired-subscriptions` e cancelamento manual no admin. Ao virar
   `cancelled`, chama `deactivateAffiliateCoupon(ref_code)` (Shopify DELETE do discount
   code) — gate `AFFILIATE_CAPTURE`, try/catch isolado, non-fatal, idempotente.
   **Semântica:** dispara no ENCERRAMENTO real (member vira inativo), não no clique de
   cancelar auto-renovação — até expirar a pessoa segue assinante ativa e o cupom vale.
   ⏳ Falta: merge desta branch + deploy.

## Passo a passo do go-live

1. ✅ ~~Push + merge da branch~~ — feito (PR #52).
2. **Vercel** → env `AFFILIATE_CAPTURE=true` → **Redeploy** (flag só vale após redeploy). ⏸️ pendente.
3. ✅ ~~Criar os cupons~~ — feito e validado em prod (08/07). Reexecutar só para novos afiliados.
4. **Combos** (time Shopify): preço +10% (o cupom nivela); vendidos só via link do afiliado.
5. **Distribuir os links** aos afiliados: `https://<loja>/discount/BH00…` (aplica o cupom sozinho).

## Teste ponta a ponta
1. Compra na loja usando um cupom (ex.: `BH00348`).
2. Venda aparece em `/admin/afiliados` (GMV do afiliado).
3. `/admin/afiliados` → "Simular fechamento" do mês → confere a comissão (venda + perpétua).

## Pra PAGAR de verdade (separado)
- **Cashin fora do mock** (`CASHIN_MODE=live` + token) — hoje em mock, nenhum PIX real sai.
- Comissão de afiliado cai no `commission_ledger` → aparece no saldo → flui pro fluxo de saque existente (F-V20).

## TBDs / follow-ups (não bloqueiam)
- Decaimento da perpétua (perder após 3 meses sem venda).
- Experience como tag automática (hoje é computado/exibido).
- Limpar o membro-teste `SENTINELTEST` do banco (resquício de teste antigo).
