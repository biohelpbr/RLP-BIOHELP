# PIVÔ V2 — Biohelp LRP

> Documento canônico do pivot do projeto. Fonte única de verdade para toda mudança a partir de 28/abr/2026.
> Quando houver conflito entre este doc e qualquer artefato anterior (SPEC_Biohelp_LRP.md, STATUS_IMPLEMENTACAO.md, documentos_projeto_iniciais_MD/*), **este doc prevalece** para tudo que diz respeito ao modelo v2.

**Data:** 2026-04-28 (atualizado 05/05/2026)
**Status:** Onda 0 concluída · F-V11 entregue · 14/26 TBDs respondidos · Front Loveable absorvido como referência · Migração em 5 sprints + buffer (06/05–11/06/2026)
**Insumos do cliente:**
- `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários)
- `documentos_escopo/Fluxograma.jpg.jpeg` (fluxograma novo, 28/04)
- `documentos_escopo/Fluxo.txt` (regras condensadas)
- `documentos_escopo/BioHelp & FlowCode.txt` (transcript da reunião 29/04 PM)
- `_loveable_import/` (front Loveable — fonte de design, não de código; ver `LOVEABLE-IMPORT.md`)

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
- ~~**F-V13:** Cupom de creatina como campanha configurável pelo admin (substitui cron mensal automático). Depende de TBD-22.~~ **ABSORVIDA POR F-V15 (06/05/2026)** — campanha de creatina vira "evento online com produto elegível = creatina". TBD-22 cai dentro de F-V15.
- **F-V14** *(nova — reunião 29/04 PM):* Vendas manuais do membro (CRM leve). Membro registra leads (potenciais clientes) e vendas concretizadas fora do canal Shopify. Métricas derivam só do que o membro preenche. Sem rastreio automático.
- **F-V15** *(nova — reunião 29/04 PM):* Eventos admin. Admin cria evento (nome, data, presencial/online, link de adesão), métricas de funil (topo, WhatsApp, presentes, convertidos), bônus de ativação por participação. Link gera tag específica em quem comprar pelo período/link. Substitui o conceito legado de "cupom de creatina mensal".
- **F-V16** *(nova — reunião 29/04 PM):* Painel admin completo. 9 áreas: Visão Geral, Comunidade (com tags Líder/Influenciador), Crescimento, Consumo, Produtos, Eventos, Financeiro, Resgates, Academy. Alertas e Configurações ficam pós-MVP.
- **F-V17** *(nova — reunião 29/04 PM):* SSO Shopify → Painel. Cliente entra logada na Shopify, clica no atalho do clube e cai direto no `/dashboard` sem novo login. Análoga ao "magic button" que Wink fez puxando dado de Stripe.
- **F-V18** *(nova — reunião 29/04 PM):* Tags automáticas Líder (≥5 afiliados ativos) e Influenciador (≥40 afiliados ativos). Auto-aplicadas pelo sistema. Conviver com tag `FOUNDER` da F-V06.
- **Triple resgate** *(refina F-V07 — reunião 29/04 PM):* além de Cashin (cash) + Crédito Shopify, também PIX direto com taxa/imposto deduzido na UI. Três opções no resgate.
- **Crédito Shopify direto** *(refina F-V05/TBD-14 — reunião 29/04 PM):* via API `customer.credit` da Shopify, não cupom. Validade do crédito → TBD-23 *(novo)*.

### Pós-MVP (acordado fora do escopo de junho/2026)
- Foto-comida → calorias (modelo ReAct).
- Registro de treino + integração Apple Watch/Google Fit.
- Gamificação tipo "Iron Man" — equipes competindo por viagem.
- `admin/Alerts` e `admin/Settings` (gestão de admins via UI) — após MVP.

---

## 2. Backlog de features — classificação e prioridade

| ID | Feature | Classe | Prioridade | Bloqueio TBD / Status |
|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | P0 | ✅ Destravada (TBD-10 resolvido). TBD-9 (código imutável?) com hipótese padrão. |
| F-V02 | Integração Guru via webhook Shopify | D | P0 | ✅ Destravada (TBD-7 resolvido — Shopify-first; confirmar com Wink). |
| F-V03 | Status ativo = subscription_paid | C | P0 | ✅ **Implementada 06/05/2026 (S5)** — destrava F-V18, F-V06, F-V08. |
| F-V04 | Comissão 50% por assinatura de convidado (1 nível) | D | P0 | 🚫 Bloqueada — TBD-1, TBD-2 abertos. |
| F-V05 | Saldo + conversão para crédito Shopify (1:1) | C | P1 | ✅ Destravada (TBD-14 resolvido). TBD-21 (prazo inativo) não bloqueia início. |
| F-V06 | Promoção a Founder (≥5 ativos no clube) | B | P1 | 🟡 Parcial — TBD-12 (perde status?) aberto. Hipótese padrão: status definitivo. |
| F-V07 | Saque Founder via Cashin + NF + validação | D | P1 | 🟡 Parcial — TBD-3/4/5 resolvidos, mas valor depende de F-V04. Pode começar UI cadastro bancário + upload/validação NF. TBD-19 (Cashin confirmado?) e TBD-20 (CPF Founder?) novos. |
| F-V08 | Ranking de Founders | B | P2 | 🚫 Bloqueada — TBD-11 (critério) aberto. |
| F-V09 | Área de conteúdo (CMS leve) | B | P2 | 🚫 Bloqueada — TBD-15 (escopo: global vs por Founder) aberto. |
| F-V10 | Link WhatsApp por Founder | A | P2 | 🚫 Bloqueada — TBD-16 (admin valida?) aberto. |
| F-V11 | Visão restrita da rede pro membro | B | P1 | ✅ **Implementada 29/04/2026** |
| F-V12 | Deprecation v1 (CV, níveis, bônus, royalty, RPA/CPF) | D | depende | Aguarda v2 estável em produção. TBD-18 confirma cortar RPA/CPF. |
| F-V13 | ~~Cupom de creatina como campanha configurável~~ | — | — | ✅ **Absorvida por F-V15 em 06/05/2026.** Campanha de creatina = evento online com produto elegível. TBD-22 cai em F-V15. |
| F-V14 | Vendas manuais do membro (CRM leve) | C | P1 | ✅ Destravada — sem TBD pendente. |
| F-V15 | Eventos admin (criação + funil + link/tag) | C | P1 | ✅ Destravada — TBD-24 (entry-fee?) e TBD-25 (bônus de ativação?) não bloqueiam início. |
| F-V16 | Painel admin completo (9 áreas) | B | P1 | ✅ Destravada — depende de F-V04, F-V05 pra dados reais; UI/shells podem começar. |
| F-V17 | SSO Shopify → Painel (sem duplo login) | D | P1 | ✅ **Implementada 06/05/2026 (S5) via App Proxy** — Multipass descartado (loja sem Plus). Default OFF via `LRP_V2_SSO=false`. |
| F-V18 | Tags automáticas Líder (≥5) / Influenciador (≥40) | B | P2 | ✅ Destravada — regra simples, depende de F-V06 ter contagem de "ativos no clube". |
| **F-V19** | **Fluxo Pré-cadastro → Guru → LRP → Shopify** (Live 01/06) | **D** | **P0** | **✅ MVP completo 25/05/2026 — 14/16 CAs verdes. Branch `feat/F-V19-fluxo-guru-pre-cadastro` pronta pra merge. Pendente: Guru real live (credenciais OK, runbook pronto) + Shopify sync live (Léo cria produto fake).** |
| **F-V20** | **Resgate alinhado à Política Financeira Nutrition Club + UI Lovable** | **D** | **P0** | **✅ Done 01/06/2026** — PR #12 mergeado em main (`6c762bb`). E2E 22/22 PASS + smoke verde. Modalidades renomeadas (Crédito loja/PF RPA/PJ NF), R$ 7,50 fixo, mín R$ 500, INSS+IRRF só PF, modal Regras, dados bancários em `members` com janela 7d. Migration `20260531_f-v20-member-bank-data.sql` aplicada. |
| F-V22 | Avisos no painel (announcement bar via CMS admin: msg + imagem + link + janela) | C | P1 | ✅ **Done 02/06/2026** — PR #22 mergeado em main (`39a9b3d`) + 3 fixes de UX do banner (`0a90f3c`). Migration `20260602_f-v22-announcements.sql` aplicada no remoto + bucket público `announcements`. Aviso da live 03/06 criado e no ar (banner responsivo por aspect-ratio). SPEC + context em `docs/sdd/features/F-V22-avisos-painel/` e `docs/wiki/context/F-V22.md`. |
| F-V23 | Disparo de e-mail nativo no admin (Resend Pro) — segmentação + status | C | P0/P1 | ✅ **Done 03/06/2026** — PR #23 mergeado (`eb0d75a`), envs Vercel + webhook Resend OK, **teste real validado** (envia/chega/renderiza). DNS/DKIM/SPF/DMARC todos passando. **Spam = reputação** do domínio (penalidade dos códigos antigos), não config — follow-up de recuperação (Postmaster Tools/warm-up) antes do blast. SPEC: `docs/sdd/features/F-V23-email-disparo-admin/`. |
| F-V24 | Cancelamento/estorno (Guru webhook + manual; imediato vs renovação) | D | P1 | ✅ **Done 03/06/2026** — PR #25 (`9a98b25`). Webhook Guru já cobria automático (canceled/expired/refund); adicionado cancelamento **manual** no admin (`adminCancelRenewal`/`adminCancelImmediate` + Shopify revoke). TBD do payload Guru resolvido (já estava implementado no webhook). Sem migration. SPEC: `docs/sdd/features/F-V24-cancelamento-estorno/`. |
| F-V25 | Busca de cliente no admin (`/admin/community`) | B | P1 | ✅ **Done 03/06/2026** — PR #24 (`2975fd7`). Busca ilike por nome/email/ref_code/telefone, form GET server-side. |
| F-V26 | Banner de avisos também na Academy (espelha F-V22) | B | P2 | ✅ **Done 05/06/2026** — PR #26 mergeado (estava aberto desde 03/06; retomado, rebased pós W1–W7, E2E 2/2 CAs). `AnnouncementBar` no topo de `/dashboard/academy`. |
| F-V27 | Academy: refinar 3 trilhas + aulas/avisos programados por data | C | P2 | ⏳ **Registrada 02/06/2026 (call)** — pedido Léo, estende F-V09. Bloqueio: Léo refinar desenho no Lovable. Contract inline TODO §1.1. |
| F-V28 | Login alternativo com senha (emergência) | D | P2 | ✅ **Done 03/06/2026** — PR #27 mergeado (`4773e74`). Admin gera senha provisória no `/admin/community/[id]` (mostrada + e-mail Resend); `/login` com toggle código/senha (`signInWithPassword`); troca obrigatória no 1º acesso via flag `app_metadata.must_reset_password` + middleware → `/trocar-senha`. Sem migration. E2E validado (8/8 CAs). SPEC: `docs/sdd/features/F-V28-login-senha/`. |
| F-V29 | Academy UX refino (mockup Lovable do Leo): grandes grupos na home + lista de aulas compacta + player em modal + duração no CMS | C | P2 | ✅ **Done 05/06/2026** — PR #38 mergeado. Migration `20260605_academy_group_duration` (`group_label` + `duration_minutes`, via MCP). Capa fallback = thumb da 1ª aula YouTube. E2E 5/5 CAs (`docs/sdd/features/F-V29-academy-ux-refino/E2E-RESULT.md`). Grupos "Consumo e Rotina" nos Módulos 1/2/3 — nomes finais a confirmar c/ Leo (editável no CMS). Cobre a parte visual de F-V27 (resta lá: aulas programadas por data). |

**Legenda:** P0 = bloqueia o novo fluxo. P1 = essencial pro MVP v2. P2 = pós-MVP v2. ✅ = destravada / 🟡 = parcial / 🚫 = bloqueada / 🚧 = em implementação.

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
11. Provider de pagamento — Cashin/PIX manual é a direção atual (TBD-3 resolvido com ressalva — TBD-19 confirmado em 29/04 PM). Construir `lib/payouts/v2/` com interface agnóstica de provider pra permitir troca sem mexer em cima.
12. **Tipos e mocks v1 do Loveable** (`_loveable_import/src/types/`, `_loveable_import/src/lib/fake-api.ts`) — nunca importar pro código de produção. O front Loveable foi gerado misturando v1 (CV, ranks PARTNER/LEADER/DIRECTOR/HEAD, Fast-Track, Triple3, Leadership) com v2 (Club, Events, OrdersAnalytics, Growth). **Apenas layout, design tokens e shells visuais** podem ser portados. Modelo de dados é refeito do zero alinhado a este doc. Ver `LOVEABLE-IMPORT.md` §4.
13. **Pasta `_loveable_import/`** — gitignored. Está local apenas como referência visual durante a migração. Nenhum import direto desse path é permitido em código de `app/`, `lib/`, `supabase/`. A pasta pode ser apagada a qualquer momento.

---

## 4. TBDs ao cliente — decisões pendentes

### 4.1 TBDs em aberto (10 — ainda bloqueando features ou aguardando confirmação)

| ID | Pergunta | Bloqueia |
|---|---|---|
| TBD-1 | A comissão é sempre 50% ou existem casos diferentes (produto vs assinatura, primeira compra vs recorrência)? | F-V04, F-V07 |
| TBD-2 | "Menos impostos e taxas" — quem desconta? LRP retém ISS/IR antes do payout, ou repassa bruto e o membro se vira na NF? | F-V04, F-V07 |
| TBD-8 | Inativo: link/código de afiliação dele continua válido pra trazer novos cadastros, ou bloqueia? | F-V01 (não-bloqueante — hipótese padrão: bloqueia novos cadastros enquanto inativo) |
| TBD-9 | Validade do código manual: imutável ou expira? Pode ser reusado se membro inativar e reativar? | F-V01 (não-bloqueante — hipótese padrão: imutável, igual ao link) |
| TBD-12 | Founder pode "desfounderar" se cair abaixo de 5 ativos, ou status é definitivo uma vez atingido? | F-V06 (não-bloqueante — hipótese padrão: status definitivo) |
| TBD-15 | Conteúdo (F-V09): admin posta global, ou cada Founder tem seu próprio mural pro clube dele? | F-V09 (29/04 PM: hipótese padrão **global**, gerenciado pelo admin via Academy CMS) |
| TBD-16 | WhatsApp link por Founder: admin valida antes de publicar, ou o Founder publica direto? | F-V10 |
| TBD-20 | Founder com CPF pode usar Cashin (sem NF), ou só Founder com CNPJ pode sacar cash? | F-V06, F-V07 |
| TBD-21 | Membro inativo: prazo X pra converter saldo em crédito antes de "expirar"? Qual X? | F-V05 (não-bloqueante — hipótese padrão: 90 dias após inativação) |
| ~~TBD-22~~ | ~~Cupom de creatina (campanhas): admin define períodos/segmentos via UI nova, ou disparo é manual?~~ **RESOLVIDO 06/05/2026:** F-V13 absorvida por F-V15. Campanha de creatina = evento `mode=online` com produto elegível = creatina. TBD-22 não bloqueia mais (cai dentro do fluxo F-V15). | — |
| **TBD-23** *(novo, 29/04 PM)* | Crédito Shopify gerado por resgate — tem validade ou é eterno até consumo? Cliente disse "depois que resgatou tem salvo lá". Confirmação técnica + validação. | F-V05 (não-bloqueante — hipótese padrão: sem validade após geração; admin pode forçar expiração no painel) |
| **TBD-24** *(novo, 29/04 PM)* | Eventos têm entry-fee (ingresso pago) ou são gratuitos com bônus de ativação? Como o "bônus de ativação" é creditado (saldo? badge? cashback Cashin)? | F-V15 (não-bloqueante — hipótese padrão: gratuito + tag em quem comprar pelo link/período) |
| **TBD-25** *(novo, 29/04 PM)* | "Preço sugerido" pro membro vender (vendas manuais F-V14) — é fixado pelo admin por produto, ou margem em cima do "preço de custo"? Custo é exibido pra todo membro ou só pra Founders? | F-V14 (não-bloqueante — hipótese padrão: admin define preço sugerido manual por produto; preço de custo só visível admin) |
| **TBD-26** *(novo, 29/04 PM)* | TBD-11 foi substituído por hipótese padrão (ranking por nº de pessoas no clube) — confirmar critério final. Pode ser combinação (pessoas + receita + retenção)? | F-V08 (não-bloqueante — começa com nº de pessoas) |
| **TBD-27** *(novo, S2 — 06/05/2026)* | Dados Biohelp pra emissão de NF (CNPJ, razão social, endereço, IE, descrição do serviço) estão **hardcoded** em `components/biohelp/WithdrawDialog.tsx` (linhas 64-70). Os valores atuais (`12.345.678/0001-90`, `Av. Paulista, 1000`) são placeholders do Loveable mock. Confirmar dados reais com cliente em demo de 13/05 e mover pra env ou tabela `system_config` em S5. | F-V07 (não-bloqueante — UI funciona com placeholders; ajusta antes da Cashin live) |

### 4.2 TBDs resolvidos (11 — registrados em 29/04/2026)

| ID | Decisão | Impacto |
|---|---|---|
| TBD-3 | **Cashin** (provável) ou PIX manual como rail de pagamento. Asaas descartado. | Anti-SPEC §11 atualizado. F-V07 com interface de provider agnóstica. **TBD-19 derivado** pra confirmar Cashin. |
| TBD-4 | **Aprovação manual** do admin antes da transferência. NF é validada **automaticamente** (formato, dados, valor) — se inválida, sistema dá erro pro user no upload, não vai pra fila. | F-V07 com 2 etapas: (1) validação automática síncrona da NF; (2) fila de aprovação pra admin. |
| TBD-5 | CPF **NÃO** está totalmente fora — pode receber via **Cashin** ou crédito em loja. CNPJ pode emitir NF de serviço pra saque cash. | Atualiza Anti-SPEC §10. **TBD-20 derivado**: Founder pode ser CPF? |
| TBD-6 | **Não há integração com ERP** nessa fase. Fluxo de produto fica manual no cliente. | Remove ERP do escopo. Não cria features pra ERP. |
| TBD-7 | ~~Guru cria pedido na Shopify, **lemos via webhook Shopify**.~~ **REVISADO 22/05/2026:** Mateus desenhou na call que Guru envia webhook **direto ao LRP** (`/api/webhooks/guru`). LRP é a fonte da assinatura e comanda a Shopify (cria customer + pedido fake com tag). Webhook Shopify orders/paid continua existindo mas perde a responsabilidade de marcar `subscription_paid`. Decisão registrada em F-V19. | F-V19 substitui F-V02 nessa parte. Webhook Shopify continua intocado (Anti-SPEC §4). |
| TBD-10 | **House Account descontinua** no v2. | Anti-SPEC §8 atualizado. F-V01 bloqueia cadastro sem ref. House Account some na onda 6 / F-V12. |
| TBD-13 | Saldo do membro **ATIVO**: sem prazo. Membro **INATIVO**: a definir. | F-V05 sem prazo pra ativos. **TBD-21 derivado** pra prazo de inativos. |
| TBD-14 | Saldo → crédito Shopify: **1:1, sem prazo após resgate**. | F-V05 com regra simples. |
| TBD-17 | Cupom de creatina **mantém**, mas com escopo alterado: vira **sistema de campanhas configuráveis pelo admin** (cliente/período/segmento). Não mais cron mensal automático. | Anti-SPEC §9 atualizado. **F-V13 criada** pra cobrir o escopo novo. **TBD-22 derivado** pra UX. Cron `generate-creatine-coupons` será desligado quando F-V13 substituir. |
| TBD-18 | **Saque RPA/CPF descontinua**. Não foi confirmado quantos membros usam. | Anti-SPEC §10 atualizado. UI escondida atrás do flag v2. Remoção física na onda 6 / F-V12. |
| TBD-001 (legado v1) | House Account — descontinua no v2 (sobreposto pelo TBD-10). | Sem ação adicional. |

### 4.3 TBDs resolvidos na reunião 29/04 PM (3 — registrados em 05/05/2026)

| ID | Decisão | Impacto |
|---|---|---|
| TBD-11 | Ranking de Founder começa **por nº de pessoas no clube** (decisão inicial). Iteração futura pode incluir receita/retenção. | F-V08 destravada com hipótese padrão. **TBD-26 derivado** pra confirmar critério final. |
| TBD-19 | **Cashin confirmado** como provider. API aberta, contato direto pelo Léo. Construir `lib/payouts/v2/cashin.ts` com interface agnóstica mantida. | F-V07 destravada na parte do provider. |
| TBD-14 (refino) | Crédito Shopify via **API `customer.credit`** (não cupom). Mateus confirmou existir endpoint. **TBD-23 derivado** pra prazo de validade do crédito. | F-V05 com regra mais clara. Cupom Shopify continua disponível via `lib/shopify/coupon.ts` mas não é o caminho default. |

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
- [ ] **F-V09** — área de conteúdo. 🚧 Em S4 (06/05/2026) com hipótese padrão TBD-15 (global).
- [ ] **F-V10** — link WhatsApp Founder. 🚫 Bloqueada (TBD-16).
- [x] ~~**F-V13** — cupom de creatina como campanha configurável.~~ **Absorvida por F-V15 em S4 (06/05/2026).**

### ONDA 6 — Cleanup
- [ ] **F-V12** — remover fisicamente código v1 (jobs CV, bônus, royalty, rebaixamento, RPA/CPF, telas de níveis, House Account, cron de cupom mensal).
- [ ] Só após v2 validado em produção e flag `LRP_V2=true` por X semanas (sugestão: 4 semanas com 0 incidentes).

### ONDA 7 — Front-end (absorção do Loveable, paralela às ondas 2-5)
> Cronograma detalhado em `docs/sdd/CRONOGRAMA-V2.md` (versão compactada — 27 dias úteis, entrega 11/06/2026). Decisões de migração em `docs/sdd/LOVEABLE-IMPORT.md`.

- [ ] **S1 — Fundação + Membro core start** (06–12/05): Tailwind + shadcn + tokens + shells + 3 telas membro (Dashboard, Club, Profile).
- [ ] **S2 — Membro finish + Login** (13–19/05): Store, Orders (F-V14), Finance (F-V05+F-V07 triple), Login refator.
- [ ] **S3 — Admin core** (20–26/05): Overview, Community (F-V18), Growth, Consumption, Products.
- [ ] **S4 — Eventos+Academy+Finance/Payouts admin** (27/05–02/06): F-V15, F-V09, Finance, Payouts admin, OrdersAnalytics.
- [ ] **S5 — Integrações finais + QA** (03–09/06): F-V17 (SSO Shopify), Cashin live, validações NF, matriz de validação por feature.
- [ ] **Buffer** (10–11/06): polimento + retrabalho de feedback. **Entrega final: 11/06/2026 (qui).**

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

## 7. Próximos passos imediatos (snapshot 05/05/2026)

1. **S1 do CRONOGRAMA-V2** (06–12/05) — fundação do front: Tailwind + shadcn + design tokens + shells. Documentação base já feita (LOVEABLE-IMPORT.md, SPECs F-V14..F-V18 skeleton).
2. **F-V01** ainda destravada — porta de entrada do v2. Pode rodar paralelo a S1 se decidir começar backend antes do front.
3. **Cliente responder TBDs ainda abertos** (10 + 4 novos da reunião 29/04 PM). Sem isso, F-V04 e a parte fiscal de F-V07 seguem bloqueadas.
4. **Validação técnica:**
   - Wink confirma Guru → Shopify webhook (F-V02).
   - Multipass / Customer Account API da Shopify pra F-V17 (SSO).
   - Documentação Cashin (F-V07).
   - API `customer.credit` da Shopify (F-V05).

---

## 8. Onde encontrar cada coisa

| Procura | Onde |
|---|---|
| Estrutura de telas/rotas + design tokens + mapeamento Loveable→Next | `docs/sdd/LOVEABLE-IMPORT.md` |
| Cronograma sprint a sprint até 15/06/2026 | `docs/sdd/CRONOGRAMA-V2.md` |
| SPEC de cada feature v2 | `docs/sdd/features/F-VNN-<slug>/SPEC.md` |
| Workflow de execução (loop por feature, classes, estados) | `docs/sdd/PLAYBOOK.md` |
| Texto enviado ao cliente pedindo decisão dos TBDs | `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` |
| Prompt self-contained pra abrir nova sessão CLI | `docs/sdd/PROMPT-NOVA-SESSAO.md` |
| Status de cada feature + o que está em produção | `docs/STATUS_IMPLEMENTACAO.md` (seção PIVÔ V2 no topo) |

---

*Última atualização: 2026-05-22 (pré-call 15h — F-V19 criada como fluxo Live 01/06 substituindo abordagem Shopify-first do TBD-7; SPEC + Plano em docs/sdd/; Cashin manual confirmado pelos primeiros 2-3 meses; credenciais Guru recebidas; aguardando GURU_OFFER_ID + Shopify variant id da Léo).*

*Versão anterior: 2026-05-05 (reunião 29/04 PM com cliente; 14/26 TBDs respondidos — TBD-11/19/14 resolvidos; TBD-23/24/25/26 derivados; 5 features novas F-V14..F-V18; absorção do Loveable como referência; Anti-SPEC §12-13; cronograma compactado de 5 sprints + 2 dias buffer = entrega 11/06/2026).*
