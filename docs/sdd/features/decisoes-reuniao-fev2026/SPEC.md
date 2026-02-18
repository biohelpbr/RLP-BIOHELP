# SPEC: Implementação das Decisões da Reunião de Alinhamento (Fev/2026)

## Metadata
- **Feature ID**: FEAT-DEC-FEV2026
- **Autor**: Equipe técnica
- **Data**: 2026-02-11
- **Status**: Approved

## Resumo
Implementar as 5 decisões tomadas na reunião de alinhamento com o cliente em 11/02/2026 (TBD-001, TBD-003, TBD-006, TBD-014, TBD-019). TBD-007 já está implementado.

## Problema
5 TBDs pendentes bloqueavam funcionalidades e geravam comportamentos provisórios no sistema (bloqueio de cadastro sem link, fallback de CV para preço, formato de ref_code inadequado, ausência de tag de nível, creatina sem mecanismo de cupom).

## Solução Proposta
Implementar cada decisão conforme aprovado pelo cliente, alterando o código existente de forma incremental.

## Requisitos Funcionais

### RF-01: CV sem fallback para preço (TBD-014)
- **Seção SPEC:** 4.3
- **Descrição**: Remover fallback que usa preço do item quando metafield CV não existe
- **Entrada**: Produto sem metafield `custom.cv`
- **Saída**: CV = 0 (zero), log warning `missing_cv_metafield`
- **Regras**: Se `custom.cv` não existir, CV do item = 0

### RF-02: Tag de nível no Shopify (TBD-003)
- **Seção SPEC:** 5.4
- **Descrição**: Adicionar tag `nivel:<nivel>` ao sincronizar customer com Shopify
- **Entrada**: Nível do membro (membro/parceiro/lider/diretor/head)
- **Saída**: Tag `nivel:<nivel>` aplicada no Customer Shopify
- **Regras**: Tag deve ser atualizada quando nível muda

### RF-03: House Account para cadastro sem link (TBD-001)
- **Seção SPEC:** 5.2
- **Descrição**: Cadastro sem link de convite atribui sponsor = House Account
- **Entrada**: POST /api/members/join sem campo `ref`
- **Saída**: Membro criado com sponsor_id = House Account
- **Regras**: Comissões vão para a empresa; House Account é conta raiz fixa

### RF-04: ref_code sequencial (TBD-006)
- **Seção SPEC:** 4.2
- **Descrição**: Gerar ref_code no formato `BH00001` (sequencial) com opção de customização admin
- **Entrada**: Novo cadastro de membro
- **Saída**: ref_code no formato `BHXXXXX`
- **Regras**: Unicidade obrigatória; admin pode customizar; imutável após criação

### RF-05: Cupom individual mensal para creatina (TBD-019)
- **Seção SPEC:** 6.1
- **Descrição**: Gerar cupom exclusivo via Shopify Admin API para cada membro ativo
- **Entrada**: Membro ativo (CV >= 200)
- **Saída**: Cupom `CREATINA-<NOME>-<HASH>-<MÊSANO>` criado na Shopify
- **Regras**: 1 uso, válido no mês, 100% OFF, formato com hash aleatório

### RF-06: Segurança anti-fraude do cupom (TBD-019 melhorado — 18/02/2026)
- **Seção SPEC:** 6.1
- **Descrição**: Impedir uso indevido do cupom de creatina por terceiros
- **Entrada**: Tentativa de uso de cupom CREATINA-*
- **Saída**: Validação de propriedade + registro de fraude se aplicável
- **Regras**:
  - Hash aleatório no código (não adivinhável)
  - Cupom restrito ao shopify_customer_id do membro
  - Limite global de 1 uso
  - Webhook valida se quem usou é o dono
  - Tentativas de fraude registradas em fraud_details

## Critérios de Aceite

- [x] CA-01: Produto sem metafield CV gera CV = 0 (não usa preço como fallback) ✅
- [x] CA-02: Customer Shopify recebe tag `nivel:<nivel>` no cadastro e em mudanças de nível ✅
- [x] CA-03: Cadastro sem link cria membro com sponsor = House Account ✅
- [x] CA-04: Novos membros recebem ref_code no formato `BH00001` ✅
- [x] CA-05: Admin pode customizar ref_code com validação de unicidade ✅
- [x] CA-06: Membro ativo recebe cupom de creatina no formato `CREATINA-<NOME>-<HASH>-<MÊSANO>` ✅
- [x] CA-07: Cupom criado na Shopify com 100% OFF, 1 uso, validade mensal ✅
- [x] CA-08: Cupom restrito ao shopify_customer_id do membro ✅
- [x] CA-09: Webhook valida se quem usou é o dono do cupom ✅
- [x] CA-10: Tentativas de fraude registradas em fraud_details ✅
- [x] CA-11: View v_creatine_fraud_attempts disponível para auditoria ✅

## Fora do Escopo
- TBD-002 (preço de membro Shopify) — ainda pendente
- TBD-004 (URLs oficiais) — ainda pendente
- TBD-005 (escopo do Resync) — ainda pendente
- Migração de ref_codes existentes (membros atuais mantêm UUID)

## Dependências
- Shopify Admin API (REST) para tags e cupons
- Supabase para sequência de ref_code e House Account

## Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| House Account não existe no banco | Média | Alto | Criar via migration/seed |
| Cupom Shopify falha na criação | Baixa | Médio | Retry + log de erro |
| Membros existentes com UUID curto | Nenhuma | Nenhum | Mantidos como estão |

## Referências
- `docs/SPEC_Biohelp_LRP.md` v4.0
- `docs/DECISOES_TBD.md` (TBD-001, TBD-003, TBD-006, TBD-014, TBD-019)
- `docs/CHANGELOG.md` v4.0
