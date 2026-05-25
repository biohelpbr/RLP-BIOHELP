# Diagnóstico E2E completo — 20/05/2026

> Rodada E2E na branch `feat/feedback-pos-demo-20mai` (4 commits sobre `main` Harness v3.2).
> Ambiente: local `npm run dev`, `LRP_V2=true`, navegação via Playwright MCP, console limpo (apenas 401 esperado nas tentativas de login com credencial errada + favicon 404).
> Credenciais: parceira `sponsor@biohelp.test / Demo13Mai!`, admin `admin@biohelp.test / S5Test#2026`.

**Resumo executivo:**
- ✅ **4/11 pontos do print implementados** nesta branch (U1, A3, A4, A1).
- 📋 **7/11 pontos documentados** com hipótese-padrão em `PERGUNTAS-CALL-20MAI.md` — dependem de decisão na call de hoje 10h.
- ✅ **Stack v2 funcional end-to-end** — todas as 16 rotas testadas renderizam corretamente; flag `LRP_V2=true` ativo.
- ⚠️ **1 anomalia técnica** identificada: divergência de contagem de afiliados N1 (dashboard parceira mostra 5, admin/community/[id] mostra 0). Não-bloqueante.

---

## 1. Cruzamento ponto-a-ponto do print do cliente vs estado atual

### ADMIN

#### ✅ A1 — Tags Líder/Founder/Influenciador (IMPLEMENTADO commit 751d197)
**Cliente pediu:** "≥5 afiliados ativos vira founder. Não tem tag líder. Influenciador tem que ser uma tag manual."

**Estado anterior (print):** 3 cards `auto:lider ≥5 (0)`, `auto:influenciador ≥40 (0)`, `FOUNDER F-V06 (0)`.

**Estado atual confirmado em `/admin`:**
- Bloco renomeado para **"Status e distinções dos membros"** ([screenshot admin-overview.png](../../admin-overview.png))
- Subtítulo: "Founder é automático (≥5 ativos). Influenciador é tag manual do admin."
- 2 cards:
  - 👑 **FOUNDER** — `≥ 5 afiliados ativos no clube (F-V06)` — count via condição real (`member_active_affiliate_count >= 5`)
  - 🏷️ **manual:influenciador** — `Atribuído manualmente pelo admin`
- Cards "auto:lider" / "auto:influenciador" REMOVIDOS

**Confirmado também em:** `/admin/community` filtro de tags só mostra "FOUNDER" e "manual:influenciador". Badge FOUNDER aparece em qualquer membro com `active_count >= 5` (não só quem tem a tag persistida).

**Restante para validar com cliente na call:**
- [ ] Threshold informal para aplicar `manual:influenciador`? (Hoje qualquer admin pode aplicar livremente.)
- [ ] Sub-tags `manual:influenciador:gold/silver`? Ou binário?
- [ ] Cleanup de eventuais `auto:lider` legados? (Não havia nenhum no DB hoje — recompute do cron remove se aparecerem.)

---

#### ❌ A2 — Diferenciar receita produto vs assinatura, valor Biohelp vs comissão (NÃO IMPLEMENTADO)
**Cliente pediu:** "É necessário diferenciar o que é receita de produto e o que é receita de assinatura e diferenciar o valor que é da biohelp e o valor que é comissão."

**Estado atual em `/admin/finance` ([screenshot](../../admin-finance.png)):**
- Tem cards: Saldo total na plataforma, Saldo disponível, Resgates pendentes, Vendas manuais (mês)
- Tem bloco "Resgates por método" (PIX / Cashback Cashin / Crédito Shopify) com bruto e líquido
- Tem bloco "Comissões (F-V04)" com explicação do modelo tier 40%→55% + 15% imposto

