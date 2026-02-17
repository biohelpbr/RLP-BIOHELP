# CHANGELOG — Biohelp LRP (SDD)

Este changelog registra **toda alteração aprovada** que afete o SPEC, escopo, banco de dados, integrações ou critérios de aceite.

> **Regra:** não existe mudança sem: (1) aprovação do cliente, (2) entrada aqui, (3) atualização do SPEC quando aplicável.

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
