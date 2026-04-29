# PIVÔ V2 — Biohelp LRP

> Documento canônico do pivot do projeto. Fonte única de verdade para toda mudança a partir de 28/abr/2026.
> Quando houver conflito entre este doc e qualquer artefato anterior (SPEC_Biohelp_LRP.md, STATUS_IMPLEMENTACAO.md, documentos_projeto_iniciais_MD/*), **este doc prevalece** para tudo que diz respeito ao modelo v2.

**Data:** 2026-04-28
**Status:** Em planejamento — aguardando decisões TBD do cliente
**Insumos do cliente:** `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários), `documentos_escopo/Fluxograma.jpg.jpeg` (fluxograma novo), `Fluxo.txt` (regras condensadas).

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

### ALTERADO (mantém com regra nova)
- **Cadastro:** ref OBRIGATÓRIO (link OU código). Sem ref → bloqueia (não cai mais em House Account).
- **Status ativo:** vinculado a ASSINATURA paga via Guru, não a CV.
- **Visão da rede:** membro vê apenas seu sponsor + indicados diretos (1 nível pra cima e 1 nível pra baixo). Admin vê tudo.
- **ref_code:** mantém o link único (formato `BH00001`) e adiciona possibilidade de o usuário **digitar código manualmente** no cadastro.
- **Sync Shopify:** mantém tags + Locksmith para liberar preços de clube.
- **Pagamento ao membro:** somente Founder + CNPJ + NF de serviço. Asaas como rail (a confirmar TBD-3). RPA/CPF cortado.
- **Webhooks Shopify:** mantém pra histórico/integração, mas não dispara cálculo de CV.

### NOVO (a construir)
- **F-V01:** Bloqueio de cadastro sem ref + suporte a código manual.
- **F-V02:** Integração Guru — receber/consultar estado de assinatura.
- **F-V03:** Status ativo = `subscription_paid` (substitui lógica CV).
- **F-V04:** Comissão 50% (líquida de impostos/taxas) sobre assinatura do convidado, somente 1 nível.
- **F-V05:** Saldo do membro + conversão saldo → crédito Shopify (pre-Founder e Founder podem converter).
- **F-V06:** Promoção a Founder ao atingir 5 membros ativos no clube. Founder destrava saque cash (CNPJ).
- **F-V07:** Saque Founder via NF de serviço + Asaas. Validação de NF + dados bancários.
- **F-V08:** Ranking de Founders. Critério a definir (TBD-8).
- **F-V09:** Área de conteúdo (texto / vídeo / imagem / pdf). CMS leve.
- **F-V10:** Link de grupo WhatsApp por Founder.
- **F-V11:** Refactor da visão de rede: membro vê só sponsor + indicados diretos.
- **F-V12:** Migration / arquivamento do modelo v1 atrás de feature flag (`LRP_V2`).

---

## 2. Backlog de features — classificação e prioridade

| ID | Feature | Classe | Prioridade | Bloqueio TBD |
|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | P0 | TBD-10, TBD-11 |
| F-V02 | Webhook/consulta Guru → registro de assinatura | D | P0 | TBD-7 |
| F-V03 | Status ativo = subscription_paid | C | P0 | TBD-7 |
| F-V04 | Comissão 50% por assinatura de convidado (1 nível) | D | P0 | TBD-1, TBD-2 |
| F-V05 | Saldo + conversão para crédito Shopify | C | P1 | TBD-12 |
| F-V06 | Promoção a Founder (≥5 ativos no clube) | B | P1 | TBD-13 |
| F-V07 | Saque Founder + CNPJ + NF serviço + Asaas | D | P1 | TBD-3, TBD-4, TBD-5 |
| F-V08 | Ranking de Founders | B | P2 | TBD-8 |
| F-V09 | Área de conteúdo (CMS leve) | B | P2 | TBD-14 |
| F-V10 | Link WhatsApp por Founder | A | P2 | TBD-15 |
| F-V11 | Visão restrita da rede pro membro | B | P1 | ✅ Implementada 29/04/2026 |
| F-V12 | Deprecation v1 (CV, níveis, bônus, royalty, RPA) | D | depende | depende de v2 estar live |

**Legenda:** P0 = bloqueia o novo fluxo. P1 = essencial pro MVP v2. P2 = pós-MVP v2.

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
8. House Account (Sprint 7 / TBD-001) — confirmar com cliente se mantém ou se é cortado pela regra "ref obrigatório" (TBD-16, novo).
9. Cupom mensal de creatina (Sprint 7 / TBD-019) — confirmar se permanece (TBD-17, novo).
10. RPA / CPF / limite R$1.000 — código existe mas **não deve ser exposto na UI v2**. Removido fisicamente apenas em F-V12.

---

## 4. TBDs ao cliente (decisões pendentes)

| ID | Pergunta | Bloqueia |
|---|---|---|
| TBD-1 | A comissão é sempre 50% ou existem casos diferentes (produto vs assinatura, primeira compra vs recorrência)? | F-V04 |
| TBD-2 | "Menos impostos e taxas" — quem desconta? LRP retém ISS/IR antes do payout, ou repassa bruto e o membro se vira na NF? | F-V04, F-V07 |
| TBD-3 | Asaas é obrigatório ou aceita PIX/TED manual também? Tem aprovação manual antes da transferência? | F-V07 |
| TBD-4 | Pre-Founder pode acumular saldo pra sacar quando virar Founder, ou tem prazo de validade? | F-V05, F-V07 |
| TBD-5 | Membro pode receber só como PJ com NF de serviço? CPF está completamente fora do fluxo? | F-V07 |
| TBD-6 | ERP (NF de venda no fluxo de produto) tem API ou é registro manual nessa fase? | escopo produto |
| TBD-7 | Guru envia webhook direto ao LRP ou cria pedido na Shopify e o LRP lê via webhook Shopify? | F-V02, F-V03 |
| TBD-8 | Critério do ranking de Founder: tamanho do clube? faturamento? média mensal de itens por cliente? combinação? | F-V08 |
| TBD-9 | Inativo: prazo X dias pra sacar saldo disponível antes de "expirar"? Qual X? | F-V05 |
| TBD-10 | Inativo: link/código de afiliação dele continua válido pra trazer novos cadastros, ou bloqueia? | F-V01 |
| TBD-11 | Validade do código manual: imutável ou expira? Pode ser reusado se membro inativar e reativar? | F-V01 |
| TBD-12 | Conversão saldo → crédito: 1:1 ou tem ágio? Crédito Shopify tem validade? | F-V05 |
| TBD-13 | Founder pode "desfounderar" se cair abaixo de 5 ativos, ou status é definitivo uma vez atingido? | F-V06 |
| TBD-14 | Conteúdo (F-V09): admin posta global, ou cada Founder tem seu próprio mural pro clube dele? | F-V09 |
| TBD-15 | WhatsApp link por Founder: admin valida antes de publicar, ou o Founder publica direto? | F-V10 |
| TBD-16 | House Account (Sprint 7) — mantém pra cadastro sem ref, ou descontinua já que ref vira obrigatório? | F-V01 |
| TBD-17 | Cupom mensal de creatina (Sprint 7) — permanece como benefício pro membro ativo, ou é descontinuado? | escopo |
| TBD-18 | Sprint 5 (saques RPA/CPF) já entregue: derruba a UI agora ou só na onda 6? Tem usuário ativo usando? | F-V07, F-V12 |

---

## 5. Plano de migração — ondas, não big-bang

### ONDA 0 — Documentação (sessões 28-29/04/2026)
- [x] Criar `docs/sdd/PIVOT-V2.md` (este doc) — 28/04/2026.
- [x] Criar `docs/sdd/PLAYBOOK.md` (workflow operacional) — 28/04/2026.
- [x] Atualizar `docs/STATUS_IMPLEMENTACAO.md` com seção do pivot no topo — 28/04/2026.
- [x] Criar `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` (texto pra WhatsApp) — 28/04/2026.
- [x] Criar `docs/sdd/PROMPT-NOVA-SESSAO.md` (prompt self-contained pra sessão CLI) — 28/04/2026.
- [x] Frente 1 — feature flag `LRP_V2` em `lib/utils/featureFlags.ts` + envs — 28/04/2026.
- [x] Frente 3 — shells em `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/` — 28/04/2026.
- [x] SPEC F-V11 (visão restrita da rede) — 28/04/2026.
- [x] Persistir insumos do cliente em `documentos_escopo/Fluxo.txt` — 29/04/2026.
- [x] Banner DEPRECATED nos 5 docs v1 (`SPEC_Biohelp_LRP.md`, `ACCEPTANCE.md`, `DECISOES_TBD.md`, `WORKFLOW.md`, `PR_TEMPLATE.md`) — 29/04/2026.
- [x] Comentário `@deprecated` em 6 arquivos de código v1 (`lib/cv/`, `lib/levels/`, `lib/commissions/{calculator,bonus3,royalty}.ts`, `lib/network/compression.ts`) — 29/04/2026.
- [x] Entrada v5.0 no `docs/CHANGELOG.md` registrando o pivô — 29/04/2026.
- [x] Reorganização do `docs/README.md` priorizando v2 — 29/04/2026.

### ONDA 1 — TBDs com cliente
- [ ] Reunião / chat pra resolver os 18 TBDs acima.
- [ ] Atualizar este doc com decisões (mover TBDs resolvidos pra rodapé).
- [ ] Confirmar destino do Sprint 7 (House Account, creatina) e Sprint 5 (RPA/CPF).

### ONDA 2 — Foundation v2 (P0)
- [ ] Adicionar env `LRP_V2=false` em `.env.local` e Vercel (default off em prod).
- [ ] **F-V01** — cadastro com ref obrigatório.
- [ ] **F-V02** — integração Guru.
- [ ] **F-V03** — status ativo = `subscription_paid`.
- [ ] Em produção: flag FALSE até validação completa em staging.
- [ ] Pausar crons CV (`close-monthly-cv`, `network-compression`) via env quando flag ON.

### ONDA 3 — Comissão e pagamento (P0/P1)
- [ ] **F-V04** — comissão 50% por assinatura.
- [ ] **F-V05** — saldo + créditos Shopify (atende pre-Founder).
- [ ] **F-V07** — saque Founder + CNPJ + NF + Asaas.

### ONDA 4 — Founder, ranking e UX (P1/P2)
- [ ] **F-V06** — promoção a Founder.
- [x] **F-V11** — visão restrita da rede (concluída 29/04/2026, antecipada da onda 4).
- [ ] **F-V08** — ranking (depende de TBD-8).

### ONDA 5 — Conteúdo e comunidade (P2)
- [ ] **F-V09** — área de conteúdo.
- [ ] **F-V10** — link WhatsApp Founder.

### ONDA 6 — Cleanup
- [ ] **F-V12** — remover fisicamente código v1 (jobs CV, bônus, royalty, rebaixamento, RPA, telas de níveis).
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
- `app/dashboard/network/*` (visão de árvore multinível) — substituir por F-V11.
- `app/dashboard/payouts/*` (UI RPA/CPF) — manter rota mas redirecionar para mensagem "saque indisponível para CPF" quando flag v2 ON.
- `app/admin/commissions/*` — adaptar pra v2 ou paralela em `app/admin/commissions-v2/`.

### Reusar com adaptação
- `lib/network/*` — vínculos sponsor mantêm; só remover compressão.
- `lib/shopify/customer.ts` — sync + tags continua. Remover tag `nivel:` (se sair).
- `lib/shopify/coupon.ts` — manter se TBD-17 confirmar creatina.
- `app/api/members/join/route.ts` — refactor pra exigir ref (F-V01).
- `lib/payouts/*` — refator pra Founder/CNPJ/Asaas (F-V07).

### A criar
- `lib/subscriptions/` — integração Guru (F-V02).
- `lib/commissions-v2/` — comissão direta 50% (F-V04).
- `lib/credits/` — saldo + crédito Shopify (F-V05).
- `lib/founder/` — promoção e ranking (F-V06, F-V08).
- `lib/content/` — CMS leve (F-V09).

---

## 7. Próximos passos imediatos (próxima sessão)

1. **Cliente responder os 18 TBDs** da seção 4. Sem isso, ondas 2-5 ficam BLOQUEADAS.
2. **Confirmar destino do Sprint 7** (House Account TBD-16, creatina TBD-17) e Sprint 5 (RPA/CPF TBD-18).
3. **Definir env `LRP_V2`** e estratégia de desligamento dos crons CV em produção (precisa janela; não desliga sem aviso a usuários ativos).
4. **Iniciar F-V01** (cadastro com ref obrigatório) assim que TBD-10, TBD-11, TBD-16 estiverem resolvidos — é a porta de entrada do v2.

---

*Última atualização: 2026-04-28.*
