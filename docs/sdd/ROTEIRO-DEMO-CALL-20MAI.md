# Roteiro de demo — Call 20/05/2026 10h-11h

> Roteiro do que **eu vou mostrar** durante a call. Foco em (a) provar que ouvi o feedback de 13/05 e mexi nos pontos rápidos, (b) alinhar o que vem antes de codar o resto. Detalhe das perguntas em `PERGUNTAS-CALL-20MAI.md`.

**Branch atual:** `feat/feedback-pos-demo-20mai` (4 commits, pushed). Vou apresentar com flag `LRP_V2=true` em ambiente local.

---

## Setup — antes de começar a call

1. `git checkout feat/feedback-pos-demo-20mai`
2. `npm run dev` (porta 3000)
3. `.env.local` com `LRP_V2=true`
4. Abrir 2 abas no Chrome (perfis incognito separados):
   - Aba A (membro): login `sponsor@biohelp.test` / `Demo13Mai!`
   - Aba B (admin): login `admin@biohelp.test` / `SSTest042026`
5. Ter aberto também a tela de produção `https://rlp-biohelp.vercel.app` como ponto de comparação (sem fixes).

---

## Bloco 1 — 5 min — Status da reorganização técnica (opcional, se cliente perguntar)

- PR #8 (Harness v3.2) mergeada em prod. Estrutura nova `docs/wiki/`, `AGENTS.md`, `TODO.md` viva. **Zero código tocado.**
- Mostrar diff alto-nível em https://github.com/biohelpbr/RLP-BIOHELP/pull/8 (se quiserem ver).
- Cliente provavelmente não dá importância — pular se ninguém perguntar.

---

## Bloco 2 — 10 min — Fixes que vocês pediram, já entregues

### Demo U1: Copiar link agora copia URL completa
- **Aba A (membro):** `/dashboard` → bloco "Link de convite" → clica "Copiar link".
- **Mostrar:** colando em qualquer campo, agora vai `https://rlp-biohelp.vercel.app/join?ref=SPONSOR01` (antes era só `/join?ref=SPONSOR01`).
- Mencionar: domínio final em prod (`bio-help.com`?) é trivial de trocar — mexe 1 env var.

### Demo A4: Clicar no nome do cliente em /admin/payouts
- **Aba B (admin):** `/admin/payouts` → aba PIX, Cashin ou Crédito.
- **Mostrar:** clicar no nome do membro → navega pra `/admin/community/[id]` com perfil dele.
- Mencionar: já funciona em qualquer um dos 3 métodos de resgate.

### Demo A3: Texto "Fonte de dados" do Consumo reescrito
- **Aba B:** `/admin/consumption` → scroll até o card "O que este painel mostra / NÃO mostra / Por que ambos coexistem".
- **Mostrar:** distinção explícita entre vendas auto-declaradas pelo membro (este painel) vs `/admin/orders` (pedidos reais Shopify).
- Pergunta de volta pra cliente: faz sentido manter ambos painéis ou consolida tudo em `/admin/orders` com filtro?

### Demo A1: Tags reorganizadas (Líder removido, Influenciador manual, Founder ≥5)
- **Aba B:** `/admin` overview.
- **Mostrar:** card "Status e distinções dos membros" (antes "Tags automáticas") agora tem 2 itens:
   - **FOUNDER** — ≥5 afiliados ativos no clube (F-V06) — contagem por condição real, não tag persistida
   - **manual:influenciador** — atribuído manualmente pelo admin
- **Mostrar também:** `/admin/community` → filtro de tags só mostra FOUNDER + manual:influenciador (não auto:* mais).
- **Confirmar com cliente:** é exatamente isso que vocês queriam? Vou empacotar pra prod assim que confirmar.

---

## Bloco 3 — 20 min — Walkthrough completo + ponto-a-ponto dos 11 itens

