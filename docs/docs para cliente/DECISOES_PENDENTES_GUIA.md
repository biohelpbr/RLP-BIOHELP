# 📋 Guia Detalhado de Decisões — Biohelp LRP

**Última atualização:** 11/02/2026  
**Objetivo:** Explicar em detalhes cada decisão pendente e já tomada, com exemplos práticos para facilitar o entendimento.

---

## 📊 RESUMO RÁPIDO

| Status | Quantidade | Impacto |
|--------|------------|---------|
| ⏳ **Pendentes** | 3 | Bloqueiam funcionalidades |
| ✅ **Resolvidas** | 19 | Já implementadas ou em implementação |
| **Total** | 22 | - |

> **Reunião de 11/02/2026:** 5 decisões tomadas + 1 atualizada. Restam apenas 3 pendências (TBD-002, TBD-004, TBD-005).

---

# ⏳ DECISÕES PENDENTES (Precisam de aprovação)

Estas decisões **bloqueiam funcionalidades** e precisam ser tomadas pelo cliente antes da implementação.

> **Nota:** Após a reunião de 11/02/2026, restam apenas 3 decisões pendentes.

---

## TBD-002 — Como liberar preço de membro na Shopify

### O que é?
Define o mecanismo técnico para que membros LRP vejam preços especiais na loja Shopify.

### Por que importa?
- É um benefício central do programa
- Afeta a experiência de compra
- Requer configuração na loja Shopify

### Situação ATUAL
```
Membro cadastrado → Tag "lrp_member" aplicada no Customer Shopify
```

### Opções disponíveis

#### Opção A: Tags + Shopify Flow/Script
```
Customer tem tag "lrp_member"
    │
    ▼
Shopify Flow detecta a tag
    │
    ▼
Aplica desconto automático ou exibe preço diferente
```
**Configuração necessária:** Criar Flow no Shopify Admin

#### Opção B: Metafield + Tema customizado
```
Customer tem metafield lrp.is_member = true
    │
    ▼
Tema da loja lê o metafield
    │
    ▼
Exibe preço de membro se metafield = true
```
**Configuração necessária:** Modificar tema da loja

#### Opção C: Price Lists (Shopify Plus)
```
Criar lista de preços "Membros LRP"
    │
    ▼
Associar customers com tag lrp_member
    │
    ▼
Preços diferentes automaticamente
```
**Requisito:** Plano Shopify Plus (mais caro)

### Exemplo prático
```
Produto: Creatina Premium
├── Preço normal: R$ 199,00
└── Preço membro LRP: R$ 159,00 (20% off)

Maria (membro LRP) acessa a loja:
├── Sistema detecta tag "lrp_member"
└── Maria vê preço: R$ 159,00

João (visitante comum) acessa a loja:
├── Sem tag de membro
└── João vê preço: R$ 199,00
```

---

---

## TBD-004 — URLs oficiais (staging e produção)

### O que é?
Define os domínios oficiais do sistema para diferentes ambientes.

### Por que importa?
- Webhooks da Shopify precisam apontar para URL correta
- Links de convite precisam funcionar
- Redirects dependem disso

### Situação ATUAL
```
App (staging): https://rlp-biohelp.vercel.app
Loja (dev):    https://biohelp-dev.myshopify.com (senha: nowcli)
```

### Decisão pendente
```
App (produção):    https://__________.com.br
Loja (produção):   https://__________.com.br ou biohelp.myshopify.com
```

### Impacto
```
Link de convite ATUAL:
https://rlp-biohelp.vercel.app/join?ref=J6QTY7hy

Link de convite PRODUÇÃO:
https://[dominio-oficial]/join?ref=J6QTY7hy
```

---

## TBD-005 — O que "Resync Shopify" deve fazer

### O que é?
Define exatamente o que acontece quando o admin clica em "Resync Shopify" para um membro.

### Por que importa?
- Evita divergências entre banco de dados e Shopify
- Corrige problemas de sincronização
- Precisa ser previsível

### Opções

| Ação | Sempre | Só se divergente |
|------|--------|------------------|
| Reaplicar tags | ⬜ | ⬜ |
| Reaplicar metacampos | ⬜ | ⬜ |
| Recriar customer se não existir | ⬜ | ⬜ |

### Exemplo prático
```
Cenário: Maria foi cadastrada, mas Shopify falhou

NO SUPABASE:
├── members: Maria existe ✅
└── shopify_customers: status = 'failed' ❌

NO SHOPIFY:
└── Customer Maria: NÃO EXISTE ❌

Admin clica "Resync Shopify":
├── Sistema cria customer no Shopify
├── Aplica tags: lrp_member, lrp_ref:..., etc.
└── Atualiza status para 'ok'

DEPOIS DO RESYNC:
├── Supabase: status = 'ok' ✅
└── Shopify: Customer existe com tags ✅
```

