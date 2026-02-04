# Plano de Testes para Demonstração — Biohelp LRP
**Data:** 23/01/2026  
**Objetivo:** Validar em ambiente real todas as funcionalidades implementadas nas Sprints 1-7  
**Ambiente:** Produção (Vercel) + Supabase + Shopify

---

## 📋 Resumo Executivo

Este documento contém um roteiro completo de testes para demonstração ao vivo do sistema LRP Biohelp, cobrindo:

| Sprint | Funcionalidades | Testáveis |
|--------|-----------------|-----------|
| Sprint 1 | Cadastro, Auth, Shopify Sync | ✅ |
| Sprint 2 | CV, Status, Webhooks | ✅ (com simulação) |
| Sprint 3 | Rede Visual, Níveis | ✅ |
| Sprint 4 | Comissões (Motor + Ledger) | ✅ (verificação de dados) |
| Sprint 5 | Saques + Workflow | ✅ |
| Sprint 6 | Admin Avançado | ✅ |
| Sprint 7 | Creatina Grátis | ✅ (API) |

---

## 🔗 URLs de Acesso

### Produção (Vercel)
- **Home:** https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/
- **Login:** https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/login
- **Dashboard:** https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/dashboard
- **Admin:** https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/admin

### Local (se necessário)
- http://localhost:3000/

---

## 🔑 Credenciais de Teste

### Admin
- **URL:** /admin
- **Email:** admin@biohelp.test
- **Senha:** 123456

### Parceira (Dashboard)
- **URL:** /dashboard
- **Email:** sponsor@biohelp.test
- **Senha:** sponsor123

---

## 📝 ROTEIRO DE DEMONSTRAÇÃO

### Ordem Sugerida de Execução

1. **Bloco A:** Autenticação e Acesso (5 min)
2. **Bloco B:** Cadastro de Novo Membro (10 min)
3. **Bloco C:** Dashboard do Membro (10 min)
4. **Bloco D:** Visualização da Rede (5 min)
5. **Bloco E:** Painel Admin - Visão Geral (10 min)
6. **Bloco F:** Gestão de Membros (Admin) (10 min)
7. **Bloco G:** Sistema de Saques (10 min)
8. **Bloco H:** Verificação de Comissões (5 min)
9. **Bloco I:** APIs e Integrações (5 min)

**Tempo Total Estimado:** ~70 minutos

---

## 🧪 BLOCO A — Autenticação e Acesso (Sprint 1)

### Teste A.1 — Login como Admin
**Objetivo:** Validar FR-02 (Autenticação de admin)

**Passos:**
1. Abrir https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/login
2. Inserir email: `admin@biohelp.test`
3. Inserir senha: `123456`
4. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Redirecionamento para `/admin`
- ✅ Painel admin carrega corretamente
- ✅ Cards de estatísticas visíveis

**Evidência:** Screenshot do painel admin

---

### Teste A.2 — Login como Parceira
**Objetivo:** Validar FR-01 (Autenticação de membro)

**Passos:**
1. Fazer logout (se logado)
2. Abrir /login
3. Inserir email: `sponsor@biohelp.test`
4. Inserir senha: `sponsor123`
5. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Redirecionamento para `/dashboard`
- ✅ Dashboard do membro carrega
- ✅ Nome e email exibidos corretamente

**Evidência:** Screenshot do dashboard

---

### Teste A.3 — Acesso Negado (sem autenticação)
**Objetivo:** Validar FR-03 (Controle de permissões)

**Passos:**
1. Fazer logout
2. Tentar acessar diretamente: `/dashboard`
3. Tentar acessar diretamente: `/admin`

**Resultado Esperado:**
- ✅ Redirecionamento para `/login` em ambos os casos
- ✅ Mensagem de "não autenticado" (se aplicável)

**Evidência:** Screenshot do redirect

---

## 🧪 BLOCO B — Cadastro de Novo Membro (Sprint 1)

### Teste B.1 — Cadastro com Link de Indicação
**Objetivo:** Validar FR-04, FR-05, FR-07, FR-08, FR-09

