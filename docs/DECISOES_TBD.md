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

## Decididos (histórico)
> Mova itens daqui quando houver decisão oficial.

- (vazio)

---

## Assinatura / Aprovação do Cliente
**Cliente:** ____________________  
**Aprovado por:** ____________________  
**Data:** ____/____/______  
**Observações:** ______________________________________