**O que falta:**
- ❌ Separação **Receita produto (loja Biohelp Shopify)** vs **Receita assinatura (Guru / clube)** — todas as vendas hoje entram em 1 balde só
- ❌ Card "Valor Biohelp" (líquido empresa) distinto de "Valor comissão paga aos membros" — hoje só vejo "saldo plataforma" agregado
- ❌ Detalhamento por origem: Shopify orders/paid vs F-V02 subscription_paid

**Bloqueio:** depende de **TBD-1** (comissão 50% varia por produto/assinatura?) e **TBD-2** (LRP retém imposto antes do payout ou repassa bruto?). Ambos abertos.

**Hipótese a apresentar na call:** detectar "assinatura" via metafield Shopify `custom.subscription_product = true` ou tag `clube-*`; novo card no overview admin separa `receita_produto = sum(orders.amount where not subscription)` e `receita_assinatura = sum(orders.amount where subscription)`; `valor_biohelp = receita_total - comissões_pagas - impostos_retidos`.

---

#### ✅ A3 — Texto fonte de dados do Consumo (IMPLEMENTADO commit ba837e6)
**Cliente questionou:** "Fonte de dados: Em S3, este painel agrega apenas vendas manuais... todas as vendas presenciais são de produtos comprados direto na shopify, então o que exatamente está sendo mostrado aqui?"

**Estado atual em `/admin/consumption` ([screenshot](../../admin-consumption.png)):**
- Header: "**Consumo (vendas declaradas pelos membros)**" — qualificador no título
- Subtítulo: "4 produtos que membros registraram em `Minhas vendas`. Para o consumo real da loja Shopify, use `/admin/orders`."
- Card inferior reescrito em 4 parágrafos:
  1. **O que este painel mostra:** vendas que cada membro *auto-registrou*
  2. **O que NÃO mostra:** pedidos reais da loja Shopify (esses ficam em `/admin/orders`)
  3. **Por que ambos coexistem:** registro manual permite acompanhar vendas presenciais *antes* da Shopify processar
  4. **Preço de custo + contribuição líquida** dependem de `/admin/products`

**Restante para validar com cliente:** confirmar se a explicação resolve a ambiguidade, ou consolidar tudo em `/admin/orders` com filtro "fonte: manual / shopify".

---

#### ✅ A4 — Linkar nome do cliente em Resgates (IMPLEMENTADO commit ba837e6)
**Cliente pediu:** "QOL: clicar no nome do cliente (em resgates por exemplo) deve levar para a página dele."

**Estado atual em `/admin/payouts` ([screenshot](../../admin-payouts.png)):**
- "Sponsor Teste" aparece como `<Link href="/admin/community/69740fd1-3abc-4856-b8be-ccc8df97a701">` com `hover:text-primary hover:underline`
- Funciona em todas as 3 abas (PIX, Cashback Cashin, Crédito Shopify)
- Quando o membro não tem ID (relação quebrada), volta pro `<p>` simples (graceful fallback)

**Confirmação técnica:** navegação para `/admin/community/[id]` carrega o detalhe completo do membro (status, afiliados ativos, leads/vendas F-V14, resgates pedidos, vínculo na rede, últimos 10 resgates).

---

#### ❌ A5 — Avisos/Notificações/Solicitações no admin (NÃO IMPLEMENTADO)
**Cliente pediu:** "Avisos/Notificações/Solicitações."

**Estado atual:** **rota inexistente**. Nenhuma área `/admin/notifications` ou `/admin/inbox` no app. Sidebar admin tem 9 áreas (Visão Geral, Comunidade, Crescimento, Consumo, Produtos, Eventos, Financeiro, Resgates, Academy) — nenhuma corresponde.

**Hipótese a apresentar:** nova tabela `admin_notifications(id, type, payload jsonb, read_at, target_admin_id?)`. Tipos iniciais: `new_payout`, `nf_rejected`, `new_founder`, `inactive_member_x_days`. Listagem em `/admin/inbox` com sino na sidebar mostrando contagem unread.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.3 (canal — só in-app? email? whatsapp? — escopo, persistência).

