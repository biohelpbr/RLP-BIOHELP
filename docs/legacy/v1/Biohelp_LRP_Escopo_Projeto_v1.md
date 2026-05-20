# Biohelp LRP Escopo Projeto v1


# 1. Objetivo

Desenvolver o aplicativo do Loyalty Reward Program (LRP) da Biohelp, integrado à Shopify, para cadastro de membros, gestão de rede (árvore), cálculo de CV e comissões, painel do membro e painel administrativo, com base nas regras de negócio fornecidas pela Biohelp.

# 2. Escopo do Projeto

Este escopo cobre:

Aplicação web em Next.js (painel do membro e painel do admin).

Back-end (API/Jobs) para processamento de eventos, cálculos e integrações.

Banco de dados no Supabase (tabelas, políticas de acesso - RLS e auditoria).

Integração com Shopify (Admin API e Webhooks) para sincronização de clientes/tags/metacampos e eventos de pedidos.

Fluxos de cadastro, login, link de indicação, visualização de rede e acompanhamento de comissões.

Fluxo de solicitação de saque, com regras fiscais e anexos de documentos (RPA/NF-e).

# 3. Glossário

LRP: Loyalty Reward Program (aplicativo externo integrado à Shopify).

Shopify: plataforma de e-commerce da Biohelp.

CV: Commissionable Value (Valor Comissionável). 1 CV = R$ 1,00. Produtos podem gerar CV diferente do preço.

N0: topo de uma rede; N1: primeiro nível abaixo; N2: segundo nível abaixo, etc.

Membro: cliente cadastrada no programa.

Parceira: membro ativo que atende requisitos para comissionamento.

Ativo/Inativo: status mensal definido por mínimo de CV do mês.

Ledger: trilha de lançamentos (razão) de CV e comissões para auditoria.

# 4. Premissas e Dependências

Para o projeto funcionar, a Contratante deve fornecer/garantir:

Acesso à loja Shopify (Admin) e criação/instalação do app necessário (API keys, scopes e webhooks).

Definição de como o CV será representado em produtos/variantes (ex.: metafield de produto com valor CV).

Definição oficial de tags/metacampos de cliente na Shopify (ex.: member, sponsor_id, status_ativo).

Definição do valor máximo 'X' para saque CPF por solicitação (regra menciona X, mas não fixa o número).

Escolha do provedor/fintech para transferências automáticas (se o pagamento automatizado entrar no escopo).

Observação técnica: pode existir redundância com Shopify Flow para soma de CV, porém o reset mensal e a apuração oficial serão garantidos pelo LRP.

# 5. Arquitetura Proposta (alto nível)

Front-end (Next.js): páginas públicas de cadastro + painel do membro + painel admin.

Back-end (Next API Routes/Server Actions + Jobs): processamento de webhooks Shopify, cálculos de CV/comissão, rotinas mensais e reprocessamento.

Banco (Supabase): Auth, tabelas, RLS, trilhas de auditoria e filas de integração.

Integração Shopify: Admin API (clientes, tags/metacampos) e Webhooks (pedidos).

Armazenamento de arquivos: anexos de NF-e e documentos do saque (via Supabase Storage ou equivalente).

# 6. Regras de Negócio (congeladas para o escopo)

## 6.1 CV e Atividade

1 CV = R$ 1,00.

Para ser elegível a comissão, a parceira deve gerar mínimo de 200 CV no mês (status Ativa).

Parceira Inativa: não recebe benefícios durante o mês de inatividade.

Se reativar no mês subsequente, volta ao ranking anterior.

Após 6 meses sem se ativar, perde totalmente o status e sai da rede (rede abaixo sobe um nível).

Status e CV mensal devem ser resetados a cada mês (rotina do LRP).

## 6.2 Níveis de Liderança

| Nível | Requisitos (resumo) |
| --- | --- |
| Membro | Cliente cadastrada. |
| Parceira | Membro Ativo + 500 CV na rede (inclui o próprio). |
| Líder em Formação | Status temporário (90 dias) após trazer a primeira parceira; recebe bônus como líder no período. |
| Líder | Parceira Ativa (N0) + 4 Parceiras (N1) Ativas no primeiro nível. |
| Diretora | N0 com mínimo 3 Líderes (N1) Ativas + 80.000 CV na rede. |
| Head | N0 com mínimo 3 Diretoras (N1) Ativas + 200.000 CV na rede. |

