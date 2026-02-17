# ACCEPTANCE — Critérios de Aceite e Testes (Biohelp LRP)

Este documento reúne **checklists de validação** por sprint, **mapeamento de FRs** e **roteiros de teste** para homologação com o cliente.

> Sempre que um item for concluído, registrar evidência (print, vídeo curto, logs) e anexar no canal combinado com o cliente.

---

## Matriz de FRs e Status

### Legenda
- ✅ Implementado e testado
- ⚠️ Parcialmente implementado
- ⏳ Pendente/Planejado
- ❌ Bloqueado (aguardando TBD)

### FRs por Sprint

| FR | Descrição | Sprint | Status | Critérios de Aceite |
|----|-----------|--------|--------|---------------------|
| FR-01 | Autenticação de membro | 1 | ✅ | CA-01 |
| FR-02 | Autenticação de admin | 1 | ✅ | CA-01 |
| FR-03 | Controle de permissões (RBAC) | 1 | ✅ | CA-01 |
| FR-04 | Cadastro de novo membro | 1 | ✅ | CA-02 |
| FR-05 | Captura de link de indicação | 1 | ✅ | CA-02 |
| FR-06 | Regra para cadastro sem link | 1 | ✅ | CA-02 (TBD-001 ✅ House Account — implementado 11/02/2026) |
| FR-07 | Geração de link único | 1 | ✅ | CA-02 |
| FR-08 | Ativação de preço de membro | 1 | ✅ | CA-02 |
| FR-09 | Persistência da rede | 1 | ✅ | CA-03 |
| FR-10 | Visualização da rede (membro) | 3 | ✅ | CA-03 |
| FR-11 | Visualização da rede (admin) | 3 | ✅ | CA-03 |
| FR-12 | Regra de saída após 6 meses | 6 | ✅ | CA-03 |
| FR-13 | Webhooks de pedidos | 2 | ✅ | CA-04 |
| FR-14 | Cálculo de CV por pedido | 2 | ✅ | CA-04 |
| FR-15 | Status Ativo/Inativo mensal | 2 | ✅ | CA-04 |
| FR-16 | Reset mensal | 2 | ✅ | CA-04 |
| FR-17 | Separação de CV (próprio vs rede) | 7 | ✅ | CA-04 |
| FR-18 | Recalcular nível automaticamente | 3 | ✅ | CA-05 |
| FR-19 | Status 'Líder em Formação' | 3 | ✅ | CA-05 |
| FR-20 | Rebaixamento automático | 3 | ✅ | CA-05 |
| FR-21 | Ledger de comissões | 4 | ✅ | CA-06 |
| FR-22 | Fast-Track | 4 | ✅ | CA-06 |
| FR-23 | Comissão Perpétua | 4 | ✅ | CA-06 |
| FR-24 | Bônus 3 | 4 | ✅ | CA-06 |
| FR-25 | Leadership Bônus | 4 | ✅ | CA-06 |
| FR-26 | Royalty | 4 | ✅ | CA-06 |
| FR-27 | Detalhamento por tipo de comissão | 4 | ✅ | CA-06 |
| FR-28 | Saldo em análise (trava) | 5 | ✅ | CA-07 (TBD-021 ✅ Net-15) |
| FR-29 | Solicitação de saque | 5 | ✅ | CA-07 |
| FR-30 | Upload e validação de NF-e | 5 | ✅ | CA-07 |
| FR-31 | Emissão de RPA (CPF) | 5 | ✅ | CA-07 |
| FR-32 | Workflow de aprovação | 5 | ✅ | CA-07 |
| FR-33 | Integração de pagamento | 5 | ⚠️ | CA-07 (Asaas definido, aguarda credenciais) |
| FR-34 | Gestão de admins | 6 | ⚠️ | CA-08 (CRUD básico, sem multi-admin) |
| FR-35 | Dashboard global | 6 | ✅ | CA-08 |
| FR-36 | Filtros por modo de comissionamento | 6 | ✅ | CA-08 |
| FR-37 | Gestão de membro | 6 | ✅ | CA-08 |
| FR-38 | Gestão de tags | 6 | ✅ | CA-08 |

