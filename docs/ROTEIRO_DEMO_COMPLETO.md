# Roteiro de Demonstração Completa - Biohelp LRP

**Data de Criação:** 23/01/2026  
**Versão:** 1.0  
**Tempo Estimado:** 20-30 minutos

---

## Pré-requisitos

### Servidor Local
```bash
cd c:\Users\edusp\Projetos_App_Desktop\RLP-bio_help
npx next dev -p 3002
```

### Credenciais de Teste
| Portal | URL | Email | Senha |
|--------|-----|-------|-------|
| Admin | /admin | admin@biohelp.test | 123456 |
| Parceira 1 (Sponsor) | /dashboard | sponsor@biohelp.test | sponsor123 |
| Nova Membro (Maria) | /dashboard | maria.demo.jan23b@biohelp.test | demo123456 |

---

## Parte 1: Cadastro de Novo Membro (5 min)

### Passos

1. **Abrir link de convite**
   ```
   http://localhost:3002/join?ref=SPONSOR01
   ```

2. **Verificar que aparece "Convidado por: SPONSOR01"**

3. **Preencher formulário:**
   - Nome: `[Nome do teste]`
   - Email: `[email-unico]@biohelp.test`
   - Senha: `demo123456`
   - Confirmar senha: `demo123456`

4. **Clicar "Criar minha conta"**

5. **Verificar redirect para Dashboard mostrando:**
   - "Oi, [Nome]!"
   - CV: 0
   - Status: Pendente
   - "Faltam 200 CV para ativar"
   - Sponsor: Sponsor Teste

### O que demonstra
- ✅ Cadastro via link de indicação funciona
- ✅ Sponsor é vinculado automaticamente
- ✅ Usuário recebe código de referência único
- ✅ Sync com Shopify cria customer com tags

---

## Parte 2: Simulação de Compra (5 min)

### Contexto para Explicar
> "Na produção, quando a cliente faz uma compra na Shopify e o pagamento é confirmado, o Shopify dispara um webhook automaticamente. Aqui vamos simular esse webhook."

### Script de Simulação
```bash
node test-webhook-demo.mjs
```

Ou criar pedido customizado:
```bash
node -e "
import('crypto').then(async crypto => {
  const dotenv = await import('dotenv');
  dotenv.default.config({ path: '.env.local' });
  
  const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
  const WEBHOOK_URL = 'http://localhost:3002/api/webhooks/shopify/orders/paid';
  const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
  
  // ALTERAR EMAIL AQUI para o membro desejado
  const email = 'maria.demo.jan23b@biohelp.test';
  const total = '318.00';
  
  const orderId = Date.now();
  const orderPayload = {
    id: orderId,
    admin_graphql_api_id: 'gid://shopify/Order/' + orderId,
    order_number: 3000 + Math.floor(Math.random() * 1000),
    email: email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_price: total,
    subtotal_price: total,
    total_tax: '0.00',
    currency: 'BRL',
    financial_status: 'paid',
    fulfillment_status: null,
    cancelled_at: null,
    line_items: [{
      id: orderId + 1,
      product_id: 8000000000001,
      variant_id: 9000000000001,
      title: 'Lemon Dreams 30 doses',
      quantity: 2,
      price: '159.00',
      sku: 'LEMON-30'
    }]
  };
  
  const rawBody = JSON.stringify(orderPayload);
  const hmac = crypto.default.createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('base64');
  
  console.log('Simulando compra de', email, '- Total:', total);
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Hmac-Sha256': hmac,
      'X-Shopify-Topic': 'orders/paid',
      'X-Shopify-Shop-Domain': SHOP_DOMAIN
    },
    body: rawBody
  });
  
  const result = await response.json();
  console.log('Status:', response.status);
  console.log('CV Calculado:', result.cv?.orderCV);
  console.log('Novo Status:', result.cv?.status);
  console.log('Comissões:', result.commissions?.created);
});
"
```

### O que mostrar após a simulação
1. **Refresh no dashboard do comprador** - CV atualizado, status mudou para "Ativa"
2. **Dashboard do Sponsor** - CV da Rede aumentou, Indicados Ativos aumentou
3. **Página de Comissões do Sponsor** - Nova comissão Fast-Track registrada

### O que demonstra
- ✅ Webhook recebe e processa pedido
- ✅ CV é calculado automaticamente (fallback para preço quando não há metafield)
- ✅ Status muda de Pendente → Ativa quando CV >= 200
- ✅ Comissão Fast-Track é gerada para o sponsor
- ✅ Tudo atualiza em tempo real

---

## Parte 3: Dashboard da Parceira (5 min)

### URLs para navegar
- Visão Geral: `/dashboard`
- Minha Rede: `/dashboard/network`
- Comissões: `/dashboard/commissions`
- Saques: `/dashboard/payouts`

### O que mostrar em cada página

#### Dashboard (Visão Geral)
- Saudação personalizada
- CV do mês atual com progresso visual
- CV da rede (próprio + indicados)
- Status de ativação
- Link de convite para copiar
- Dados do sponsor

#### Minha Rede
- Estatísticas: Total, Ativos, CV da Rede
- Nível atual e próximo nível
- Progresso para promoção
- Árvore visual com todos os indicados
- Status e CV de cada indicado

#### Comissões
- Resumo: Disponível, Total Ganho, Total Sacado, Em Análise
- Breakdown por tipo de comissão
- Histórico mensal
- Explicação de cada tipo de comissão

