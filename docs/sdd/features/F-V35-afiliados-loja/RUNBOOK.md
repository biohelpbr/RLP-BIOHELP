# F-V35 — Runbook de go-live (Programa de Afiliados)

Checklist operacional para ligar o programa de afiliados em produção. O
**desenvolvimento está concluído** (fases 1-4 + criação em massa de cupons);
o que segue é operação/deploy — depende de credenciais e ações no Vercel/Shopify.

## Estado atual (07/07/2026)
- ✅ Código do módulo na `main` (PR #51 mergeado): captura, GMV, comissão, painel.
- ✅ Migrations aplicadas em prod (affiliate_sales, affiliate_customer_origin, tipos no ledger).
- ⏳ Criação em massa de cupons: branch `feat/F-V35-cupons-massa` (aguardando push/merge — bloqueio de permissão da conta git).
- ⏸️ Flag `AFFILIATE_CAPTURE` = OFF.

## Passo a passo do go-live

1. **Push + merge** da branch `feat/F-V35-cupons-massa` (conta com permissão: `lgouveac`).
2. **Vercel** → env `AFFILIATE_CAPTURE=true` → **Redeploy** (flag só vale após redeploy).
3. **Criar os cupons** (painel `/admin/afiliados` → "Cupons no Shopify"):
   - Simular (escopo "ativos") → conferir contagem.
   - Rodar com **limite 5** → validar na loja Shopify (os 5 internos).
   - Rodar geral (ativos, depois todos).
   - Obs.: roda com as credenciais Shopify de **prod** (client credentials na Vercel).
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