---

---

# ✅ DECISÕES JÁ TOMADAS (Implementadas)

Estas decisões já foram aprovadas e estão implementadas ou em fase de implementação.

---

## TBD-001 — Cadastro sem link de convite ✅ (Decidido 11/02/2026)

### Decisão
**Opção A — House Account (Conta Raiz)**

### Regra final
```
Usuário acessa /join sem ref
    │
    ▼
Sistema cadastra com sponsor = "House Account" (conta Biohelp)
    │
    ▼
Comissões desse membro vão para a empresa
```

### Exemplo prático
- Maria acessa o site diretamente (sem link de convite)
- Maria é cadastrada com sponsor = "Biohelp House"
- Quando Maria compra, a comissão vai para a empresa
- Se Maria depois indicar alguém, ela se torna sponsor normalmente

### Status: ⏳ Implementação pendente

---

## TBD-003 — Lista final de tags e metacampos ✅ (Decidido 11/02/2026)

### Decisão
**Manter tags atuais + adicionar nova tag obrigatória de nível**

### Tags FINAIS
```
lrp_member              → Identifica como membro do programa
lrp_ref:BH00001         → Código de referência do membro
lrp_sponsor:BH00002     → Código de quem indicou (ou "none")
lrp_status:active       → Status atual (pending/active/inactive)
nivel:parceiro           → NOVA — Nível do membro no programa
```

### Exemplos de tag de nível
```
nivel:membro
nivel:parceiro
nivel:lider
nivel:diretor
nivel:head
```

### Exemplo no Shopify Admin
```
Customer: Maria Silva
Email: maria@email.com
Tags: lrp_member, lrp_ref:BH00001, lrp_sponsor:BH00002, lrp_status:active, nivel:parceiro
```

### Impacto
- Regras de comissão podem usar o nível via tag
- Relatórios na Shopify podem filtrar por nível
- Tag atualizada automaticamente quando nível muda

### Status: ⏳ Implementação da tag `nivel:` pendente

---

## TBD-006 — Formato do código de referência (ref_code) ✅ (Decidido 11/02/2026)

### Decisão
**Padrão sequencial + admin pode customizar**

### Formato
```
Automático: BH00001, BH00002, BH00003...
Customizado (pelo admin): MARIA2026, JOANA2025...
```

### Exemplo de links
```
Link automático:   https://rlp-biohelp.vercel.app/join?ref=BH00001
Link customizado:  https://rlp-biohelp.vercel.app/join?ref=MARIA2026
```

### Regras
- Código sempre único (sistema valida antes de salvar)
- Após criado, é imutável
- Admin pode customizar pelo painel administrativo

### Status: ⏳ Implementação pendente (membros existentes mantêm código atual)

---

## TBD-007 — Comportamento da página inicial (/) ✅ (Decidido 11/02/2026)

### Decisão
**Manter como está — redirect direto para /login**

```
Usuário acessa: https://rlp-biohelp.vercel.app/
Resultado: Redirecionado para /login
```

### Status: ✅ Já implementado (sem alteração necessária)

---

## TBD-014 — Nome do metafield CV no Shopify ✅ (Decidido 11/02/2026)

### Decisão
**Manter `custom.cv` | Remover fallback para preço | Se ausente → CV = 0**

### Regra final
```
Produto: Lemon Dreams
├── Preço: R$ 159,00
├── Metafield custom.cv: 77
└── CV creditado: 77 pontos ✅

Produto sem metafield configurado:
├── Preço: R$ 99,00
├── Metafield custom.cv: NÃO EXISTE
└── CV creditado: 0 pontos ⚠️ (antes usava o preço como fallback)
```

### Por que essa mudança?
- Evita distorção de comissão
- Se o produto não tem CV definido, não deve gerar comissão
- Força a equipe a configurar CV em todos os produtos

### Status: ⏳ Implementação pendente (remover fallback no código)

---

## TBD-019 — Creatina mensal grátis ✅ (Atualizado 11/02/2026)

### Decisão ATUALIZADA
**Cupom Individual Mensal** (antes era "desconto automático")

### Funcionamento
```
1. Membro atinge 200 CV no mês
    │
    ▼
2. Sistema gera cupom exclusivo: CREATINA-MARIA-FEV2026
    │
    ▼
3. Dashboard mostra: "🎁 Seu cupom: CREATINA-MARIA-FEV2026"
    │
    ▼
4. Membro vai à loja e usa o cupom no checkout
    │
    ▼
5. Desconto de 100% aplicado (1 unidade de creatina)
    │
    ▼
6. Dashboard mostra: "✅ Já utilizado este mês"
```