**Dados Fictícios para Cadastro:**
```
Nome: Maria Teste Demo
Email: maria.demo.{timestamp}@teste.com
Senha: Demo@12345
```
*Substituir {timestamp} por horário atual para garantir email único*

**Passos:**
1. Obter link de indicação do sponsor existente
   - Login como `sponsor@biohelp.test`
   - Copiar link de convite do dashboard
   - Exemplo: `/join?ref=SPONSOR01`
2. Abrir em janela anônima/privada
3. Preencher formulário:
   - Nome: Maria Teste Demo
   - Email: maria.demo.20260123@teste.com
   - Senha: Demo@12345
4. Clicar em "Cadastrar"

**Resultado Esperado:**
- ✅ Membro criado no Supabase (tabela `members`)
- ✅ `sponsor_id` preenchido corretamente
- ✅ `ref_code` único gerado
- ✅ Registro em `referral_events` com ref_code_used
- ✅ Customer criado/atualizado no Shopify (verificar tags)
- ✅ Redirecionamento para /dashboard
- ✅ Dashboard mostra: nome, email, sponsor, link de convite

**Verificação no Supabase:**
```sql
SELECT id, name, email, ref_code, sponsor_id, status 
FROM members 
WHERE email = 'maria.demo.20260123@teste.com';
```

**Verificação no Shopify Admin:**
- Buscar customer pelo email
- Verificar tags: `lrp_member`, `lrp_ref:XXX`, `lrp_sponsor:SPONSOR01`, `lrp_status:pending`

**Evidência:** Screenshot do dashboard + Shopify Admin

---

### Teste B.2 — Tentativa de Cadastro com Email Existente
**Objetivo:** Validar unicidade de email (FR-04)

**Passos:**
1. Abrir `/join?ref=SPONSOR01` em janela anônima
2. Tentar cadastrar com email já existente: `sponsor@biohelp.test`

**Resultado Esperado:**
- ✅ Erro 409 (EMAIL_EXISTS)
- ✅ Mensagem: "Email já cadastrado. Faça login."
- ✅ Nenhum registro duplicado criado

**Evidência:** Screenshot da mensagem de erro

---

### Teste B.3 — Verificação do Link de Convite
**Objetivo:** Validar FR-07 (Geração de link único)

**Passos:**
1. Login como o membro recém-criado (maria.demo...)
2. Verificar se o link de convite está visível
3. Copiar o link
4. Verificar formato: `/join?ref={ref_code}`

**Resultado Esperado:**
- ✅ Link único gerado
- ✅ ref_code é imutável
- ✅ Link funcional (pode abrir em nova aba)

**Evidência:** Screenshot do link no dashboard

---

## 🧪 BLOCO C — Dashboard do Membro (Sprints 2, 3, 4)

### Teste C.1 — Visualização de CV
**Objetivo:** Validar FR-14, FR-15, FR-17

**Passos:**
1. Login como parceira existente: `sponsor@biohelp.test`
2. Observar seção de CV no dashboard

**Verificar:**
- ✅ CV atual do mês exibido
- ✅ Barra de progresso para 200 CV (meta de ativação)
- ✅ Status (pending/active/inactive) correto
- ✅ CV próprio vs CV da rede separados (se implementado)

**Evidência:** Screenshot da seção CV

---

### Teste C.2 — Visualização de Nível
**Objetivo:** Validar FR-18, FR-19

**Passos:**
1. No dashboard, observar card de nível

**Verificar:**
- ✅ Nível atual exibido (membro/parceira/líder/etc.)
- ✅ Requisitos para próximo nível listados
- ✅ Progresso visual

**Evidência:** Screenshot do card de nível

---

### Teste C.3 — Visualização de Comissões
**Objetivo:** Validar FR-21, FR-27

**Passos:**
1. Navegar para `/dashboard/commissions`

**Verificar:**
- ✅ Saldo total exibido
- ✅ Detalhamento por tipo de comissão:
  - Fast-Track
  - Perpétua
  - Bônus 3
  - Leadership
  - Royalty