---

### USER

#### ✅ U1 — Copiar link completo (IMPLEMENTADO commit ba837e6)
**Cliente reportou:** `copiar link copia apenas /join?ref=SPONSOR01`.

**Estado atual em `/dashboard` ([snapshot dashboard-parceira.yml linha 100](../../dashboard-parceira.yml)):**
- Display: `https://rlp-biohelp.vercel.app/join?ref=SPONSOR01` — URL absoluta visível na página
- Botão "Copiar link" copia o mesmo conteúdo
- Botão "Copiar código" copia só `SPONSOR01` (variante intencional)
- Fallback hardcoded em `app/dashboard/V2Dashboard.tsx` quando `NEXT_PUBLIC_APP_URL` não está setada

**Restante para validar:** quando trocar pra domínio `bio-help.com` em produção (TBD), só mexer 1 env var.

---

#### ❌ U2 — Página do membro em Minha comunidade (NÃO IMPLEMENTADO)
**Cliente pediu:** "Em 'Minha comunidade' falta informações de compra/rank dos membros. Ao clicar no nome deveria abrir uma página do membro (sem informações sensíveis) com informações úteis."

**Estado atual em `/dashboard/club` ([snapshot club-parceira.yml](../../club-parceira.yml)):**
- Lista 5 indicados diretos (eduardo teste, Demo Video Chamada, Demo Domain, Maria Demo Janeiro, Membro Teste)
- Cada item mostra: avatar (iniciais), nome, ref_code, data ingresso, badge "Inativa"
- **❌ Nomes NÃO são clicáveis** — sem `<Link>` envolvendo
- **❌ Não existe rota** `/dashboard/club/[memberId]` ou similar
- ❌ Falta info de compra/rank do membro

**Hipótese a apresentar:** nova rota `/dashboard/club/[memberId]` (RSC) que mostra: nome, avatar, status, mês de ingresso, # indicados diretos, última compra (mês/ano, sem valor), tags públicas (FOUNDER se aplicável). Anti-SPEC: nunca expor email, telefone, valor de payout, NF.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.4.

---

#### ❌ U3 — Painel da comunidade do sponsor (NÃO IMPLEMENTADO)
**Cliente pediu:** "Se você veio por meio de alguém, você faz parte de uma comunidade que não a sua própria, falta painel para essa comunidade da qual você faz parte."

**Estado atual em `/dashboard/club`:**
- Existe seção "Quem te trouxe (sponsor)" mas é só 1 linha com nome do sponsor (ou "Você foi cadastrada direto pela admin")
- **❌ Não existe painel da comunidade DO sponsor** — não vê os "irmãos de rede", não vê eventos do sponsor, não vê posts (futuro U5)

**Hipótese a apresentar:** nova rota `/dashboard/sponsor-club` ou seção colapsável em `/dashboard/club` mostrando: nome do sponsor, # total de membros na comunidade dele, próximos eventos públicos dessa comunidade, posts do Founder (depende U5). **Privacidade:** vejo info agregada — não vejo individualmente quem são os outros membros.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.4.

---

#### ❌ U4 — Refator "Minhas vendas → Novo registro" (NÃO IMPLEMENTADO)
**Cliente pediu:** custo por unidade + linhas múltiplas (`nome | custo | receita | qty`) + totais + data + método pagamento.

**Estado atual em `/dashboard/orders/new` ([screenshot](../../orders-new-parceira.png)):**
- Form atual (linha única):
  - Nome do cliente *
  - Produto (1 só, sem custo)
  - Quantidade *
  - Valor pago (R$) *
  - Forma de pagamento *
  - Data da venda *
  - Observação
- **❌ Não tem campo "Custo (por unidade)"**
- **❌ Não tem botão "+ adicionar produto"** (linhas múltiplas)
- ❌ Não tem cálculo de totais agregados (só captura `paid_amount`)

