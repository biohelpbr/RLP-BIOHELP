# DECISÕES TBD — Biohelp LRP
**Objetivo:** registrar decisões obrigatórias (pendentes) que afetam regra de negócio, escopo, banco e integração.  
**Regra:** nada marcado como **TBD** deve ser implementado sem aprovação formal do cliente (assinatura/ok por escrito).

---

## Como usar este documento
1. Cada item TBD deve ter: **opções**, **decisão escolhida**, **responsável**, **data**, **evidência** (print, e-mail, ata).
2. Ao decidir, mova para **"Decididos"** e atualize:
   - `docs/CHANGELOG.md` (nova versão)
   - `docs/SPEC.md` (se a decisão mudar regras, campos, endpoints)

---

## TBD — Pendentes

### TBD-001 — Regra de cadastro **sem link** (sem `ref`)
**Por que importa:** define como a rede começa e evita casos “órfãos”.

**Opções (escolher 1):**
- **A)** Sponsor = *House Account* (usuário raiz do sistema)
- **B)** Distribuição para lista de líderes elegíveis (round-robin/critério)
- **C)** Sem sponsor (rede começa nele) *(não recomendado se gerar exceções)*

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-002 — Como o **preço de membro** é liberado na Shopify
**Por que importa:** define como o cliente “vê preço de membro”.

**Opções comuns:**
- Tags no customer + Shopify Flow/Script/Logic na loja
- Metaobject/metafield no customer e tema faz a regra
- Segmentação de customer + price list (depende de plano/recursos)

**Decisão escolhida (descrever mecanismo):** ________  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-003 — Lista final de **tags** e **metacampos**
**Por que importa:** padroniza auditoria e automações.

**Tags propostas (base):**
- `lrp_member`
- `lrp_ref:<ref_code>`
- `lrp_sponsor:<sponsor_ref_code|none>`
- `lrp_status:pending|active|inactive`

**Metacampos propostos (opcional):**
- `lrp.ref_code`
- `lrp.sponsor_ref_code`
- `lrp.status`

**Decisão final (lista fechada):** ________  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-004 — Domínios e URLs oficiais (staging/prod)
**Por que importa:** redirects e webhooks dependem disso.

- URL da loja Shopify (prod): ________
- URL da loja Shopify (staging/test): ________
- URL do app (staging): ________
- URL do app (prod): ________

**Responsável:** ________  
**Data:** ________

---

### TBD-005 — "Resync Shopify" (o que exatamente reaplicar?)
**Por que importa:** evita divergência entre Supabase e Shopify.

**Decisão (marcar):**
- ⬜ Reaplicar tags sempre
- ⬜ Reaplicar metacampos sempre
- ⬜ Recriar customer se não existir
- ⬜ Somente atualizar se divergente

**Responsável:** ________  
**Data:** ________

---

### TBD-006 — Formato do `ref_code` (geração)
**Por que importa:** define usabilidade do link de convite e unicidade.  
**Origem:** SPEC 3.2 diz que é único e imutável, mas não define formato.

**Opções:**
- **A)** UUID curto (ex.: `abc123xy`)
- **B)** Slug baseado no nome (ex.: `maria-silva-1234`)
- **C)** Código alfanumérico sequencial (ex.: `BH00001`)
- **D)** Permitir que o membro escolha (com validação de unicidade)

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-007 — Comportamento da landing page (`/`)
**Por que importa:** define primeira impressão do usuário.  
**Origem:** SPEC 6.1 diz "landing simples ou redirect" — não está claro qual.

**Opções:**
- **A)** Redirect direto para `/join`
- **B)** Redirect direto para `/login`
- **C)** Landing page simples com CTAs para `/join` e `/login`

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

## TBDs do Sprint 3 (Rede Visual + Níveis)