- ✅ Valores consistentes com o ledger

**Evidência:** Screenshot da página de comissões

---

## 🧪 BLOCO D — Visualização da Rede (Sprint 3)

### Teste D.1 — Árvore de Rede do Membro
**Objetivo:** Validar FR-10

**Passos:**
1. Login como parceira: `sponsor@biohelp.test`
2. Navegar para `/dashboard/network`

**Verificar:**
- ✅ Árvore de rede carrega
- ✅ Membros N1 listados
- ✅ Para cada membro: nome, email, CV, status, nível
- ✅ Telefone respeita `phone_visibility`
- ✅ Performance aceitável (< 3 segundos)

**Evidência:** Screenshot da árvore

---

### Teste D.2 — Expandir Níveis da Rede
**Objetivo:** Validar profundidade da rede

**Passos:**
1. Na árvore, expandir um nó para ver N2
2. Verificar se os dados carregam corretamente

**Resultado Esperado:**
- ✅ N2, N3, etc. carregam sob demanda
- ✅ Dados consistentes

**Evidência:** Screenshot expandido

---

## 🧪 BLOCO E — Painel Admin - Visão Geral (Sprint 6)

### Teste E.1 — Dashboard Global Admin
**Objetivo:** Validar FR-35

**Passos:**
1. Login como admin: `admin@biohelp.test`
2. Observar página `/admin`

**Verificar KPIs:**
- ✅ Total de membros cadastrados
- ✅ Membros ativos
- ✅ Membros por nível (membro, parceira, líder, etc.)
- ✅ CV global
- ✅ Comissão global
- ✅ Saques pendentes

**Evidência:** Screenshot do dashboard admin

---

### Teste E.2 — API de Estatísticas
**Objetivo:** Validar `/api/admin/stats`

**Passos (usando navegador ou Postman):**
1. Chamar `GET /api/admin/stats` (autenticado como admin)

**Resultado Esperado:**
```json
{
  "members": {
    "total": X,
    "active": X,
    "inactive": X,
    "pending": X,
    "by_level": {...}
  },
  "cv": {...},
  "commissions": {...},
  "payouts": {...}
}
```

**Evidência:** Response da API

---

### Teste E.3 — Listagem de Membros
**Objetivo:** Validar busca e listagem

**Passos:**
1. No painel admin, ir para lista de membros
2. Buscar por email: `sponsor@biohelp.test`

**Resultado Esperado:**
- ✅ Membro encontrado
- ✅ Dados corretos exibidos
- ✅ Link para detalhes funciona

**Evidência:** Screenshot da busca

---

## 🧪 BLOCO F — Gestão de Membros Admin (Sprint 6)

### Teste F.1 — Ver Detalhes do Membro
**Objetivo:** Validar FR-37

**Passos:**
1. No admin, clicar em um membro da lista
2. Verificar página de detalhes

**Verificar:**
- ✅ Dados pessoais (nome, email, telefone)
- ✅ Status e nível
- ✅ CV atual
- ✅ Sponsor
- ✅ Rede (N1s)
- ✅ Comissões
- ✅ Histórico

**Evidência:** Screenshot da página de detalhes

---

### Teste F.2 — Ajustar Nível Manualmente
**Objetivo:** Validar ação administrativa

**Passos:**
1. Na página de detalhes do membro
2. Clicar em "Ajustar Nível"
3. Selecionar novo nível (ex: parceira → líder)
4. Confirmar

**Resultado Esperado:**
- ✅ Nível atualizado
- ✅ Registro em `member_level_history`
- ✅ Auditoria registrada

**⚠️ CUIDADO:** Fazer com membro de teste, não com dados reais importantes

**Evidência:** Screenshot antes/depois + query no Supabase

---

### Teste F.3 — Resync Shopify
**Objetivo:** Validar sincronização manual

**Passos:**
1. Na página de detalhes do membro
2. Clicar em "Resync Shopify"
3. Aguardar conclusão

**Resultado Esperado:**
- ✅ Tags atualizadas no Shopify
- ✅ Status de sync = 'ok'
- ✅ Timestamp atualizado