## 6.3 Modelos de Comissionamento

### 6.3.1 Fast-Track

Quando uma Parceira (N0) traz um novo membro via link, ela recebe nos primeiros 30 dias: 30% do CV sobre as compras da Parceira (N1); e nos 30 dias seguintes: 20%.

A Líder (N0) recebe 20% e 10% do CV sobre as compras das clientes (N2) (mesma regra de tempo).

A Líder continua recebendo 30% / 20% dos membros (N1) que ela mesma trouxer.

### 6.3.2 Comissão Perpétua

Se a N0 estiver recebendo Fast-Track de uma N1, só passa a receber a Comissão Perpétua dessa N1 após terminar o período de 60 dias do Fast-Track.

| Perfil (N0) | Regra de comissão |
| --- | --- |
| Parceira | 5% do CV das clientes que trouxe (N1 somente). |
| Líder / Líder em Formação | 7% do CV da rede inteira + 5% do CV das clientes que trouxe (N1 somente). |
| Diretora | 10% do CV da rede inteira + 7% do CV das parceiras que trouxe (N1) + 5% do CV das clientes que trouxe (N1). |
| Head | 15% do CV da rede inteira + 10% do CV das Líderes que trouxe (N1) + 7% do CV das parceiras que trouxe (N1) + 5% do CV das clientes que trouxe (N1). |

### 6.3.3 Bônus 3

| Marco | Condição | Valor |
| --- | --- | --- |
| Bônus 1 | Rede com 3 Parceiras Ativas (N1). Se a rede se mantiver ativa no mês seguinte. | R$ 250,00 |
| Bônus 2 | Cada uma das 3 Parceiras Ativas (N1) tem por sua vez 3 Parceiras ativas abaixo (N2). | R$ 1.500,00 |
| Bônus 3 | Cada uma das 9 Parceiras Ativas (N2) tem por sua vez 3 Parceiras ativas abaixo (N3). | R$ 8.000,00 |

Observação: toda a rede deve estar ativa para receber a bonificação. Pode ocorrer em vários meses quando completados os requisitos mínimos.

### 6.3.4 Leadership Bônus

Diretora recebe 3% do CV de sua rede como Leadership Bônus.

Head recebe 4% do CV de sua rede como Leadership Bônus.

### 6.3.5 Royalty

Se uma Head (N0) formar outra Head (N1), a rede da nova Head (N1) deixa de fazer parte da rede antiga.

Mesmo assim, a Head (N0) passa a receber 3% do CV da nova rede (Royalty).

Se essa separação fizer a Head (N0) não atender mais aos requisitos para ser Head, isso não faz ela deixar de ser Head.

## 6.4 Regras de Resgate (Saque) da Comissão

A transferência deve ser automática via integração com ferramenta terceira, mediante solicitação.

CPF: só poderá sacar até X valor por solicitação (X será definido pela Contratante). Deve gerar RPA automaticamente e descontar impostos do RPA.

MEI e outras modalidades PJ: saque mediante envio de NF-e; sistema deve validar informações da NF-e e correspondência do valor com o valor disponível.

Dados necessários para operação devem estar cadastrados. Conta para recebimento deve ser sempre em nome da parceira; não é permitido saque para terceiros.

Regras detalhadas de 'trava' (saldo em análise) devem ser fornecidas pela Contratante para implementação fiel.

# 7. Requisitos Funcionais (FR)

Os requisitos abaixo descrevem o que será entregue no aplicativo. Cada requisito tem critérios de aceite associados.

## 7.1 Identidade, Acesso e Perfis

### FR-01 - Autenticação de membro

Permitir login do membro/parceira no painel do LRP (senha + recuperação de senha).

Critérios de aceite:

Usuários não autenticados não acessam rotas protegidas.

Admin não enxerga telas de membro como membro (a não ser em modo 'visualizar como').

Logs/auditoria para ações administrativas relevantes.

### FR-02 - Autenticação de admin

Permitir login do admin com permissões elevadas e área separada.

Critérios de aceite:

Usuários não autenticados não acessam rotas protegidas.

Admin não enxerga telas de membro como membro (a não ser em modo 'visualizar como').

Logs/auditoria para ações administrativas relevantes.

### FR-03 - Controle de permissões (RBAC)