---

## Critérios de Aceite (CA)

### CA-01 — Identidade, Acesso e Perfis
**FRs:** FR-01, FR-02, FR-03

- [ ] Usuários não autenticados não acessam rotas protegidas
- [ ] Admin não enxerga telas de membro como membro (a não ser em modo 'visualizar como')
- [ ] Logs/auditoria para ações administrativas relevantes
- [ ] Login funciona (Supabase Auth)
- [ ] Recuperação de senha funciona

### CA-02 — Cadastro, Link de Indicação e Entrada na Rede
**FRs:** FR-04, FR-05, FR-06, FR-07, FR-08

- [ ] Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail)
- [ ] Link do membro funciona e atribui corretamente a hierarquia (parent/child)
- [ ] Acesso a preço de membro funciona para o e-mail cadastrado
- [ ] `ref_code` é único e imutável
- [ ] `ref_code` no formato sequencial `BH00001` (TBD-006 ✅)
- [ ] Admin pode customizar `ref_code` com validação de unicidade (TBD-006 ✅)
- [ ] Captura de UTMs (quando existirem) e registro em `referral_events`
- [ ] Customer Shopify criado/atualizado por e-mail
- [ ] Tags aplicadas corretamente no customer (incluindo `nivel:<nivel>` — TBD-003 ✅)
- [ ] Dashboard mostra: nome, e-mail, sponsor (ou "none"), `ref_code`, link de convite
- [ ] CTA para "Ir para a Loja" (redirect definido)
- [ ] Cadastro sem link → sponsor = House Account (TBD-001 ✅)
- [ ] House Account existe como conta raiz no sistema (TBD-001 ✅)

### CA-03 — Rede (Árvore) e Visualização
**FRs:** FR-09, FR-10, FR-11, FR-12

- [ ] Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós)
- [ ] Compressão não quebra integridade (sem ciclos; sem órfãos)
- [ ] Admin consegue buscar membro e abrir a rede completa
- [ ] Membro vê sua rede com: contato, nível, CV, status ativo/inativo
- [ ] Privacidade de telefone respeitada (phone_visibility)

### CA-04 — CV, Status e Rotinas Mensais
**FRs:** FR-13, FR-14, FR-15, FR-16, FR-17

- [ ] Cada pedido é processado uma única vez (idempotência por shopify_order_id)
- [ ] Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify
- [ ] Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar)
- [ ] CV calculado corretamente via metafield `custom.cv` (se ausente → CV = 0, sem fallback para preço)
- [ ] CV próprio separado de CV da rede no painel (FR-17)

### CA-05 — Cálculo de Níveis
**FRs:** FR-18, FR-19, FR-20

- [ ] Mudança de nível fica registrada com data e justificativa (cálculo)
- [ ] Painel exibe nível atual e requisitos faltantes para o próximo nível
- [ ] Líder em Formação recebe bônus como Líder por 90 dias
- [ ] Rebaixamento automático quando requisitos não são atendidos

### CA-06 — Motor de Comissões e Ledger
**FRs:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

- [ ] Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito
- [ ] Cálculos são reprocessáveis sem duplicação (ledger com idempotência)
- [ ] Telas mostram totals e detalhamento consistente com o ledger
- [ ] Fast-Track calculado corretamente (30%/20% nos primeiros 60 dias)
- [ ] Comissão Perpétua diferenciada por tipo de N1
- [ ] Bônus 3 detecta marcos e credita corretamente
- [ ] Leadership Bônus (3%/4%) calculado corretamente
- [ ] Royalty (3% da nova rede) calculado corretamente