**Verificação no Shopify Admin:**
- Buscar customer
- Verificar tags atualizadas

**Evidência:** Screenshot do Shopify Admin

---

### Teste F.4 — Gestão de Tags
**Objetivo:** Validar FR-38

**Passos:**
1. Na página de detalhes do membro
2. Ver tags atuais
3. Adicionar uma tag de teste: `teste_demo`
4. Verificar sync com Shopify

**Resultado Esperado:**
- ✅ Tag adicionada no sistema
- ✅ Tag refletida no Shopify (se sync ativo)

**⚠️ LEMBRETE:** Remover tag de teste após demonstração

**Evidência:** Screenshot das tags

---

## 🧪 BLOCO G — Sistema de Saques (Sprint 5)

### Teste G.1 — Visualizar Página de Saques (Membro)
**Objetivo:** Validar FR-29

**Passos:**
1. Login como parceira: `sponsor@biohelp.test`
2. Navegar para `/dashboard/payouts`

**Verificar:**
- ✅ Saldo disponível exibido
- ✅ Saldo pendente (em análise) separado
- ✅ Histórico de saques (se houver)
- ✅ Botão de "Solicitar Saque"

**Evidência:** Screenshot da página

---

### Teste G.2 — Formulário de Solicitação de Saque
**Objetivo:** Validar regras de saque (FR-29, FR-30, FR-31)

**Passos:**
1. Clicar em "Solicitar Saque"
2. Verificar campos do formulário:
   - Valor
   - Tipo de pessoa (PF/MEI/PJ)
   - Dados bancários
   - PIX

**Verificar Validações:**
- ✅ Mínimo R$ 100 para saque
- ✅ PF: limite de R$ 1.000/mês
- ✅ PJ: campo para NF-e
- ✅ Conta deve ser do titular

**⚠️ NOTA:** Não precisa finalizar o saque se não houver saldo. Demonstrar apenas o formulário e validações.

**Evidência:** Screenshot do formulário

---

### Teste G.3 — Painel Admin de Saques
**Objetivo:** Validar FR-32 (Workflow de aprovação)

**Passos:**
1. Login como admin
2. Navegar para `/admin/payouts`

**Verificar:**
- ✅ Lista de solicitações de saque
- ✅ Filtros por status (pendente, aprovado, rejeitado, etc.)
- ✅ Detalhes de cada solicitação
- ✅ Ações: Aprovar, Rejeitar, Solicitar documento

**Evidência:** Screenshot do painel

---

### Teste G.4 — Simular Workflow (se houver solicitação)
**Objetivo:** Demonstrar fluxo de aprovação

**Se existir uma solicitação pendente:**
1. Abrir detalhes
2. Verificar documentos anexados
3. Demonstrar opções de ação
4. (Opcional) Aprovar ou solicitar mais informações

**Evidência:** Screenshot das ações

---

## 🧪 BLOCO H — Verificação de Comissões (Sprint 4)

### Teste H.1 — Consultar Ledger de Comissões (Admin)
**Objetivo:** Validar FR-21 (Auditoria)

**Passos:**
1. Login como admin
2. Navegar para `/admin/commissions` ou usar API

**Via API:**
```
GET /api/admin/commissions
```

**Verificar:**
- ✅ Listagem de comissões no ledger
- ✅ Cada comissão tem:
  - member_id
  - commission_type
  - amount
  - source_order_id
  - source_member_id
  - reference_month
  - available_at (Net-15)

**Evidência:** Screenshot ou response da API

---

### Teste H.2 — Verificar Tipos de Comissão
**Objetivo:** Validar implementação de cada tipo

**Query no Supabase:**
```sql
SELECT commission_type, COUNT(*), SUM(amount)
FROM commission_ledger
GROUP BY commission_type;
```

**Tipos esperados:**
- fast_track_30
- fast_track_20
- perpetual
- bonus_3_level_1/2/3
- leadership
- royalty
- adjustment
- reversal

**Evidência:** Resultado da query

---

### Teste H.3 — Fast-Track Windows
**Objetivo:** Validar janelas de 60 dias

