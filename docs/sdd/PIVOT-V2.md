# PIVÔ V2 — Biohelp LRP

> Documento canônico do pivot do projeto. Fonte única de verdade para toda mudança a partir de 28/abr/2026.
> Quando houver conflito entre este doc e qualquer artefato anterior (SPEC_Biohelp_LRP.md, STATUS_IMPLEMENTACAO.md, documentos_projeto_iniciais_MD/*), **este doc prevalece** para tudo que diz respeito ao modelo v2.

**Data:** 2026-04-28 (atualizado 29/04/2026)
**Status:** Onda 0 concluída · F-V11 entregue · 11/18 TBDs respondidos · Ondas 2-3 parcialmente desbloqueadas
**Insumos do cliente:** `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários), `documentos_escopo/Fluxograma.jpg.jpeg` (fluxograma novo), `documentos_escopo/Fluxo.txt` (regras condensadas).

---

## 1. Resumo do delta v1 → v2

### REMOVIDO (não-aplica mais)
- CV (Commissionable Value) e relação 1 CV = R$1
- Múltiplos níveis N0/N1/N2/N3
- Rankings Parceira / Líder em Formação / Líder / Diretora / Head
- Status Ativo/Inativo baseado em 200 CV mensais
- Reset mensal de CV
- Compressão de rede após 6 meses inativo
- Fast-Track 30%/20%
- Comissão Perpétua diferenciada por nível de sponsor
- Bônus 1 / 2 / 3
- Leadership Bônus
- Royalty
- RPA / CPF / limite mensal R$1.000
- Ledger orientado a CV
- Visualização de árvore multinível para o membro comum
- House Account (TBD-10 resolvido 29/04 — descontinuada)

### ALTERADO (mantém com regra nova)
- **Cadastro:** ref OBRIGATÓRIO (link OU código). Sem ref → bloqueia (não cai mais em House Account).
- **Status ativo:** vinculado a ASSINATURA paga via Guru, não a CV.
- **Visão da rede:** membro vê apenas seu sponsor + indicados diretos (1 nível pra cima e 1 nível pra baixo). Admin vê tudo. ✅ Implementada (F-V11, 29/04/2026).
- **ref_code:** mantém o link único (formato `BH00001`) e adiciona possibilidade de o usuário **digitar código manualmente** no cadastro.
- **Sync Shopify:** mantém tags + Locksmith para liberar preços de clube.
- **Pagamento ao membro:** CPF e CNPJ podem receber via **Cashin** (provável — TBD-19) ou crédito em loja. Apenas Founder + CNPJ pode emitir NF de serviço pra saque cash. Aprovação manual do admin + validação automática da NF (formato/dados) pra dar erro pro user na hora do upload. RPA/CPF antigo cortado.
- **Cupom mensal de creatina:** escopo alterado (TBD-17) — mantém, mas vira sistema de campanhas configuráveis pelo admin (cliente/período/segmento) ao invés do cron mensal automático.
- **Webhooks Shopify:** mantém pra histórico/integração, mas não dispara cálculo de CV.

### NOVO (a construir)
- **F-V01:** Bloqueio de cadastro sem ref + suporte a código manual.
- **F-V02:** Integração Guru — leitura via webhook Shopify (Guru cria pedido na Shopify; lemos de lá). Confirmar com Wink (TBD-7 resolvido com essa abordagem).
- **F-V03:** Status ativo = `subscription_paid` (substitui lógica CV).
- **F-V04:** Comissão 50% (líquida de impostos/taxas) sobre assinatura do convidado, somente 1 nível.
- **F-V05:** Saldo do membro + conversão saldo → crédito Shopify 1:1 (pre-Founder e Founder podem converter; sem prazo após resgate).
- **F-V06:** Promoção a Founder ao atingir 5 membros ativos no clube. Founder destrava saque cash (CNPJ + NF de serviço).
- **F-V07:** Saque Founder via Cashin + validação automática da NF + aprovação manual do admin. CPF (não-Founder ou Founder sem CNPJ — TBD-20) recebe via Cashin direto ou crédito em loja.
- **F-V08:** Ranking de Founders. Critério a definir (TBD-11).
- **F-V09:** Área de conteúdo (texto / vídeo / imagem / pdf). CMS leve.
- **F-V10:** Link de grupo WhatsApp por Founder.
- **F-V11:** Refactor da visão de rede: membro vê só sponsor + indicados diretos. ✅ **Implementada 29/04/2026.**
- **F-V12:** Migration / arquivamento do modelo v1 atrás de feature flag (`LRP_V2`). Inclui cleanup do RPA/CPF (TBD-18 resolvido — descontinua).
- **F-V13:** Cupom de creatina como campanha configurável pelo admin (substitui cron mensal automático). Depende de TBD-22.

---

## 2. Backlog de features — classificação e prioridade

| ID | Feature | Classe | Prioridade | Bloqueio TBD / Status |
|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | P0 | ✅ Destravada (TBD-10 resolvido). TBD-9 (código imutável?) com hipótese padrão. |
| F-V02 | Integração Guru via webhook Shopify | D | P0 | ✅ Destravada (TBD-7 resolvido — Shopify-first; confirmar com Wink). |
| F-V03 | Status ativo = subscription_paid | C | P0 | ✅ Destravada (depende de F-V02). |
| F-V04 | Comissão 50% por assinatura de convidado (1 nível) | D | P0 | 🚫 Bloqueada — TBD-1, TBD-2 abertos. |
| F-V05 | Saldo + conversão para crédito Shopify (1:1) | C | P1 | ✅ Destravada (TBD-14 resolvido). TBD-21 (prazo inativo) não bloqueia início. |
| F-V06 | Promoção a Founder (≥5 ativos no clube) | B | P1 | 🟡 Parcial — TBD-12 (perde status?) aberto. Hipótese padrão: status definitivo. |
| F-V07 | Saque Founder via Cashin + NF + validação | D | P1 | 🟡 Parcial — TBD-3/4/5 resolvidos, mas valor depende de F-V04. Pode começar UI cadastro bancário + upload/validação NF. TBD-19 (Cashin confirmado?) e TBD-20 (CPF Founder?) novos. |
| F-V08 | Ranking de Founders | B | P2 | 🚫 Bloqueada — TBD-11 (critério) aberto. |
| F-V09 | Área de conteúdo (CMS leve) | B | P2 | 🚫 Bloqueada — TBD-15 (escopo: global vs por Founder) aberto. |
| F-V10 | Link WhatsApp por Founder | A | P2 | 🚫 Bloqueada — TBD-16 (admin valida?) aberto. |
| F-V11 | Visão restrita da rede pro membro | B | P1 | ✅ **Implementada 29/04/2026** |
| F-V12 | Deprecation v1 (CV, níveis, bônus, royalty, RPA/CPF) | D | depende | Aguarda v2 estável em produção. TBD-18 confirma cortar RPA/CPF. |
| F-V13 | Cupom de creatina como campanha configurável | C | P2 | 🚫 Bloqueada — TBD-22 (UX da gestão) aberto. |

**Legenda:** P0 = bloqueia o novo fluxo. P1 = essencial pro MVP v2. P2 = pós-MVP v2. ✅ = destravada / 🟡 = parcial / 🚫 = bloqueada.

---

## 3. Anti-SPEC v2 (sagrada)

NÃO mexer sem autorização explícita do humano:

1. Tabela `members.sponsor_id` — vínculo de patrocínio é dado vivo de produção.
2. Tabela `shopify_customers` e tags atuais — preço de clube depende delas.
3. Tabelas `orders` e `order_items` — histórico fiscal, base do que já foi vendido.
4. Webhooks Shopify ativos em produção (`/api/webhooks/shopify/orders/*`).
5. RLS policies existentes — só alterar dentro de feature classe D com Anti-SPEC explícita.
6. Migrations já aplicadas — nunca reverter; sempre criar nova migration.
7. ref_code de membros existentes — formato `BH00001` mantém; não regenerar.
8. House Account (Sprint 7 / TBD-001) — **descontinuada no v2** (TBD-10 resolvido 29/04/2026). Código permanece até onda 6 / F-V12 cleanup. Quando flag `LRP_V2=true`, cadastro sem ref bloqueia (não cai mais em House Account).
9. Cupom mensal de creatina (Sprint 7 / TBD-019) — **escopo alterado no v2** (TBD-17 resolvido 29/04/2026). Vira sistema de campanhas configuráveis pelo admin (cliente/período/segmento), não mais cron mensal automático. Detalhes em F-V13 + TBD-22.
10. RPA / CPF / limite R$1.000 — **descontinuado no v2** (TBD-18 resolvido 29/04/2026). Código existe mas **não deve ser exposto na UI v2**. Removido fisicamente em F-V12.
11. Provider de pagamento — Cashin/PIX manual é a direção atual (TBD-3 resolvido com ressalva — TBD-19 pra confirmação). Construir `lib/payouts/v2/` com interface agnóstica de provider pra permitir troca sem mexer em cima.

---

## 4. TBDs ao cliente — decisões pendentes

### 4.1 TBDs em aberto (12 — ainda bloqueando features)

| ID | Pergunta | Bloqueia |
|---|---|---|
| TBD-1 | A comissão é sempre 50% ou existem casos diferentes (produto vs assinatura, primeira compra vs recorrência)? | F-V04, F-V07 |
| TBD-2 | "Menos impostos e taxas" — quem desconta? LRP retém ISS/IR antes do payout, ou repassa bruto e o membro se vira na NF? | F-V04, F-V07 |
| TBD-8 | Inativo: link/código de afiliação dele continua válido pra trazer novos cadastros, ou bloqueia? | F-V01 (não-bloqueante — hipótese padrão: bloqueia novos cadastros enquanto inativo) |
| TBD-9 | Validade do código manual: imutável ou expira? Pode ser reusado se membro inativar e reativar? | F-V01 (não-bloqueante — hipótese padrão: imutável, igual ao link) |
| TBD-11 | Critério do ranking de Founder: tamanho do clube? faturamento? média mensal de itens por cliente? combinação? | F-V08 |
| TBD-12 | Founder pode "desfounderar" se cair abaixo de 5 ativos, ou status é definitivo uma vez atingido? | F-V06 (não-bloqueante — hipótese padrão: status definitivo) |
| TBD-15 | Conteúdo (F-V09): admin posta global, ou cada Founder tem seu próprio mural pro clube dele? | F-V09 |
| TBD-16 | WhatsApp link por Founder: admin valida antes de publicar, ou o Founder publica direto? | F-V10 |
| **TBD-19** *(novo)* | **Cashin** é o fornecedor confirmado pra pagamentos? Resposta TBD-3 disse "provavelmente" — precisa confirmação final. Em paralelo: o `lib/payouts/v2/` é construído com interface de provider agnóstica. | F-V07 |
| **TBD-20** *(novo)* | Founder com CPF pode usar Cashin (sem NF), ou só Founder com CNPJ pode sacar cash? Em outras palavras, ser Founder é independente de CPF/CNPJ ou exige CNPJ? | F-V06, F-V07 |
| **TBD-21** *(novo)* | Membro inativo: prazo X pra converter saldo em crédito antes de "expirar"? Qual X? Resposta TBD-13 deixou em aberto pra inativos. | F-V05 (não-bloqueante — hipótese padrão: 90 dias após inativação) |
| **TBD-22** *(novo)* | Cupom de creatina (campanhas): admin define períodos/segmentos via UI nova, ou disparo é manual? Quais critérios de elegibilidade (cliente novo, valor mínimo de pedido, etc.)? | F-V13 |

### 4.2 TBDs resolvidos (11 — registrados em 29/04/2026)

| ID | Decisão | Impacto |
|---|---|---|
| TBD-3 | **Cashin** (provável) ou PIX manual como rail de pagamento. Asaas descartado. | Anti-SPEC §11 atualizado. F-V07 com interface de provider agnóstica. **TBD-19 derivado** pra confirmar Cashin. |
| TBD-4 | **Aprovação manual** do admin antes da transferência. NF é validada **automaticamente** (formato, dados, valor) — se inválida, sistema dá erro pro user no upload, não vai pra fila. | F-V07 com 2 etapas: (1) validação automática síncrona da NF; (2) fila de aprovação pra admin. |
| TBD-5 | CPF **NÃO** está totalmente fora — pode receber via **Cashin** ou crédito em loja. CNPJ pode emitir NF de serviço pra saque cash. | Atualiza Anti-SPEC §10. **TBD-20 derivado**: Founder pode ser CPF? |
| TBD-6 | **Não há integração com ERP** nessa fase. Fluxo de produto fica manual no cliente. | Remove ERP do escopo. Não cria features pra ERP. |
| TBD-7 | Guru cria pedido na Shopify, **lemos via webhook Shopify**. Wink valida abordagem técnica posteriormente. | F-V02 com abordagem Shopify-first. Reuso de webhooks já existentes. |
| TBD-10 | **House Account descontinua** no v2. | Anti-SPEC §8 atualizado. F-V01 bloqueia cadastro sem ref. House Account some na onda 6 / F-V12. |
| TBD-13 | Saldo do membro **ATIVO**: sem prazo. Membro **INATIVO**: a definir. | F-V05 sem prazo pra ativos. **TBD-21 derivado** pra prazo de inativos. |
| TBD-14 | Saldo → crédito Shopify: **1:1, sem prazo após resgate**. | F-V05 com regra simples. |
| TBD-17 | Cupom de creatina **mantém**, mas com escopo alterado: vira **sistema de campanhas configuráveis pelo admin** (cliente/período/segmento). Não mais cron mensal automático. | Anti-SPEC §9 atualizado. **F-V13 criada** pra cobrir o escopo novo. **TBD-22 derivado** pra UX. Cron `generate-creatine-coupons` será desligado quando F-V13 substituir. |
| TBD-18 | **Saque RPA/CPF descontinua**. Não foi confirmado quantos membros usam. | Anti-SPEC §10 atualizado. UI escondida atrás do flag v2. Remoção física na onda 6 / F-V12. |
| TBD-001 (legado v1) | House Account — descontinua no v2 (sobreposto pelo TBD-10). | Sem ação adicional. |

---

## 5. Plano de migração — ondas, não big-bang

### ONDA 0 — Documentação (sessões 28-29/04/2026) ✅ Concluída
- [x] Criar `docs/sdd/PIVOT-V2.md` (este doc) — 28/04/2026.
- [x] Criar `docs/sdd/PLAYBOOK.md` (workflow operacional) — 28/04/2026.
- [x] Atualizar `docs/STATUS_IMPLEMENTACAO.md` com seção do pivot no topo — 28/04/2026.
- [x] Criar `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` (texto pra WhatsApp) — 28/04/2026.
- [x] Criar `docs/sdd/PROMPT-NOVA-SESSAO.md` (prompt self-contained pra sessão CLI) — 28/04/2026.
- [x] Frente 1 — feature flag `LRP_V2` em `lib/utils/featureFlags.ts` + envs — 28/04/2026.
- [x] Frente 3 — shells em `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/` — 28/04/2026.
- [x] SPEC F-V11 (visão restrita da rede) — 28/04/2026.
- [x] Persistir insumos do cliente em `documentos_escopo/Fluxo.txt` — 29/04/2026.
- [x] Banner DEPRECATED nos 5 docs v1 — 29/04/2026.
- [x] Comentário `@deprecated` em 6 arquivos de código v1 — 29/04/2026.
- [x] Entrada v5.0 no `docs/CHANGELOG.md` registrando o pivô — 29/04/2026.
- [x] Reorganização do `docs/README.md` priorizando v2 — 29/04/2026.

### ONDA 1 — TBDs com cliente (parcial — 11/18 respondidos)
- [x] Enviar questionário ao cliente (29/04/2026).
- [x] Receber primeira leva de respostas — 11/18 TBDs resolvidos (29/04/2026).
- [x] Atualizar este doc com decisões (§4.2 "Resolvidos").
- [x] Confirmar destino do Sprint 7 — House Account descontinuada (TBD-10), creatina mantida com escopo alterado (TBD-17 → F-V13).
- [x] Confirmar destino do Sprint 5 (RPA/CPF) — descontinuado (TBD-18).
- [ ] Receber respostas dos 8 TBDs originais ainda abertos (1, 2, 8, 9, 11, 12, 15, 16) + 4 derivados (19, 20, 21, 22).

### ONDA 2 — Foundation v2 (P0)
- [x] Adicionar env `LRP_V2=false` em `.env.local` e `.env.example` (default off) — 28/04/2026.
- [ ] **F-V01** — cadastro com ref obrigatório. ✅ Destravada (TBD-10 resolvido). Hipóteses padrão pra TBD-8/TBD-9.
- [ ] **F-V02** — integração Guru via webhook Shopify. ✅ Destravada (TBD-7).
- [ ] **F-V03** — status ativo = `subscription_paid` (após F-V02). ✅ Destravada.
- [ ] Em produção: flag FALSE até validação completa em staging.
- [ ] Pausar crons CV (`close-monthly-cv`, `network-compression`) via `CRON_DISABLED_V2=true` quando flag v2 ON em produção.

### ONDA 3 — Comissão e pagamento (P0/P1)
- [ ] **F-V04** — comissão 50% por assinatura. 🚫 Bloqueada (TBD-1, TBD-2).
- [ ] **F-V05** — saldo + créditos Shopify 1:1. ✅ Destravada (prazo do inativo TBD-21 não bloqueia início).
- [ ] **F-V07** — saque Founder via Cashin + NF + validação automática + aprovação manual. 🟡 Parcial — fluxo definido (TBD-3/4/5), valor depende de F-V04. Pode iniciar UI cadastro bancário + upload/validação NF.

### ONDA 4 — Founder, ranking e UX (P1/P2)
- [ ] **F-V06** — promoção a Founder. 🟡 Parcial — hipótese padrão "status definitivo" (TBD-12).
- [x] **F-V11** — visão restrita da rede (concluída 29/04/2026, antecipada da onda 4).
- [ ] **F-V08** — ranking. 🚫 Bloqueada (TBD-11).

### ONDA 5 — Conteúdo e comunidade (P2)
- [ ] **F-V09** — área de conteúdo. 🚫 Bloqueada (TBD-15).
- [ ] **F-V10** — link WhatsApp Founder. 🚫 Bloqueada (TBD-16).
- [ ] **F-V13** — cupom de creatina como campanha configurável. 🚫 Bloqueada (TBD-22).

### ONDA 6 — Cleanup
- [ ] **F-V12** — remover fisicamente código v1 (jobs CV, bônus, royalty, rebaixamento, RPA/CPF, telas de níveis, House Account, cron de cupom mensal).
- [ ] Só após v2 validado em produção e flag `LRP_V2=true` por X semanas (sugestão: 4 semanas com 0 incidentes).

---

## 6. Mapeamento código → status pós-pivot

### Manter mas DEPRECATED (não tocar até onda 6, podem ser desligadas via flag/env)
- `lib/cv/calculator.ts` — CV deixa de ser fonte de status.
- `lib/levels/calculator.ts` — níveis Parceira/Líder/etc. saem de cena.
- `lib/commissions/calculator.ts` (Fast-Track, Perpétua) — substituído por `lib/commissions-v2/`.
- `lib/commissions/bonus3.ts`, `lib/commissions/royalty.ts` — sem uso no v2.
- `app/api/cron/close-monthly-cv/route.ts` — pausar via `CRON_DISABLED_V2=true`.
- `app/api/cron/network-compression/route.ts` — pausar idem.
- `app/api/cron/generate-creatine-coupons/route.ts` — pausar quando F-V13 estiver pronto.
- `app/dashboard/network/*` (visão de árvore multinível) — substituída por F-V11 ✅.
- `app/dashboard/payouts/*` (UI RPA/CPF) — esconder atrás do flag v2 (TBD-18 confirmou descontinuar). Remoção física em F-V12.
- `app/admin/commissions/*` — adaptar pra v2 ou paralela em `app/admin/commissions-v2/`.
- `lib/utils/ref-code.ts` (export `HOUSE_ACCOUNT_ID`) — descontinuado no v2 (TBD-10). Remove em F-V12.

### Reusar com adaptação
- `lib/network/*` — vínculos sponsor mantêm; só remover compressão. ✅ `lib/network/v2.ts` adicionado em F-V11.
- `lib/shopify/customer.ts` — sync + tags continua. Remover tag `nivel:` (não tem mais nível).
- `lib/shopify/coupon.ts` — manter (será reusado por F-V13 — campanha de creatina).
- `app/api/members/join/route.ts` — refactor pra exigir ref (F-V01).
- `lib/payouts/*` — refator pra Founder/Cashin (F-V07). Construir `lib/payouts/v2/` com interface de provider agnóstica.

### A criar
- `lib/subscriptions/` — integração Guru (F-V02). Shell criado 28/04/2026.
- `lib/commissions-v2/` — comissão direta 50% (F-V04). Shell criado 28/04/2026.
- `lib/credits/` — saldo + crédito Shopify (F-V05). Shell criado 28/04/2026.
- `lib/founder/` — promoção e ranking (F-V06, F-V08). Shell criado 28/04/2026.
- `lib/content/` — CMS leve (F-V09). Shell criado 28/04/2026.
- `lib/payouts/v2/` — provider Cashin + interface agnóstica (F-V07). A criar.
- `lib/campaigns/` ou `lib/content/campaigns/` — sistema de campanhas de cupom (F-V13). A criar.

---

## 7. Próximos passos imediatos

1. **Iniciar F-V01** (cadastro com ref obrigatório) — porta de entrada do v2. TBD-10 resolvido. Hipóteses padrão pra TBD-8/9 documentadas no SPEC quando criar.
2. **Iniciar F-V02** (integração Guru via Shopify) — em paralelo a F-V01. Confirmar com Wink a abordagem antes de mergear.
3. **Iniciar F-V05** (saldo + créditos Shopify 1:1) — depende de F-V03/F-V04 estarem em curso? Não — saldo pode existir antes da comissão entrar; vira valor 0 até F-V04 alimentar.
4. **Cliente responder os 12 TBDs ainda abertos** (8 originais + 4 derivados). Sem isso, F-V04, F-V07, F-V08, F-V09, F-V10, F-V13 ficam bloqueadas.
5. **Confirmação técnica do Wink** sobre Guru → Shopify webhook.
6. **Confirmação do fornecedor de pagamento** (Cashin vs alternativas — TBD-19).

---

*Última atualização: 2026-04-29 (11/18 TBDs respondidos; F-V01, F-V02, F-V03, F-V05 destravadas; 4 TBDs derivados criados; F-V13 nova feature).*
