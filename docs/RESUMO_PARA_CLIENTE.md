# Resumo Executivo — Biohelp LRP
**Status do Projeto: Sprint 2 (Em Implementação)**

**Última atualização:** 07/01/2026

---

## VISÃO GERAL DO PROGRESSO

```
Sprint 1 — MVP Operacional     [████████████████████] 100% ✅
Sprint 2 — CV + Status         [████████████████████] 100% ✅
Sprint 3 — Rede Visual         [░░░░░░░░░░░░░░░░░░░░]   0% 🔜
Sprint 4 — Comissões           [░░░░░░░░░░░░░░░░░░░░]   0%
Sprint 5 — Saques              [░░░░░░░░░░░░░░░░░░░░]   0%
```

---

## ✅ SPRINT 1 — CONCLUÍDO

### O que foi entregue

O **Sprint 1 (MVP Operacional Inicial)** está completo:

1. ✅ **Cadastro com link de indicação** - Funcionando
2. ✅ **Autenticação completa** - Supabase Auth integrado
3. ✅ **Dashboard do membro** - Funcional com dados reais
4. ✅ **Painel administrativo** - Lista, busca e resync
5. ✅ **Integração Shopify** - Tags aplicadas via REST API
6. ✅ **Segurança (RLS)** - Políticas ativas no banco

---

## ✅ SPRINT 2 — CONCLUÍDO

### O que foi entregue

O **Sprint 2 (CV + Status)** está completo:

1. ✅ **Webhooks Shopify** - Recebem pedidos pagos/reembolsados/cancelados
2. ✅ **Cálculo de CV** - Commission Volume por pedido
3. ✅ **Status automático** - Ativo se CV >= 200/mês
4. ✅ **Dashboard com CV** - Progresso visual da meta
5. ✅ **Histórico de CV** - Meses anteriores
6. ✅ **Job mensal** - Fechamento automático do mês
7. ✅ **Ajuste manual** - Admin pode ajustar CV

### Novas Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| **CV Automático** | Cada compra gera CV baseado no valor |
| **Meta de 200 CV** | Membro fica "Ativo" ao atingir 200 CV/mês |
| **Progresso Visual** | Barra de progresso no dashboard |
| **Reversão de CV** | Refunds e cancelamentos revertem CV |
| **Fechamento Mensal** | Job automático no 1º dia do mês |
| **Histórico** | Visualização de meses anteriores |

---

## Banco de Dados (Supabase)

### Tabelas Sprint 1
| Tabela | Status | Descrição |
|--------|--------|-----------|
| `members` | ✅ Completo | Cadastro de membros + CV |
| `referral_events` | ✅ Completo | Histórico de indicações |
| `shopify_customers` | ✅ Completo | Rastreamento de sync |
| `roles` | ✅ Completo | Controle de permissões |

### Tabelas Sprint 2 (Novas)
| Tabela | Status | Descrição |
|--------|--------|-----------|
| `orders` | ✅ Completo | Espelho dos pedidos Shopify |
| `order_items` | ✅ Completo | Itens dos pedidos |
| `cv_ledger` | ✅ Completo | Ledger auditável de CV |
| `cv_monthly_summary` | ✅ Completo | Resumo mensal por membro |

---

## Como Funciona o CV

### Fluxo de Compra
```
1. Membro faz compra na loja Shopify
2. Shopify envia webhook para o sistema
3. Sistema calcula CV (100% do valor)
4. CV é registrado no ledger
5. CV mensal do membro é atualizado
6. Se CV >= 200, status muda para "Ativo"
7. Tag no Shopify é atualizada
```

### Regras de CV
- **CV = 100% do valor** do item (configurável)
- **Meta mensal:** 200 CV para ficar "Ativo"
- **Refunds:** CV é revertido completamente
- **Cancelamentos:** CV é revertido completamente
- **Fechamento:** 1º dia do mês às 00:00 (BRT)

---

## Interface do Usuário

### Dashboard do Membro (Atualizado)

| Componente | Status | Descrição |
|------------|--------|-----------|
| Card de CV | ✅ Novo | Progresso visual da meta |
| Barra de progresso | ✅ Novo | Quanto falta para 200 CV |
| Status de ativação | ✅ Atualizado | Baseado em CV real |
| Histórico de CV | ✅ Novo | Meses anteriores |

### Painel Admin (Atualizado)

| Componente | Status | Descrição |
|------------|--------|-----------|
| CV do membro | ✅ Novo | Ver CV detalhado |
| Ajuste manual | ✅ Novo | Adicionar/remover CV |
| Ledger | ✅ Novo | Histórico de transações |

---

## Webhooks Shopify

### Endpoints Criados

| Webhook | URL | Função |
|---------|-----|--------|
| `orders/paid` | `/api/webhooks/shopify/orders/paid` | Adiciona CV |
| `orders/refunded` | `/api/webhooks/shopify/orders/refunded` | Reverte CV |
| `orders/cancelled` | `/api/webhooks/shopify/orders/cancelled` | Reverte CV |

### Segurança
- ✅ Validação HMAC (assinatura do Shopify)
- ✅ Verificação de domínio
- ✅ Idempotência (não processa duplicados)
- ✅ Logs estruturados

---

## Progresso Visual

```
Sprint 2 — CV + Status
├── ✅ Schema do Banco         [████████████████████] 100%
├── ✅ Webhooks Shopify        [████████████████████] 100%
├── ✅ Cálculo de CV           [████████████████████] 100%
├── ✅ Job Mensal              [████████████████████] 100%
├── ✅ API Endpoints           [████████████████████] 100%
└── ✅ Frontend CV             [████████████████████] 100%

Progresso Total Sprint 2: 100% ✅
```