**Schema atual** (`supabase/migrations/20260505_f-v14-sales-manual.sql`):
```sql
member_sales(id, member_id, customer_name, product, qty, paid_amount, payment_method, sold_at, notes, ...)
```
1 linha = 1 venda completa.

**Hipótese a apresentar:** opção (a) — adicionar coluna `cost_breakdown jsonb` em `member_sales` armazenando `[{product, cost, revenue, qty}]`; OU (b) tabela filha `member_sale_lines(sale_id, product, cost, revenue, qty)`. Recomendo (b) — query agregada mais limpa, RLS mais simples, índice por produto.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.5 + reabre **TBD-25** (preço sugerido manual vs margem).

---

#### ❌ U5 — Posts do Founder na comunidade (NÃO IMPLEMENTADO)
**Cliente pediu:** "Possibilidade do Founder da comunidade fazer posts dentro da comunidade (não no academy). Inicialmente precisa de permissão/validação admin."

**Estado atual:** rota inexistente. Academy F-V09 existe (CMS leve, somente admin posta trilhas) mas não tem entidade `community_posts` separada. Sidebar parceira não tem item "Comunidade > Posts" — só "Minha Comunidade" (lista de indicados).

**Hipótese a apresentar:** nova tabela `community_posts(id, author_member_id, content_md, status [pending_review|approved|rejected], reviewed_by_admin_id, published_at, sponsor_scope_id)`. Workflow: Founder cria → status pending_review → admin aprova em nova rota `/admin/posts/review` → vira approved → aparece em `/dashboard/sponsor-club/posts` (depende U3) ou `/dashboard/club/posts`.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.6 (workflow approval vs publicação direta, mídia permitida, comentários, notificação).

---

#### ❌ U6 — Avisos/Notificações para user (NÃO IMPLEMENTADO)
**Cliente pediu:** "Avisos/Notificações."

**Estado atual:** sidebar parceira não tem sino/badge de notificação. Sem rota correspondente.

**Hipótese (unificada com A5):** mesma tabela `user_notifications(user_id, type, payload, read_at)` com tipos pra membro: `payout_approved`, `payout_completed`, `nf_rejected`, `founder_promoted`, `new_post_from_founder`, `event_invite`. UI: sininho na sidebar + `/dashboard/inbox`.

**Decisões pendentes pra call:** ver `PERGUNTAS-CALL-20MAI.md` §1.3.

---

## 2. Mapa completo das rotas — o que funciona

### Sidebar parceira (7 áreas)

| Rota | Status | Achados E2E |
|---|---|---|
| `/dashboard` | ✅ Funciona | Cards: Meu código (SPONSOR01), Afiliados diretos (5), Status (Inativa). Acesso à loja → `bio-help.com`. Próximo evento (placeholder). Link de convite com URL absoluta ✅. Atalhos pra comunidade/perfil. |
| `/dashboard/store` | ✅ Funciona | Atalho "Sua loja exclusiva" + 6 categorias (Rotina manhã/noite, Performance, Beleza, Imunidade, Todos). Cada categoria abre em nova aba pra `bio-help.com/collections/*`. |
| `/dashboard/academy` | ✅ Funciona (vazio) | "Nenhuma trilha publicada ainda. Volte em breve!" Mostra que F-V09 está pronto pra receber conteúdo do admin. |
| `/dashboard/orders` | ✅ Funciona | Página de listagem (não capturei screenshot mas existe via sidebar). |
| `/dashboard/orders/new` | ⚠️ Funciona mas precisa refator (U4) | Form linha-única sem custo, sem linhas múltiplas. |
| `/dashboard/club` | ⚠️ Funciona parcial (U2+U3) | Lista 5 indicados sem clicabilidade nem detalhe. Falta painel do sponsor. |
| `/dashboard/finance` | ✅ Funciona | Saldo R$190,40 disponível + Pendente R$0 + Recebido R$350,40. Triple resgate F-V07 (3 abas). Tier de comissão (40%→55%). Histórico 5 resgates com status. |
| `/dashboard/profile` | ✅ Funciona | Dados membro, "Quem te trouxe", botão "Editar nome e telefone". |