Garantir permissões distintas para Membro e Admin (RLS no Supabase e checagens no back-end).

Critérios de aceite:

Usuários não autenticados não acessam rotas protegidas.

Admin não enxerga telas de membro como membro (a não ser em modo 'visualizar como').

Logs/auditoria para ações administrativas relevantes.

## 7.2 Cadastro, Link de Indicação e Entrada na Rede

### FR-04 - Cadastro de novo membro

Permitir cadastro de membro no LRP e criação/atualização do cliente correspondente na Shopify.

Critérios de aceite:

Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail).

Link do membro funciona e atribui corretamente a hierarquia (parent/child).

Acesso a preço de membro funciona para o e-mail cadastrado.

### FR-05 - Captura de link de indicação

Capturar ref/UTM/cookies e vincular o novo membro ao patrocinador (N0) como N1.

Critérios de aceite:

Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail).

Link do membro funciona e atribui corretamente a hierarquia (parent/child).

Acesso a preço de membro funciona para o e-mail cadastrado.

### FR-06 - Regra para cadastro sem link

Quando não houver ref, aplicar regra de alocação definida pela Contratante (TBD no Anexo de Decisões).

Critérios de aceite:

Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail).

Link do membro funciona e atribui corretamente a hierarquia (parent/child).

Acesso a preço de membro funciona para o e-mail cadastrado.

### FR-07 - Geração de link único

Gerar e exibir link único por membro para convites e rastreio.

Critérios de aceite:

Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail).

Link do membro funciona e atribui corretamente a hierarquia (parent/child).

Acesso a preço de membro funciona para o e-mail cadastrado.

### FR-08 - Ativação de preço de membro

Após cadastro, assegurar acesso a preços especiais na Shopify (ex.: via tags/segmento).

Critérios de aceite:

Cadastro cria registro no Supabase e sincroniza com Shopify sem duplicidade (idempotência por e-mail).

Link do membro funciona e atribui corretamente a hierarquia (parent/child).

Acesso a preço de membro funciona para o e-mail cadastrado.

## 7.3 Rede (Árvore) e Visualização

### FR-09 - Persistência da rede

Armazenar relações parent-child da rede e permitir consultas por subárvore.

Critérios de aceite:

Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós).

Compressão não quebra integridade (sem ciclos; sem órfãos).

Admin consegue buscar membro e abrir a rede completa.

### FR-10 - Visualização da rede no painel do membro

Exibir árvore da rede com contato, nível, CV, status ativo/inativo.

Critérios de aceite:

Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós).

Compressão não quebra integridade (sem ciclos; sem órfãos).

Admin consegue buscar membro e abrir a rede completa.

### FR-11 - Visualização da rede no painel admin

Admin pode visualizar a rede de qualquer membro com os mesmos dados do painel do membro.

Critérios de aceite:

Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós).

Compressão não quebra integridade (sem ciclos; sem órfãos).

Admin consegue buscar membro e abrir a rede completa.

### FR-12 - Regra de saída após 6 meses inativo

Após 6 meses sem ativar, remover membro da rede (compressão) e subir níveis abaixo.

Critérios de aceite:

Rede de um membro abre em até 3 segundos em condições normais (rede até 10.000 nós).

Compressão não quebra integridade (sem ciclos; sem órfãos).

Admin consegue buscar membro e abrir a rede completa.

## 7.4 CV (Valor Comissionável), Status e Rotinas Mensais

### FR-13 - Receber eventos de pedidos (Shopify Webhooks)

Processar pedidos pagos/cancelados/estornados para atualizar CV e base de comissão.

Critérios de aceite:

Cada pedido é processado uma única vez (idempotência por shopify_order_id).

Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify.

Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar).

### FR-14 - Cálculo de CV por pedido

Calcular CV do pedido a partir de CV por produto/variante (metafield) e armazenar no ledger.

Critérios de aceite:

Cada pedido é processado uma única vez (idempotência por shopify_order_id).

Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify.

Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar).

### FR-15 - Status Ativo/Inativo mensal

Marcar membro/parceira como Ativo quando CV do mês >= 200; caso contrário Inativo.

Critérios de aceite:

Cada pedido é processado uma única vez (idempotência por shopify_order_id).

Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify.

Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar).

### FR-16 - Reset mensal

