# Runbook — Webhook Shopify debug

## Quando usar
- Webhook `orders/paid` retornou 401 / 500.
- Hook v2 (subscription / events / tags) não disparou após pedido pago.
- HMAC mismatch.

## Diagnóstico inicial
1. **Vercel Logs:** Vercel → Project → Functions → `/api/webhooks/shopify/orders/paid`. Filtrar por `error`.
2. **Shopify Admin:** Settings → Notifications → Webhooks → ver "Recent deliveries" do webhook em questão. Ver status code retornado.
3. **Supabase Logs:** `mcp__supabase__get_logs` filtrar `webhook` ou `subscription`.

## Causas comuns
- **HMAC mismatch:** `SHOPIFY_WEBHOOK_SECRET` desatualizado no Vercel após rotação no Shopify Admin.
- **Body já consumido:** Next.js consumiu body antes do validator HMAC — sempre ler raw body uma vez só.
- **Hook v2 lançou exception:** verificar que está em try/catch isolado (`lib/<modulo>/hook-on-order-paid.ts`).
- **`LRP_V2=false`:** hook v2 não roda por design — não é bug.

## Reenvio manual
- Shopify Admin → Webhooks → "Send test notification" ou "Resend".
- Local com ngrok: `npx ngrok http 3000` → atualizar URL no Shopify temporariamente → reenviar.

## Reprodução local
- `node test-webhook-local.mjs` — script standalone que monta payload Shopify e chama `/api/webhooks/shopify/orders/paid` com HMAC válido.
- `node test-webhook-demo.mjs` — variação para demo.

## Pós-fix
- Adicionar evidência (log Vercel + screenshot Shopify Admin) na matriz de validação do PR.
- Atualizar este runbook se for um novo modo de falha.