Abrir `PERGUNTAS-CALL-20MAI.md` em uma aba e ir descendo a lista. Para cada item:
1. Mostrar o estado atual (se aplicável) na tela.
2. Apresentar minha hipótese-padrão (lista a leitura).
3. Pedir decisão: ✅ implementa hipótese / 🟡 hipótese + ajusta depois / ⏸️ mantém TBD.

**Ordem sugerida (fluxo natural):**
1. **A1** (confirma o que já fiz) — 2 min
2. **A2** (receita produto vs assinatura) — 3 min — reabre TBD-1/2
3. **A5+U6** (notificações admin/user juntas) — 3 min
4. **U2** (página do membro em comunidade) — 3 min
5. **U3** (painel da comunidade do sponsor) — 2 min
6. **U4** (vendas manuais com custo + linhas) — 3 min — reabre TBD-25
7. **U5** (posts do Founder com aprovação) — 4 min

---

## Bloco 4 — 15 min — Integração Guru → Shopify → assinatura real (F-V02)

Matt liderar essa parte. Eu mostrar o estado técnico atual:
- `app/api/webhooks/shopify/orders/paid/route.ts` — fluxo do webhook (HMAC, fetch order, atualiza orders/order_items, gates `LRP_V2`).
- `lib/subscriptions/hook-on-order-paid.ts` — F-V03 detecta assinatura por title/tag/total e marca `subscription_status='paid'`.
- Mostrar log de uma assinatura test que rodei (smoke S5).

**Pedir:**
- Wink envia credenciais Guru sandbox.
- Marcar 1 sessão dedicada (1h) pra fazer end-to-end: comprar 1 assinatura test via Guru → ver chegando como pedido Shopify → ver webhook → ver `subscription_status` atualizando → ver tag/Founder atualizando.
- Cashin: cobrar credenciais sandbox/live com Léo.

---

## Bloco 5 — 5 min — TBDs antigos que ainda travam features

Cobrar respostas dos 10 abertos (lista em `PERGUNTAS-CALL-20MAI.md` §2):
- **TBD-1, TBD-2** — destravam F-V04 (comissão real). Sem eles, demo mostra UI mas valor é placeholder.
- Resto tem hipótese-padrão funcionando — confirmar pra fechar definitivamente.

---

## Bloco 6 — 5 min — Plano dos próximos 5 dias úteis (até 26-27/05)

Apresentar tabela de `PERGUNTAS-CALL-20MAI.md` §5. Pedir validação.

---

## Saídas esperadas (anotar AO VIVO durante a call)

- [ ] A1 — confirmado / ajustar
- [ ] A2 — decisão sobre `receita produto` vs `assinatura` + retenção imposto (TBD-1, TBD-2)
- [ ] A5/U6 — escopo notificações fechado
- [ ] U2 — campos visíveis fechados
- [ ] U3 — escopo painel sponsor fechado
- [ ] U4 — schema (filha vs jsonb) + visibilidade custo fechados (TBD-25)
- [ ] U5 — workflow aprovação + conteúdo permitido fechados
- [ ] TBDs antigos — quantos fechados
- [ ] Guru — credenciais e prazo pra teste end-to-end
- [ ] Cashin — credenciais

---

## Pós-call (mesmo dia 20/05 PM)

1. Atualizar `docs/sdd/PIVOT-V2.md` §4 com TBDs resolvidos.
2. Criar/atualizar SPECs em `docs/sdd/features/F-VNN-<slug>/SPEC.md` para cada item decidido (~6 SPECs novas/atualizadas).
3. Atualizar `TODO.md` (raiz) §2 com Feature Contracts inline.
4. Linha em `docs/wiki/log.md` tipo `[INGEST] call 20/05 + N TBDs resolvidos + N features novas catalogadas`.
5. Mergear esta branch `feat/feedback-pos-demo-20mai` em `main` (PR pequena, 4 commits, baixo risco).
6. Começar implementação de U2 (a mais pronta pra atacar imediato).

---

*Roteiro gerado 20/05/2026 09:55 — atualizar com anotações da call.*