### CA-07 — Saques, Documentos e Pagamentos
**FRs:** FR-28, FR-29, FR-30, FR-31, FR-32, FR-33

- [ ] Não permitir saque para conta em nome de terceiros
- [ ] Bloquear saque acima das regras sem documento obrigatório
- [ ] Registrar status do saque e logs de pagamento
- [ ] PF: gerar RPA automaticamente, descontar impostos
- [ ] PJ: validar NF-e antes de aprovar pagamento
- [ ] Saldo em análise (trava) separado do disponível

### CA-08 — Painel do Admin
**FRs:** FR-34, FR-35, FR-36, FR-37, FR-38

- [ ] Ações manuais ficam registradas em auditoria
- [ ] Filtros retornam resultados consistentes com o ledger e rede
- [ ] Dashboard global mostra KPIs corretos
- [ ] Admin pode editar dados, ajustar CV/comissão, ajustar nível
- [ ] Admin pode bloquear membro e trocar de rede
- [ ] Admin pode gerenciar tags

---

## Sprint 1 — Onboarding + Shopify Sync (MVP) ✅ CONCLUÍDO

**Objetivo:** permitir cadastro → virar membro → convidar → comprar como membro.

**FRs cobertos:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09

### Checklist (Aceite)
- [x] Cadastro com link (`/join?ref=...`) cria membro com `sponsor_id` correto
- [x] `ref_code` é único e imutável
- [x] Captura de UTMs (quando existirem) e registro em `referral_events`
- [x] Customer Shopify criado/atualizado por e-mail
- [x] Tags aplicadas corretamente no customer
- [x] Login funciona (Supabase Auth)
- [x] Dashboard mostra: nome, e-mail, sponsor (ou "none"), `ref_code`, link de convite
- [x] CTA para "Ir para a Loja" (redirect definido)
- [x] Admin lista/busca membro e vê sponsor/ref_code
- [x] Admin executa "Resync Shopify"
- [x] RLS ativo: membro não consegue ler dados de outro membro
- [x] Erros tratados:
  - [x] e-mail existente → sugere login (409)
  - [x] Shopify falha → member criado + sync_status=failed + reprocesso via admin

---

## Teste Shopify (Sprint 1) — Validação por evidência

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
   - `nivel:<nivel>` (ex.: `nivel:membro`) — TBD-003 ✅
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

### Cenário T-SH-03 — Falha Shopify não bloqueia criação do membro
1) Simule falha (ex.: token inválido em staging)
2) Cadastre Member C
3) No Supabase:
   - `members` tem o Member C
   - `shopify_customers.last_sync_status = 'failed'` + `last_sync_error` preenchido
4) Restaure o token
5) Como Admin:
   - execute "Resync Shopify" no Member C
6) No Shopify Admin:
   - customer existe + tags corretas
7) No Supabase:
   - status de sync muda para `ok`

✅ Passa se: membro é criado mesmo com falha e admin consegue recuperar.

---

## Sprint 2 — CV + Status ✅ CONCLUÍDO

**FRs cobertos:** FR-13, FR-14, FR-15, FR-16

### Checklist (Aceite)
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

✅ Passa se: CV calculado corretamente via metacampo `custom.cv` (se ausente → CV=0, sem fallback) e registrado no ledger.

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

## Sprint 3 — Rede Visual + Níveis ✅ CONCLUÍDO

**FRs cobertos:** FR-10, FR-11, FR-17 (parcial), FR-18, FR-19, FR-20

### Checklist (Aceite)
- [x] Rede N1/N2 consistente
- [x] Membro vê rede (completa)
- [x] Níveis calculados conforme regra do documento canônico
- [x] Checklist do próximo nível exibido
- [x] Privacidade de telefone (phone_visibility) implementada
- [x] CV próprio separado de CV da rede (FR-17) — ✅ Implementado Sprint 7

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

## Sprint 4 — Comissões + Ledger ✅ CONCLUÍDO

**FRs cobertos:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

