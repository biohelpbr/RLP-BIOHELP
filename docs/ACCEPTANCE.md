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

## Sprint 2 — CV + Status ✅
- [x] Webhooks idempotentes (mesmo evento não duplica)
- [x] Pedido pago soma CV corretamente
- [x] Refund/cancel remove CV corretamente
- [x] CV mensal fecha no mês correto
- [x] Status muda para active quando CV >= 200
- [x] Dashboard mostra CV atual e progresso
- [x] Admin pode ver CV de qualquer membro
- [x] Admin pode fazer ajuste manual de CV
- [x] Ledger é imutável (auditável)
- [x] Job mensal fecha mês corretamente

### Teste CV (Sprint 2) — Validação por evidência

#### Pré-requisitos
- Webhooks configurados no Shopify Admin
- Variáveis de ambiente configuradas (SHOPIFY_WEBHOOK_SECRET, CRON_SECRET)
- App rodando em staging

#### Cenário T-CV-01 — Pedido pago gera CV
1) Faça um pedido na loja Shopify com e-mail de membro cadastrado
2) Aguarde webhook ser processado
3) No Dashboard do membro:
   - CV deve aumentar pela soma dos CVs dos itens (metacampo por produto)
   - Barra de progresso deve atualizar
4) No Supabase:
   - Registro em `orders` com status 'paid'
   - Registros em `order_items` com cv_value de cada item
   - Entradas no `cv_ledger` com cv_type 'order_paid'

✅ Passa se: CV calculado corretamente via metacampo (ou fallback para preço) e registrado no ledger.

**Nota sobre CV:** O CV de cada produto vem do metacampo `custom.cv` ou `lrp.cv`. Ex: Lemon Dreams (R$159) pode ter CV 77. Se não houver metacampo, usa o preço do item como fallback.

#### Cenário T-CV-02 — Refund reverte CV
1) Reembolse um pedido no Shopify
2) Aguarde webhook ser processado
3) No Dashboard do membro:
   - CV deve diminuir
   - Status pode mudar se CV < 200
4) No Supabase:
   - `orders.status` = 'refunded'
   - Entradas negativas no `cv_ledger` com cv_type 'order_refunded'

✅ Passa se: CV revertido corretamente.

#### Cenário T-CV-03 — Idempotência
1) Simule o mesmo webhook sendo enviado 2x
2) No Supabase:
   - Apenas 1 registro em `orders`
   - CV não deve duplicar

✅ Passa se: Pedido não duplicado.

#### Cenário T-CV-04 — Status muda para Active
1) Faça compras suficientes para atingir 200 CV
2) No Dashboard:
   - Status deve mudar para "Ativa"
   - Barra de progresso em 100%
3) No Shopify Admin:
   - Tag `lrp_status:active` aplicada

✅ Passa se: Status atualizado em todos os sistemas.

---

## Sprint 3 — Rede Visual + Níveis (futuro)
- [ ] Rede N1/N2 consistente
- [ ] Membro vê rede (simples)
- [ ] Níveis calculados conforme regra do documento canônico
- [ ] Checklist do próximo nível exibido

### Regras de Níveis (canônico: Biohelp___Loyalty_Reward_Program.md)

| Nível | Requisitos |
|-------|------------|
| Membro | Cliente cadastrada |
| Parceira | Membro Ativo + CV_rede >= 500 |
| Líder em Formação | Parceira + primeira Parceira em N1 (janela 90 dias) |
| Líder | Parceira Ativa + 4 Parceiras Ativas em N1 |
| Diretora | 3 Líderes Ativas em N1 + 80.000 CV na rede |
| Head | 3 Diretoras Ativas em N1 + 200.000 CV na rede |

### Cenário T-NV-01 — Promoção para Parceira
1) Membro atinge 200 CV (ativo) + rede com 500 CV total
2) Sistema deve promover para Parceira
3) Dashboard mostra novo nível

✅ Passa se: Nível atualizado automaticamente

### Cenário T-NV-02 — Líder em Formação (90 dias)
1) Parceira traz primeira Parceira em N1
2) Sistema inicia janela de 90 dias
3) Parceira recebe comissão como Líder
4) Após 90 dias sem atingir Líder, volta para comissão de Parceira

