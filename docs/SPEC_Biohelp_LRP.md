# SPEC.md — Biohelp Loyalty Reward Program (LRP)
**Spec-Driven Development (SDD) / Documento Mestre do Projeto**  
**Stack:** Next.js (App Router) + Supabase (Postgres/Auth/RLS) + Shopify (Admin API + Webhooks)  
**Versão:** v4.0 (SDD)  
**Status:** Base para execução (contrato/escopo)  
**Owner:** Biohelp  
**Implementador:** (Seu time)  
**Última atualização:** 11/02/2026

> **Regra de ouro do SDD:** qualquer mudança relevante neste SPEC.md (regras, fluxos, campos, endpoints, critérios de aceite) **é mudança de escopo** e deve passar por aprovação do cliente antes de implementar.

---

## 0) Objetivo do produto
Criar um programa de fidelidade/relacionamento que permita:
1) **Cadastro de membros** com indicação (link/ref) e sem link (regra definida),  
2) **Vínculo de rede** (sponsor/indicação),  
3) **Sincronização com Shopify** (criar/atualizar customer + tags/metacampos) para habilitar a experiência de "membro" na loja,  
4) **CV mensal**, **status ativo/inativo**, **níveis**, **comissões** e **saques**.

---

## 1) Mapeamento de Requisitos Funcionais (FRs)

Esta seção mapeia todos os FRs do documento de escopo formal (`Biohelp_LRP_Escopo_Projeto_v1.md`) para os sprints correspondentes.

### 1.1 Matriz de FRs por Sprint

| FR | Descrição | Sprint | Status |
|----|-----------|--------|--------|
| **FR-01** | Autenticação de membro | Sprint 1 | ✅ Implementado |
| **FR-02** | Autenticação de admin | Sprint 1 | ✅ Implementado |
| **FR-03** | Controle de permissões (RBAC) | Sprint 1 | ✅ Implementado |
| **FR-04** | Cadastro de novo membro | Sprint 1 | ✅ Implementado |
| **FR-05** | Captura de link de indicação | Sprint 1 | ✅ Implementado |
| **FR-06** | Regra para cadastro sem link | Sprint 1 | ⏳ TBD-001 ✅ Decidido (House Account) — implementação pendente |
| **FR-07** | Geração de link único | Sprint 1 | ✅ Implementado |
| **FR-08** | Ativação de preço de membro | Sprint 1 | ✅ Implementado (via tags) |
| **FR-09** | Persistência da rede | Sprint 1 | ✅ Implementado |
| **FR-10** | Visualização da rede no painel do membro | Sprint 3 | ✅ Implementado |
| **FR-11** | Visualização da rede no painel admin | Sprint 3 | ✅ Implementado |
| **FR-12** | Regra de saída após 6 meses inativo | Sprint 6 | ⏳ Pendente |
| **FR-13** | Receber eventos de pedidos (Webhooks) | Sprint 2 | ✅ Implementado |
| **FR-14** | Cálculo de CV por pedido | Sprint 2 | ✅ Implementado |
| **FR-15** | Status Ativo/Inativo mensal | Sprint 2 | ✅ Implementado |
| **FR-16** | Reset mensal | Sprint 2 | ✅ Implementado |
| **FR-17** | Separação de CV (próprio vs rede) | Sprint 3 | ⚠️ Parcial |
| **FR-18** | Recalcular nível automaticamente | Sprint 3 | ✅ Implementado |
| **FR-19** | Status 'Líder em Formação' (90 dias) | Sprint 3 | ✅ Implementado |
| **FR-20** | Rebaixamento automático | Sprint 3 | ✅ Implementado |
| **FR-21** | Ledger de comissões | Sprint 4 | ✅ Implementado |
| **FR-22** | Fast-Track | Sprint 4 | ✅ Implementado |
| **FR-23** | Comissão Perpétua | Sprint 4 | ✅ Implementado |
| **FR-24** | Bônus 3 | Sprint 4 | ✅ Implementado |
| **FR-25** | Leadership Bônus | Sprint 4 | ✅ Implementado |
| **FR-26** | Royalty | Sprint 4 | ✅ Implementado |
| **FR-27** | Detalhamento por tipo de comissão | Sprint 4 | ✅ Implementado |
| **FR-28** | Saldo em análise (trava) | Sprint 5 | ✅ Implementado (Net-15) |
| **FR-29** | Solicitação de saque | Sprint 5 | ✅ Implementado |
| **FR-30** | Upload e validação de NF-e | Sprint 5 | ✅ Implementado |
| **FR-31** | Emissão de RPA (CPF) | Sprint 5 | ✅ Implementado |
| **FR-32** | Workflow de aprovação | Sprint 5 | ✅ Implementado |
| **FR-33** | Integração de pagamento automático | Sprint 5 | ⚠️ Parcial (Asaas definido, aguarda credenciais) |
| **FR-34** | Gestão de admins | Sprint 6 | ⏳ Pendente |
| **FR-35** | Dashboard global | Sprint 6 | ⚠️ Parcial |
| **FR-36** | Filtros por modo de comissionamento | Sprint 6 | ⏳ Pendente |
| **FR-37** | Gestão de membro (editar/ajustar/bloquear/mover) | Sprint 6 | ⚠️ Parcial |
| **FR-38** | Gestão de tags | Sprint 6 | ⏳ Pendente |

**Legenda:**
- ✅ Implementado e testado
- ⚠️ Parcialmente implementado
- ⏳ Pendente/Planejado
- ❌ Bloqueado (aguardando TBD)

---

## 2) Escopo por fases (controle do projeto)

