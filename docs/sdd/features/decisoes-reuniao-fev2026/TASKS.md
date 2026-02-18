# TASKS: Implementação das Decisões da Reunião de Alinhamento (Fev/2026)

## Metadata
- **Feature ID**: FEAT-DEC-FEV2026
- **SPEC**: [SPEC.md](./SPEC.md)
- **PLAN**: [PLAN.md](./PLAN.md)
- **Data**: 2026-02-11

## Legenda de Status
- ⬜ Pendente
- 🔄 Em progresso
- ✅ Concluída
- ⏸️ Bloqueada
- ❌ Cancelada

## Tasks

### Fase 1: Mudanças Simples (sem dependências)

#### TASK-001: Remover fallback CV para preço (TBD-014)
- **Status**: ✅
- **Prioridade**: P0
- **Dependências**: Nenhuma
- **Arquivo**: `lib/cv/calculator.ts`
- **Descrição**: Remover lógica que usa preço do item como fallback quando metafield CV não existe. Retornar CV=0 e logar warning.
- **Critério de Done**: Produto sem metafield gera CV=0, não preço

#### TASK-002: Landing page /login (TBD-007)
- **Status**: ✅ (já implementado)
- **Prioridade**: P0
- **Descrição**: Verificar que `/` redireciona para `/login`. Sem alteração necessária.

### Fase 2: Tags e Sync Shopify

#### TASK-003: Adicionar tag de nível no sync Shopify (TBD-003)
- **Status**: ✅
- **Prioridade**: P1
- **Arquivo**: `lib/shopify/customer.ts`
- **Descrição**: Adicionar `nivel:<nivel>` em `generateMemberTags()`. Incluir parâmetro `level` em `CustomerSyncParams`.
- **Critério de Done**: Customer Shopify recebe tag `nivel:membro` (ou nível real) no cadastro

### Fase 3: House Account e ref_code

#### TASK-004: Criar migration para House Account e sequência ref_code
- **Status**: ✅
- **Prioridade**: P0
- **Arquivo**: Migration Supabase
- **Descrição**: Criar membro House Account com ID fixo + sequência `ref_code_seq` para gerar códigos sequenciais.
- **Critério de Done**: House Account existe no banco; sequência funciona

#### TASK-005: Implementar ref_code sequencial (TBD-006)
- **Status**: ✅
- **Prioridade**: P1
- **Dependências**: TASK-004
- **Arquivo**: `lib/utils/ref-code.ts`
- **Descrição**: Trocar `nanoid(8)` por formato `BH00001` usando sequência do banco.
- **Critério de Done**: Novos membros recebem ref_code `BH00001`, `BH00002`, etc.

#### TASK-006: Implementar House Account no cadastro sem link (TBD-001)
- **Status**: ✅
- **Prioridade**: P0
- **Dependências**: TASK-004
- **Arquivo**: `app/api/members/join/route.ts`
- **Descrição**: Trocar bloqueio "cadastro indisponível" por atribuição de sponsor = House Account.
- **Critério de Done**: Cadastro sem `ref` cria membro com sponsor = House Account

### Fase 4: Cupom Creatina

#### TASK-007: Criar helper de cupom Shopify (TBD-019)
- **Status**: ✅
- **Prioridade**: P1
- **Arquivo**: `lib/shopify/coupon.ts`
- **Descrição**: Criar função para gerar Discount Code via Shopify REST API (100% OFF, 1 uso, validade mensal).
- **Critério de Done**: Função cria cupom na Shopify e retorna código

#### TASK-008: Integrar cupom na API de creatina
- **Status**: ✅
- **Prioridade**: P1
- **Dependências**: TASK-007
- **Arquivo**: `app/api/members/me/free-creatine/route.ts`
- **Descrição**: Alterar GET para gerar/retornar cupom individual mensal. Alterar POST para usar cupom.
- **Critério de Done**: API retorna cupom `CREATINA-MARIA-X7K9-FEV2026` para membro ativo

### Fase 5: Segurança Anti-Fraude (18/02/2026)

#### TASK-009: Hash aleatório no código do cupom
- **Status**: ✅
- **Prioridade**: P0
- **Arquivo**: `lib/shopify/coupon.ts`
- **Descrição**: Adicionar hash de 4 caracteres para tornar código não adivinhável.
- **Critério de Done**: Código no formato `CREATINA-NOME-X7K9-MES`

#### TASK-010: Restringir cupom ao customer específico
- **Status**: ✅
- **Prioridade**: P0
- **Arquivo**: `lib/shopify/coupon.ts`, `app/api/members/me/free-creatine/route.ts`
- **Descrição**: Usar `customer_selection: 'prerequisite'` com `prerequisite_customer_ids`.
- **Critério de Done**: Shopify rejeita uso por outra pessoa

#### TASK-011: Validação de fraude no webhook
- **Status**: ✅
- **Prioridade**: P0
- **Arquivo**: `app/api/webhooks/shopify/orders/paid/route.ts`
- **Descrição**: Verificar se quem usou o cupom é o dono. Registrar fraude se não for.
- **Critério de Done**: fraud_details preenchido em caso de tentativa irregular

#### TASK-012: Migration de segurança
- **Status**: ✅
- **Prioridade**: P1
- **Arquivo**: `supabase/migrations/20260218_creatine_security.sql`
- **Descrição**: Índice UNIQUE em coupon_code, coluna fraud_details, view de auditoria.
- **Critério de Done**: Migration aplicada via Supabase MCP

## Resumo

| Fase | Total | Pendente | Concluída |
|------|-------|----------|-----------|
| Mudanças Simples | 2 | 0 | 2 |
| Tags | 1 | 0 | 1 |
| House Account + ref_code | 3 | 0 | 3 |
| Cupom Creatina | 2 | 0 | 2 |
| Segurança Anti-Fraude | 4 | 0 | 4 |
| **Total** | **12** | **0** | **12** |
