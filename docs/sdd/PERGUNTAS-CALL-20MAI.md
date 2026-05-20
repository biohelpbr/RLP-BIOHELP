# Perguntas para a call de 20/05/2026 — Biohelp <> Flowcode

**Horário:** 10h00-11h00.
**Participantes esperados:** Léo (cliente), Matt (Wink), Gabriel Sturm, Matheus, Eduardo.
**Objetivo declarado (WhatsApp):** validar feedback pós-demo de 13/05 ponto a ponto, testar na prática, **integrar Guru pra realizar assinatura verdadeira**.

> Pré-leitura recomendada: este doc + `docs/sdd/ROTEIRO-DEMO-CALL-20MAI.md`.

---

## 0. Status que vou apresentar (3 fixes já entregues nesta branch)

| Item | O que foi feito | Onde demonstrar |
|---|---|---|
| **U1** Copiar link copia URL completa | Fallback `https://rlp-biohelp.vercel.app/join?ref=<code>` quando env não setada | `/dashboard` membro, botão "Copiar link" |
| **A4** Nome do cliente em /admin/payouts vira link | Vai direto pra `/admin/community/[id]` do membro | `/admin/payouts`, qualquer aba |
| **A3** Texto "Fonte de dados" em /admin/consumption reescrito | Explicação clara: vendas auto-declaradas vs Shopify reais | `/admin/consumption`, card inferior |
| **A1** Spec Líder/Founder/Influenciador atualizada | Tag `auto:lider` removida; Influenciador vira manual; Founder = ≥5 ativos | `/admin` (cards reorganizados), `/admin/community` (filtro), `/admin/community/[id]` (badges) |

---

## 1. Decisões críticas que preciso fechar **na call**

### 1.1 [A1] Confirmar redesign Líder/Founder/Influenciador (já implementado preliminarmente)

> Implementei conforme entendi do print: tag `auto:lider` removida, `auto:influenciador` removida, Influenciador vira tag manual aplicada pelo admin, ≥5 ativos vira FOUNDER. Quero validar antes de deploy em prod.

- [ ] Está correto? Algum threshold diferente para Influenciador manual (admin tem critério informal de quando aplicar)?
- [ ] Manter migration `auto:lider` → cleanup automático (recompute do cron limpa)? Ou rodar limpeza agora?
- [ ] Influenciador pode ter sub-tag manual (`manual:influenciador:gold`, `manual:influenciador:plata`)? Ou só uma categoria binária?

### 1.2 [A2] Diferenciar receita de produto vs receita de assinatura, valor Biohelp vs comissão

- [ ] Quem define o que é "receita produto" (Shopify orders sem subscription) vs "receita assinatura" (apenas clubes)?
   - Hipótese: detectar via `metafield custom.subscription_product = true` no produto Shopify, ou via tag `clube-*` no produto. Confirmar.
- [ ] "Valor Biohelp" = `gross_amount - comissão_pago_membros - impostos_retidos`?
   - Quem retém imposto: LRP antes do payout, ou Biohelp na NF?
   - **Reabre TBD-1 e TBD-2** que ainda estão em aberto (`docs/sdd/PIVOT-V2.md` §4.1).
- [ ] Onde quer ver isso: novo card em `/admin` overview, ou nova aba em `/admin/finance`?

### 1.3 [A5 + U6] Avisos / Notificações / Solicitações

- [ ] O que dispara notificação?
  - Admin: novo saque pendente, NF rejeitada, novo Founder, novo membro com >X dias inativo?
  - User: pagamento confirmado, saldo creditado, sponsor enviou mensagem?
- [ ] Canal: só in-app (sininho)? Email também? WhatsApp via Twilio?
- [ ] Persistência: nova tabela `notifications(user_id, type, payload, read_at)` faz sentido?
- [ ] É 1 feature ou 2 (admin separado de user)?

### 1.4 [U2 + U3] Página do membro em "Minha comunidade" + Painel da comunidade do sponsor

- [ ] **U2** Quais infos aparecem ao clicar num membro da minha comunidade?
   - Hipótese mínima: nome, foto (avatar), status (ativo/inativo), data ingresso, # de indicados que ele tem, **última compra** (mês/ano, sem valor) — sem dados sensíveis (email, telefone, valor, NF).
   - Tem campo "público" que admin define como visível pra outros membros?
- [ ] **U3** "Painel da comunidade do sponsor" — o que vê?
   - Hipótese: vejo nome do meu sponsor, # de membros total na comunidade dele, próximos eventos que essa comunidade tem, posts (se U5 aprovar).
   - Privacidade: vejo os OUTROS indicados do meu sponsor (meus "irmãos de rede")? Ou só vejo info agregada?

### 1.5 [U4] Refator "Minhas vendas → Novo registro"

- [ ] Cliente quer adicionar:
   - `custo` por unidade — visível pra qual perfil? (Hipótese-padrão: só pro membro que registra, não no painel admin público; admin vê tudo)
   - Linhas múltiplas: `produto | custo | receita | qty` repetível com botão "+"
   - Totais agregados + data + método de pagamento
- [ ] Schema: adicionar coluna `cost_breakdown jsonb` em `member_sales`, OU criar tabela filha `member_sale_lines(sale_id, product, cost, revenue, qty)`?
   - Hipótese-padrão: tabela filha — query agregada fica mais limpa, RLS mais simples.
- [ ] Preço de custo do produto: cadastrado pelo admin em `/admin/products` (já tem) ou o membro digita livre?
   - **Reabre TBD-25** (preço sugerido manual vs margem).

### 1.6 [U5] Posts do Founder na comunidade