Executar rotina mensal para zerar CV do mês e resetar status (e refletir na Shopify).

Critérios de aceite:

Cada pedido é processado uma única vez (idempotência por shopify_order_id).

Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify.

Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar).

### FR-17 - Separação de CV (próprio vs rede)

No painel do membro, exibir CV de compras próprias separado de CV gerado pela rede.

Critérios de aceite:

Cada pedido é processado uma única vez (idempotência por shopify_order_id).

Mudanças de status (Ativo/Inativo) refletem no LRP e na Shopify.

Reset mensal roda com log e pode ser reexecutado de forma segura (sem duplicar).

## 7.5 Cálculo de Níveis (Membro/Parceira/Líder/Diretora/Head)

### FR-18 - Recalcular nível automaticamente

Recalcular nível do membro baseado em regras de liderança e volumes de rede.

Critérios de aceite:

Mudança de nível fica registrada com data e justificativa (cálculo).

Painel exibe nível atual e requisitos faltantes para o próximo nível.

### FR-19 - Status 'Líder em Formação' (90 dias)

Aplicar status temporário por 90 dias ao trazer a primeira parceira; comissionar como líder no período.

Critérios de aceite:

Mudança de nível fica registrada com data e justificativa (cálculo).

Painel exibe nível atual e requisitos faltantes para o próximo nível.

### FR-20 - Rebaixamento automático

Rebaixar nível quando requisitos deixam de ser atendidos (exceto regra do Royalty para Head).

Critérios de aceite:

Mudança de nível fica registrada com data e justificativa (cálculo).

Painel exibe nível atual e requisitos faltantes para o próximo nível.

## 7.6 Motor de Comissões e Ledger (auditável)

### FR-21 - Ledger de comissões

Registrar cada comissão com origem (pedido), beneficiário, regra, percentual e valor.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-22 - Fast-Track

Aplicar as regras e janelas de tempo do Fast-Track para N0 sobre N1 e para Líder sobre N2.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-23 - Comissão Perpétua

Aplicar regras e percentuais por nível e respeitar bloqueio durante Fast-Track (60 dias).

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-24 - Bônus 3

Detectar marcos e creditar bônus quando a rede atender requisitos e estiver ativa.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-25 - Leadership Bônus

Creditar 3% (Diretora) e 4% (Head) sobre CV da rede conforme regras.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-26 - Royalty

Separar rede ao formar nova Head e creditar 3% do CV da nova rede à Head formadora.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-27 - Detalhamento por tipo de comissão

No painel do membro, permitir expandir detalhes do saldo por tipo de comissão.

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

### FR-28 - Saldo em análise (trava)

Manter saldo separado por 'em análise' conforme regra a ser fornecida (TBD).

Critérios de aceite:

Para qualquer valor pago, o admin consegue auditar quais pedidos geraram o crédito.

Cálculos são reprocessáveis sem duplicação (ledger com idempotência).

Telas mostram totals e detalhamento consistente com o ledger.

## 7.7 Saques, Documentos e Pagamentos

### FR-29 - Solicitação de saque

Parceira solicita saque do saldo disponível; sistema exige atualização de cadastro no momento do saque.

Critérios de aceite:

Não permitir saque para conta em nome de terceiros.

Bloquear saque acima das regras sem documento obrigatório.

Registrar status do saque e logs de pagamento.

### FR-30 - Upload e validação de NF-e

Para PJ, permitir upload/registro de NF-e e validar emitente/valor antes de aprovar pagamento.

Critérios de aceite:

Não permitir saque para conta em nome de terceiros.

Bloquear saque acima das regras sem documento obrigatório.

Registrar status do saque e logs de pagamento.

### FR-31 - Emissão de RPA (CPF)

Para CPF, gerar RPA automaticamente, aplicar retenções e registrar líquido/pago.

Critérios de aceite:

Não permitir saque para conta em nome de terceiros.

Bloquear saque acima das regras sem documento obrigatório.

Registrar status do saque e logs de pagamento.

### FR-32 - Workflow de aprovação

Admin aprova/rejeita solicitações com motivo e histórico.

Critérios de aceite:

Não permitir saque para conta em nome de terceiros.

Bloquear saque acima das regras sem documento obrigatório.

Registrar status do saque e logs de pagamento.

### FR-33 - Integração de pagamento automático (opcional)

