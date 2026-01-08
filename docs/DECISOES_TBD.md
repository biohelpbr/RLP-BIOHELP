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

### TBD-011 — Regras de progressão de nível
**Por que importa:** define como membros sobem de Parceira → Líder → Diretora → Head.  
**Origem:** SPEC 1.3 menciona níveis mas não define critérios.

**Opções comuns:**
- **A)** Por CV pessoal acumulado (ex: Líder = 1000 CV total)
- **B)** Por número de indicados ativos (ex: Líder = 5 indicados ativos)
- **C)** Por CV total da rede (ex: Líder = rede com 5000 CV/mês)
- **D)** Combinação de critérios (ex: 500 CV pessoal + 3 indicados ativos)

**Critérios a definir:**
| Nível | Requisito |
|-------|-----------|
| Parceira | (inicial) |
| Líder | ________ |
| Diretora | ________ |
| Head | ________ |

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-012 — Profundidade da rede visível
**Por que importa:** define o que o membro pode ver de sua rede.  
**Origem:** SPEC 1.3 diz "visualização da rede (simples)" — não define profundidade.

**Opções:**
- **A)** Apenas N1 (indicados diretos)
- **B)** N1 + N2 (2 níveis)
- **C)** N1 + N2 + N3 (3 níveis)
- **D)** Toda a rede abaixo (ilimitado)

**Decisão escolhida:** ⬜ A  ⬜ B  ⬜ C  ⬜ D  
**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

### TBD-013 — Informações visíveis dos indicados
**Por que importa:** define privacidade e o que o membro vê sobre sua rede.

**Campos a definir (marcar quais são visíveis):**
- ⬜ Nome completo
- ⬜ Apenas primeiro nome
- ⬜ Email
- ⬜ Telefone
- ⬜ CV do indicado
- ⬜ Status (ativo/inativo)
- ⬜ Nível do indicado
- ⬜ Data de cadastro
- ⬜ Quantidade de indicados (do indicado)

**Responsável:** ________  
**Data:** ________  
**Evidência:** ________

---

## Decididos (histórico)
> Mova itens daqui quando houver decisão oficial.

### TBD-008 — Regra de cálculo de CV por produto ✅
**Decisão:** Opção A - CV = 100% do preço do item
**Data:** 07/01/2026
**Implementação:** `lib/cv/calculator.ts` - Constante `CV_PERCENTAGE = 1.0`
**Observação:** Pode ser ajustado futuramente via configuração

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