### TBD-011 — Regras de progressão de nível ✅ RESOLVIDO
**Por que importa:** define como membros sobem de Parceira → Líder → Diretora → Head.  
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md`

**Critérios definidos (canônico):**
| Nível | Requisito |
|-------|-----------|
| Membro | Cliente cadastrada |
| Parceira | Membro Ativo + CV_rede >= 500 (inclui próprio membro) |
| Líder em Formação | Parceira + primeira Parceira em N1 (janela 90 dias) |
| Líder | Parceira Ativa (N0) + 4 Parceiras Ativas em N1 |
| Diretora | 3 Líderes Ativas em N1 + 80.000 CV na rede |
| Head | 3 Diretoras Ativas em N1 + 200.000 CV na rede |

**Regras de perda de nível:**
- Se requisitos deixam de ser atendidos, a Parceira desce de cargo
- Líder perde status se não mantiver 4 Parceiras ativas em N1
- Após 6 meses sem se ativar, perde totalmente o status e sai da rede

**Data:** 09/01/2026
**Evidência:** Documento canônico de regras de negócio

---

### TBD-012 — Profundidade da rede visível ✅ RESOLVIDO
**Por que importa:** define o que o membro pode ver de sua rede.  
**Origem:** SPEC 1.3 diz "visualização da rede (simples)" — não define profundidade.

**Opções:**
- **A)** Apenas N1 (indicados diretos)
- **B)** N1 + N2 (2 níveis)
- **C)** N1 + N2 + N3 (3 níveis)
- **D)** Toda a rede abaixo (ilimitado) ✅

**Decisão escolhida:** ✅ D — Toda a rede abaixo (ilimitado)
**Observação:** Implementar com lazy loading e paginação para evitar lag em redes grandes.
**Responsável:** Cliente  
**Data:** 09/01/2026  
**Evidência:** Aprovação via chat

---

### TBD-013 — Informações visíveis dos indicados ✅ RESOLVIDO
**Por que importa:** define privacidade e o que o membro vê sobre sua rede.

**Campos visíveis para TODOS os níveis da rede:**
- ✅ Nome completo
- ✅ Email
- ✅ CV do indicado
- ✅ Status (ativo/inativo)
- ✅ Nível do indicado
- ✅ Quantidade de indicados (do indicado)

**Campos com visibilidade RESTRITA:**
- 📱 Telefone: Visível apenas para:
  - Superior direto (sponsor)
  - Indicados diretos (N1)
  - OU se o membro habilitar nas configurações de privacidade

**Campos NÃO visíveis:**
- ❌ Data de cadastro (opcional, pode adicionar depois)

**Responsável:** Cliente  
**Data:** 09/01/2026  
**Evidência:** Aprovação via chat

---

## TBDs do Sprint 4/5 (Comissões + Saques)

### TBD-014 — Nome exato do metafield CV no Shopify
**Por que importa:** Define onde ler o CV de cada produto.
**Origem:** Documento canônico menciona "metacampo CV" mas não especifica namespace/key.

**Opções:**
- **A)** `custom.cv`
- **B)** `lrp.cv`
- **C)** `biohelp.cv_value`
- **D)** Outro: ________

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________

---

### TBD-015 — Limite de saque por CPF (PF)
**Por que importa:** Documento canônico menciona R$990/mês em alguns lugares e R$1.000 em outros.
**Origem:** Linhas 127/129 (R$990) vs linha 252 (R$1.000) do documento canônico.

**Opções:**
- **A)** R$990,00/mês
- **B)** R$1.000,00/mês

**Decisão escolhida:** ⬜ A  ⬜ B  
**Responsável:** ________  
**Data:** ________

---

### TBD-016 — Valor mínimo para saque
**Por que importa:** Define quando a parceira pode solicitar saque.
**Origem:** Não explicitado no documento canônico.

**Opções:**
- **A)** R$100,00
- **B)** R$50,00
- **C)** Sem mínimo
- **D)** Outro: ________

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________

---

### TBD-017 — Arredondamento de CV e moeda
**Por que importa:** Define precisão dos cálculos de CV e comissões.

**Opções:**
- **A)** 2 casas decimais (padrão BRL)
- **B)** Inteiro (arredondar para cima)
- **C)** Inteiro (arredondar para baixo)

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  
**Responsável:** ________  
**Data:** ________

---

### TBD-018 — Integração fintech para saques
**Por que importa:** Define como os pagamentos serão processados.
**Origem:** Documento canônico menciona "integração com ferramenta terceira".

**Opções:**
- **A)** Asaas (PIX + Boleto)
- **B)** PagSeguro
- **C)** Stripe
- **D)** Manual (transferência bancária)
- **E)** Outro: ________

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  ⬜ E  
**Responsável:** ________  
**Data:** ________

---

### TBD-019 — Creatina mensal grátis - implementação
**Por que importa:** Documento canônico diz "Todo Membro Ativo (200 CV) recebe creatina mensal grátis".
**Origem:** Linha 153 do documento canônico.

**Opções:**
- **A)** Cupom de desconto 100% gerado automaticamente
- **B)** Produto adicionado ao pedido via Shopify Flow
- **C)** Crédito no saldo da parceira
- **D)** Processo manual (admin envia)

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________

---

## Decididos (histórico)
> Mova itens daqui quando houver decisão oficial.

### TBD-008 — Regra de cálculo de CV por produto ✅ (CORRIGIDO)
**Decisão:** CV do pedido = soma do CV dos itens (metacampo por produto).
**Fonte:** `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` — "Cada produto da Biohelp vai gerar um CV diferente, exemplo, o Lemon Dreams que venderemos a R$159,00, será gerado um CV de 77."
**Data:** 07/01/2026 (atualizado 09/01/2026)
**Implementação:** 
- Ler metafield/metacampo do produto (ex.: `custom.cv` ou `lrp.cv`)
- `lib/cv/calculator.ts` - Função `calculateCVForItem()` prioriza metafield
**Fallback:** Se não houver metacampo, usar preço do item como fallback e logar warning "missing_cv_metafield"
**Observação:** CV ≠ preço do produto. Ex: Lemon Dreams (R$159) → CV 77

---

### TBD-009 — Comportamento de refund/cancel ✅
**Decisão:** Reverter CV completamente
**Data:** 07/01/2026
**Implementação:** Webhooks de refund e cancel criam entradas negativas no cv_ledger
**Observação:** CV é revertido integralmente, recalculando o CV mensal

---

### TBD-010 — Job de fechamento mensal ✅
**Decisão:**
- Executar: 1º dia do mês às 03:00 UTC (00:00 BRT)
- Timezone: America/Sao_Paulo
- Pedidos do último dia: Considerados até 23:59:59 do mês anterior

**Data:** 07/01/2026
**Implementação:** `app/api/cron/close-monthly-cv/route.ts` + `vercel.json`

---

## Assinatura / Aprovação do Cliente
**Cliente:** ____________________  
**Aprovado por:** ____________________  
**Data:** ____/____/______  
**Observações:** ______________________________________