Integrar com ferramenta terceira para realizar transferência automática após aprovação.

Critérios de aceite:

Não permitir saque para conta em nome de terceiros.

Bloquear saque acima das regras sem documento obrigatório.

Registrar status do saque e logs de pagamento.

## 7.8 Painel do Admin

### FR-34 - Gestão de admins

Admin pode cadastrar outros admins e definir permissões.

Critérios de aceite:

Ações manuais ficam registradas em auditoria.

Filtros retornam resultados consistentes com o ledger e rede.

### FR-35 - Dashboard global

Exibir membros cadastrados, ativos, pessoas por nível, CV global e comissão global.

Critérios de aceite:

Ações manuais ficam registradas em auditoria.

Filtros retornam resultados consistentes com o ledger e rede.

### FR-36 - Filtros por modo de comissionamento

Permitir filtrar KPIs por fast-track, perpétua, bônus 3 e leadership.

Critérios de aceite:

Ações manuais ficam registradas em auditoria.

Filtros retornam resultados consistentes com o ledger e rede.

### FR-37 - Gestão de membro

Admin pode editar dados, ajustar CV/comissão, ajustar nível, bloquear e trocar membro de rede.

Critérios de aceite:

Ações manuais ficam registradas em auditoria.

Filtros retornam resultados consistentes com o ledger e rede.

### FR-38 - Gestão de tags

Admin pode dar/alterar/remover tags e usar tags como filtro; refletir tags na Shopify quando aplicável.

Critérios de aceite:

Ações manuais ficam registradas em auditoria.

Filtros retornam resultados consistentes com o ledger e rede.

# 8. Requisitos Não Funcionais (NFR)

Segurança: RLS no Supabase para isolar dados por usuário; rotas admin protegidas; validação no servidor.

Auditoria: logs de alterações manuais e de processamento de webhooks.

Observabilidade: painel/log de falhas de webhooks e opção de reprocessamento.

Performance: rede e dashboards devem abrir em tempo aceitável; uso de agregações e jobs quando necessário.

Confiabilidade: idempotência para webhooks e rotinas (evitar duplicidade de CV/comissão).

# 9. Fora de Escopo (nesta versão)

Design/branding definitivo além do necessário para um painel funcional (UI/UX final depende de referência).

Criação/gestão de campanhas de marketing, e-mails transacionais avançados e automações fora do LRP.

Integração com ERP/Contabilidade além da geração de documentos e relatórios previstos.

Regra e implementação de 'Creatina Mensal Grátis' na experiência de compra caso exija customização avançada de checkout (pode virar fase 2 se necessário).

# 10. Itens a Decidir (TBD) - precisam ser definidos para implementação

| ID | Tema | Decisão necessária |
| --- | --- | --- |
| TBD-01 | Regra para cadastro sem link (alocação de rede) | Definir: rede fixa / aleatória / nova rede / outra. |
| TBD-02 | Valor X do limite de saque CPF por solicitação | Definir valor e se existe limite mensal adicional. |
| TBD-03 | Regras da 'trava' (saldo em análise) | Definir prazo e condições (ex.: chargeback, cancelamento, janela de devolução). |
| TBD-04 | Provedor de pagamentos (fintech) e formato de integração | Escolher provedor e confirmar se entra na fase 1. |
| TBD-05 | Metafield/estrutura oficial do CV por produto | Definir campo(s) e regras (produto, variante, bundles). |

# 11. Entregáveis

Aplicação Next.js (front-end e back-end) com ambientes de desenvolvimento e produção.

Schema do banco Supabase (tabelas, índices, RLS) e migrations.

Configuração de integração Shopify (webhooks, app scopes e documentação de instalação).

Documentação técnica (README): como rodar local, variáveis de ambiente, rotinas e reprocessamento.

Documentação funcional: guia do admin e do membro.

# 12. Critérios de Aceite do Projeto (macro)

Cadastro com link cria membro, vincula rede e libera preço de membro na Shopify.

Painel do membro mostra CV (próprio e rede), status, nível, saldo e detalhamento por comissão.

Admin visualiza KPIs globais, busca membros e executa ações administrativas com auditoria.

Webhooks de pedidos atualizam CV e comissões com idempotência.

Rotina mensal de reset executa corretamente e é auditável.

Fluxo de saque funciona com regras de CPF/PJ e anexos obrigatórios.