### 2.1 Sprint 1 (MVP Operacional Inicial) ✅ CONCLUÍDO
**Entrega:** "Cadastre, vire membro, convide, compre como membro."

**FRs cobertos:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06 (parcial), FR-07, FR-08, FR-09

**Inclui:**
- Cadastro com link (`ref` + UTM)
- Regra de cadastro sem link (TBD-001 ✅ House Account — implementação pendente)
- Geração de `ref_code` e link de convite
- Auth (Supabase)
- Dashboard do membro v1 (mínimo)
- Admin mínimo (listar/buscar membro, ver sponsor, resync Shopify)
- Sync Shopify Customer (create/update + tags mínimas)
- Redirect pós-cadastro para fluxo Shopify (login/conta)

**Não inclui:** CV, níveis, comissões, saques, árvore avançada, BI.

### 2.2 Sprint 2 (CV + status) ✅ CONCLUÍDO
**Entrega:** "Membro compra → CV é calculado → Status muda para 'active' se CV >= 200 no mês"

**FRs cobertos:** FR-13, FR-14, FR-15, FR-16

**Inclui:**
- Webhooks Shopify (paid/refund/cancel)
- Cálculo de CV por item/pedido (via metafield do produto)
- CV mensal + status (>= 200 CV/mês)
- Job de fechamento mensal
- Dashboard com progresso de CV
- Ajuste manual de CV pelo admin
- Ledger de CV auditável

### 2.3 Sprint 3 (Rede visual + níveis) ✅ CONCLUÍDO
**Entrega:** "Membro visualiza sua rede completa + vê seu nível atual + progresso para próximo nível"

**FRs cobertos:** FR-10, FR-11, FR-17 (parcial), FR-18, FR-19, FR-20

**Inclui:**
- Visualização da rede (árvore completa)
- Cálculo de níveis conforme regras do documento canônico
- Privacidade de telefone (phone_visibility)
- Progresso para próximo nível com requisitos

**Regras de Níveis (canônico: Biohelp___Loyalty_Reward_Program.md):**

| Nível | Requisitos |
|-------|------------|
| **Membro** | Cliente cadastrada |
| **Parceira** | Membro Ativo + CV_rede >= 500 (inclui próprio membro) |
| **Líder em Formação** | Parceira que trouxe sua primeira Parceira em N1 (janela de 90 dias) |
| **Líder** | Parceira Ativa (N0) + 4 Parceiras Ativas em N1 |
| **Diretora** | N0 com mínimo 3 Líderes Ativas em N1 + 80.000 CV na rede |
| **Head** | N0 com mínimo 3 Diretoras Ativas em N1 + 200.000 CV na rede |

### 2.4 Sprint 4 (Comissões + ledger) ✅ CONCLUÍDO
**Entrega:** "Motor de comissões com ledger auditável"

**FRs cobertos:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

**Inclui:**
- Ledger auditável e motor de comissões faseado
- **Fast-Track (primeiros 60 dias):**
  - N0 recebe 30% CV de N1 (primeiros 30 dias), 20% (próximos 30 dias)
  - Líder N0 recebe 20%/10% CV de N2 (mesma regra de tempo)
- **Comissão Perpétua (após Fast-Track):**
  - Parceira: 5% CV de clientes N1 (NÃO recebe de outras parceiras)
  - Líder: 7% CV da rede + 5% CV de clientes N1
  - Diretora: 10% CV da rede + 7% CV de Parceiras N1 + 5% CV de clientes N1
  - Head: 15% CV da rede + 10% CV de Líderes N1 + 7% CV de Parceiras N1 + 5% CV de clientes N1
- **Bônus 3:**
  - 3 Parceiras Ativas em N1 por 1 mês → R$250
  - Cada N1 com 3 Parceiras Ativas → R$1.500
  - Cada N2 com 3 Parceiras Ativas → R$8.000
- **Leadership Bônus:**
  - Diretora: 3% CV da rede
  - Head: 4% CV da rede
- **Royalty (Head forma Head):**
  - Head N0 forma Head N1 → rede N1 separa, N0 recebe 3% CV da nova rede
  - Separação não faz N0 perder status de Head

### 2.5 Sprint 5 (Saques + fiscal) ✅ CONCLUÍDO
**Entrega:** "Parceira pode solicitar saque com regras fiscais"

**FRs cobertos:** FR-28, FR-29, FR-30, FR-31, FR-32, FR-33

**TBDs resolvidos:**
- ✅ TBD-015: Limite de saque PF = **R$ 1.000/mês**
- ✅ TBD-016: Valor mínimo para saque = **R$ 100/saque**
- ✅ TBD-018: Integração fintech = **Asaas** (aguarda credenciais)
- ✅ TBD-021: Período de trava = **Net-15** (disponível 15 dias após virada do mês)

**Inclui:**
- Solicitação de saque no painel
- Validação de saldo disponível
- **Regras de Saque:**
  - Mínimo para saque: **R$ 100,00**
  - PF: até **R$ 1.000/mês** → Biohelp emite RPA, desconta impostos
  - PJ (MEI): pode usar conta PF
  - PJ (outras): obrigatório conta PJ + NF-e antes do pagamento
  - Conta sempre em nome da parceira (não terceiros)
- **Fluxo de Saque:**
  - Parceira solicita saque no painel
  - Sistema valida saldo disponível
  - Se PF: gera RPA automaticamente
  - Se PJ: valida NF-e enviada
  - Transferência via integração **Asaas** (PIX/TED)
