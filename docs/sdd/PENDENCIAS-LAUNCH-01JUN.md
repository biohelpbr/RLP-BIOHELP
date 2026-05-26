# Pendências para Launch 01/06 — Lista numerada

> Fonte: transcrições 25/05 + 26/05 + estado real do código/infra.
> Atualizado: 26/05/2026 noite.

---

## BLOCO 1 — Crítico (bloqueia launch)

### 1. Webhook Guru não dispara
- **Causa:** plano do Guru tem limite de 2 webhooks. Os 2 slots estão ocupados por webhooks de Vendas do Make (abandoned_checkout + sale_guru_make_shop).
- **Solução:** deletar abandoned_checkout (menos crítico) e criar webhook de Assinaturas no lugar. OU upgrade do plano.
- **Quem:** Matt/Gabriel autorizam, Eduardo executa.
- **Status:** mensagem enviada no grupo aguardando resposta.

### 2. Shopify sync real (NÃO é mock)
- **Causa:** o webhook Guru (V2) usa função `shopifySyncMock` que só loga. O código real de sync (`syncCustomerToShopify` em `lib/shopify/customer.ts`) existe e funciona desde a V1.
- **Solução:** substituir `shopifySyncMock` por chamada real a `syncCustomerToShopify`. Credentials já estão no Vercel (SHOPIFY_ADMIN_API_TOKEN, SHOPIFY_STORE_DOMAIN apontando pra biohelp-dev).
- **Quem:** Eduardo implementa.
- **Status:** EM ANDAMENTO.

### 3. Migration CHECK constraint comissão
- **Causa:** commission_ledger tem CHECK que não inclui 'subscription_activation'.
- **Solução:** 1 SQL no Supabase dashboard (30 segundos).
- **Quem:** Eduardo.
- **Status:** SQL pronto, falta aplicar.

### 4. Login por código de email (sem senha)
- **Problema:** (transcription 26/05 12:31-15:05) pessoa compra no Guru, cai no LRP logada via sessão. Mas quando sai, não tem senha pra voltar. Gera "zilhão de mensagens de suporte".
- **Solução:** login via magic link (código no email). Supabase Auth já suporta nativamente.
- **Quem:** Eduardo implementa.
- **Decisão (Léo/Gabriel 26/05):** login por código de email é aceito. Não precisa de senha.

### 5. Redirect /welcome pós-pagamento Guru
- **Problema:** página dá erro quando Guru redireciona com ?email=
- **Causa:** fix email-only (commit 93b3f7a) pode não estar deployado.
- **Solução:** confirmar deploy + testar.
- **Quem:** Eduardo.

---

## BLOCO 2 — Importante (precisa até sexta 30/05)

### 6. Design da landing /convite
- **O que:** Léo vai mandar referência de design (cores, logo, fonte). Print de referência já enviado no grupo.
- **Solução:** Eduardo aplica quando receber assets.
- **Quem:** Léo envia → Eduardo implementa.
- **Prazo:** até quinta 29/05.

### 7. URL admin separada
- **Problema:** (transcription 26/05 03:24-03:51) /admin aparece na mesma URL do painel de parceiras.
- **Decisão Léo:** criar URL oculta só pra admin (parceiras.bio-help.com ou painel.bio-help.com/admin com acesso restrito).
- **Solução:** criar subdomínio parceiras.bio-help.com no Cloudflare OU rota oculta.
- **Quem:** Eduardo.

### 8. SSO Shopify → LRP (sem duplo login)
- **Problema:** (transcription 26/05 06:11-06:30) pessoa logada na Shopify clica "Painel" → tem que fazer login de novo no LRP.
- **Solução:** F-V17 (SSO via App Proxy) já está implementada. Precisa ativar na loja. O botão na Shopify redireciona pro LRP com sessão do App Proxy.
- **Quem:** Eduardo + Gabriel configuram App Proxy na loja.
- **Decisão Léo (26/05):** não precisa estar 100% pro dia 1, mas o básico sim.

### 9. CRM Absolut — integração
- **O que:** (transcription 26/05 21:24-24:37) enviar pro CRM: quem comprou e quem não comprou. Time comercial precisa dessa info.
- **Decisão Léo:** primeiro momento = base Adriana, quem comprou vs não comprou. Funis mais complexos depois.
- **Solução:** Léo vai adicionar Eduardo ao grupo de tech do CRM. Eduardo faz integração via API.
- **Quem:** Léo adiciona ao grupo → Eduardo integra.
- **Prazo:** pode ser pós-launch se necessário, mas ideal dia 1.

### 10. Teste de carga 1000 simultâneas
- **O que:** (transcription 25/05 22:02-22:54) Lucas pediu simular 1000 compras simultâneas.
- **Solução:** script de load test (k6/artillery) apontando pro webhook endpoint.
- **Quem:** Eduardo.
- **Prazo:** sexta 30/05.

### 11. Checkout Guru — valor R$99/mês visível
- **O que:** (transcription 25/05 06:43-06:54) mostrar valor da assinatura no checkout.
- **Solução:** Gabriel/Matheus ajustam no painel Guru (não é código nosso).
- **Quem:** Gabriel.

---

## BLOCO 3 — Pós-launch (pode entrar terça 02/06)

### 12. Academy (trilhas YouTube)
- **O que:** (transcription 26/05 19:47-20:52) subir vídeos privados no YouTube, disponibilizar URL no LRP.
- **Decisão Léo (26/05):** pode ser terça. Última prioridade.
- **Solução:** Eduardo cria automação: admin cola URL do YouTube → vídeo aparece na trilha.
- **Quem:** Eduardo.

### 13. Loja Shopify ES vs SP
- **O que:** (transcription 25/05 17:36-18:41) migração de SP pra ES.
- **Decisão Gabriel (26/05 17:01):** NÃO muda a loja. Só mudou o gateway. Sem NF. Sem mudança de API.
- **Status:** ✅ RESOLVIDO — mesma loja, mesmas credentials. Não precisa trocar nada.

### 14. Design refinado do LRP (pós-Loveable)
- **Decisão Léo (26/05 18:55-19:47):** primeiro lança o básico, depois refina design.
- **Status:** adiado.

---

## Resumo de prioridade para HOJE/AMANHÃ

| # | Item | Tempo estimado | Bloqueia launch? |
|---|---|---|---|
| 1 | Webhook Guru (deletar abandoned_checkout) | 5 min (precisa autorização) | SIM |
| 2 | Shopify sync real (substituir mock) | 30 min | SIM |
| 3 | Migration CHECK comissão | 1 min (SQL no dashboard) | SIM |
| 4 | Login por código email (magic link) | 2h | SIM |
| 5 | Fix /welcome redirect | 10 min (verificar deploy) | SIM |
| 6 | Design landing | Depende do Léo enviar | NÃO |
| 7 | Admin URL separada | 30 min | NÃO |
| 8 | SSO Shopify | 1h (ativar App Proxy) | NÃO pro dia 1 |
| 9 | CRM Absolut | 2-4h (após acesso) | NÃO pro dia 1 |
| 10 | Teste carga | 1h | NÃO (mas importante) |