### Checklist (Aceite)
- [x] Ledger imutável (auditável)
- [x] Cada valor tem origem (pedido/regra)
- [x] Reprocessamento seguro (sem duplicar)
- [x] Fast-Track calculado corretamente
- [x] Comissão Perpétua diferenciada por tipo de N1
- [x] Bônus 3 implementado
- [x] Leadership Bônus implementado
- [x] Royalty implementado
- [x] Dashboard de comissões (membro) funcionando
- [x] Painel admin de comissões funcionando

### Regras de Comissionamento (canônico: Biohelp___Loyalty_Reward_Program.md)

**Creatina Mensal Grátis (TBD-019 ✅ RESOLVIDO — Atualizado 11/02/2026):**
- [x] Membro Ativo (200 CV) tem direito a 1 creatina grátis/mês
- [x] Mecanismo: ~~Desconto 100% no pedido real~~ → **Cupom Individual Mensal**
- [x] Tabela `free_creatine_claims` controla uso mensal
- [x] API `/api/members/me/free-creatine` (GET/POST)
- [x] Card no dashboard mostra elegibilidade
- [x] Gerar cupom via Shopify Admin API (Discount Code — 100% OFF, 1 uso, validade mensal) ✅ `lib/shopify/coupon.ts`
- [x] Formato do cupom: `CREATINA-<NOME>-<MÊSANO>` (ex.: `CREATINA-MARIA-FEV2026`) ✅
- [x] Job mensal para gerar cupons para membros ativos ✅ `/api/cron/generate-creatine-coupons` (dia 2/mês, 05:00 UTC)
- [x] Dashboard mostra cupom gerado para o membro ✅ Card com código + botão copiar
- [x] Webhook detecta uso de cupom `CREATINA-*` e atualiza `free_creatine_claims` ✅
- [x] UNIQUE constraint em `free_creatine_claims(member_id, month_year)` ✅

**Fast-Track (primeiros 60 dias):**
- [x] N0 recebe 30% CV de N1 (primeiros 30 dias)
- [x] N0 recebe 20% CV de N1 (próximos 30 dias)
- [x] Líder N0 recebe 20%/10% CV de N2

**Comissão Perpétua:**
- [x] Parceira: 5% CV de clientes N1 (NÃO recebe de outras parceiras)
- [x] Líder: 7% CV da rede + 5% CV de clientes N1
- [x] Diretora: 10% CV da rede + 7% CV de Parceiras N1 + 5% CV de clientes N1
- [x] Head: 15% CV da rede + 10% CV de Líderes N1 + 7% CV de Parceiras N1 + 5% CV de clientes N1

**Bônus 3:**
- [x] 3 Parceiras Ativas em N1 por 1 mês → R$250
- [x] Cada N1 com 3 Parceiras Ativas → R$1.500
- [x] Cada N2 com 3 Parceiras Ativas → R$8.000

**Leadership Bônus:**
- [x] Diretora: 3% CV da rede
- [x] Head: 4% CV da rede

**Royalty:**
- [x] Head forma Head → recebe 3% CV da nova rede

### Cenário T-CM-01 — Fast-Track 30 dias
1) N0 traz N1 no dia 1
2) N1 compra R$100 (CV 50) no dia 15
3) N0 deve receber 30% = R$15 de comissão

✅ Passa se: Comissão calculada corretamente

### Cenário T-CM-02 — Transição Fast-Track → Perpétua
1) Após 60 dias do cadastro de N1
2) N1 compra R$100 (CV 50)
3) N0 (Parceira) deve receber 5% = R$2,50 de comissão (se N1 for cliente)

✅ Passa se: Sistema detecta fim do Fast-Track e aplica Perpétua

### Cenário T-CM-03 — Comissão Perpétua diferenciada
1) Parceira (N0) tem N1 que é Parceira
2) N1 compra R$100 (CV 50)
3) N0 NÃO deve receber comissão (Parceira não recebe de outras Parceiras)

