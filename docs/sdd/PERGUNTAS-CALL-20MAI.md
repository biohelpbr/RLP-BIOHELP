# Pendências pós-call 20/05/2026 — Biohelp <> Flowcode

**Call realizada:** 20/05/2026, 09:33–10:27.
**Participantes:** Léo (Biohelp), Matheus Wink, Gabriel Sturm (Logística Biohelp), Eduardo (Flowcode).
**Próxima call:** sexta-feira 22/05/2026, ~15h00 — validar fluxo Guru integrado end-to-end.

> Tudo que foi fechado na call (A1, fluxo Guru→LRP→Shopify, estrutura de comissão 100%/50%) saiu deste doc. Aqui ficou só o que **ainda depende de decisão ou envio do cliente**.

---

## ⚡ Atualização 22/05/2026 (pré-call 15h)

**Fechados nesta janela (pós envios do Léo/Gabriel via WhatsApp 11h–12h):**

- ✅ **Cashin integração:** confirmado **MANUAL via planilha** nos primeiros 2-3 meses (mensagem Léo 11:14). Saque PF opta pela Cashin → "desconta a taxa e paga o novo valor líquido" (sem NF). Integração API só depois do trial. → **F-V07b (Cashin live) sai do escopo MVP-Live 01/06**. Mantém-se no backlog mas não bloqueia.
- ✅ **Receita produto vs assinatura (A2):** decisão MVP — "contribuição líquida cadastrada manualmente no painel admin". Gabriel ainda vai mandar mockup detalhado do display, mas a regra está fechada. → atualizar `docs/sdd/features/F-V16-painel-admin-completo/SPEC.md` quando o mockup chegar.
- ✅ **Fluxo end-to-end pré-cadastro → Guru → LRP → Shopify:** SPEC F-V19 criada em `docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md`. Plano de implementação em `docs/sdd/PLANO-IMPLEMENTACAO-22MAI.md`. MVP demo 22/05 cobre: landing + form + mock Guru + ativação + sync mock Shopify. Real Guru + sync Shopify live ficam pós-call.
- ✅ **Credenciais Guru:** recebidas pelo Léo via WhatsApp 22/05 (eduardo.sousa@flowcode.cc). Não persistidas em arquivo — ficam no `.env.local` do desenvolvedor + cofre pessoal.
- ✅ **TBD-7 revisitado:** integração Guru passa a ser **Guru → LRP direto via webhook próprio**, NÃO mais via Shopify (revisa decisão de 29/04 que dizia "Shopify-first"). Motivo: Mateus na call 20/05 desenhou no Miro o webhook Guru direto, e o fluxo de assinatura fake na Shopify vira RESPONSABILIDADE DO LRP (não do Guru-Shopify-make). Anti-SPEC §4 não muda — webhook Shopify orders/paid continua intocado.

**Continua pendente desta lista (sem mudança):**

---

## 1. Você (Léo) ficou de mandar

| # | Item | Quando | Bloqueia | Status 22/05 |
|---|---|---|---|---|
| 1.1 | **Números finais de comissionamento** — faixas (20 primeiros = 100%, e depois?) + threshold de SKU/pessoa pra cair de 100% pra 50%. Você ia bater com Matt hoje à tarde. | Até sexta 22/05 | F-V04 (cálculo comissão real) | 📥 Gabriel mandou planilha "Ass Líquido" às 11:11 — Léo ainda vai fechar com Matt |
| 1.2 | **% de impostos/taxas final** — você falou em ~15%, mas queria validar com escritório. | Até sexta 22/05 | F-V04, F-V07 (payout) | 📥 Planilha indica taxas — Léo ainda vai validar |
| 1.3 | **Print/mockup da tela "Minha comunidade" refinada** (U2/U3) — o que aparece ao clicar num membro; como é o painel da comunidade do sponsor; campo "link do grupo WhatsApp". | Até sexta 22/05 | U2 e U3 | ⏳ Não chegou ainda |
| 1.4 | **Dados de NF Biohelp** (TBD-27) — CNPJ, razão social, endereço — você ia falar com Bruno (escritório contábil). | Sem prazo definido | Emissão de NF no Cashin | ⏳ Aguarda (não bloqueia Live 01/06 — Cashin manual) |
| 1.5 | **Credenciais Cashin sandbox** — Gabriel disse que está atrasado, ainda não chegaram. | Quando chegar | F-V07 (payout real) | ✅ Desbloqueado por decisão "Cashin manual primeiros 2-3 meses" (Léo 11:12) |
| 1.6 | **`GURU_OFFER_ID_CLUBE_MENSAL`** — ID da oferta de assinatura mensal no Guru pra montar URL do checkout. | Até a call 15h | F-V19 (URL Guru real) | ⏳ Léo precisa enviar ID da oferta (não é credencial, é ID público do checkout) |
| 1.7 | **Produto "Assinatura Clube" no Shopify Admin + variant id** — pra sync Shopify criar pedido fake. | Antes da Live 01/06 | F-V19 (sync Shopify live) | ⏳ Léo cria no Shopify Admin + envia variant id |