**Query no Supabase:**
```sql
SELECT * FROM fast_track_windows WHERE is_active = true;
```

**Verificar:**
- ✅ phase_1_ends_at (30 dias após started_at)
- ✅ phase_2_ends_at (60 dias após started_at)

**Evidência:** Resultado da query

---

## 🧪 BLOCO I — APIs e Integrações

### Teste I.1 — API de CV do Membro
**Objetivo:** Validar `/api/members/me/cv`

**Passos:**
1. Estar logado como parceira
2. Chamar `GET /api/members/me/cv`

**Resultado Esperado:**
```json
{
  "current_cv": X,
  "month_year": "2026-01",
  "status": "active|inactive|pending",
  "progress_to_active": X%
}
```

**Evidência:** Response da API

---

### Teste I.2 — API de Rede do Membro
**Objetivo:** Validar `/api/members/me/network`

**Passos:**
1. Estar logado como parceira
2. Chamar `GET /api/members/me/network`

**Resultado Esperado:**
```json
{
  "network": [
    {
      "id": "...",
      "name": "...",
      "email": "...",
      "level": "...",
      "status": "...",
      "cv_current_month": X
    }
  ],
  "total_count": X
}
```

**Evidência:** Response da API

---

### Teste I.3 — API de Creatina Grátis
**Objetivo:** Validar TBD-019 (Sprint 7)

**Passos:**
1. Estar logado como membro ativo (CV >= 200)
2. Chamar `GET /api/members/me/free-creatine`

**Resultado Esperado:**
```json
{
  "eligible": true|false,
  "already_claimed_this_month": true|false,
  "month_year": "2026-01"
}
```

**Evidência:** Response da API

---

### Teste I.4 — Verificar Integração Shopify
**Objetivo:** Confirmar sync funcionando

**Verificações:**
1. Selecionar um membro com sync OK
2. No Shopify Admin, buscar o customer
3. Confirmar que as tags LRP estão presentes

**Tags esperadas:**
- `lrp_member`
- `lrp_ref:{ref_code}`
- `lrp_sponsor:{sponsor_ref|none}`
- `lrp_status:{pending|active|inactive}`

**Evidência:** Screenshot do Shopify Admin

---

## 📊 Dados no Banco de Dados (Estado Atual - 23/01/2026)

### Membros Cadastrados

| Nome | Email | ref_code | Status | Nível | CV Mensal | Role |
|------|-------|----------|--------|-------|-----------|------|
| Admin Biohelp | admin@biohelp.test | ADMIN001 | active | membro | 0.00 | admin |
| Sponsor Teste | sponsor@biohelp.test | SPONSOR01 | active | parceira | 575.00 | member |
| Membro Teste | membro@teste.com | IaUZqzPe | pending | membro | 0.00 | member |

### Estrutura de Rede Atual

```
Admin Biohelp (ADMIN001) - SEM SPONSOR (raiz)
    └── (sem indicados)

Sponsor Teste (SPONSOR01) - SEM SPONSOR (raiz)
    └── Membro Teste (IaUZqzPe)
```

### Pedidos Processados

| Número | Status | CV Total | Valor | Membro |
|--------|--------|----------|-------|--------|
| TEST-001 | paid | 250.00 | R$ 250.00 | Sponsor Teste |
| 1001 | paid | 150.00 | R$ 150.00 | Sponsor Teste |
| 1002 | paid | 150.00 | R$ 150.00 | Sponsor Teste |

**Total CV do Sponsor Teste:** 575 CV (550 CV pedidos + algum ajuste = 575)

### Comissões Registradas

| Tipo | Quantidade | Valor Total |
|------|------------|-------------|
| fast_track_30 | 1 | R$ 45.00 |

### Saldo de Comissões

| Membro | Total Ganho | Disponível | Pendente | Fast-Track Mês |
|--------|-------------|------------|----------|----------------|
| Sponsor Teste | R$ 45.00 | R$ 45.00 | R$ 0.00 | R$ 45.00 |
| Admin Biohelp | R$ 0.00 | R$ 0.00 | R$ 0.00 | R$ 0.00 |
| Membro Teste | R$ 0.00 | R$ 0.00 | R$ 0.00 | R$ 0.00 |