✅ Passa se: Regra de tipo de N1 respeitada

---

## Sprint 5 — Saques + Fiscal ✅ CONCLUÍDO

**FRs cobertos:** FR-28, FR-29, FR-30, FR-31, FR-32, FR-33

### TBDs Resolvidos
- [x] TBD-015: Limite de saque PF = **R$ 1.000/mês**
- [x] TBD-016: Valor mínimo para saque = **R$ 100**
- [x] TBD-018: Integração fintech = **Asaas** (manual por enquanto)
- [x] TBD-021: Período de trava = **Net-15** (disponível 15 dias após virada do mês)

### Checklist (Aceite)
- [x] Solicitação de saque + estados
- [x] Validação PF (RPA) até R$ 1.000/mês
- [x] Validação PJ (NF-e) sem limite
- [x] Histórico de pagamentos
- [x] Saldo em análise (trava) separado — Net-15 implementado
- [x] Atualização de cadastro no momento do saque
- [x] Workflow de aprovação admin
- [x] Integração fintech Asaas (manual por enquanto)

### Regras de Saque (canônico)
- [x] Mínimo para saque: R$ 100
- [x] PF: até R$ 1.000/mês → Biohelp emite RPA, desconta impostos (~16%)
- [x] PJ (MEI): pode usar conta PF
- [x] PJ (outras): obrigatório conta PJ + NF-e antes do pagamento
- [x] Conta sempre em nome da parceira (não terceiros)
- [x] Net-15: comissões disponíveis 15 dias após virada do mês
- [x] Condições que invalidam comissão: chargeback, cancelamento, devolução

### Cenário T-SQ-01 — Saque PF válido
1) Parceira PF com R$500 de saldo disponível (após Net-15)
2) Solicita saque de R$300
3) Sistema gera RPA automaticamente
4) Transferência via PIX/Asaas

✅ Passa se: Saque processado com RPA

### Cenário T-SQ-02 — Saque PJ com NF-e
1) Parceira PJ com R$2.000 de saldo disponível
2) Solicita saque de R$1.500
3) Sistema exige upload de NF-e
4) Admin valida NF-e
5) Transferência autorizada

✅ Passa se: Saque bloqueado até NF-e válida

### Cenário T-SQ-03 — Limite PF excedido
1) Parceira PF já sacou R$800 no mês
2) Tenta sacar mais R$300 (total R$1.100)
3) Sistema deve bloquear ou exigir cadastro PJ

✅ Passa se: Limite de R$ 1.000/mês respeitado

### Cenário T-SQ-04 — Net-15 (comissão não disponível)
1) Parceira ganha comissão em 20/01
2) Tenta sacar em 25/01
3) Sistema mostra saldo como "pendente" (não disponível)
4) Em 15/02, saldo fica disponível

✅ Passa se: Comissão só disponível após 15 dias da virada do mês

---

## Sprint 6 — Admin Avançado + Regras Especiais ✅ CONCLUÍDO

**FRs cobertos:** FR-12, FR-34, FR-35, FR-36, FR-37, FR-38

### Checklist (Aceite)
- [x] Regra de 6 meses inativo implementada (FR-12)
- [x] Compressão de rede funciona sem quebrar integridade
- [x] Gestão de admins básica (FR-34) — multi-admin pendente
- [x] Dashboard global completo (FR-35) — API `/api/admin/stats`
- [x] Filtros por modo de comissionamento (FR-36)
- [x] Gestão completa de membro (FR-37)
- [x] Gestão de tags (FR-38)

### Cenário T-AD-01 — Regra de 6 meses inativo ✅
1) Membro fica 6 meses consecutivos sem atingir 200 CV
2) Cron job `/api/cron/network-compression` executa no dia 1
3) Sistema marca membro como `status = 'removed'`
4) Indicados do membro são movidos para o sponsor dele
5) Histórico registrado em `member_level_history`

