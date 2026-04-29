# CHANGELOG — Biohelp LRP (SDD)

Este changelog registra **toda alteração aprovada** que afete o SPEC, escopo, banco de dados, integrações ou critérios de aceite.

> **Regra:** não existe mudança sem: (1) aprovação do cliente, (2) entrada aqui, (3) atualização do SPEC quando aplicável.

---

## Versão 5.1 — 2026-04-29 (Pivô V2 — primeira leva de TBDs respondidos)
**Tipo:** Documental / desbloqueio parcial
**Solicitação:** Cliente respondeu 11 dos 18 TBDs do questionário enviado em 29/04/2026.

### Decisões registradas (TBDs resolvidos)
- **TBD-3:** Pagamento via **Cashin** (provável) ou PIX manual. Asaas descartado.
- **TBD-4:** Aprovação **manual** do admin + validação **automática** da NF (formato/dados/valor) no upload.
- **TBD-5:** CPF **não está fora** — pode receber via Cashin ou crédito em loja. CNPJ é obrigatório só pra emitir NF de serviço.
- **TBD-6:** **Sem integração com ERP** nessa fase.
- **TBD-7:** Guru cria pedido na Shopify, **lemos via webhook Shopify** (Wink valida abordagem).
- **TBD-10:** **House Account descontinuada** no v2.
- **TBD-13 (parcial):** Saldo do **ATIVO** sem prazo. Inativo TBD.
- **TBD-14:** Saldo → crédito Shopify **1:1, sem prazo** após resgate.
- **TBD-17:** Cupom de creatina **mantém com escopo alterado** — sistema de campanhas configuráveis pelo admin.
- **TBD-18:** Saque RPA/CPF **descontinua**.

### TBDs derivados (4 novos)
- **TBD-19:** Cashin é o fornecedor confirmado? (resposta TBD-3 disse "provavelmente")
- **TBD-20:** Founder com CPF pode usar Cashin ou só CNPJ pode ser Founder?
- **TBD-21:** Prazo de saldo pra membro INATIVO (TBD-13 deixou em aberto).
- **TBD-22:** UX de gestão de campanhas de cupom (deriva de TBD-17 alterado).

### Features afetadas
- ✅ **Destravadas:** F-V01, F-V02, F-V03, F-V05.
- 🟡 **Parcialmente destravadas:** F-V06, F-V07.
- 🚫 **Ainda bloqueadas:** F-V04, F-V08, F-V09, F-V10, F-V13.
- 🆕 **Nova feature criada:** F-V13 (cupom de creatina como campanha configurável — substitui cron mensal).

### Anti-SPEC v2 atualizada
- §8: House Account marcada como descontinuada.
- §9: Cupom de creatina marcado com escopo alterado (campanhas).
- §10: RPA/CPF marcado como descontinuado.
- §11 (novo): provider de pagamento — Cashin/PIX manual (TBD-19 confirma); construir `lib/payouts/v2/` com interface de provider agnóstica.

### TBDs ainda abertos (12 — bloqueando 6 features)
1, 2, 8, 9, 11, 12, 15, 16, 19, 20, 21, 22. Detalhe em `docs/sdd/PIVOT-V2.md` §4.1.

---

## Versão 5.0 — 2026-04-28 (PIVÔ V2 declarado)
**Tipo:** Major / Pivô de produto
**Solicitação:** Cliente realinhou o modelo de negócio em reunião e via fluxograma novo (`documentos_escopo/Fluxograma.jpg.jpeg`).

### Resumo
O modelo MLM CV-based (Sprints 1-7, 98% dos FRs v1) foi declarado **descontinuado**.
Novo modelo: afiliação 1-nível + comissão 50% direta + Founder ao atingir 5 ativos no clube + créditos Shopify pré-Founder + saque cash via NF de serviço (Asaas, CNPJ obrigatório).

### Documentos canônicos do v2
- `docs/sdd/PIVOT-V2.md` (fonte de verdade)
- `docs/sdd/PLAYBOOK.md` (workflow operacional)
- `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` (18 TBDs ao cliente)
- `docs/sdd/PROMPT-NOVA-SESSAO.md` (prompt self-contained pra sessões CLI)
- `docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md` (1ª feature destravada)