- [ ] "Iniciamente precisa de permissão/validação admin." Workflow:
   - Founder cria post → status `pending_review` → admin aprova/rejeita em `/admin/posts` → vira `published` na `/dashboard/club`?
   - Ou Founder publica direto e admin pode REMOVER se inadequado (modelo Twitter)?
   - Hipótese-padrão: workflow de aprovação (mais seguro pra MVP).
- [ ] Conteúdo permitido: texto + imagem? Vídeo? Link externo? Markdown?
- [ ] Comentário/curtida nos posts? Ou one-way (Founder → comunidade)?
- [ ] Notificação do membro quando Founder posta? (Liga com 1.3 — A5/U6).

---

## 2. TBDs antigos ainda abertos (cobrar resposta)

Fonte: `docs/sdd/PIVOT-V2.md` §4.1 (10 TBDs originais + 5 derivados na demo).

### 2.1 Críticos (bloqueando features)
- **TBD-1**: Comissão sempre 50% ou varia por produto/assinatura/primeira compra? → bloqueia **F-V04** (comissão real).
- **TBD-2**: "Menos impostos e taxas" — LRP retém ISS/IR ou repassa bruto? → bloqueia **F-V04** e parte de F-V07.

### 2.2 Não-bloqueantes (têm hipótese-padrão, mas vale confirmar)
- **TBD-8**: Membro inativo — link/código dele continua válido pra novos cadastros? (Hipótese: bloqueia)
- **TBD-9**: Validade do código manual de afiliação — imutável ou expira? (Hipótese: imutável)
- **TBD-12**: Founder pode "desfounderar" se cair < 5 ativos? (Hipótese: status definitivo)
- **TBD-15**: Conteúdo Academy — admin posta global ou cada Founder tem seu mural? (Hipótese: global pelo admin via `/admin/academy`)
- **TBD-16**: WhatsApp link por Founder — admin valida antes? (Hipótese: sim) → **liga com U5 (posts Founder)**.
- **TBD-20**: Founder com CPF (sem CNPJ) pode usar Cashin? (Hipótese: sim, sem NF)
- **TBD-21**: Membro inativo — prazo X pra converter saldo em crédito? (Hipótese: 90 dias)
- **TBD-23**: Crédito Shopify gerado — tem validade ou eterno? (Hipótese: sem validade)
- **TBD-24**: Eventos com entry-fee ou gratuitos + bônus ativação? (Hipótese: gratuitos + tag em quem compra pelo link)
- **TBD-25**: Preço sugerido/custo nas vendas manuais — admin define ou membro? → **liga com U4**.
- **TBD-26**: Critério final ranking Founder (TBD-11 confirmar) — só nº pessoas ou combinação? (Hipótese: nº pessoas)
- **TBD-27**: Dados NF Biohelp (CNPJ, razão social, endereço) hardcoded em `WithdrawDialog` — mover pra env/system_config. Confirmar valores reais.

---

## 3. Tópicos técnicos da call (do WhatsApp)

### 3.1 Integração Guru → Shopify → assinatura verdadeira (F-V02)
Matt: "validar ponto a ponto, testar na prática, integrar o Guru pra realizarmos assinatura verdadeira."

- [ ] Wink já tem credenciais Guru sandbox/prod?
- [ ] Confirmação técnica: Guru cria pedido na Shopify → webhook `orders/paid` chega → `subscriptions/hook-on-order-paid.ts` (F-V03 já implementado) marca `subscription_status='paid'`. Validar fluxo end-to-end com 1 assinatura test.
- [ ] Heurística atual do hook detecta "assinatura" via title contém `assinatura`/`clube`, OR product_tag, OR fallback total ≥ R$200. Wink confirma que produto Guru bate em uma dessas regras?

### 3.2 Shopify integration ok? (Gabriel confirmou "sim sim")
- [ ] Walkthrough técnico rápido do webhook flow pro time entender:
   - `app/api/webhooks/shopify/orders/paid/route.ts` → HMAC valida → busca order via Admin API → atualiza orders + order_items + (se `LRP_V2=true`) chama F-V03 + F-V15 attribution + F-V18 tags recompute.

### 3.3 Cashin onboarding
- TBD-19 ✅ confirmado (Léo). Credenciais sandbox/live ainda não chegaram. Cobrar.

---

## 4. Saídas esperadas da call

Para cada item de 1.1–1.6, sair com:
- ✅ Decisão fechada (vou implementar)
- 🟡 Decisão preliminar + hipótese-padrão (implemento na hipótese, ajusta depois)
- ⏸️ Mantém TBD aberto (não implemento, abre nova rodada de spec)

Para os TBDs antigos (seção 2), idealmente fechar pelo menos TBD-1 e TBD-2 (destravam F-V04 — comissão real, sem ela o app demonstra UI mas não calcula valor real ainda).

---

## 5. Próximos 5 dias úteis (planejamento provisório pós-call)

Assumindo todas as decisões saírem na call:

| Dia | Foco |
|---|---|
| **20/05 PM** | Implementar U2 (página membro em comunidade) + U3 (painel comunidade do sponsor) — features B, ~4-6h cada |
| **21/05** | U4 (refator vendas manuais com custo + linhas) — C, schema change + UI ~6-10h |
| **22/05** | A2 (diferenciação receita/comissão) — C, queries + UI ~3-4h. Se TBD-1/2 fecharem na call, começar F-V04 |
| **23-24/05** | A5+U6 (notificações) — B unificada ~6-10h |
| **27-28/05** | U5 (posts Founder) — C, tabela nova + workflow aprovação ~10-15h |
| **29-30/05** | Buffer + QA + ajustes |

Margem confortável até 11/06 (deadline original).

---

*Arquivo gerado 20/05/2026 09:50 antes da call das 10h. Atualizar pós-call com decisões.*