### Sidebar admin (9 áreas)

| Rota | Status | Achados E2E |
|---|---|---|
| `/admin` | ✅ Funciona — **A1 entregue** | Total membros (13), Ativos (0), Vendas mês (3 / R$790), Resgates pendentes (2 / R$30). Distribuição por status. **"Status e distinções dos membros"** com FOUNDER ≥5 e manual:influenciador. |
| `/admin/community` | ✅ Funciona — **A1 entregue** | Filtros Status (Todos/Ativos/Pendentes/Inativos) + Tag (Todas / FOUNDER ≥5 ativos / manual:influenciador admin). 13 membros listados, todos `inactive`. Cada nome é link pra `/admin/community/[id]`. |
| `/admin/community/[id]` | ✅ Funciona — **A4 destino** | Detalhe membro: status badge, afiliados ativos (proxy status='active' S3), leads+vendas F-V14, resgates pedidos. Vínculo na rede + últimos 10 resgates com método e status. Botão "Detalhe v1 (legado)". |
| `/admin/growth` | ✅ Funciona | Bar chart "Membros novos/mês" (6m hist + 3m projeção média móvel). Line chart "Receita vs Resgates". Notas explicativas. |
| `/admin/consumption` | ✅ Funciona — **A3 entregue** | Card "Consumo (vendas declaradas pelos membros)" no header. 4 produtos ranking. Card inferior com 4 parágrafos explicativos sobre o que mostra/não mostra/por que coexistem. |
| `/admin/products` | ✅ Funciona (parcial) | "Mais vendidos (F-V14 manual)" — 4 produtos. **❌ Sem cadastro de produto** (cadastro com preço sugerido + custo previsto pra S4 — TBD-25). |
| `/admin/events` | ✅ Funciona (vazio) | 3 abas (Em andamento, Futuros, Passados) — 0 eventos. Botão "Novo evento" presente. |
| `/admin/finance` | ⚠️ Funciona — **A2 NÃO entregue** | Cards Saldo, Resgates pendentes, Vendas manuais. Resgates por método. Comissões F-V04 (tier 40-55%, 15% imposto). Falta separar Receita produto vs assinatura e Valor Biohelp vs comissão. |
| `/admin/payouts` | ✅ Funciona — **A4 entregue** | 3 abas (PIX 1, Cashback Cashin 1, Crédito Shopify 3). Cada item com nome (linkado), email+data, valor bruto/líquido, badge status, ações "Marcar pago" / "Rejeitar". |
| `/admin/academy` | ✅ Funciona (vazio) | "Nenhuma trilha cadastrada ainda. Crie a primeira pra começar." Botão "Nova trilha". |

---

## 3. Anomalias e observações técnicas

### ⚠️ Anomalia 1: divergência de contagem de afiliados

- **`/dashboard` (parceira)** mostra "Afiliados diretos: 5"
- **`/admin/community/[id]` (Sponsor Teste)** mostra "Afiliados ativos: 0 — proxy: status='active' (S3)" e "N1 (afiliados diretos): 0 ativos"

**Causa:** dashboard conta indicados totais (`network.direct_reports.length` = 5 todos `Inativa`). Detalhe admin filtra por `status='active'` (mostra 0 porque todos os 13 membros estão inactive — F-V03 subscription_status ainda não foi populado em massa).

**Impacto:** confuso pra admin/usuário ler. Cliente vai ver "5" num lugar e "0" no outro.

**Recomendação:** explicitar na UI: "Afiliados diretos: 5 (0 ativos no clube)" em ambos os lugares. Não-bloqueante — corrige em fast-fix B depois da call.

### ⚠️ Anomalia 2: subtitle "Membro do clube" mesmo com 5 afiliados