#### Saques (se disponível)
- Saldo disponível
- Formulário de solicitação
- Histórico de saques
- Regras (limite PF, mínimo, etc.)

### O que demonstra
- ✅ Interface limpa e profissional
- ✅ Informações em tempo real
- ✅ Transparência nas comissões
- ✅ Facilidade de uso

---

## Parte 4: Painel Admin (5 min)

### Login Admin
```
URL: /admin
Email: admin@biohelp.test
Senha: 123456
```

### O que mostrar

#### Dashboard Admin
- KPIs: Total membros, CV total, Comissões
- Visão geral do sistema

#### Lista de Membros
- Busca e filtros
- Ver detalhes de cada membro
- Histórico de CV
- Histórico de pedidos
- Ações: Resync Shopify, Ajustar CV

#### Gestão de Saques (se implementado)
- Lista de solicitações
- Aprovar/Rejeitar
- Histórico

### O que demonstra
- ✅ Controle administrativo completo
- ✅ Visibilidade de toda a operação
- ✅ Ferramentas de gestão

---

## Parte 5: Integração Shopify (5 min)

### Verificar no Shopify Admin
```
https://biohelp-dev.myshopify.com/admin
→ Customers → Buscar por email
```

### O que verificar
1. **Customer existe** com o email cadastrado
2. **Tags aplicadas:**
   - `lrp_member`
   - `lrp_ref:[codigo]`
   - `lrp_sponsor:[codigo_sponsor]`
   - `lrp_status:pending` ou `lrp_status:active`

### Testar conexão (opcional)
```bash
node test-shopify-token.mjs
```

Esperar ver:
- ✅ Teste 1 (REST shop): Sucesso
- ✅ Teste 2 (GraphQL shop): Sucesso
- ⚠️ Teste 3 (GraphQL customers): Falha esperada em plano Basic
- ✅ Teste 4 (REST customers): Sucesso ← Este é o importante!

### O que demonstra
- ✅ Integração bidirecional funciona
- ✅ Tags são aplicadas automaticamente
- ✅ Customer é criado/atualizado via REST API

---

## Resumo do Fluxo de Produção

```
┌─────────────────┐
│  Link Convite   │
│  ?ref=CODIGO    │
└────────┬────────┘
         ▼
┌─────────────────┐      ┌─────────────────┐
│  Cadastro App   │─────▶│ Sync Shopify    │
│  (Supabase)     │      │ (REST API)      │
└────────┬────────┘      └────────┬────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│ Dashboard       │      │ Customer +Tags  │
│ CV: 0, Pendente │      │ na Shopify      │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │    ┌───────────────────┘
         │    │
         ▼    ▼
┌─────────────────┐
│ Cliente compra  │
│ na loja Shopify │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook orders/ │
│ paid disparado  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ CV Calculado    │─────▶│ Comissões       │
│ Status: Ativa   │      │ Fast-Track 30%  │
└─────────────────┘      └─────────────────┘
```

---

## Dados de Teste Atuais

### Membros
| Nome | Email | Ref Code | Status | CV Mês | Sponsor |
|------|-------|----------|--------|--------|---------|
| Admin Biohelp | admin@biohelp.test | ADMIN001 | active | 0 | — |
| Sponsor Teste | sponsor@biohelp.test | SPONSOR01 | active | 825 | — |
| Membro Teste | membro@teste.com | IaUZqzPe | pending | 0 | Sponsor |
| Maria Demo Janeiro | maria.demo.jan23b@biohelp.test | _kAPio7o | active | 318 | Sponsor |

### Pedidos Processados
| # | Email | Total | CV | Data |
|---|-------|-------|----|----|
| TEST-001 | sponsor@biohelp.test | R$ 250 | 250 | 07/01 |
| 1001 | sponsor@biohelp.test | R$ 150 | 150 | 08/01 |
| 1002 | sponsor@biohelp.test | R$ 150 | 150 | 08/01 |
| 2641 | sponsor@biohelp.test | R$ 250 | 250 | 23/01 |
| 3633 | maria.demo.jan23b@biohelp.test | R$ 318 | 318 | 23/01 |

### Comissões
| Beneficiário | Tipo | Valor | Data |
|--------------|------|-------|------|
| Sponsor Teste | Fast-Track 30% | R$ 45,00 | 10/01 |
| Sponsor Teste | Fast-Track 30% | R$ 95,40 | 23/01 |
| **Total** | | **R$ 140,40** | |

---

## Perguntas Frequentes

### "E se o Shopify estiver fora do ar?"
O cadastro continua funcionando! O membro é criado no Supabase e o sync fica com status "failed". O admin pode fazer resync depois.

### "Como funciona o CV quando não tem metafield no produto?"
O sistema usa o preço do produto como fallback e loga um warning. Na produção, recomenda-se configurar o metafield `custom.cv` em cada produto.

### "Como testar webhook real?"
Configure o webhook na Shopify Admin → Settings → Notifications → Webhooks apontando para a URL de produção da Vercel.

### "A API GraphQL dá erro de permissão?"
Normal! O plano Basic da Shopify bloqueia acesso a Customer PII via GraphQL. Por isso usamos REST API na implementação real, que funciona normalmente.

---

## Comandos Úteis

```bash
# Iniciar servidor
npx next dev -p 3002

# Testar conexão Shopify
node test-shopify-token.mjs

# Simular compra
node test-webhook-demo.mjs

# Ver logs do servidor
# (ver terminal do Next.js)
```

---

**Documento criado em:** 23/01/2026  
**Baseado em demonstração real executada com sucesso**