### Insumos do cliente persistidos
- `documentos_escopo/Fluxograma.jpg.jpeg` (28/04/2026)
- `documentos_escopo/Fluxo.txt` (regras condensadas)
- `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários)

### Removido do modelo (mas código v1 mantido até onda 6 / F-V12)
- CV (Commissionable Value) e relação 1 CV = R$1
- Múltiplos níveis N0/N1/N2/N3 e rankings Parceira/Líder/Diretora/Head
- Status ativo/inativo por 200 CV mensais e reset mensal
- Compressão de rede após 6 meses inativo
- Fast-Track 30%/20%, Comissão Perpétua, Bônus 1/2/3, Leadership, Royalty
- RPA/CPF e limite mensal R$1.000
- Visualização multinível pro membro

### Adicionado (28-29/04/2026)
- Feature flag `LRP_V2` (default OFF) em `lib/utils/featureFlags.ts`
- Vars `LRP_V2` e `CRON_DISABLED_V2` em `.env.example` e `.env.local`
- Shells dos módulos novos: `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/`
- Banner DEPRECATED em 5 docs v1 (`SPEC_Biohelp_LRP.md`, `ACCEPTANCE.md`, `DECISOES_TBD.md`, `WORKFLOW.md`, `PR_TEMPLATE.md`)
- Comentário `@deprecated` em 6 arquivos de código v1 (`lib/cv/calculator.ts`, `lib/levels/calculator.ts`, `lib/commissions/{calculator,bonus3,royalty}.ts`, `lib/network/compression.ts`)
- `docs/README.md` reorganizado priorizando v2

### TBDs abertos
**18 TBDs** aguardando decisão do cliente. Lista em `docs/sdd/PIVOT-V2.md` §4. Bloqueiam F-V01..F-V10 e F-V12 (10 das 12 features v2). F-V11 (visão restrita da rede) é a única feature destravada — SPEC pronta em `docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md`.

### Cleanup do código v1
Programado para a onda 6 (F-V12), apenas após `LRP_V2=true` em produção por ~4 semanas com 0 incidentes. Até lá, código v1 permanece funcional e é o único caminho ativo (flag default OFF).

---

## Versão 4.4 — 2026-02-18
**Tipo:** Segurança (Anti-Fraude Cupom Creatina)  
**Solicitação:** Cliente pediu proteção contra uso indevido do cupom de creatina

### Segurança do Cupom de Creatina (TBD-019 melhorado)

**Problema identificado:**
- Código do cupom era previsível (`CREATINA-NOME-MES`)
- Qualquer pessoa poderia tentar usar o cupom de outro membro

**Solução implementada:**
1. **Hash aleatório no código:** `CREATINA-NOME-X7K9-MES` (4 caracteres hex)
2. **Restrição por customer:** Cupom vinculado ao `shopify_customer_id` do membro
3. **Limite global:** `usage_limit: 1` + `once_per_customer: true`
4. **Validade temporal:** Expira no último dia do mês
5. **UNIQUE INDEX:** `coupon_code` não pode ser duplicado
6. **Validação no webhook:** Detecta se quem usou é o dono
7. **Registro de fraude:** Campo `fraud_details` (JSON) para auditoria
8. **View de auditoria:** `v_creatine_fraud_attempts` para admin

**Arquivos alterados:**
- `lib/shopify/coupon.ts` — Hash aleatório + restrição customer
- `app/api/members/me/free-creatine/route.ts` — Passa shopify_customer_id
- `app/api/webhooks/shopify/orders/paid/route.ts` — Validação de fraude
- `supabase/migrations/20260218_creatine_security.sql` — Índices + view

**Migration aplicada:** Via Supabase MCP (`creatine_coupon_security_v2`)

---

## Versão 4.3 — 2026-02-16
**Tipo:** Nova funcionalidade (Página de Produtos Admin) + Limpeza de sidebar  
**TBD-023:** Aprovado pelo cliente

### Página de Produtos (`/admin/products`)
- Nova página no painel admin que lista produtos da Shopify com CV
- **API:** `GET /api/admin/products` — proxy Shopify REST API + enriquecimento com metafield `custom.cv`
- **UI:** Grid de cards com imagem, título, preço, SKU, status, CV (indicação visual de CV ausente)
- **Cards resumo:** Total produtos, Ativos, Com CV, Sem CV
- **Requer:** permissão `read_products` (já habilitada)

### Limpeza do sidebar admin
- Link "Produtos" atualizado para `/admin/products` (antes era placeholder)
- Link "Configurações" removido (não havia funcionalidade associada)

**Arquivos criados/alterados:**
- `app/api/admin/products/route.ts` (novo)
- `app/admin/products/page.tsx` (novo)
- `app/admin/products/page.module.css` (novo)
- `app/admin/page.tsx` (sidebar atualizado)
- `app/admin/commissions/page.tsx` (sidebar atualizado)
- `docs/DECISOES_TBD.md` (TBD-023 registrado)
- `docs/SPEC_Biohelp_LRP.md` (seção 10.3)

---

## Versão 4.2 — 2026-02-16
**Tipo:** Nova funcionalidade (Página de Vendas)  
**Mudanças:**

### Página de Vendas (`/dashboard/sales`)
- Nova página no painel do membro para visualizar pedidos próprios e vendas da rede (N1)
- **API:** `GET /api/members/me/orders` — retorna resumo, pedidos próprios com items/CV, vendas dos indicados diretos
- **UI:** Cards de resumo (total pedidos, CV total, indicados N1), abas Minhas Compras / Vendas da Rede, tabela com expand para detalhes dos itens
- **Design:** Consistente com as páginas existentes (dark theme, mesmo padrão visual)
- **FRs relacionados:** FR-13, FR-14, FR-17 (complemento visual)
- **SDD:** `docs/sdd/features/sales-page/`

**Arquivos criados/alterados:**
- `app/api/members/me/orders/route.ts` (novo)
- `app/dashboard/sales/page.tsx` (novo)
- `app/dashboard/sales/page.module.css` (novo)
- `app/dashboard/page.tsx` (link sidebar atualizado)
- `docs/SPEC_Biohelp_LRP.md` (seções 10.2 e 11.9b)

---

## Versão 4.0 — 2026-02-11
**Tipo:** Decisões de negócio (reunião de alinhamento com cliente)  
**Mudanças:**

### TBDs Resolvidos (5 decisões + 1 atualização)

1. **TBD-001 — Cadastro sem link → ✅ House Account**
   - Cadastro sem convite → sponsor = conta da empresa (Biohelp)
   - Comissão de membros sem convite fica com a empresa
   - FR-06 desbloqueado para implementação

2. **TBD-003 — Tags → ✅ Manter padrão atual + nova tag de nível**
   - Nova tag obrigatória: `nivel:<nivel>` (membro/parceiro/lider/diretor/head)
   - Impacta: regras de comissão, hierarquia, relatórios
   - Sync Shopify deve atualizar tag quando nível muda

3. **TBD-006 — Formato ref_code → ✅ Sequencial + customização admin**
   - Padrão: `BH00001` (sequencial automático)
   - Admin pode customizar: ex. `MARIA2026`
   - Validação de unicidade obrigatória

4. **TBD-007 — Página inicial → ✅ Redirect para /login (manter como está)**
   - Sem alteração necessária

5. **TBD-014 — Metafield CV → ✅ custom.cv | CV=0 se ausente**
   - Removido fallback para preço do item
   - Se metafield não existir → CV = 0
   - Evita distorção de comissão

6. **TBD-019 — Creatina mensal → ✅ Cupom Individual Mensal (atualização)**
   - Método alterado de "desconto automático" para "cupom individual"
   - Sistema gera cupom exclusivo: `CREATINA-<NOME>-<MÊSANO>`
   - Mais simples e mais barato (sem Shopify Functions)

**FRs afetados:** FR-06 (desbloqueado), FR-07 (formato ref_code), FR-14 (CV sem fallback), FR-04/FR-08 (tags)

**Impacto:**
- Prazo: Requer implementação de FR-06 (House Account), novo formato ref_code, remoção de fallback CV, tag de nível, cupom individual
- Custo: Incluso no escopo
- Risco: Baixo (decisões alinham implementação ao modelo de negócio)

**Aprovado por (cliente):** Reunião de alinhamento 11/02/2026  
**Evidência:** Ata de reunião

---

## Versão 4.1 — 2026-02-11
**Tipo:** Correção técnica (obtenção de CV via Shopify API)  
**Mudanças:**

### Fix: Webhook orders/paid — busca de metafield CV via API

**Problema identificado:**
- O webhook `orders/paid` do Shopify **não inclui metafields dos produtos** no payload.
- Como consequência, o cálculo de CV resultava sempre em 0 (TBD-014: sem fallback para preço).

**Solução implementada:**
- Adicionadas funções `fetchProductCV()` e `fetchProductCVsBatch()` em `lib/shopify/customer.ts`
- Ao receber o webhook, o sistema agora faz chamada extra à **Shopify REST API** (`GET /products/{id}/metafields.json?namespace=custom&key=cv`) para cada produto do pedido
- CVs obtidos são injetados como metafields virtuais nos itens antes do cálculo
- Rate limiting entre chamadas (100ms) para respeitar limites da API Shopify

**Arquivos alterados:**
- `lib/shopify/customer.ts` — novas funções `fetchProductCV()` e `fetchProductCVsBatch()`
- `app/api/webhooks/shopify/orders/paid/route.ts` — integração com busca de CV via API

**FRs afetados:** FR-14 (CV agora funcional com compras reais)  
**Impacto:** Sem impacto em outras funcionalidades; correção essencial para demo com Shopify real  
**Risco:** Baixo (chamadas adicionais à API são leves e com rate limiting)

---

## Versão 3.0 — 2026-01-12
**Tipo:** Atualização completa do SDD com mapeamento de FRs  
**Mudanças:**
- **SPEC.md:** Atualização completa com todos os 38 FRs do documento de escopo formal
- **ACCEPTANCE.md:** Reorganização com matriz de FRs e critérios de aceite por categoria
- **STATUS_IMPLEMENTACAO.md:** Adição de cobertura de FRs por sprint e status detalhado
- **DECISOES_TBD.md:** Mapeamento completo de TBDs do escopo formal para TBDs do SDD
- **WORKFLOW.md:** Atualização com checklist de FRs
- Adição de seção de Requisitos Não Funcionais (NFR) do escopo formal
- Adição de critérios de aceite macro do projeto
- Mapeamento de FRs bloqueados por TBDs pendentes

**FRs mapeados:**
- FR-01 a FR-38 (38 requisitos funcionais)
- 24 implementados (71%)
- 3 parcialmente implementados
- 11 pendentes

**Impacto:**
- Prazo: Sem impacto (documentação)
- Custo: Incluso no escopo
- Risco: Baixo (melhoria de rastreabilidade)

**Aprovado por (cliente):** ____________________  
**Evidência:** Documentos de escopo formal

---

## Versão 2.1 — 2026-01-10
**Tipo:** Correção de regra de negócio (Comissão Perpétua)  
**Mudanças:**
- **CORREÇÃO CRÍTICA:** Comissão Perpétua agora diferencia percentual por TIPO de N1 (comprador)
- Implementação correta conforme documento canônico `Biohelp___Loyalty_Reward_Program.md` (linhas 163-173)
- Regras corrigidas:
  - **Parceira:** 5% CV de clientes N1 (NÃO recebe de outras parceiras)
  - **Líder/Líder em Formação:** 7% CV da rede + 5% CV de clientes N1
  - **Diretora:** 10% CV da rede + 7% CV de parceiras N1 + 5% CV de clientes N1
  - **Head:** 15% CV da rede + 10% CV de líderes N1 + 7% CV de parceiras N1 + 5% CV de clientes N1
- Novas funções RPC: `get_buyer_type()`, `get_perpetual_percentage()`
- Atualização da função `calculate_order_commissions()` para usar regras diferenciadas
- Atualização de `lib/commissions/calculator.ts` com nova lógica
- Atualização de `types/database.ts` com documentação das regras

**Arquivos alterados:**
- `lib/commissions/calculator.ts` — Lógica de cálculo corrigida
- `types/database.ts` — Tipos e constantes atualizados
- `supabase/migrations/20260110_fix_perpetual_commission.sql` — Nova migration

**FRs afetados:** FR-23 (Comissão Perpétua)

**Impacto:**
- Prazo: Sem impacto (correção pontual)
- Custo: Incluso no escopo
- Risco: Baixo (correção alinha implementação ao documento canônico)

**Aprovado por (cliente):** ____________________  
**Evidência:** Documento canônico `Biohelp___Loyalty_Reward_Program.md`

---

## Versão 2.0 — 2026-01-07
**Tipo:** Nova feature (Sprint 2)  
**Mudanças:**
- Implementação completa do Sprint 2 (CV + Status)
- Novas tabelas: orders, order_items, cv_ledger, cv_monthly_summary
- Webhooks Shopify para orders/paid, orders/refunded, orders/cancelled
- Cálculo automático de CV (via metacampo do produto; fallback para preço do item)
- Status automático baseado em CV (active se >= 200/mês)
- Dashboard atualizado com progresso de CV
- Job de fechamento mensal
- Ajuste manual de CV pelo admin
- Ledger auditável e imutável

**FRs implementados:** FR-13, FR-14, FR-15, FR-16

**Impacto:**
- Prazo: Conforme planejado
- Custo: Incluso no escopo
- Risco: Baixo

**Aprovado por (cliente):** ____________________  
**Evidência:** ____________________

---

## Versão 1.0 — 2025-12-23
**Tipo:** criação do baseline SDD  
**Mudanças:**
- Criação do SPEC.md (SDD) e documentos de suporte (TBD/Acceptance/Changelog/Docs README)
- Definição do Sprint 1 (MVP) e fases futuras
- Definição inicial de schema Supabase e RLS mínimos
- Definição inicial de integração Shopify (customer + tags)

**FRs implementados:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-07, FR-08, FR-09

**Aprovado por (cliente):** ____________________  
**Evidência:** ____________________

---

## Template para novas entradas
### Versão X.Y — AAAA-MM-DD
**Tipo:** ajuste de regra / nova feature / correção de escopo / mudança técnica  
**Mudanças:**
- (listar em bullets)

**FRs afetados:** FR-XX, FR-YY

**Impacto:**
- Prazo: (ex.: +1 semana / sem impacto)
- Custo: (ex.: mudança de escopo / incluso)
- Risco: (baixo/médio/alto)

**Aprovado por (cliente):** ________  
**Evidência:** ________  