### Integração Shopify (Customers Sincronizados)

| Membro | Shopify Customer ID | Último Sync | Status |
|--------|---------------------|-------------|--------|
| Membro Teste | gid://shopify/Customer/7916645122082 | 06/01/2026 | ok |
| Sponsor Teste | gid://shopify/Customer/7934865473570 | 09/01/2026 | ok |
| Admin Biohelp | gid://shopify/Customer/7940355653666 | 09/01/2026 | ok |

---

### Queries Úteis para Verificação

**Listar todos os membros:**
```sql
SELECT id, name, email, ref_code, status, level, current_cv_month 
FROM members 
ORDER BY created_at DESC;
```

**Ver rede de um membro:**
```sql
SELECT m.name, m.email, m.level, m.status, m.current_cv_month
FROM members m
WHERE m.sponsor_id = '{MEMBER_ID}';
```

**Ver comissões de um membro:**
```sql
SELECT * FROM commission_ledger 
WHERE member_id = '{MEMBER_ID}'
ORDER BY created_at DESC;
```

**Ver saldo consolidado:**
```sql
SELECT * FROM commission_balances 
WHERE member_id = '{MEMBER_ID}';
```

---

## ⚠️ Dados Fictícios para Testes

### Para Criar Novos Membros

```
Nome: [Nome] Teste Demo
Email: [nome].demo.{YYYYMMDD}@teste.com
Senha: Demo@12345
```

### Para Simular Webhook (se necessário)

**⚠️ ATENÇÃO:** Não simular webhooks em produção com dados reais da Shopify.

Para ambiente de teste, pode usar o endpoint:
```
POST /api/webhooks/shopify/orders/paid
Headers:
  X-Shopify-Hmac-Sha256: {calcular}
  X-Shopify-Topic: orders/paid
Body: {payload do webhook}
```

---

## 🎯 Funcionalidades NÃO Testáveis Diretamente

### 1. Integração Asaas (Pagamentos)
- **Status:** Aguardando credenciais
- **Workaround:** Demonstrar workflow manual de aprovação

### 2. Webhooks Shopify Reais
- **Motivo:** Precisa de pedido real na loja
- **Workaround:** Mostrar dados já processados no banco

### 3. Cron Jobs
- **Motivo:** Executam em horário específico
- **Workaround:** Mostrar endpoints disponíveis:
  - `/api/cron/close-monthly-cv` (fechamento mensal)
  - `/api/cron/network-compression` (regra 6 meses)

### 4. Shopify Discount para Creatina
- **Status:** Pendente configuração na loja
- **Workaround:** Mostrar API de elegibilidade

---

## ✅ Checklist Final de Demonstração

### Pré-Demonstração
- [ ] Verificar ambiente está online (Vercel)
- [ ] Verificar conexão com Supabase
- [ ] Ter credenciais de teste prontas
- [ ] Preparar janela anônima para cadastro
- [ ] Ter acesso ao Shopify Admin

### Durante a Demonstração
- [ ] Gravar tela (se possível)
- [ ] Fazer screenshots de cada etapa
- [ ] Anotar problemas encontrados

### Pós-Demonstração
- [ ] Limpar dados de teste criados (opcional)
- [ ] Documentar issues encontrados
- [ ] Atualizar ACCEPTANCE.md se necessário

---

## 📝 Template de Registro de Resultados

```markdown
## Resultado do Teste [ID]

**Executado em:** YYYY-MM-DD HH:MM
**Executor:** [Nome]

**Status:** ✅ Passou | ❌ Falhou | ⚠️ Parcial

**Observações:**
- ...

**Screenshot:** [link ou anexo]

**Issues encontrados:**
- [ ] Issue 1
- [ ] Issue 2
```

---

**Documento criado em:** 23/01/2026  
**Versão:** 1.0  
**Autor:** Sistema de Desenvolvimento