### Por que cupom individual?
- ✔️ Mais simples de implementar
- ✔️ Mais barato (não precisa de Shopify Functions)
- ✔️ Não depende de validação manual
- ✔️ Cupom criado pela API da Shopify automaticamente

### Status: ⏳ Implementação pendente

---

## TBD-008 — Cálculo de CV por produto ✅

### Decisão
**CV é lido do metafield do produto, não do preço.**

### Exemplo prático
```
Pedido de Maria:
├── 2x Lemon Dreams (R$159 cada, CV 77 cada)
├── 1x Creatina Premium (R$199, CV 100)
└── Total do pedido: R$517

Cálculo de CV:
├── Lemon Dreams: 77 × 2 = 154 CV
├── Creatina: 100 × 1 = 100 CV
└── CV TOTAL: 254 CV

⚠️ Nota: CV (254) ≠ Valor (R$517)
```

---

## TBD-009 — Comportamento de refund/cancelamento ✅

### Decisão
**Reverter CV completamente quando pedido é reembolsado ou cancelado.**

### Exemplo prático
```
ANTES DO REFUND:
Maria tem 450 CV no mês

REFUND de pedido (150 CV):
├── Sistema cria entrada negativa no cv_ledger
├── Tipo: 'order_refunded'
└── Valor: -150 CV

DEPOIS DO REFUND:
Maria tem 300 CV no mês

Se Maria tinha status "Ativa" (200+ CV):
└── Continua ativa (300 >= 200) ✅

Se Maria tinha 180 CV e recebe refund de 50:
└── 180 - 50 = 130 CV → Status muda para "Inativa" ⚠️
```

---

## TBD-011 — Regras de progressão de nível ✅

### Decisão
Níveis definidos conforme documento canônico.

### Tabela de níveis

| Nível | Requisitos | Exemplo |
|-------|------------|---------|
| **Membro** | Cadastrado no sistema | Maria acabou de se cadastrar |
| **Parceira** | Membro Ativo + CV rede >= 500 | Maria tem 200 CV próprio + rede soma 500 |
| **Líder em Formação** | Parceira + 1ª Parceira em N1 | Maria trouxe Ana, que virou Parceira |
| **Líder** | Parceira Ativa + 4 Parceiras em N1 | Maria tem 4 indicadas diretas que são Parceiras Ativas |
| **Diretora** | 3 Líderes em N1 + 80.000 CV rede | Maria tem 3 Líderes diretas + rede soma 80k CV |
| **Head** | 3 Diretoras em N1 + 200.000 CV rede | Maria tem 3 Diretoras diretas + rede soma 200k CV |

### Exemplo de progressão
```
Mês 1:
├── Maria cadastra, compra 200 CV
└── Nível: Membro (ativo)

Mês 2:
├── Maria indica Ana, Bia, Carla, Duda
├── Rede soma 500 CV
└── Nível: Parceira ✅

Mês 3:
├── Ana (N1 de Maria) vira Parceira
├── Maria ganha janela de 90 dias
└── Nível: Líder em Formação ✅

Mês 6:
├── Maria tem 4 Parceiras Ativas em N1: Ana, Bia, Carla, Duda
└── Nível: Líder ✅
```

---

## TBD-022 — Comissão Perpétua diferenciada ✅

### Decisão
**Percentual de comissão depende do nível do sponsor E do tipo de quem comprou.**

### Tabela de comissões

| Você é | Quem comprou | Você recebe |
|--------|--------------|-------------|
| Parceira | Cliente (membro comum) | 5% |
| Parceira | Outra Parceira | **0%** (não recebe!) |
| Líder | Cliente | 5% |
| Líder | Parceira | 7% |
| Diretora | Cliente | 5% |
| Diretora | Parceira | 7% |
| Diretora | Líder | 10% |
| Head | Cliente | 5% |
| Head | Parceira | 7% |
| Head | Líder | 10% |
| Head | Outros | 15% |

### Exemplo prático
```
CENÁRIO 1:
Maria é Parceira
Ana (N1 de Maria) é Membro (cliente)
Ana compra CV 100
Maria recebe: 5% × 100 = R$ 5,00 ✅

CENÁRIO 2:
Maria é Parceira
Bia (N1 de Maria) é Parceira
Bia compra CV 100
Maria recebe: 0% × 100 = R$ 0,00 ❌ (Parceira não recebe de outra Parceira)

CENÁRIO 3:
Maria é Líder
Bia (N1 de Maria) é Parceira
Bia compra CV 100
Maria recebe: 7% × 100 = R$ 7,00 ✅ (Líder recebe 7% de Parceira)
```

---

## TBD-021 — Net-15 (Período de trava) ✅