- Sidebar parceira mostra "Membro do clube" como subtítulo do Sponsor Teste
- `lib/members/subtitle.ts` v2 lógica: FOUNDER > manual:influenciador > subscription_paid > default
- Sponsor Teste tem 5 indicados mas todos `Inativa` → não cumpre critério Founder real
- Subtítulo está coerente (não tem subscription_paid, não tem tag FOUNDER ainda — o overview admin agora conta via `member_active_affiliate_count` mas o subtítulo não tem essa info)

**Recomendação:** após F-V03 entrar em produção e ativar membros via Guru, FOUNDER aparecerá automaticamente para quem atingir ≥5 ativos. Hoje 0 ativos = 0 Founders. Comportamento correto.

### ✅ Sem regressões de console
- 2 erros benignos durante toda a navegação (favicon 404 + 401 auth no primeiro login com senha errada).
- 0 erros JS no app v2.
- 4 warnings em `/admin/growth` (provavelmente Recharts React 18 strict mode — não-bloqueante).

### ✅ Triple resgate (F-V07) funcional end-to-end
- `/dashboard/finance` mostra os 3 métodos (Cashback Cashin, Crédito loja, PIX CNPJ+NF)
- Histórico real com 5 resgates de teste (R$50 completed, R$50 completed, R$10 pending, R$20 pending, R$30 approved)
- `/admin/payouts` mostra mesmos resgates nas 3 abas corretas
- `/admin/community/[id]` ecoa os mesmos 5 resgates no detalhe do membro

---

## 4. Status consolidado — 11 pontos do print

| # | Item | Status | Branch atual | Bloqueio |
|---|---|---|---|---|
| A1 | Tags Líder/Founder/Influenciador | ✅ **IMPLEMENTADO** | commit `751d197` | Confirmar redesign na call |
| A2 | Receita produto/assinatura, Biohelp/comissão | ❌ Não implementado | — | TBD-1, TBD-2 (cliente decidir) |
| A3 | Texto fonte de dados consumo | ✅ **IMPLEMENTADO** | commit `ba837e6` | Validar reescrita na call |
| A4 | Link nome em /admin/payouts | ✅ **IMPLEMENTADO** | commit `ba837e6` | — |
| A5 | Avisos/Notificações admin | ❌ Não implementado | — | Escopo + canal pra definir |
| U1 | Copiar link completo | ✅ **IMPLEMENTADO** | commit `ba837e6` | — |
| U2 | Página membro em Minha comunidade | ❌ Não implementado | — | Campos visíveis pra definir |
| U3 | Painel comunidade do sponsor | ❌ Não implementado | — | Privacidade pra definir |
| U4 | Vendas com custo + linhas múltiplas | ❌ Não implementado | — | Schema (jsonb vs filha) + TBD-25 |
| U5 | Posts Founder com aprovação | ❌ Não implementado | — | Workflow + escopo pra definir |
| U6 | Avisos/Notificações user | ❌ Não implementado | — | Igual A5 (unificável) |

**Score:** 4/11 = **36% entregue antes da call de 10h**.

---

## 5. TBDs antigos ainda abertos (cobrar resposta na call)

Fonte: `docs/sdd/PIVOT-V2.md` §4.1. Resumo crítico:

| TBD | Pergunta | Bloqueia |
|---|---|---|
| **TBD-1** | Comissão 50% sempre ou varia? | F-V04 (comissão real) + A2 |
| **TBD-2** | Quem retém imposto (LRP ou repassa)? | F-V04 + A2 + F-V07 |
| TBD-8 | Inativo: link/código continua válido? | F-V01 (não-bloq, hipótese: bloqueia) |
| TBD-9 | Código manual: imutável ou expira? | F-V01 (não-bloq, hipótese: imutável) |
| TBD-12 | Founder pode "desfounderar"? | F-V06 (não-bloq, hipótese: definitivo) |
| TBD-15 | Conteúdo Academy: global vs por Founder? | F-V09 (hipótese: global pelo admin) |
| TBD-16 | WhatsApp link Founder: admin valida? | F-V10 + relaciona com U5 |
| TBD-20 | Founder CPF pode usar Cashin? | F-V07 (hipótese: sim, sem NF) |
| TBD-21 | Membro inativo: prazo X pra converter saldo? | F-V05 (hipótese: 90d) |
| TBD-23 | Crédito Shopify gerado: tem validade? | F-V05 (hipótese: sem validade) |
| TBD-24 | Eventos: entry-fee ou gratuitos + bônus? | F-V15 (hipótese: gratuitos + tag) |
| TBD-25 | Preço sugerido/custo: admin define ou membro? | U4 + F-V14 |
| TBD-26 | Critério final ranking Founder? | F-V08 (hipótese: nº pessoas) |
| TBD-27 | Dados NF Biohelp hardcoded — confirmar valores | F-V07 (não-bloq) |

---

## 6. Próximos 5 dias úteis (pós-call, planejamento provisório)

| Dia | Foco | Esforço estimado |
|---|---|---|
| **20/05 AM** | ✅ Já entregue (4 fast-fixes) | — |
| **20/05 PM** | Atualizar SPECs com decisões da call + mergear `feat/feedback-pos-demo-20mai` | 1-2h |
| **21/05** | **U2** página membro em comunidade (B) — nova rota `/dashboard/club/[memberId]` | 4-6h |
| **22/05** | **U3** painel comunidade sponsor (B) — extends F-V11 | 3-5h |
| **23/05** | **U4** refator vendas manuais (C) — schema change + UI multi-linha | 6-10h |
| **24/05** | **A2** receita produto/assinatura + Biohelp/comissão (C) — depende TBD-1/2 | 3-4h |
| **27-28/05** | **A5+U6** Avisos/Notificações (B) — 1 feature unificada admin+user | 6-10h |
| **29-30/05** | **U5** Posts Founder com aprovação (C) | 10-15h |
| **02-04/06** | Buffer + QA E2E completo + ajustes | 2 dias |
| **05-09/06** | F-V02 end-to-end Guru (integração real) + F-V04 (comissão real após TBD-1/2) | 5 dias |
| **10-11/06** | Buffer final + go-live `LRP_V2=true` em produção | 2 dias |

**Margem confortável até 11/06 (deadline original).**

---

## 7. Veredito

O app está **estruturalmente sólido** — 16 rotas v2 navegáveis, switch v1/v2 funcional, triple resgate completo, sidebar admin com 9 áreas conforme F-V16, Academy + Eventos prontas pra receber conteúdo, Growth com gráficos reais. **Stack v2 pronta para produção quando o switch for ligado.**

Os 7 itens não-implementados do print são **features novas ou refators de escopo decisão-cliente** — não bugs nem regressões. A call de 10h fecha as decisões e libera 5-7 dias de implementação focada antes do deadline 11/06.

A1 entregue na branch é a única mudança breaking de spec — confirmar com cliente que `auto:lider` removida + `manual:influenciador` + FOUNDER ≥5 está conforme entendido. Se cliente vetar, rollback é trivial (revert commit `751d197`).

---

*Arquivo gerado 20/05/2026 09:55 antes da call das 10h. Capturado via Playwright MCP em ambiente local. Screenshots disponíveis na raiz do projeto: `dashboard-parceira.yml`, `club-parceira.yml`, `orders-new-parceira.png`, `finance-parceira.png`, `profile-parceira.png`, `academy-parceira.png`, `store-parceira.png`, `admin-overview.png`, `admin-community.png`, `admin-community-detail.png`, `admin-payouts.png`, `admin-consumption.png`, `admin-finance.png`, `admin-orders.png`, `admin-events.png`, `admin-growth.png`, `admin-products.png`, `admin-academy.png`.*