✅ Passa se: Janela de 90 dias funciona corretamente

### Cenário T-NV-03 — Perda de nível
1) Líder perde 1 das 4 Parceiras ativas em N1
2) Sistema deve rebaixar para Parceira
3) Dashboard mostra novo nível

✅ Passa se: Rebaixamento automático

---

## Sprint 4 — Comissões + Ledger (futuro)
- [ ] Ledger imutável (auditável)
- [ ] Cada valor tem origem (pedido/regra)
- [ ] Reprocessamento seguro (sem duplicar)

### Regras de Comissionamento (canônico: Biohelp___Loyalty_Reward_Program.md)

**Creatina Mensal Grátis:**
- [ ] Membro Ativo (200 CV) recebe creatina mensal

**Fast-Track (primeiros 60 dias):**
- [ ] N0 recebe 30% CV de N1 (primeiros 30 dias)
- [ ] N0 recebe 20% CV de N1 (próximos 30 dias)
- [ ] Líder N0 recebe 20%/10% CV de N2

**Comissão Perpétua:**
- [ ] Parceira: 5% CV de N1
- [ ] Líder: 7% CV da rede + 5% CV de N1
- [ ] Diretora: 10% CV da rede + 7% CV de Parceiras N1 + 5% CV de clientes N1
- [ ] Head: 15% CV da rede + 10% CV de Líderes N1 + 7% CV de Parceiras N1 + 5% CV de clientes N1

**Bônus 3:**
- [ ] 3 Parceiras Ativas em N1 por 1 mês → R$250
- [ ] Cada N1 com 3 Parceiras Ativas → R$1.500
- [ ] Cada N2 com 3 Parceiras Ativas → R$8.000

**Leadership Bônus:**
- [ ] Diretora: 3% CV da rede
- [ ] Head: 4% CV da rede

**Royalty:**
- [ ] Head forma Head → recebe 3% CV da nova rede

### Cenário T-CM-01 — Fast-Track 30 dias
1) N0 traz N1 no dia 1
2) N1 compra R$100 (CV 50) no dia 15
3) N0 deve receber 30% = R$15 de comissão

✅ Passa se: Comissão calculada corretamente

### Cenário T-CM-02 — Transição Fast-Track → Perpétua
1) Após 60 dias do cadastro de N1
2) N1 compra R$100 (CV 50)
3) N0 (Parceira) deve receber 5% = R$2,50 de comissão

✅ Passa se: Sistema detecta fim do Fast-Track e aplica Perpétua

---

## Sprint 5 — Saques + Fiscal (futuro)
- [ ] Solicitação de saque + estados
- [ ] Validação PF (RPA) até R$ 990/mês
- [ ] Validação PJ (NF-e) acima de R$ 990/mês
- [ ] Histórico de pagamentos

### Regras de Saque (canônico)
- [ ] Mínimo para saque: R$100 (TBD confirmar)
- [ ] PF: até R$990/mês → Biohelp emite RPA, desconta impostos
- [ ] PJ (MEI): pode usar conta PF
- [ ] PJ (outras): obrigatório conta PJ + NF-e antes do pagamento
- [ ] Conta sempre em nome da parceira (não terceiros)

### Cenário T-SQ-01 — Saque PF válido
1) Parceira PF com R$500 de saldo
2) Solicita saque de R$300
3) Sistema gera RPA automaticamente
4) Transferência via PIX

✅ Passa se: Saque processado com RPA

### Cenário T-SQ-02 — Saque PJ com NF-e
1) Parceira PJ com R$2.000 de saldo
2) Solicita saque de R$1.500
3) Sistema exige upload de NF-e
4) Admin valida NF-e
5) Transferência autorizada

✅ Passa se: Saque bloqueado até NF-e válida

### Cenário T-SQ-03 — Limite PF excedido
1) Parceira PF já sacou R$800 no mês
2) Tenta sacar mais R$300 (total R$1.100)
3) Sistema deve bloquear ou exigir cadastro PJ

✅ Passa se: Limite de R$990/mês respeitado
