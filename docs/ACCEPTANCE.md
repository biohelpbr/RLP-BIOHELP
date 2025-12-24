# ACCEPTANCE — Critérios de Aceite e Testes (Biohelp LRP)

Este documento reúne **checklists de validação** por sprint e **roteiros de teste** para homologação com o cliente.

> Sempre que um item for concluído, registrar evidência (print, vídeo curto, logs) e anexar no canal combinado com o cliente.

---

## Sprint 1 — Onboarding + Shopify Sync (MVP)
**Objetivo:** permitir cadastro → virar membro → convidar → comprar como membro.

### Checklist (Aceite)
- [ ] Cadastro com link (`/join?ref=...`) cria membro com `sponsor_id` correto
- [ ] `ref_code` é único e imutável
- [ ] Captura de UTMs (quando existirem) e registro em `referral_events`
- [ ] Customer Shopify criado/atualizado por e-mail
- [ ] Tags aplicadas corretamente no customer
- [ ] Login funciona (Supabase Auth)
- [ ] Dashboard mostra: nome, e-mail, sponsor (ou “none”), `ref_code`, link de convite
- [ ] CTA para “Ir para a Loja” (redirect definido)
- [ ] Admin lista/busca membro e vê sponsor/ref_code
- [ ] Admin executa “Resync Shopify”
- [ ] RLS ativo: membro não consegue ler dados de outro membro
- [ ] Erros tratados:
  - [ ] e-mail existente → sugere login (409)
  - [ ] Shopify falha → member criado + sync_status=failed + reprocesso via admin

---

## Teste Shopify (Sprint 1) — Validação por evidência (sem saber API)
> Este teste é o que garante que “está certo” mesmo sem domínio de Shopify API.

### Pré-requisitos
- Acesso ao **Shopify Admin** da loja de staging/teste
- Token/credenciais Shopify configuradas no backend (env vars)
- App rodando em staging (Vercel ou local)

### Evidências que devem existir no Shopify Admin
Para um cadastro bem-sucedido (membro novo):
1) **Customer existe** com o e-mail do membro
2) **Tags** incluem no mínimo:
   - `lrp_member`
   - `lrp_ref:<ref_code_do_membro>`
   - `lrp_sponsor:<ref_code_do_sponsor|none>`
   - `lrp_status:pending` *(no Sprint 1)*
3) (Se metacampos forem usados) os metacampos aparecem com valores coerentes

### Cenário T-SH-01 — Cadastro com link cria/atualiza customer e tags
1) Crie (ou use) um Sponsor A
2) Pegue o link de convite do Sponsor A (`/join?ref=...`)
3) Abra em janela anônima
4) Cadastre Member B
5) No Shopify Admin:
   - Buscar customer pelo e-mail do Member B
   - Confirmar tags (lista acima)

✅ Passa se: customer existe + tags corretas.

### Cenário T-SH-02 — Re-cadastro não cria duplicado (upsert por e-mail)
1) Use o mesmo e-mail do Member B
2) Tente cadastrar novamente
3) Resultado esperado:
   - App retorna 409 (EMAIL_EXISTS) e sugere login
   - Shopify continua com **1 customer** para aquele e-mail

✅ Passa se: não há customer duplicado e o app não cria um novo membro.

### Cenário T-SH-03 — Falha Shopify não bloqueia criação do membro (graceful degradation)
1) Simule falha (ex.: token inválido em staging)
2) Cadastre Member C
3) No Supabase:
   - `members` tem o Member C
   - `shopify_customers.last_sync_status = 'failed'` + `last_sync_error` preenchido
4) Restaure o token
5) Como Admin:
   - execute “Resync Shopify” no Member C
6) No Shopify Admin:
   - customer existe + tags corretas
7) No Supabase:
   - status de sync muda para `ok`

✅ Passa se: membro é criado mesmo com falha e admin consegue recuperar.

---

## Sprint 2 — CV + Status (futuro)
- [ ] Webhooks idempotentes (mesmo evento não duplica)
- [ ] Pedido pago soma CV corretamente
- [ ] Refund/cancel remove CV corretamente
- [ ] CV mensal fecha no mês correto
- [ ] Status muda para active quando CV >= 200

---

## Sprint 3 — Rede Visual + Níveis (futuro)
- [ ] Rede N1/N2 consistente
- [ ] Membro vê rede (simples)
- [ ] Níveis calculados conforme regra assinada
- [ ] Checklist do próximo nível exibido

---

## Sprint 4 — Comissões + Ledger (futuro)
- [ ] Ledger imutável (auditável)
- [ ] Cada valor tem origem (pedido/regra)
- [ ] Reprocessamento seguro (sem duplicar)

---

## Sprint 5 — Saques + Fiscal (futuro)
- [ ] Solicitação de saque + estados
- [ ] Validação PF (RPA) até R$ 990
- [ ] Validação PJ (NF-e) acima
- [ ] Histórico de pagamentos