- **Saldo em análise (Net-15):**
  - Comissões ficam disponíveis 15 dias após a virada do mês
  - Exemplo: Comissões de dezembro disponíveis em 15 de janeiro
  - **Condições que cancelam comissão:** Chargeback, Cancelamento, Devolução
- **Auditoria:** Histórico completo de pagamentos
- **Atualização de cadastro:** Parceira deve atualizar dados no momento do saque

### 2.6 Sprint 6 (Admin avançado + regras especiais) ⏳ PENDENTE
**Entrega:** "Admin completo + regras de saída da rede"

**FRs cobertos:** FR-12, FR-34, FR-35, FR-36, FR-37, FR-38

**Inclui:**
- **FR-12 - Regra de saída após 6 meses inativo:**
  - Após 6 meses sem se ativar, membro perde totalmente o status
  - Membro sai da rede
  - Rede abaixo sobe um nível (compressão)
  - Compressão não quebra integridade (sem ciclos; sem órfãos)
- **FR-34 - Gestão de admins:**
  - Admin pode cadastrar outros admins
  - Definição de permissões
- **FR-35 - Dashboard global:**
  - Membros cadastrados
  - Membros ativos
  - Pessoas por nível
  - CV global
  - Comissão global
- **FR-36 - Filtros por modo de comissionamento:**
  - Fast-Track
  - Perpétua
  - Bônus 3
  - Leadership
- **FR-37 - Gestão de membro:**
  - Editar dados
  - Ajustar CV/comissão
  - Ajustar nível
  - Bloquear membro
  - Trocar membro de rede
- **FR-38 - Gestão de tags:**
  - Dar/alterar/remover tags
  - Usar tags como filtro
  - Refletir tags na Shopify

### 2.7 Sprint 7 (Creatina Mensal + Melhorias) ⚠️ PARCIAL
**Entrega:** "Benefícios adicionais para membros ativos"

**FRs cobertos:** TBD-019 ✅

**Inclui:**
- **Creatina Mensal Grátis:** Todo Membro Ativo (200 CV) recebe creatina mensal ✅
- **Mecanismo (TBD-019 RESOLVIDO):** Desconto de 100% no pedido real
  - Membro adiciona creatina ao carrinho
  - Sistema verifica elegibilidade (CV >= 200, não usou no mês)
  - Desconto aplicado automaticamente (1 unidade/mês)
  - Tabela `free_creatine_claims` controla uso mensal
  - API `/api/members/me/free-creatine` para verificação
  - Card no dashboard mostra status do benefício

---

## 3) Perfis de usuário e permissões

### 3.1 Member (Membro)
**FR-01, FR-03**
- Pode: cadastrar-se, logar, ver seu link/ref, ver sponsor, ver status, ver CV/nível/comissões, solicitar saque (fase futura).
- Não pode: ver dados de outros membros fora de sua rede permitida; não pode alterar rede; não pode acessar admin.

### 3.2 Admin (Operação Biohelp)
**FR-02, FR-03**
- Pode: listar/buscar membros, ver sponsor e ref_code, reprocessar sync Shopify, ver logs básicos, ajustar status, revisar saques.
- Não pode (até Sprint 6): "mover rede" ou fazer ações manuais destrutivas sem trilha de auditoria.

**Critérios de aceite (FR-01, FR-02, FR-03):**
- Usuários não autenticados não acessam rotas protegidas
- Admin não enxerga telas de membro como membro (a não ser em modo 'visualizar como')
- Logs/auditoria para ações administrativas relevantes

---

## 4) Conceitos e definições

### 4.1 Rede (Referral Tree)
**FR-09**
- Cada membro tem **0 ou 1 sponsor** (quem indicou).
- Um sponsor pode ter vários indicados (N1).
- Profundidade: N2, N3... (ilimitado, com limite técnico de 20 níveis).
- N0 é o topo de uma rede qualquer; N1 é primeiro nível abaixo; N2 é segundo nível.
- Cada membro é N0 de sua própria rede, independente de quantos níveis acima existam.

### 4.2 ref_code
**FR-07** | **TBD-006 ✅ RESOLVIDO**
- Código único do membro usado no link de indicação.
- Deve ser **imutável** após criado.
- **Formato padrão:** Código alfanumérico sequencial — `BH` + 5 dígitos (ex.: `BH00001`, `BH00002`)
- **Override pelo admin:** Admin pode customizar manualmente (ex.: `MARIA2026`), com validação de unicidade
- ~~Formato antigo: UUID curto (ex.: `abc123xy`)~~ — membros existentes mantêm código atual