### Decisão
**Comissões ficam disponíveis 15 dias após virada do mês.**

### Exemplo prático
```
JANEIRO:
├── Dia 10: Maria ganha R$ 100 de comissão
├── Dia 25: Maria ganha R$ 50 de comissão
└── Total de janeiro: R$ 150

FEVEREIRO:
├── Dia 1-14: Comissões de janeiro ainda "em análise"
├── Dia 15: Comissões de janeiro ficam DISPONÍVEIS
└── Maria pode sacar os R$ 150

LINHA DO TEMPO:
10/Jan     25/Jan     01/Fev     15/Fev
  │          │          │          │
  ▼          ▼          ▼          ▼
+R$100    +R$50     Virada     LIBERADO!
                   do mês     R$150 disponível
```

### Por que existe essa trava?
- Protege contra chargebacks
- Protege contra cancelamentos
- Protege contra devoluções

Se o cliente cancelar/devolver o pedido dentro desses 15 dias, a comissão é revertida antes de ficar disponível.

---

## TBD-015 e TBD-016 — Limites de saque ✅

### Decisões
- **Mínimo por saque:** R$ 100,00
- **Limite PF mensal:** R$ 1.000,00

### Exemplo prático
```
Maria (PF) tem saldo de R$ 2.500 disponível

SAQUE 1 (válido):
├── Solicita: R$ 500
├── Sistema: ✅ Aprovado
└── Limite restante no mês: R$ 500

SAQUE 2 (válido):
├── Solicita: R$ 400
├── Sistema: ✅ Aprovado
└── Limite restante no mês: R$ 100

SAQUE 3 (bloqueado):
├── Solicita: R$ 200
├── Sistema: ❌ Excede limite mensal (restam R$ 100)
└── Opção: Aguardar próximo mês ou virar PJ

SAQUE 4 (bloqueado):
├── Solicita: R$ 50
├── Sistema: ❌ Abaixo do mínimo (R$ 100)
└── Opção: Acumular mais saldo
```

---

## TBD-018 — Integração Asaas ✅

### Decisão
**Usar Asaas para processar pagamentos de saque.**

### Fluxo planejado
```
1. Parceira solicita saque no sistema
    │
    ▼
2. Admin aprova a solicitação
    │
    ▼
3. Sistema envia para Asaas:
   ├── Dados da conta (PIX ou banco)
   ├── Valor do saque
   └── Identificação do membro
    │
    ▼
4. Asaas processa o pagamento:
   ├── PIX: imediato
   └── TED: até D+1
    │
    ▼
5. Asaas notifica via webhook:
   ├── Pagamento confirmado
   └── Sistema atualiza status para "pago"
```

### Status atual
**⚠️ Aguardando credenciais Asaas para implementar a integração.**

---

## TBD-019 — Creatina mensal grátis ✅

### Decisão
**Desconto de 100% aplicado no pedido real (1 unidade/mês).**

### Fluxo
```
1. Membro atinge 200 CV no mês
    │
    ▼
2. Dashboard mostra: "🎁 Creatina Grátis Disponível"
    │
    ▼
3. Membro vai à loja e adiciona creatina ao carrinho
    │
    ▼
4. No checkout, desconto de 100% é aplicado automaticamente
   (limite: 1 unidade)
    │
    ▼
5. Sistema registra uso em free_creatine_claims
    │
    ▼
6. Dashboard mostra: "✅ Já utilizado este mês"
```

### Estados do card no dashboard

| CV do mês | Já usou? | Estado do card |
|-----------|----------|----------------|
| < 200 | - | ⚪ "Indisponível - atinja 200 CV" |
| >= 200 | Não | 🟢 "Disponível - resgate sua creatina!" |
| >= 200 | Sim | 🟡 "Já utilizado este mês" |

### Status atual
**⚠️ Backend pronto. Falta configurar Shopify Discount para aplicar o desconto automático.**

---

# 📌 COMO TOMAR UMA DECISÃO PENDENTE

1. **Revise as opções** disponíveis neste documento
2. **Escolha a opção** que faz mais sentido para o negócio
3. **Comunique a decisão** por escrito (email, chat, documento)
4. **Aguarde implementação** pela equipe técnica
5. **Valide em ambiente de teste** antes de ir para produção

---

# 📞 CONTATO

**Dúvidas sobre decisões técnicas?**
Consulte a equipe de desenvolvimento.

**Dúvidas sobre regras de negócio?**
Consulte a documentação em `docs/SPEC_Biohelp_LRP.md`.

---

**Documento atualizado em:** 11/02/2026  
**Baseado em:** `docs/DECISOES_TBD.md` + Ata de reunião de alinhamento (11/02/2026)
