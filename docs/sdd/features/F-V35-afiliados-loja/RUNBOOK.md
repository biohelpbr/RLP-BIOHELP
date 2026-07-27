# F-V35 — Runbook de go-live (Programa de Afiliados)

Checklist operacional para ligar o programa de afiliados em produção. O
**desenvolvimento está concluído** (fases 1-4 + criação em massa de cupons);
o que segue é operação/deploy — depende de credenciais e ações no Vercel/Shopify.

## Estado atual (27/07/2026)
- ✅ Módulo completo na `main` e **em produção** (captura, GMV, comissão, painel, cupons).
- ✅ `AFFILIATE_CAPTURE=true` ligado; captura gravando.
- ✅ **Bugfix crítico (27/07, PR #65):** captura não pegava comprador **não-membro** → 11 de 17 vendas perdidas. Corrigido + **backfill das 11** feito. `affiliate_sales` = 17 (13 reais, GMV R$3.338). Detalhes no `log.md`.
- ✅ **Cupom automático no onboarding** (PR #66) + ferramenta incremental (PR #64, 14 faltantes criados) → afiliado novo nunca fica sem cupom.
- ✅ Price rule = "Desconto de produto" na coleção Loja Biohelp (não pega o club) (PRs #55/#56).
- ✅ Cupom desativa no cancelamento (PR #53).
- ⏳ **Fechamento de comissão de julho ainda NÃO rodou** (ledger de afiliado zerado). Rodar em `/admin/afiliados` → "Fechamento de comissão" após a virada. Confirmar data com o cliente.
- 🔎 Follow-up menor: Originador/perpétua first-touch dos 11 backfillados não foi refeito (volume pequeno; só afeta perpétua futura).

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