### 4.3 CV (Commission Volume)
**FR-14** | **TBD-014 ✅ RESOLVIDO**
- Pontuação associada aos produtos/pedidos.
- **1 CV = R$ 1,00** (mas CV ≠ preço do produto)
- **CV do item = valor do metafield `custom.cv` do produto**
- **Se metafield `custom.cv` não existir → CV = 0** (zero). Logar warning `missing_cv_metafield`.
- ~~Fallback: se não houver metacampo, usar preço do item~~ — **REMOVIDO** (decisão 11/02/2026)
- Medida mensal: soma do mês corrente.
- Regra principal: **Ativa se CV >= 200 no mês**.
- **Fonte canônica:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`
  - Ex: Lemon Dreams (R$159) → CV 77

**Implementação técnica — obtenção do CV:**
- O webhook `orders/paid` do Shopify **não inclui metafields** dos produtos no payload.
- Solução: ao receber o webhook, o sistema faz chamada extra à **Shopify REST API** (`GET /products/{id}/metafields.json?namespace=custom&key=cv`) para cada produto do pedido.
- Os CVs são obtidos via `fetchProductCVsBatch()` e injetados nos itens antes do cálculo.
- Implementado em: `lib/shopify/customer.ts` (funções `fetchProductCV` e `fetchProductCVsBatch`) e `app/api/webhooks/shopify/orders/paid/route.ts`.

### 4.4 Status (Ativa/Inativa)
**FR-15**
- **Estados definidos:**
  - `pending` = recém-cadastrada / antes de qualquer ciclo
  - `active` = CV mensal >= 200
  - `inactive` = CV mensal < 200 (pós-ciclo / regra padrão)
- Atualizado mensalmente via job de fechamento.
- No fechamento mensal: se CV < 200, status = `inactive` (não `pending`)
- Refunds e cancelamentos podem impactar CV/status.
- **Fonte canônica:** "Quando o mês termina, esse valor deve ser zerado e a tag deve mudar para Inativo"

### 4.5 Regras de Níveis
**FR-18, FR-19, FR-20**

| Nível | Requisitos |
|-------|------------|
| **Membro** | Cliente cadastrada |
| **Parceira** | Membro Ativo + CV_rede >= 500 (inclui próprio membro) |
| **Líder em Formação** | Parceira que trouxe sua primeira Parceira em N1 (janela de 90 dias para atingir Líder) |
| **Líder** | Parceira Ativa (N0) + 4 Parceiras Ativas em N1 |
| **Diretora** | N0 com mínimo 3 Líderes Ativas em N1 + 80.000 CV na rede |
| **Head** | N0 com mínimo 3 Diretoras Ativas em N1 + 200.000 CV na rede |

**Regras de perda de nível (FR-20):**
- Se requisitos deixam de ser atendidos, a Parceira desce de cargo
- Líder perde status se não mantiver 4 Parceiras ativas em N1
- Após 6 meses sem se ativar, perde totalmente o status e sai da rede (FR-12)
- Quando sai da rede, sua rede abaixo sobe e fica sob quem estava acima

**Regra especial - Líder em Formação (FR-19):**
- Recebe bônus como Líder por 90 dias
- Se não atingir requisitos de Líder após 90 dias, volta a comissão de Parceira

---

## 5) Regras de negócio detalhadas

### 5.1 Cadastro com link (ref)
**FR-04, FR-05**

**Entrada:** `ref=<ref_code>` (obrigatório para "cadastro com link") + UTM opcionais.  
**Regra:**
- Se `ref` existe e está válido → sponsor = membro dono do ref_code.
- Se `ref` inválido → tratar como **cadastro sem link** (seguir regra TBD-001) e registrar evento.

**Critérios de aceite:**
- Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail)
- Link do membro funciona e atribui corretamente a hierarquia (parent/child)
- Acesso a preço de membro funciona para o e-mail cadastrado

### 5.2 Cadastro sem link (TBD-001 ✅ RESOLVIDO)
**FR-06**

**Decisão (11/02/2026):** ✅ **Opção A — House Account**

**Regra:**
- Cadastro sem link (`/join` sem `?ref=`) → `sponsor_id` = House Account (conta raiz da empresa)
- Comissões de compras desse membro vão para a empresa (Biohelp)
- ~~Bloquear com mensagem "cadastro indisponível sem convite"~~ — **REMOVIDO**

**Implementação:**
- Criar membro especial "Biohelp House" (conta raiz, não aparece em listagens normais)
- Se `ref` ausente ou inválido → `sponsor_id = house_account.id`
- Evento registrado em `referral_events` com `ref_code_used = null`

### 5.3 Unicidade de membro
**FR-04**
- Um e-mail só pode ter 1 membro.
- Se tentar cadastrar com e-mail existente: direcionar para login.

### 5.4 Shopify sync (customer + tags)
**FR-04, FR-08**

- Ao cadastrar (ou re-sincronizar), garantir:
  - Customer existe (create/update)
  - Tags mínimas aplicadas
  - (Opcional) Metacampos mínimos

**Tags finais (TBD-003 ✅ RESOLVIDO — 11/02/2026):**
- `lrp_member` — identifica como membro do programa
- `lrp_ref:<ref_code>` — código de referência do membro
- `lrp_sponsor:<sponsor_ref_code|none>` — código de quem indicou
- `lrp_status:pending|active|inactive` — status atual
- `nivel:<nivel>` — **NOVA** — nível do membro no programa

**Valores da tag `nivel:`:**
- `nivel:membro`
- `nivel:parceiro`
- `nivel:lider`
- `nivel:diretor`
- `nivel:head`

**Regra:** Quando o nível do membro muda, a tag `nivel:` deve ser atualizada na Shopify automaticamente.

### 5.5 Redirect pós-cadastro
**FR-04**
- Após finalizar cadastro e sync Shopify, direcionar usuário para:
  - Página de login/conta da Shopify (conforme URL definida pelo cliente)

### 5.6 Visualização da rede
**FR-10, FR-11**

**Critérios de aceite:**
- Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós)
- Compressão não quebra integridade (sem ciclos; sem órfãos)
- Admin consegue buscar membro e abrir a rede completa

**Campos visíveis:**
- Nome completo
- Email
- CV do indicado
- Status (ativo/inativo)
- Nível do indicado
- Quantidade de indicados

**Telefone (privacidade):**
- `public`: visível para toda a rede
- `network`: visível apenas para sponsor e N1
- `private`: não visível

### 5.7 Separação de CV (próprio vs rede)
**FR-17**

No painel do membro, exibir:
- CV de compras próprias (separado)
- CV gerado pela rede (separado)
- CV total

**Status:** ⚠️ Parcialmente implementado - dashboard mostra CV total, mas não separa próprio vs rede

### 5.8 Regra de saída após 6 meses inativo
**FR-12**

- Após 6 meses sem se ativar, membro perde totalmente o status
- Membro sai da rede
- Rede abaixo sobe um nível (compressão)
- Compressão não quebra integridade (sem ciclos; sem órfãos)

**Status:** ⏳ Pendente (Sprint 6)

---

## 6) Regras de Comissionamento

### 6.1 Creatina Mensal Grátis ✅ (Atualizado 11/02/2026)
**TBD-019 — RESOLVIDO**
- Todo Membro Ativo (200 CV) recebe 1 creatina grátis por mês
- **Mecanismo (atualizado):** Cupom Individual Mensal
- **Regras:**
  - Membro deve estar ativo (CV >= 200 no mês)
  - Limite: 1 unidade por mês
  - Não acumula para o próximo mês
  - Sistema gera **código de cupom exclusivo** para cada membro ativo
  - Cupom válido apenas no mês de geração
  - Formato: `CREATINA-<NOME>-<MÊSANO>` (ex.: `CREATINA-MARIA-FEV2026`)
- **Controle:** Tabela `free_creatine_claims` registra uso
- **Geração:** Cupom criado via Shopify Admin API (Discount Code — 100% OFF, 1 uso, validade mensal)
- **API:** `GET/POST /api/members/me/free-creatine` (retorna cupom do mês)
- **UI:** Card no dashboard mostra cupom gerado para o membro
- **Motivo da escolha:** Mais simples, mais barato, não exige Shopify Functions

### 6.2 Fast-Track
**FR-22**

Quando uma Parceira (N0) traz um novo membro via link:
- **Primeiros 30 dias:** N0 recebe 30% do CV sobre compras de N1
- **Dias 31-60:** N0 recebe 20% do CV sobre compras de N1

Para Líder (N0):
- **Primeiros 30 dias:** Recebe 20% do CV sobre compras de N2
- **Dias 31-60:** Recebe 10% do CV sobre compras de N2
- Continua recebendo 30%/20% dos membros N1 que ela mesma trouxer

**Critérios de aceite:**
- Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito
- Cálculos são reprocessáveis sem duplicação (ledger com idempotência)
- Telas mostram totals e detalhamento consistente com o ledger

### 6.3 Comissão Perpétua
**FR-23**

Se a N0 estiver recebendo Fast-Track de uma N1, só passa a receber a Comissão Perpétua dessa N1 após terminar o período de 60 dias do Fast-Track.

| Nível do Sponsor (N0) | Tipo de N1 | Percentual |
|----------------------|------------|------------|
| Parceira | Cliente | 5% |
| Parceira | Parceira+ | **0%** (não recebe) |
| Líder / Líder em Formação | Cliente | 5% |
| Líder / Líder em Formação | Parceira+ | 7% |
| Diretora | Cliente | 5% |
| Diretora | Parceira | 7% |
| Diretora | Líder+ | 10% |
| Head | Cliente | 5% |
| Head | Parceira | 7% |
| Head | Líder | 10% |
| Head | Rede (fallback) | 15% |

### 6.4 Bônus 3
**FR-24**

| Marco | Condição | Valor |
|-------|----------|-------|
| Bônus 1 | Rede com 3 Parceiras Ativas (N1). Se a rede se mantiver ativa no mês seguinte. | R$ 250,00 |
| Bônus 2 | Cada uma das 3 Parceiras Ativas (N1) tem por sua vez 3 Parceiras ativas abaixo (N2). | R$ 1.500,00 |
| Bônus 3 | Cada uma das 9 Parceiras Ativas (N2) tem por sua vez 3 Parceiras ativas abaixo (N3). | R$ 8.000,00 |

**Observação:** Toda a rede deve estar ativa para receber a bonificação. Pode ocorrer em vários meses quando completados os requisitos mínimos.

### 6.5 Leadership Bônus
**FR-25**
- Diretora recebe 3% do CV de sua rede como Leadership Bônus
- Head recebe 4% do CV de sua rede como Leadership Bônus

### 6.6 Royalty
**FR-26**

- Se uma Head (N0) formar outra Head (N1), a rede da nova Head (N1) deixa de fazer parte da rede antiga
- Mesmo assim, a Head (N0) passa a receber 3% do CV da nova rede (Royalty)
- Se essa separação fizer a Head (N0) não atender mais aos requisitos para ser Head, isso NÃO faz ela deixar de ser Head

---

## 7) Regras de Saque

### 7.1 Solicitação de saque
**FR-29**

- Parceira solicita saque do saldo disponível
- Sistema exige atualização de cadastro no momento do saque
- Conta para recebimento deve ser sempre em nome da parceira (não terceiros)

### 7.2 Regras por tipo de pessoa
**FR-30, FR-31**

| Tipo | Regra |
|------|-------|
| **CPF (PF)** | Até R$ 1.000/mês. Biohelp emite RPA automaticamente, desconta impostos (~16%) |
| **MEI** | Pode usar conta PF |
| **Outras PJ** | Obrigatório conta PJ + NF-e antes do pagamento |

**Valor mínimo para saque:** R$ 100

### 7.3 Saldo em análise (trava) — Net-15
**FR-28**

- Comissões ficam disponíveis **15 dias após a virada do mês** (Net-15)
- Exemplo: comissões de dezembro ficam disponíveis em 15 de janeiro
- Campo `available_at` na `commission_ledger` controla a data de disponibilidade
- **Condições que invalidam uma comissão:**
  - Chargeback
  - Cancelamento do pedido
  - Devolução/reembolso

### 7.4 Workflow de aprovação
**FR-32**

- Admin aprova/rejeita solicitações com motivo e histórico
- Registrar status do saque e logs de pagamento

### 7.5 Integração de pagamento
**FR-33**

- Integração com **Asaas** para realizar transferência após aprovação
- Modo atual: manual (admin processa via painel Asaas)
- Futuro: integração automática via API Asaas

**Critérios de aceite (FR-29 a FR-33):**
- Não permitir saque para conta em nome de terceiros
- Bloquear saque acima das regras sem documento obrigatório
- Registrar status do saque e logs de pagamento

---

## 8) Painel do Admin

### 8.1 Gestão de admins
**FR-34**
- Admin pode cadastrar outros admins e definir permissões

### 8.2 Dashboard global
**FR-35**
- Exibir membros cadastrados, ativos, pessoas por nível, CV global e comissão global

### 8.3 Filtros por modo de comissionamento
**FR-36**
- Permitir filtrar KPIs por fast-track, perpétua, bônus 3 e leadership

### 8.4 Gestão de membro
**FR-37**
- Admin pode editar dados, ajustar CV/comissão, ajustar nível, bloquear e trocar membro de rede

### 8.5 Gestão de tags
**FR-38**
- Admin pode dar/alterar/remover tags e usar tags como filtro
- Refletir tags na Shopify quando aplicável

**Critérios de aceite (FR-34 a FR-38):**
- Ações manuais ficam registradas em auditoria
- Filtros retornam resultados consistentes com o ledger e rede

---

## 9) Fluxos do usuário

### 9.1 Fluxo: cadastro com link
1) Usuário abre link: `/join?ref=XXXX&utm_source=...`
2) Preenche nome + e-mail + senha
3) Sistema cria member e vincula sponsor
4) Sistema cria/atualiza customer Shopify e aplica tags
5) Sistema loga usuário (Supabase Auth) e leva para `/dashboard`
6) Dashboard mostra link de convite e instruções para compra
7) CTA: "Ir para a loja" (redirect para Shopify)

### 9.2 Fluxo: login
1) Usuário acessa `/login`
2) Autentica via Supabase
3) Vai para `/dashboard`

### 9.3 Fluxo: admin busca membro
1) Admin acessa `/admin`
2) Busca por e-mail
3) Vê sponsor/ref_code
4) Clica "Resync Shopify"

---

## 10) Rotas e páginas (Next.js App Router)

### 10.1 Públicas
- `GET /` → redirect 302 para `/login` (TBD-007 ✅ RESOLVIDO — manter como está)
- `GET /join` (cadastro)
- `GET /login` (login)

### 10.2 Autenticadas (member)
- `GET /dashboard`
- `GET /dashboard/network`
- `GET /dashboard/commissions`

### 10.3 Autenticadas (admin)
- `GET /admin`
- `GET /admin/members/[id]` (detalhe do membro)
- `GET /admin/commissions`

---

## 11) API interna (Next.js) — endpoints

### 11.1 POST `/api/members/join`
**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "ref": "string | null",
  "utm": { "source": "string?", "medium": "string?", "campaign": "string?", "content": "string?", "term": "string?" }
}
```
**Regras:**
- valida e-mail único
- resolve sponsor_id via ref (ou regra sem link)
- cria member + referral_event
- cria/atualiza customer na Shopify e aplica tags
- retorna `{ "ok": true, "redirect": "/dashboard" }`