✅ Passa se: Compressão funciona corretamente

### Cenário T-AD-02 — Dashboard global ✅
1) Admin chama `GET /api/admin/stats`
2) Recebe: membros (total, ativos, por nível), CV global, comissões por tipo
3) Recebe: saques pendentes e pagos
4) Pode filtrar comissões por tipo via `/api/admin/commissions?type=...`

✅ Passa se: KPIs corretos e filtros funcionando

### Cenário T-AD-03 — Gestão de membro ✅
1) Admin chama `GET /api/admin/members/[id]` — detalhes completos
2) Admin chama `PATCH /api/admin/members/[id]` com action:
   - `edit`: editar nome, telefone
   - `adjust_level`: mudar nível manualmente
   - `block` / `unblock`: bloquear/desbloquear
   - `adjust_commission`: ajustar comissão manualmente
3) Todas ações registradas em auditoria

✅ Passa se: Ações executadas e auditadas

### Cenário T-AD-04 — Gestão de tags ✅
1) Admin chama `GET /api/admin/members/[id]/tags` — lista tags
2) Admin chama `POST /api/admin/members/[id]/tags` — adiciona tag
3) Admin chama `DELETE /api/admin/members/[id]/tags?tag=...` — remove tag
4) Tags sincronizadas com Shopify Customer

✅ Passa se: Tags CRUD funcionando + sync Shopify

---

## Página de Vendas — Aceite

**Rota:** `/dashboard/sales`  
**API:** `GET /api/members/me/orders`  
**SDD:** `docs/sdd/features/sales-page/`

### Checklist (Aceite)
- [x] Página `/dashboard/sales` carrega corretamente
- [x] Cards de resumo mostram totais (pedidos, CV, rede)
- [x] Aba "Minhas Compras" exibe pedidos próprios do membro
- [x] Aba "Vendas da Rede" exibe pedidos dos indicados N1
- [x] Clique em pedido expande e mostra itens com CV por item
- [x] Status dos pedidos (Pago/Reembolsado/Cancelado) visualmente distintos
- [x] Empty state quando não há pedidos
- [x] Link do sidebar atualizado para `/dashboard/sales`
- [x] Design consistente com páginas existentes (dark theme)
- [x] Build sem erros

---

## Critérios de Aceite do Projeto (macro)

**Do documento de escopo formal:**

1. ✅ Cadastro com link cria membro, vincula rede e libera preço de membro na Shopify
2. ✅ Painel do membro mostra CV (próprio e rede), status, nível, saldo e detalhamento por comissão
   - CV próprio vs rede separado (Sprint 7 - FR-17)
3. ✅ Admin visualiza KPIs globais, busca membros e executa ações administrativas com auditoria
   - Dashboard global completo (Sprint 6 - FR-35)
4. ✅ Webhooks de pedidos atualizam CV e comissões com idempotência
5. ✅ Rotina mensal de reset executa corretamente e é auditável
6. ✅ Fluxo de saque funciona com regras de CPF/PJ e anexos obrigatórios (Sprint 5)

---

## Progresso Geral

| Sprint | FRs | Implementados | Parciais | Pendentes | % Completo |
|--------|-----|---------------|----------|-----------|------------|
| Sprint 1 | 9 | 9 | 0 | 0 | 100% |
| Sprint 2 | 4 | 4 | 0 | 0 | 100% |
| Sprint 3 | 5 | 5 | 0 | 0 | 100% |
| Sprint 4 | 7 | 7 | 0 | 0 | 100% |
| Sprint 5 | 6 | 5 | 1 | 0 | 92% |
| Sprint 6 | 6 | 5 | 1 | 0 | 92% |
| Sprint 7 | 2 | 2 | 0 | 0 | 100% |
| **Total** | **38** | **37** | **2** | **0** | **98%** |

---

**Última atualização:** 11/02/2026