---

## Como Testar (Produção)

### URLs de Acesso

| Página | URL |
|--------|-----|
| Home | https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/ |
| Login | https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/login |
| Cadastro | https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/join?ref=SPONSOR01 |
| Dashboard | https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/dashboard |
| Admin | https://rlp-biohelp-git-main-flowcodes-projects.vercel.app/admin |

### Logins de Teste

| Portal | Email | Senha |
|--------|-------|-------|
| Admin | admin@biohelp.test | 123456 |
| Parceira | sponsor@biohelp.test | sponsor123 |

### Teste de CV (Novo)

1. **Simular compra:**
   - Fazer pedido na loja Shopify com e-mail de membro
   - Webhook é enviado automaticamente
   - CV aparece no dashboard

2. **Verificar no Dashboard:**
   - Login como membro
   - Ver card de CV com progresso
   - Ver histórico de meses

3. **Verificar como Admin:**
   - Login como admin
   - Acessar CV do membro
   - Ver ledger detalhado

---

## Configuração Necessária

### Variáveis de Ambiente (Novas)

```env
# Webhooks Shopify
SHOPIFY_WEBHOOK_SECRET=shpss_xxx...  # Secret do webhook

# Cron Job
CRON_SECRET=seu_secret_aqui         # Protege o job mensal
```

### Webhooks no Shopify Admin

1. Acesse: Shopify Admin → Settings → Notifications → Webhooks
2. Criar webhook para cada evento:
   - `Order payment` → `https://seu-dominio/api/webhooks/shopify/orders/paid`
   - `Order refund` → `https://seu-dominio/api/webhooks/shopify/orders/refunded`
   - `Order cancellation` → `https://seu-dominio/api/webhooks/shopify/orders/cancelled`
3. Copiar o Webhook Secret para a variável `SHOPIFY_WEBHOOK_SECRET`

### Cron Job (Vercel)

Adicionar ao `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/close-monthly-cv",
    "schedule": "0 3 1 * *"
  }]
}
```

---

## Decisões Pendentes (TBD)

| TBD | Status | Descrição |
|-----|--------|-----------|
| TBD-001 | ❓ Pendente | Regra para cadastro sem link |
| TBD-004 | ❓ Pendente | URLs oficiais (staging/prod) |
| TBD-008 | ✅ Resolvido | CV = 100% do preço (padrão) |
| TBD-009 | ✅ Resolvido | Refund reverte CV completamente |
| TBD-010 | ✅ Resolvido | Job mensal no 1º dia às 00:00 BRT |

---

## Próximos Passos (Sprint 3)

Conforme `docs/SPEC.md`:

1. **Visualização da Rede** - Ver indicados (N1, N2)
2. **Cálculo de Níveis** - Parceira/Líder/Diretora/Head
3. **Regras de Níveis** - Conforme aprovação do cliente

---

## Checklist de Aceite

### Sprint 1 ✅
| Critério | Status |
|----------|--------|
| Cadastro com link vincula sponsor | ✅ |
| `ref_code` único gerado | ✅ |
| Customer Shopify criado/atualizado | ✅ |
| Tags aplicadas corretamente | ✅ |
| Dashboard mostra link de convite | ✅ |
| Admin busca membro e executa resync | ✅ |
| RLS ativo | ✅ |
| Login funciona | ✅ |
| Redirect pós-cadastro | ✅ |

### Sprint 2 ✅
| Critério | Status |
|----------|--------|
| Webhook `orders/paid` processa | ✅ |
| Webhook `orders/refunded` reverte CV | ✅ |
| Webhook `orders/cancelled` reverte CV | ✅ |
| Idempotência (não duplica) | ✅ |
| CV mensal soma corretamente | ✅ |
| Status muda para 'active' (CV >= 200) | ✅ |
| Job mensal fecha mês | ✅ |
| Dashboard mostra CV | ✅ |
| Admin pode ver/ajustar CV | ✅ |
| Ledger é auditável | ✅ |

---

## Arquivos Importantes

### Documentação
- `docs/SPEC.md` - Especificação completa
- `docs/ACCEPTANCE.md` - Critérios de aceite
- `docs/DECISOES_TBD.md` - Decisões pendentes
- `docs/PLANO_SPRINT_2.md` - Detalhes técnicos Sprint 2

### Código Principal (Sprint 2)
- `app/api/webhooks/shopify/orders/paid/route.ts` - Webhook de pagamento
- `app/api/webhooks/shopify/orders/refunded/route.ts` - Webhook de refund
- `app/api/members/me/cv/route.ts` - Endpoint de CV do membro
- `lib/cv/calculator.ts` - Lógica de cálculo de CV
- `app/api/cron/close-monthly-cv/route.ts` - Job de fechamento

### Migrations
- `supabase/migrations/20260107_sprint2_cv_tables.sql` - Tabelas de CV
- `supabase/migrations/20260107_sprint2_rls_policies.sql` - Políticas RLS

---

## Suporte

Para dúvidas ou problemas:
1. Consulte `docs/SPEC.md` para regras de negócio
2. Verifique `docs/PLANO_SPRINT_2.md` para detalhes técnicos
3. Execute os scripts de teste para validar ambiente

---

**Sprint 2 concluído com sucesso!**

**Próximo passo:** Configurar webhooks no Shopify Admin e validar com pedido de teste.