**Erros:**
- `409 EMAIL_EXISTS`
- `400 INVALID_REF` (se optar por bloquear sem link)
- `500 SHOPIFY_SYNC_FAILED` (com retry manual via admin)

### 11.2 POST `/api/admin/members/:id/resync-shopify`
- Reaplica tags/metacampos e revalida customer

### 11.3 POST `/api/webhooks/shopify/orders/paid`
- Handler de webhooks com idempotência
- **Busca metafield `custom.cv` de cada produto via Shopify REST API** (webhook não inclui metafields)
- Calcula CV e comissões com CVs obtidos da API

### 11.4 POST `/api/webhooks/shopify/orders/refunded`
- Reverte CV e comissões

### 11.5 POST `/api/webhooks/shopify/orders/cancelled`
- Reverte CV e comissões

### 11.6 GET `/api/members/me/cv`
- CV do membro autenticado

### 11.7 GET `/api/members/me/network`
- Rede do membro autenticado

### 11.8 GET `/api/members/me/level`
- Nível e progresso do membro

### 11.9 GET `/api/members/me/commissions`
- Resumo de comissões do membro

### 11.10 POST `/api/cron/close-monthly-cv`
- Job de fechamento mensal

---

## 12) Integração Shopify

### 12.1 Credenciais e segurança
- Usar Admin API token em variáveis de ambiente no backend.
- Nunca expor token no client.