---

## 2. Decisões que ainda precisam da sua palavra

### 2.1 [A2] Receita de produto × Receita de assinatura ✅ FECHADO 22/05
- **Já fechado:** assinatura = R$99 mensal, separar de produto no admin, produto **não** gera comissão.
- **Decisão MVP confirmada (22/05 implícita pela inação do Léo):** "contribuição líquida" cadastrada manualmente no painel admin. Gabriel ainda mandará mockup detalhado mas a regra-base não muda.
- **Próximo passo:** quando Gabriel enviar o mockup, atualizar [F-V16 SPEC](features/F-V16-painel-admin-completo/SPEC.md).

### 2.2 [A5 + U6] Notificações
- **Já fechado:** in-app (sininho no header), prioridade admin, lista persistida.
- **Gabriel vai listar** as notificações mínimas (saque pendente, NF rejeitada, post aguardando aprovação, nova trilha/live, etc).
- **Decisão pendente:** quer email/WhatsApp também ou só in-app por enquanto?

### 2.3 [U5] Posts do Founder
- **Já fechado:** workflow de aprovação pelo admin antes de publicar. Link de grupo WhatsApp do Founder entra nessa fila.
- **Faltam decisões:**
  - Conteúdo permitido: texto + imagem? Vídeo? Markdown? Link externo?
  - Permite comentário/curtida dos membros? Ou one-way (Founder → comunidade)?
  - Notifica os membros automaticamente quando Founder posta?

### 2.4 [U4] Refator "Minhas vendas → Novo registro"
- **Não foi discutido na call.**
- **Hipótese-padrão pra confirmar:**
  - Membro digita custo livre por linha (não puxa do cadastro de produto do admin).
  - Linhas múltiplas (produto / custo / receita / qty) com botão "+".
  - Custo é visível só pro próprio membro + admin (não pra outros membros da rede).

---

## 3. TBDs antigos ainda abertos (não-bloqueantes, mas vale uma posição)

| TBD | Pergunta | Hipótese-padrão |
|---|---|---|
| 8 | Membro inativo — link/código dele continua válido pra novos cadastros? | Bloqueia |
| 9 | Validade do código manual de afiliação — imutável ou expira? | Imutável |
| 12 | Founder pode "desfounderar" se cair < 5 ativos? | Status definitivo |
| 15 | Conteúdo Academy — admin posta global, ou cada Founder tem mural próprio? | Global pelo admin |
| 20 | Founder com CPF (sem CNPJ) pode usar Cashin? | Sim, sem NF |
| 21 | Membro inativo — prazo X pra converter saldo em crédito? | 90 dias |
| 23 | Crédito Shopify gerado — tem validade ou é eterno? | Sem validade |
| 24 | Eventos com entry-fee ou gratuitos + bônus de ativação? | Gratuitos + tag |
| 25 | Preço sugerido nas vendas manuais — admin define ou membro digita livre? | Liga com 2.4 |
| 26 | Critério final ranking Founder — só nº pessoas ou combinação? | Só nº pessoas |

> Se você não responder, eu sigo com a hipótese-padrão. Se discordar de alguma, me sinaliza no grupo.

---

## 4. Próximos passos (Flowcode)

### Até a call de hoje (22/05 15h)
- ✅ **F-V19 SPEC** criada em `docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md`.
- ✅ **PLANO-IMPLEMENTACAO-22MAI.md** com prompt acionável passo-a-passo.
- ⏳ **Implementar MVP demo F-V19** (3h, escopo: landing + form + mock Guru + ativação + sync mock Shopify).
- ⏳ **Apresentar end-to-end na call** com fluxo navegável + DB enchendo + sininho de notificação funcionando.

### Pós-call de hoje (continuação)
- **Webhook Guru real:** logar em https://app.gurupay.com.br (credenciais Léo já enviadas) → documentar payload real → configurar webhook produção apontando pra `/api/webhooks/guru` + setar `GURU_WEBHOOK_SECRET` no Vercel.
- **Shopify produto fake:** quando Léo enviar variant id, ligar `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=true`.
- **F-V03 deprecation:** hook em `lib/subscriptions/hook-on-order-paid.ts` vira no-op (Guru passa a ser fonte da assinatura, não Shopify).

### Backlog dependente (continua igual)
- F-V04 (comissão real) — começa assim que TBD-1 + TBD-2 fecharem (Léo vai bater com Matt hoje).
- U2/U3 — começa quando o print da "Minha comunidade" chegar (item 1.3 acima).
- U4 (refator vendas manuais) — não foi discutido na call, hipótese padrão registrada em §2.4 mantém.
- U5 (posts Founder) — pendente decisões §2.3.
- A5+U6 (notificações) — MVP entregue em F-V19 (sininho admin), Gabriel ainda lista notificações mínimas finais.

---

*Doc gerado 20/05/2026 pós-call. Atualizado 22/05/2026 pré-call 15h.*
*Versão HTML para envio ao Léo em `docs/sdd/PENDENTES-POS-CALL-20MAI.html` (precisa regerar com este conteúdo atualizado).*
