# PLAN: Implementação das Decisões da Reunião de Alinhamento (Fev/2026)

## Metadata
- **Feature ID**: FEAT-DEC-FEV2026
- **SPEC**: [SPEC.md](./SPEC.md)
- **Autor**: Equipe técnica
- **Data**: 2026-02-11

## Visão Geral da Arquitetura

Alterações incrementais em 5 pontos do sistema existente. Nenhuma nova tabela ou endpoint — apenas modificações em código existente + 1 migration para House Account e sequência.

## Componentes Afetados

### Backend
| Componente | Ação | Descrição |
|------------|------|-----------|
| `lib/cv/calculator.ts` | Modificar | Remover fallback para preço, retornar CV=0 |
| `lib/shopify/customer.ts` | Modificar | Adicionar tag `nivel:<nivel>` em `generateMemberTags()` |
| `lib/utils/ref-code.ts` | Modificar | Trocar `nanoid(8)` por formato sequencial `BH00001` |
| `app/api/members/join/route.ts` | Modificar | Trocar bloqueio por House Account |
| `app/api/members/me/free-creatine/route.ts` | Modificar | Adicionar geração de cupom Shopify |
| `lib/shopify/coupon.ts` | Criar | Helper para criar Discount Code via Shopify REST API |

### Frontend
| Componente | Ação | Descrição |
|------------|------|-----------|
| Dashboard creatina card | Modificar | Exibir código do cupom ao invés de "desconto automático" |

### Banco de Dados
| Tabela/Ação | Tipo | Descrição |
|-------------|------|-----------|
| `members` (seed House Account) | INSERT | Criar membro raiz da empresa |
| `ref_code_seq` | CREATE SEQUENCE | Sequência para gerar ref_codes |

## Modelo de Dados

```sql
-- Sequência para ref_code
CREATE SEQUENCE IF NOT EXISTS ref_code_seq START WITH 1 INCREMENT BY 1;

-- House Account (conta raiz da empresa)
-- Inserido via migration com ref_code fixo
INSERT INTO members (id, name, email, ref_code, sponsor_id, status, level)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Biohelp House',
  'house@biohelp.com.br',
  'HOUSE',
  NULL,
  'active',
  'membro'
);
```

## Fluxo de Dados

### 1. Cadastro sem link (House Account)
1. POST /api/members/join sem `ref`
2. Sistema busca House Account por ID fixo
3. `sponsor_id = HOUSE_ACCOUNT_ID`
4. Membro criado normalmente com sponsor

### 2. ref_code sequencial
1. Novo membro cadastrado
2. `SELECT nextval('ref_code_seq')`
3. Formatar como `BH` + pad(5, '0', seq)
4. Validar unicidade e salvar

### 3. Tag de nível
1. Cadastro ou mudança de nível
2. `generateMemberTags()` inclui `nivel:<nivel>`
3. Sync Shopify aplica tags

### 4. CV sem fallback
1. Webhook de pedido processa itens
2. Se metafield `custom.cv` não existe → cv = 0
3. Log warning emitido

### 5. Cupom creatina
1. GET /api/members/me/free-creatine
2. Se elegível e sem cupom no mês → cria via Shopify API
3. Retorna código do cupom
4. Dashboard exibe cupom

## Estratégia de Testes
- **Manuais**: Cadastro sem link, verificar tags no Shopify, testar CV=0
- **Verificação**: Consultar Supabase após cada operação

## Plano de Rollback
1. CV fallback: restaurar lógica de preço em `calculator.ts`
2. House Account: reativar bloqueio em `join/route.ts`
3. ref_code: reverter para `nanoid(8)` em `ref-code.ts`
4. Tags: remover tag de nível do `generateMemberTags()`
5. Cupom: remover geração de cupom (manter tabela)

## Estimativa de Complexidade
| Área | Complexidade | Justificativa |
|------|--------------|---------------|
| CV fallback | Baixa | 1 arquivo, remover linhas |
| Tag nível | Baixa | 1 arquivo, adicionar linha |
| House Account | Média | Migration + lógica de join |
| ref_code | Média | Sequência + migração de lógica |
| Cupom creatina | Média | Integração Shopify API |