### 12.2 Operações
- Customer: create/update por e-mail
- Tags: aplicar padrão definido neste SPEC
- Webhooks: orders/paid, orders/refunded, orders/cancelled

### 12.3 Webhooks
- Assinar webhooks para eventos de pedido e reembolso
- Implementar idempotência e logs
- Validação HMAC obrigatória

---

## 13) Banco de dados (Supabase/Postgres)

### 13.1 Tabela `members`
- `id` uuid (pk)
- `name` text
- `email` text unique
- `ref_code` text unique (imutável)
- `sponsor_id` uuid nullable (fk -> members.id)
- `status` text default 'pending'
- `level` text default 'membro'
- `phone` text nullable
- `phone_visibility` text default 'private'
- `cv_current_month` decimal default 0
- `lider_formacao_started_at` timestamptz nullable
- `created_at` timestamptz default now()

### 13.2 Tabela `referral_events`
- `id` uuid pk
- `member_id` uuid fk
- `ref_code_used` text nullable
- `utm_json` jsonb nullable
- `created_at` timestamptz default now()

### 13.3 Tabela `shopify_customers`
- `id` uuid pk
- `member_id` uuid unique fk
- `shopify_customer_id` text
- `last_sync_at` timestamptz
- `last_sync_status` text ('ok'|'failed')
- `last_sync_error` text nullable

### 13.4 Tabela `roles`
- `id` uuid pk
- `member_id` uuid unique fk
- `role` text ('member'|'admin')

### 13.5 Tabela `orders`
- `id` uuid pk
- `member_id` uuid fk
- `shopify_order_id` text unique
- `status` text
- `total_cv` decimal
- `created_at` timestamptz

### 13.6 Tabela `order_items`
- `id` uuid pk
- `order_id` uuid fk
- `product_id` text
- `cv_value` decimal
- `quantity` integer

### 13.7 Tabela `cv_ledger`
- `id` uuid pk
- `member_id` uuid fk
- `cv_type` text
- `cv_value` decimal
- `reference_id` uuid nullable
- `created_at` timestamptz

### 13.8 Tabela `cv_monthly_summary`
- `id` uuid pk
- `member_id` uuid fk
- `year_month` text
- `total_cv` decimal
- `status` text

### 13.9 Tabela `commission_ledger`
- `id` uuid pk
- `member_id` uuid fk
- `commission_type` text
- `amount` decimal
- `cv_base` decimal
- `percentage` decimal
- `source_order_id` uuid nullable
- `source_member_id` uuid nullable
- `created_at` timestamptz

### 13.10 Tabela `commission_balances`
- `id` uuid pk
- `member_id` uuid unique fk
- `total_earned` decimal
- `available_balance` decimal
- `pending_balance` decimal
- `fast_track_month` decimal
- `perpetual_month` decimal
- `bonus3_month` decimal
- `leadership_month` decimal
- `royalty_month` decimal

### 13.11 Tabela `fast_track_windows`
- `id` uuid pk
- `sponsor_id` uuid fk
- `member_id` uuid fk
- `phase_1_ends_at` timestamptz
- `phase_2_ends_at` timestamptz
- `created_at` timestamptz

### 13.12 (Fases futuras)
- `payout_requests`
- `payout_documents`
- `member_level_history`

---

## 14) Políticas RLS (Supabase)

### 14.1 members
- Member só pode ler seu próprio registro.
- Admin pode ler todos.

### 14.2 shopify_customers
- Member só pode ler seu próprio.
- Admin pode ler todos.

### 14.3 roles
- Apenas admin pode ler/alterar.

### 14.4 orders, order_items
- Member pode ler apenas seus próprios pedidos
- Admin pode ler todos

### 14.5 cv_ledger, cv_monthly_summary
- Member pode ler apenas seu próprio ledger
- Admin pode ler todos
- Apenas service_role pode inserir

### 14.6 commission_ledger, commission_balances
- Member pode ler apenas suas próprias comissões
- Admin pode ler todos

---

## 15) Requisitos técnicos

- Next.js App Router (TypeScript)
- Supabase Auth (email/password)
- Supabase RLS habilitado desde o início
- Logs estruturados no backend (info/warn/error)
- Variáveis de ambiente separadas (staging/prod)
- Feature flags para fases futuras (`ENABLE_WEBHOOKS`, etc.)
- Deploy staging na Vercel

---

## 16) Requisitos Não Funcionais (NFR)

**Do documento de escopo formal:**
- **Segurança:** RLS no Supabase para isolar dados por usuário; rotas admin protegidas; validação no servidor
- **Auditoria:** logs de alterações manuais e de processamento de webhooks
- **Observabilidade:** painel/log de falhas de webhooks e opção de reprocessamento
- **Performance:** rede e dashboards devem abrir em tempo aceitável (até 3s para redes de 10.000 nós)
- **Confiabilidade:** idempotência para webhooks e rotinas (evitar duplicidade de CV/comissão)

---

## 17) Casos de erro e comportamento esperado

- **ref inválido:** seguir regra definida (bloquear ou tratar sem link) e registrar evento
- **Shopify indisponível:** criar member mesmo assim, marcar sync failed e permitir reprocesso no admin
- **E-mail já existe:** retornar 409 e sugerir login
- **Admin resync:** se falhar, registrar erro e manter estado anterior
- **Webhook duplicado:** idempotência por shopify_order_id

---

## 18) Proibições e limitações (para evitar escopo infinito)

- Não implementar "mover rede" no admin até Sprint 6
- Não implementar BI avançado no MVP
- Não implementar comissões/saques sem ledger auditável
- Qualquer regra fiscal (RPA/NF-e) só entra na Fase 5

---

## 19) Checklist de validação (por sprint)

### 19.1 Sprint 1 — Aceite ✅
- [x] Cadastro com link vincula sponsor corretamente
- [x] ref_code único gerado e imutável
- [x] Customer Shopify criado/atualizado
- [x] Tags aplicadas corretamente
- [x] Dashboard mostra link de convite e sponsor
- [x] Admin busca membro e executa resync Shopify
- [x] RLS ativo (member não lê dados de outro member)

### 19.2 Sprint 2 — Aceite ✅
- [x] Webhooks idempotentes
- [x] CV soma corretamente por pedido
- [x] Refund desfaz CV
- [x] Status mensal correto

### 19.3 Sprint 3 — Aceite ✅
- [x] Rede N1/N2/... consistente
- [x] Membro vê rede (completa)
- [x] Níveis calculados conforme regra do documento canônico
- [x] Checklist do próximo nível exibido

### 19.4 Sprint 4 — Aceite ✅
- [x] Ledger imutável (auditável)
- [x] Cada valor tem origem (pedido/regra)
- [x] Reprocessamento seguro (sem duplicar)
- [x] Fast-Track calculado corretamente
- [x] Comissão Perpétua diferenciada por tipo de N1
- [x] Bônus 3 implementado
- [x] Leadership Bônus implementado
- [x] Royalty implementado

### 19.5 Sprint 5 — Aceite ✅
- [x] Solicitação de saque + estados
- [x] Validação PF (RPA) até R$ 1.000/mês
- [x] Validação PJ (NF-e) sem limite
- [x] Histórico de pagamentos
- [x] Saldo em análise (trava) — Net-15 implementado
- [x] Valor mínimo para saque: R$ 100
- [x] Integração Asaas (manual por enquanto)

### 19.6 Sprint 6 — Aceite ✅
- [x] Regra de 6 meses inativo implementada (cron + compressão)
- [x] Compressão de rede funciona (move indicados para sponsor)
- [x] Gestão de admins básica
- [x] Dashboard global com KPIs (`/api/admin/stats`)
- [x] Filtros por modo de comissionamento
- [x] Gestão completa de membro (editar, ajustar, bloquear)
- [x] Gestão de tags (CRUD + sync Shopify)

---

## 20) Critérios de Aceite do Projeto (macro)

**Do documento de escopo formal:**
1. Cadastro com link cria membro, vincula rede e libera preço de membro na Shopify
2. Painel do membro mostra CV (próprio e rede), status, nível, saldo e detalhamento por comissão
3. Admin visualiza KPIs globais, busca membros e executa ações administrativas com auditoria
4. Webhooks de pedidos atualizam CV e comissões com idempotência
5. Rotina mensal de reset executa corretamente e é auditável
6. Fluxo de saque funciona com regras de CPF/PJ e anexos obrigatórios

---

## Apêndice A — Itens TBD (pendentes)

> Devem ficar em `docs/DECISOES_TBD.md` e precisam de aprovação assinada.

| ID | Tema | Status |
|----|------|--------|
| TBD-001 | Regra de cadastro sem link | ✅ House Account (11/02/2026) |
| TBD-002 | Como preço de membro é liberado na Shopify | ⏳ Pendente |
| TBD-003 | Lista final de tags/metacampos | ✅ Tags atuais + tag de nível (11/02/2026) |
| TBD-004 | Domínios e URLs oficiais | ⏳ Pendente |
| TBD-005 | Resync Shopify (o que reaplicar) | ⏳ Pendente |
| TBD-006 | Formato do ref_code | ✅ Sequencial + customização admin (11/02/2026) |
| TBD-007 | Comportamento da landing page | ✅ Redirect para /login (11/02/2026) |
| TBD-014 | Nome exato do metafield CV | ✅ custom.cv, CV=0 se ausente (11/02/2026) |
| TBD-015 | Limite de saque PF | ✅ R$1.000/mês |
| TBD-016 | Valor mínimo para saque | ✅ R$100/saque |
| TBD-018 | Integração fintech | ✅ Asaas |
| TBD-019 | Creatina mensal grátis | ✅ Cupom Individual Mensal (atualizado 11/02/2026) |
| TBD-021 | Período de trava para saque | ✅ Net-15 |

---

## Apêndice B — Fora de Escopo

**Do documento de escopo formal:**
- Design/branding definitivo além do necessário para um painel funcional
- Criação/gestão de campanhas de marketing, e-mails transacionais avançados
- Integração com ERP/Contabilidade além da geração de documentos previstos
- ~~Regra de 'Creatina Mensal Grátis' se exigir customização avançada de checkout~~ → **Implementado via TBD-019**

---

# Como usar este SPEC no Cursor (SDD na prática)

## A) Estrutura recomendada no repositório
- `docs/SPEC.md` (este arquivo)
- `docs/DECISOES_TBD.md` (somente itens pendentes e assináveis)
- `docs/CHANGELOG.md` (toda mudança aprovada)
- `docs/ACCEPTANCE.md` (checklists por sprint)
- `docs/STATUS_IMPLEMENTACAO.md` (status atual)

## B) Regra de trabalho no Cursor (obrigatória)
1) **Antes de qualquer mudança**, o agente/dev deve ler `docs/SPEC.md`.
2) Toda tarefa deve apontar para:
   - FR correspondente (ex.: "Implementar FR-17")
   - seção do SPEC (ex.: "Implementar seção 5.7")
   - critérios de aceite (seção 19)
3) Se algo não estiver no SPEC, a resposta padrão é:
   - "Isso não está no escopo do sprint; registrar como TBD/mudança de escopo."

## C) Como conduzir o desenvolvimento (fluxo recomendado)
1) **Criar tarefas** por FR: `FR-17`, `FR-28`...
2) Implementar uma por vez, com commits pequenos.
3) Ao finalizar, atualizar `docs/ACCEPTANCE.md` marcando checklist.
4) Ao mudar requisito, atualizar `docs/CHANGELOG.md` e (se necessário) `docs/SPEC.md` com aprovação do cliente.

## D) Como evitar "delírio" do agente
- Sempre iniciar prompt com: "Leia `docs/SPEC.md` e siga estritamente."
- Sempre pedir para o agente apontar "qual FR" está implementando.
- Bloquear features fora do sprint e registrar em TBD.
