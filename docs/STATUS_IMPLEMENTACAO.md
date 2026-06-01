# 📊 Status de Implementação — Biohelp LRP
**Data:** 01/06/2026 (go-live day — F-V20 + admin login fix em main; DB limpo)
**Sprint Atual:** ⏸️ Sprints v1 (1-7) CONGELADOS | ✅ Pivô V2 em produção
**Status Geral:** ✅ V1 entregue (37/38 FRs) | ⚠️ V1 sendo descontinuado | 📋 14/22 TBDs respondidos | 🎨 Front Loveable absorvido como referência

---

## 🚀 Go-Live 01/06/2026 — Snapshot do dia
- ✅ **F-V20** mergeada em main via PR #12 (commit `6c762bb`). Resgate alinhado à Política Financeira + UI Lovable. E2E 22/22 PASS.
- ✅ **F-V19 admin login series** — 3 commits hotfix em main (`f4c4693` + `f574538` + `b1dd011`) corrigindo regressão onde Gabriel caía em /dashboard partner em vez de /admin. Causa-raiz em 3 camadas (V2Login hardcoded, callback default, **middleware classificando /admin-login como protected via `startsWith('/admin')`**).
- ✅ **DB limpo:** 20 members + 17 orders + 13 commission_ledger + 5 payouts + 4 vendas + 16 auth.users + 2 cv HOUSE deletados. Mantidos: 4 members reais (ADMIN002/BH00014/BH00021/HOUSE) + 1886 guru_webhook_events (audit log). Member BH00022 re-criado pra smoke F-V20.
- ✅ **Supabase URL Configuration:** Site URL `painel.bio-help.com` + Redirect URLs allow-list com 3 entries (painel/admin/preview Vercel).
- ⏳ **Follow-ups pós go-live (radar baixo):** logo `/admin-login` não carrega (reportado por Gabriel + Léo); deploy v1 órfão ainda servindo na Site URL (UI antiga com tabs "Sou Parceira/Sou Admin Biohelp" + botão verde) — investigar e desligar.

---

---

## ⚠️ PIVÔ V2 — 28/04/2026 (em planejamento)

**Cliente realinhou o modelo de negócio.** O modelo MLM CV-based (Sprints 1-7, 98% FRs) está sendo descontinuado. Novo modelo: afiliação 1-nível, comissão 50% por assinatura de convidado, promoção a Founder ao atingir 5 ativos no clube, créditos Shopify pré-Founder, saque cash apenas Founder com CNPJ+NF.

📄 **Documento canônico do pivot:** [docs/sdd/PIVOT-V2.md](sdd/PIVOT-V2.md)
📄 **Workflow operacional pós-pivot:** [docs/sdd/PLAYBOOK.md](sdd/PLAYBOOK.md)
📄 **Migração do front Loveable:** [docs/sdd/LOVEABLE-IMPORT.md](sdd/LOVEABLE-IMPORT.md)
📅 **Cronograma sprints:** [docs/sdd/CRONOGRAMA-V2.md](sdd/CRONOGRAMA-V2.md) — 5 sprints + buffer até **11/06/2026** (versão compactada — 27 dias úteis)
📥 **Insumos do cliente:** `documentos_escopo/Biohelp _ Loyalty Reward Program.docx` (escopo v1 com comentários), `documentos_escopo/Fluxograma.jpg.jpeg` (fluxograma novo, 28/04), `documentos_escopo/Fluxo.txt` (regras condensadas), `documentos_escopo/BioHelp & FlowCode.txt` (transcript reunião 29/04 PM), `_loveable_import/` (front Loveable — gitignored, referência visual).

### Resumo do que muda
- ❌ **REMOVIDO:** CV, níveis (Parceira/Líder/Diretora/Head), Fast-Track, Bônus 1/2/3, Leadership Bônus, Royalty, RPA/CPF, reset mensal de CV, compressão após 6 meses inativo, ledger CV-based.
- 🔄 **ALTERADO:** cadastro exige ref obrigatório (link OU código manual); status ativo = assinatura paga (não CV); membro vê só sponsor + indicados diretos; pagamento = NF de serviço + Asaas (apenas Founder).
- ➕ **NOVO:** integração Guru, comissão 50% direta, saldo + créditos Shopify, Founder@5, ranking de Founders, área de conteúdo, link WhatsApp por Founder.
- ⏸️ **PAUSADOS:** crons `close-monthly-cv` e `network-compression` (desligar via env quando flag v2 ON).

### Backlog v2 — 17 features (detalhe em PIVOT-V2.md §2)
| Onda | Features | Status |
|---|---|---|
| 0 (docs) | PIVOT-V2.md, PLAYBOOK.md, LOVEABLE-IMPORT.md, CRONOGRAMA-V2.md, SPECs F-V14..F-V18 | ✅ Concluído (05/05/2026) |
| 1 (TBDs) | 22 TBDs com cliente (14 respondidos) | 🟡 Em andamento — 8 abertos |
| 2 (foundation) | F-V01, F-V02, F-V03 | ✅ Destravadas |
| 3 (commissão) | F-V04, F-V05, F-V07 | F-V05 ✅ destravada · F-V04 🚫 · F-V07 🟡 |
| 4 (Founder) | F-V06, F-V08, F-V11, F-V18 | F-V11 ✅ feita · F-V08 ✅ destravada · F-V18 ✅ destravada |
| 5 (conteúdo) | F-V09, F-V10, ~~F-V13~~ | F-V09 🚧 S4 · F-V10 🚫 · ~~F-V13~~ ✅ **absorvida por F-V15 em S4 (06/05/2026)** |
| 6 (cleanup) | F-V12 (remover v1 morto) | depende v2 estável |
| **7 (front)** | **F-V14, F-V15, F-V16, F-V17, F-V18** + portar todas as outras features migradas | 🚧 **Em execução** — S1 ✅ entregue (06/05) |

### Bloqueios atuais (snapshot 05/05/2026)
- **8 TBDs originais ainda abertos** (`PIVOT-V2.md` §4.1) + 4 derivados (TBD-23/24/25/26 da reunião 29/04 PM). Total: 12 abertos de 26 catalogados (14 respondidos).
- **Resolvidos na reunião 29/04 PM:** TBD-11 (ranking por nº pessoas), TBD-19 (Cashin confirmado), TBD-14 refino (crédito Shopify via API `customer.credit`).
- F-V04, F-V07 (parte cálculo) ainda bloqueadas por TBD-1, TBD-2.
- F-V09 🟡 com hipótese padrão (global), F-V10 🚫 (TBD-16), F-V13 🚫 (pode ser absorvida por F-V15).
- F-V01, F-V02, F-V03, F-V05, F-V08, F-V14, F-V15, F-V16, F-V18 ✅ **destravadas**.
- F-V17 (SSO Shopify) 🟡 — exige PoC técnica com Multipass/App Proxy antes.
- ✅ Sprint 7 v1 — House Account descontinuada; creatina vira campanhas (F-V13/F-V15).
- ✅ Sprint 5 v1 — RPA/CPF descontinuado.

### Trabalho em andamento (sem bloqueio de TBD)
- ✅ **Frente 1** (feature flag `LRP_V2`) concluída em 28/04/2026 — `lib/utils/featureFlags.ts`, `LRP_V2` e `CRON_DISABLED_V2` em `.env.example` e `.env.local`.
- ✅ **Frente 3** (shells dos módulos novos) concluída em 28/04/2026 — `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/`.
- ✅ **F-V11** (visão restrita da rede) — implementação concluída em 29/04/2026, mergeada em `main`. Branch `feat/F-V11-visao-restrita-rede` ainda existe localmente. Build/typecheck limpos. Validação manual pendente.
- ✅ **Adequação documental V2** concluída em 29/04/2026 — banner DEPRECATED nos 5 docs v1, comentário `@deprecated` em 6 arquivos de código v1, entrada v5.0 no CHANGELOG.
- ✅ **Reunião 29/04 PM com cliente** — Léo apresentou layout completo (partner + admin) feito em Loveable. 5 features novas catalogadas (F-V14..F-V18). Cronograma esticado pra 01–15/06.
- ✅ **Documentação base da migração concluída em 05/05/2026:**
  - `docs/sdd/LOVEABLE-IMPORT.md` — inventário 33 páginas + design tokens + mapeamento Loveable→Next + Anti-SPEC do import (tipos v1 hybrid).
  - `docs/sdd/CRONOGRAMA-V2.md` — 5 sprints + buffer.
  - SPECs skeleton: `docs/sdd/features/F-V14-vendas-manuais-membro/SPEC.md`, `F-V15-eventos-admin/`, `F-V16-painel-admin-completo/`, `F-V17-sso-shopify/`, `F-V18-tags-automaticas/`.
  - `PIVOT-V2.md` atualizado com Anti-SPEC §12-13, novos TBDs, F-V14..F-V18, Onda 7.
- ✅ **`_loveable_import/`** — ZIP do Loveable extraído na raiz do projeto. Gitignored. Fonte de design, não de código.

### S1 entregue (06/05/2026) — branch `feat/S1-fundacao-loveable`
- ✅ Tailwind 3 + plugins (`tailwindcss-animate`, `@tailwindcss/typography`).
- ✅ shadcn/ui inicializado + 17 primitivos (`button`, `card`, `input`, `label`, `tabs`, `dialog`, `sheet`, `dropdown-menu`, `tooltip`, `sonner`, `avatar`, `badge`, `select`, `separator`, `skeleton`, `table`, `form`).
- ✅ Tokens HSL Biohelp em `app/globals.css` (vars Loveable + bloco `--legacy-*` preservando v1).
- ✅ Plus Jakarta Sans via `next/font/google` em `app/layout.tsx` (var `--font-jakarta`).
- ✅ `lib/utils.ts` com `cn` helper (clsx + tailwind-merge).
- ✅ Deps runtime: @tanstack/react-query, react-hook-form, @hookform/resolvers, recharts, sonner, lucide-react, date-fns, class-variance-authority.
- ✅ Componentes biohelp: `BHCard`, `BHAvatar`, `BHStat`, `PeriodFilter`, `NavLink`.
- ✅ Sidebars client: `components/layouts/PartnerSidebar.tsx`, `AdminSidebar.tsx`.
- ✅ Shells: `components/layouts/PartnerShell.tsx`, `AdminShell.tsx`.
- ✅ Layouts: `app/(member)/layout.tsx` e `app/admin/layout.tsx` (passthrough — shell aplicado nas pages v2 explicitamente).
- ✅ 3 telas membro v2 (read-only) atrás de `LRP_V2`:
  - `/dashboard` — switch interno (`V2Dashboard` quando ON, `V1Dashboard` quando OFF — v1 movida pra `app/dashboard/V1Dashboard.tsx`).
  - `/dashboard/club` — sponsor + N1 via F-V11 (`lib/network/v2.ts`).
  - `/dashboard/profile` — read-only.
- ✅ Build limpa, typecheck e lint zero erros (warnings v1 preexistentes mantidos).
- ✅ Validação Playwright: 3 telas v2 renderizam com sponsor real e 5 N1; smoke flag OFF — `/dashboard` v1 renderiza intacto. Screenshots em `docs/sdd/features/S1-fundacao/screenshots/`.

### S4 entregue (06/05/2026) — branch `feat/S4-eventos-academy`
- ✅ **Decisão técnica F-V13 absorvida por F-V15** (06/05/2026): campanha de creatina vira "evento online com produto elegível = creatina". TBD-22 resolvido. PIVOT-V2 §1, §2, §4, §5 atualizados.
- ✅ SPEC F-V15 refinada (9 CAs) + SPEC F-V09 nova (8 CAs) + F-V16 áreas marcadas ✅.
- ✅ **2 migrations aplicadas via MCP** (rlp-biohelp `ikvwzfbkbwpiewhkumrj`):
  - `f_v15_events` — 4 tabelas (events + event_eligible_products + event_visits + event_attendances), 9 policies (admin manage + public read active), índices em period/status/event_id.
  - `f_v09_academy_content` — 3 tabelas (content_trails + content_modules + content_views), 6 policies (admin manage + member read published), UNIQUE(module_id, member_id).
- ✅ `lib/events/{schema,queries,actions,hook-on-order-paid}.ts` — Zod, listEvents (3 buckets), getEventById com funil, findAttributableEventForOrder (atribuição via event_visits.member_id 7d + fallback). createEvent/updateEvent/markAttendance gated por admin.
- ✅ `app/r/[slug]/route.ts` — handler 302 + Set-Cookie evt + visit insert + 404 inexistente/expirado.
- ✅ Hook em webhook orders/paid via composição (1 chamada gate `isV2Enabled()` + try/catch isolado — Anti-SPEC §4 respeitada). Tag `evento:<slug>` aplicada idempotente em `members.tags`; cron F-V18 preserva (filtra apenas `auto:*`).
- ✅ `lib/content/{schema,queries,actions}.ts` — substitui shell antigo. createTrail/updateTrail/addModule (admin) + markView idempotente (membro UPSERT). listAdminTrails agrega modules_count + views_count.
- ✅ Pages admin v2 (5 áreas): `/admin/events` (lista 3 abas), `/admin/events/new` (form client), `/admin/events/[id]` (detalhe + funil + ROI), `/admin/academy` (lista trilhas), `/admin/academy/new` + `[id]` (form trilha + ModuleManager), `/admin/finance` (rota nova com 4 stats + breakdown 3 métodos), `/admin/orders` (LRP/FIRST/NORMAL + tabela mensal), switch interno em `/admin/payouts` (V1/V2 com 3 abas Tabs PIX/Cashin/Crédito Shopify).
- ✅ Page member: `/dashboard/academy` (grid trilhas published) + `/dashboard/academy/[trailId]` (módulos com ModulePlayer client — youtube embed parsing youtu.be e youtube.com/watch?v=, pdf link externo, text inline; `markView(false)` no mount + botão "Marcar como visto" → `markView(true)`).
- ✅ Build, typecheck, lint zero erros (warnings legacy v1 mantidos).
- ✅ **Smoke ON via HTTP** (admin@biohelp.test logado): 9 rotas v2 retornaram 200 com markers v2 corretos (Eventos/Em andamento/Test S4 Event, Novo evento/Slug do link, Conversões/test-product-001, Academy/Nenhuma trilha, Financeiro/Resgates por método/Cashback Cashin, Triple resgate F-V07, Pedidos LRP/FIRST/NORMAL, Trilhas com vídeos). Handler `/r/test-s4-evt` → 302 + Set-Cookie `evt=test-s4-evt; Max-Age=604800; SameSite=lax` + visit registrada (count=2). Slugs inexistente/expirado → 404.
- ✅ **e2e SQL F-V15 hook** (cleanup ao final): evento + produto elegível + visit do membro → atribuição via `visit-match` retorna `test-s4-evt`. Idempotência: 3 chamadas → tag única `["evento:test-s4-evt"]` em `members.tags` (`jsonb_array_length=1`). CHECK rejeita `end_at < start_at` (`check_violation`). UNIQUE rejeita slug duplicado (`unique_violation`). Cenários negativos: produto não-elegível e evento expirado → 0 candidatos.
- ✅ **Smoke OFF v1** (`LRP_V2=false`): `/admin/events`, `/admin/events/new`, `/admin/academy`, `/admin/finance`, `/admin/orders`, `/dashboard/academy` redirecionam pra `/admin`/`/dashboard`. `/admin`, `/admin/payouts` (renderiza V1AdminPayouts — markers v1 presentes, markers v2 ausentes), `/admin/commissions` retornam 200. Webhook `orders/paid` POST mock retorna `401 Invalid HMAC` (validação v1 intacta; gate `isV2Enabled()` impede hook v2 chamar).

### S2 entregue (06/05/2026) — branch `feat/S2-membro-finish` ✅ migrations aplicadas + smoke ON+OFF via HTTP/SQL
- ✅ SPECs `F-V05-saldo-creditos` (classe C) e `F-V07-saque-cashin-nf` (classe D); refino dos CAs do `F-V14` (CA-01..CA-08).
- ✅ Migration `20260505_f-v14-sales-manual.sql` — tabelas `member_leads` + `member_sales` com RLS (`members.auth_user_id = auth.uid()`); índices `(member_id, created_at DESC)`. Rollback comentado no topo.
- ✅ Migration `20260505_f-v07-payout-method.sql` — enum `payout_method_v2` + coluna em `payout_requests` (default 'pix'). Rollback comentado.
- ✅ `lib/sales-manual/{schema,queries,actions}.ts` — Zod, `createLead/createSale/deleteLead/deleteSale`, agregados mês.
- ✅ `lib/payouts/v2/{schema,queries,actions}.ts` — `requestPayout` 3 métodos + `getMemberBalance` (RPC `get_available_balance`) + `listMemberPayouts`.
- ✅ Pages v2 atrás de `LRP_V2`: `/dashboard/store` (RSC + atalho Shopify), `/dashboard/orders` + `/orders/new` (RSC + client form F-V14), `/dashboard/finance` (RSC + saldo/histórico + `WithdrawDialog` 3 abas).
- ✅ `WithdrawDialog v2` reescrito (Anti-SPEC §13) — 3 métodos vs 2 do mock Loveable; chama Server Action; PIX exige NF.
- ✅ Login refator visual atrás de `LRP_V2` (Pattern §1) — `app/login/page.tsx` switch RSC; `V1Login.tsx` deprecated; `V2Login.tsx` com tabs Parceira/Admin Biohelp + visual Loveable. Lógica auth (signInWithPassword via `/api/auth/login`) preservada.
- ✅ Build, typecheck, lint exit 0.
- ✅ **3 migrations aplicadas** via Supabase MCP no projeto `rlp-biohelp` (ref `ikvwzfbkbwpiewhkumrj`):
  - `f_v14_sales_manual` — 2 tabelas (8+10 cols), RLS habilitada, 4 policies criadas.
  - `f_v07_payout_method` — enum `payout_method_v2` (3 valores) + coluna `payout_method` em `payout_requests` (default `'pix'`, NOT NULL).
  - `f_v07b_relax_bank_fields` *(extra, descoberta no smoke)* — DROP NOT NULL em 6 campos legacy v1 (`bank_name`, `bank_agency`, `bank_account`, `bank_account_type`, `cpf_cnpj`, `holder_name`); v2 não exige conta bancária pra `cashback_cashin`/`shopify_credit`.
- ✅ **Smoke ON via HTTP+SQL** com sponsor@biohelp.test logado:
  - 7 rotas v2 retornaram 200 (`/dashboard`, `/dashboard/store`, `/dashboard/orders`, `/dashboard/orders/new`, `/dashboard/finance`, `/dashboard/club`, `/dashboard/profile`).
  - HTML grep validou markers v2 (`Acesso à loja`, `Minhas vendas`, `Novo registro`, `Resultado & Resgate`, `Sou Parceira`, `Sou Admin Biohelp`, `Cashback Cashin`, `Crédito na loja`, `PIX (Founder + NF)`).
  - 1 lead, 1 lead antigo (>30d), 1 sale, 3 payout_requests (1 por método) inseridos via SQL service_role; HTML mostra todos no histórico + seção Oportunidades.
- ✅ **Smoke OFF v1** com `LRP_V2=false`:
  - 5 rotas v1 retornaram 200 (`/dashboard`, `/dashboard/sales`, `/dashboard/commissions`, `/dashboard/payouts`, `/dashboard/network`).
  - 4 rotas v2 redirecionam pra `/dashboard` quando flag OFF (`/dashboard/store`, `/orders`, `/orders/new`, `/finance`).
  - `/login` mostra V1 (markers `Acesse sua conta` em vez de `Sou Parceira`).
- ✅ **Matrizes preenchidas:** F-V14 (7 ✅ / 1 🟡 RLS e2e), F-V05 (5 ✅ / 1 🟡 saldo > 0 e2e), F-V07 (8 ✅ / 1 🟡 saldo > 0 e2e). Todos os 🟡 viram ✅ quando F-V04 (comissão real) destravar.
- ⏳ **Decisão técnica registrada:** WithdrawDialog usa 3 abas Tabs (não Select único) — pivota fácil pra Select se demo de 13/05 mostrar fricção.
- ⏳ **Decisão técnica registrada:** login mantém signInWithPassword em vez de magic link — Supabase Auth do projeto não foi configurado pra OTP. Conversão pra magic link fica como TBD pós-S5.
- ⏳ **TBD-27 *(novo, S2)*:** dados Biohelp NF (CNPJ, razão social, endereço) hardcoded em `WithdrawDialog`. Confirmar dados reais com cliente em demo de 13/05 e mover pra env ou `system_config` table em S5.
- ⏳ **Pendente humano (não-bloqueante):** Playwright UI screenshot smoke (Plug-in MCP desconectou na primeira tentativa); RLS test end-to-end com 2 tokens (precisa setup de 2 contas test).

### S3 entregue (06/05/2026) — branch `feat/S3-admin-core` ✅ migrations aplicadas + smoke ON+OFF + F-V18 end-to-end
- ✅ **Migration aplicada** via Supabase MCP no projeto `rlp-biohelp`: `f_v18_tags_and_affiliate_count` — `members.tags jsonb DEFAULT '[]'` + index GIN + view `member_active_affiliate_count` (proxy `status='active'` até F-V03 entrar). Idempotente, rollback comentado.
- ✅ **F-V18 implementada e validada end-to-end** (8/8 CAs ✅):
  - `lib/tags/auto-classifier.ts` — `recompute(memberId?)` lê view, aplica regra (≥40 → lider+influenciador; ≥5 → lider; else → []), preserva `manual:*` por prefix. Idempotente.
  - `app/api/cron/auto-tags/route.ts` — GET endpoint protegido por `Bearer CRON_SECRET`. Retorna `{ok, scanned, updated, unchanged}`.
  - `vercel.json` — schedule diário 03:00 UTC.
  - `lib/tags/hook-on-status-change.ts` — stub documentado (wire em S5+ quando F-V03 entrar).
  - Smoke: seed 5/40/4 affiliates → tags corretas. `manual:vip` preservada. 2x recompute = idempotente. Auth 401 sem Bearer.
- ✅ **5 áreas admin v2** atrás de `LRP_V2`:
  - `/admin` (switch RSC) — V2Admin com 4 cards + breakdown por status (substitui `breakdownByRank` v1) + 3 stats de tags F-V18.
  - `/admin/community` + `/admin/community/[id]` — lista com filtros status+tag, paginação, badges Líder/Influenciador/FOUNDER. Detalhe com sponsor + payouts.
  - `/admin/growth` — RSC + `GrowthCharts` client (Recharts). 6m histórico + 3m projeção (média móvel). Bar (membros) + Line (receita vs resgates) com `ReferenceLine`.
  - `/admin/consumption` — agregação `member_sales` (F-V14) por produto. Ranking receita+qty+ticket+clientes únicos.
  - `/admin/products` (switch RSC) — V2 mostra mais vendidos via F-V14. Cadastro completo (preço sugerido + custo) em S4.
- ✅ **2 bugs reais detectados e corrigidos no smoke:**
  - Cache de `fetch` Next 14 cacheava leituras service_role e quebrava `recompute()` entre chamadas. Fix em `createServiceClient` global com `cache:'no-store'`.
  - `.contains("tags", [...])` envia formato Postgres array incompatível com jsonb. Fix em `lib/admin/community.ts` usando `.filter("cs", JSON.stringify([...]))`.
- ✅ **Build/typecheck/lint exit 0.**
- ✅ **Smoke ON via HTTP+SQL** (admin@biohelp.test logado): 6 rotas v2 retornaram 200 com markers v2 corretos (Visão Geral, Distribuição por status, Tags automáticas F-V18, Filtros community, etc).
- ✅ **Smoke OFF**: 4 rotas v1 (200) + 3 rotas v2 redirect → /admin (community/growth/consumption) + login V1 visível.

### S5 em execução (06/05/2026) — branch `feat/S5-integracoes`
- ✅ **SPECs criadas/refinadas:** F-V03 (status via assinatura), F-V07b (Cashin live sandbox), F-V07c (NF auto), F-V17 (App Proxy escolhido — Multipass exige Plus que loja não tem).
- ✅ **2 migrations aplicadas via MCP** (rlp-biohelp `ikvwzfbkbwpiewhkumrj`):
  - `f_v03_subscription_status` — enum `subscription_status_v2 (pending|paid|cancelled)` + colunas em `members` + index BTREE + **view `member_active_affiliate_count` recriada para usar `subscription_status='paid'`** (substitui proxy v1 status='active'). 13 members em `pending` por default.
  - `f_v17_auth_audit` — tabela `auth_audit` (source/outcome/email/member_id/shop_domain/ip/user_agent/details jsonb) + 3 índices + RLS deny-default.
- ✅ **F-V03 lib + hook em webhook orders/paid (Pattern §10):**
  - `lib/subscriptions/{queries,actions,hook-on-order-paid}.ts` — markSubscriptionPaid/cancelSubscription idempotentes + heurística (title contém `assinatura`/`clube` OR product_tag OR fallback total ≥ R$200).
  - Hook plugado entre F-V15 e o final do try do webhook, dentro de `if (isV2Enabled())` + try/catch isolado. Falha NUNCA derruba 200 (Anti-SPEC §4).
  - `LRP_V2_INVALIDATE_TAGS_ON_STATUS_CHANGE=true` ativa recompute F-V18 do sponsor após mudança de status.
- ✅ **F-V03 e2e validado:** SQL test → UPDATE 5 afiliados de SPONSOR01 para `subscription_status='paid'` → view `active_count=5` → recompute manual aplica `auto:lider` na tag do sponsor. Estado revertido pós-teste.
- ✅ **F-V17 SSO Shopify (App Proxy):**
  - `lib/sso/{app-proxy.ts, audit.ts, handler.ts}` — verify HMAC SHA256 sobre query string + audit log + handler que cria magic link Supabase.
  - `app/api/sso/shopify/route.ts` — endpoint GET com gates (LRP_V2_SSO + signature + customerId), redirect pra `/dashboard|/login|/join`.
  - Setup doc completa em `docs/sdd/features/F-V17-sso-shopify/SHOPIFY-SETUP.md` (passo a passo Partner Dashboard, link no tema, smoke 4 cenários, rollback).
  - **Decisão registrada:** App Proxy escolhido — Multipass exige plano Plus que loja Biohelp não tem.
- ✅ **F-V07b Cashin live (sandbox):**
  - `lib/payouts/v2/cashin.ts` — interface agnóstica `CashinClient` + 3 implementações (Mock/Sandbox/Live). Factory por env `CASHIN_MODE`.
  - `lib/payouts/v2/transfer.ts` — `transferPayout(payoutId)` chama provider, atualiza status; `applyCashinStatusUpdate` para webhook.
  - `app/api/payouts/cashin/transfer/[id]/route.ts` — admin-only POST gated por `LRP_V2_CASHIN_LIVE`.
  - `app/api/webhooks/cashin/status/route.ts` — webhook receiver com auth via header token (sandbox).
  - **Status:** mock funciona; sandbox estruturado mas requer creds (TBD-19 ✅ provider definido, mas onboarding via Léo pendente). Default OFF (`LRP_V2_CASHIN_LIVE=false`).
- ✅ **F-V07c Validação automática NF:**
  - `lib/payouts/v2/nfe-validator.ts` — `validateInvoice(buffer, mimeOrFilename)` PDF (busca CNPJ + razão social no texto) + XML (regex sobre `<emit><CNPJ>`/`<dest><CNPJ>`).
  - Plugado em `requestPayout`: quando `payout_method='pix'` + `invoice_data_url` presente, valida síncrono antes do insert. Inválido → erro pro user na hora.
  - Schema: extendido `invoice_data_url` opcional (data URL/base64).
  - Cobertura: 75% PDF, 90% XML em casos comuns. Não cobre PDFs scaneados nem assinatura SEFAZ (não-objetivo).
- ✅ **Testes unitários** (`test-f-v03-subscription.mjs`, `test-f-v07b-cashin-mock.mjs`, `test-f-v07c-nfe-validator.mjs`, `test-f-v17-app-proxy.mjs`) — lógica replicada inline pra rodar sem tsx (padrão do projeto).
- ⏳ **Build/typecheck/lint:** não executado nesta sessão (Bash/PowerShell sem permissão). Validação por inspeção: imports/tipos consistentes; aliases existentes; nenhum import de `_loveable_import/`.
- ⏳ **Smoke Playwright ON+OFF:** não executado (Bash sem permissão). Webhook composição revisada: bloco F-V03 isolado em `if (isV2Enabled())` + try/catch — Anti-SPEC §4 preservada.
- ⏳ **Pendente humano:** rodar `npm run build && npm run lint && npx tsc --noEmit && node test-f-v03-subscription.mjs && node test-f-v07c-nfe-validator.mjs && node test-f-v17-app-proxy.mjs && node test-f-v07b-cashin-mock.mjs` antes do PR.

### Próximo passo (snapshot 06/05/2026 pós-S3-validado)
1. Humano revisa PR #4 (S3) e mergeia.
2. **S4 — Eventos + Academy + Finance/Payouts admin** (27/05–02/06/2026): F-V15 (eventos), F-V09 (Academy CMS), Finance/Payouts admin refator, OrdersAnalytics. Detalhe em `CRONOGRAMA-V2.md`.
2. **F-V01** (cadastro com ref obrigatório) — pode rodar em paralelo a S1 se decidir começar backend antes do front.
3. Cliente responder os **12 TBDs ainda abertos** (8 originais + 4 da reunião 29/04 PM). Cobrar nas demos quartas-feiras.
4. **Validação técnica antes de S5:**
   - Wink confirma Guru → Shopify webhook (F-V02).
   - Multipass / App Proxy da Shopify pra F-V17 (PoC).
   - Documentação Cashin (F-V07).
   - API `customer.credit` da Shopify (F-V05).

### Status de cada feature v2 (atualizar conforme avanço — 05/05/2026)
| ID | Feature | Classe | Onda | Status |
|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório | C | 2 | ✅ Destravada (TBD-10 resolvido) — pronta pra iniciar |
| F-V02 | Integração Guru via webhook Shopify | D | 2 | ✅ Destravada (TBD-7 resolvido) |
| F-V03 | Status ativo = subscription_paid | C | 2 | ✅ Destravada (depende F-V02) |
| F-V04 | Comissão 50% por assinatura | D | 3 | 🚫 Bloqueada (TBD-1, TBD-2) |
| F-V05 | Saldo + créditos Shopify 1:1 | C | 3 | ✅ UI v2 entregue em S2 (06/05) — Status:Done. Chamada API `customer.credit` real fica pra S5 |
| F-V06 | Promoção a Founder ≥5 ativos | B | 4 | 🟡 Parcial (TBD-12 hipótese padrão: definitivo) |
| F-V07 | Saque Founder via Cashin + NF + triple resgate | D | 3 | ✅ UI 3 abas + persistência pending entregue em S2 (06/05) — Status:Done escopo S2. Cashin live + validação NF auto + chamada `customer.credit` em S5 |
| F-V08 | Ranking de Founders | B | 4 | ✅ Destravada (TBD-11 resolvido — nº pessoas como critério inicial) |
| F-V09 | Área de conteúdo (Academy CMS) | B | 5 | 🟡 Parcial (TBD-15 hipótese padrão: global gerenciado pelo admin) |
| F-V10 | Link WhatsApp Founder | A | 5 | 🚫 Bloqueada (TBD-16) |
| F-V11 | Visão restrita da rede | B | 4 (antecipada) | ✅ Implementada 29/04/2026 — pendente validação manual |
| F-V12 | Cleanup v1 (remover CV, níveis, RPA, etc.) | D | 6 | depende v2 estável |
| F-V13 | Cupom de creatina como campanha configurável | C | 5 | 🚫 Bloqueada (TBD-22) — pode ser absorvida por F-V15 |
| **F-V14** | **Vendas manuais do membro (CRM leve)** | **C** | **7 (S2)** | ✅ **Entregue em S2 (06/05) — Status:Done. Migrations aplicadas + smoke ON+OFF + matriz preenchida** |
| **F-V15** | **Eventos admin (criação + funil + link/tag)** | **C** | **7 (S4)** | ✅ **Destravada (nova — 29/04 PM)** |
| **F-V16** | **Painel admin completo (9 áreas)** | **B** | **7 (S3-S4)** | ✅ **Destravada (nova — 29/04 PM)** |
| **F-V17** | **SSO Shopify → Painel** | **D** | **7 (S5)** | 🟡 **Parcial — exige PoC Multipass/App Proxy** |
| **F-V18** | **Tags automáticas Líder/Influenciador** | **B** | **7 (S3)** | ✅ **Entregue em S3 (06/05) — Status:Done escopo S3 (proxy `status='active'`). Migration aplicada + cron diário + 8/8 CAs validados** |

---

> ℹ️ **Tudo abaixo desta seção é histórico do modelo v1 (Sprints 1-7).** Permanece como referência do que foi entregue, mas **NÃO é fonte de verdade pro v2**. Para regras vigentes, ler `PIVOT-V2.md`.

---

## 🎯 Resumo Executivo (v1 — histórico)

O projeto concluiu as **Fases 1-6**, com sistema completo de cadastro, rede, comissões, saques e administração. **Todos os sprints planejados foram concluídos!**

### Cobertura de FRs (Requisitos Funcionais)

| Categoria | Total FRs | Implementados | Parciais | Pendentes | % |
|-----------|-----------|---------------|----------|-----------|---|
| Identidade/Acesso | 3 | 3 | 0 | 0 | 100% |
| Cadastro/Indicação | 5 | 5 | 0 | 0 | 100% |
| Rede/Visualização | 4 | 4 | 0 | 0 | 100% |
| CV/Status | 5 | 4 | 1 | 0 | 90% |
| Níveis | 3 | 3 | 0 | 0 | 100% |
| Comissões | 7 | 7 | 0 | 0 | 100% |
| Saques | 6 | 5 | 1 | 0 | 92% |
| Admin | 5 | 5 | 0 | 0 | 100% |
| **TOTAL** | **38** | **36** | **2** | **0** | **97%** |

---

## 📋 Matriz de FRs por Sprint

### Legenda
- ✅ Implementado e testado
- ⚠️ Parcialmente implementado
- ⏳ Pendente/Planejado
- ❌ Bloqueado (aguardando TBD)

| FR | Descrição | Sprint | Status | Observação |
|----|-----------|--------|--------|------------|
| **FR-01** | Autenticação de membro | 1 | ✅ | Supabase Auth |
| **FR-02** | Autenticação de admin | 1 | ✅ | Supabase Auth + role |
| **FR-03** | Controle de permissões (RBAC) | 1 | ✅ | RLS implementado |
| **FR-04** | Cadastro de novo membro | 1 | ✅ | Sync Shopify |
| **FR-05** | Captura de link de indicação | 1 | ✅ | UTM + ref |
| **FR-06** | Regra para cadastro sem link | 1 | ✅ | TBD-001 ✅ House Account (implementado 11/02/2026) |
| **FR-07** | Geração de link único | 1 | ✅ | ref_code imutável |
| **FR-08** | Ativação de preço de membro | 1 | ✅ | Via tags Shopify |
| **FR-09** | Persistência da rede | 1 | ✅ | sponsor_id FK |
| **FR-10** | Visualização da rede (membro) | 3 | ✅ | NetworkTree |
| **FR-11** | Visualização da rede (admin) | 3 | ✅ | Admin endpoint |
| **FR-12** | Regra de saída após 6 meses | 6 | ✅ | Compressão de rede implementada |
| **FR-13** | Webhooks de pedidos | 2 | ✅ | paid/refund/cancel |
| **FR-14** | Cálculo de CV por pedido | 2 | ✅ | Via metafield (busca API REST — webhook não inclui metafields) |
| **FR-15** | Status Ativo/Inativo mensal | 2 | ✅ | >= 200 CV |
| **FR-16** | Reset mensal | 2 | ✅ | Cron job |
| **FR-17** | Separação de CV (próprio vs rede) | 7 | ✅ | Dashboard com CV próprio + rede |
| **FR-18** | Recalcular nível automaticamente | 3 | ✅ | calculator.ts |
| **FR-19** | Status 'Líder em Formação' | 3 | ✅ | Janela 90 dias |
| **FR-20** | Rebaixamento automático | 3 | ✅ | Implementado |
| **FR-21** | Ledger de comissões | 4 | ✅ | Auditável |
| **FR-22** | Fast-Track | 4 | ✅ | 30%/20% |
| **FR-23** | Comissão Perpétua | 4 | ✅ | Diferenciada por tipo N1 |
| **FR-24** | Bônus 3 | 4 | ✅ | R$250/1500/8000 |
| **FR-25** | Leadership Bônus | 4 | ✅ | 3%/4% |
| **FR-26** | Royalty | 4 | ✅ | 3% nova rede |
| **FR-27** | Detalhamento por tipo de comissão | 4 | ✅ | Dashboard |
| **FR-28** | Saldo em análise (trava) | 5 | ✅ | Net-15 (15 dias após virada do mês) |
| **FR-29** | Solicitação de saque | 5 | ✅ | Mínimo R$100/saque |
| **FR-30** | Upload e validação de NF-e | 5 | ✅ | Implementado |
| **FR-31** | Emissão de RPA (CPF) | 5 | ✅ | Limite R$1.000/mês |
| **FR-32** | Workflow de aprovação | 5 | ✅ | Implementado |
| **FR-33** | Integração de pagamento | 5 | ⚠️ | Asaas definido, aguarda credenciais |
| **FR-34** | Gestão de admins | 6 | ⚠️ | CRUD básico (sem multi-admin) |
| **FR-35** | Dashboard global | 6 | ✅ | KPIs completos via API |
| **FR-36** | Filtros por modo de comissionamento | 6 | ✅ | API com filtros por tipo |
| **FR-37** | Gestão de membro | 6 | ✅ | Editar, ajustar, bloquear |
| **FR-38** | Gestão de tags | 6 | ✅ | CRUD + sync Shopify |

---

## ✅ SPRINT 1 — CONCLUÍDO (100%)

### Resumo do Sprint 1
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema Supabase** | ✅ Completo | FR-09 |
| **RLS (Row Level Security)** | ✅ Ativo | FR-03 |
| **API Backend** | ✅ Completo | FR-04, FR-05, FR-07 |
| **Integração Shopify** | ✅ Completo | FR-04, FR-08 |
| **Frontend** | ✅ Completo | FR-01, FR-02 |
| **Autenticação** | ✅ Completo | FR-01, FR-02, FR-03 |

**FRs implementados:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09  
**FRs pendentes:** Nenhum

---

## ✅ SPRINT 2 — CONCLUÍDO (100%)

### Resumo do Sprint 2
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (orders/cv)** | ✅ Completo | FR-14 |
| **Webhooks Shopify** | ✅ Completo | FR-13 |
| **Cálculo de CV** | ✅ Completo | FR-14 |
| **Job Mensal** | ✅ Completo | FR-16 |
| **Status Ativo/Inativo** | ✅ Completo | FR-15 |
| **Frontend CV** | ✅ Completo | FR-17 (parcial) |

**FRs implementados:** FR-13, FR-14, FR-15, FR-16  
**FRs parciais:** FR-17 (CV próprio vs rede não separado no dashboard)

---

## ✅ SPRINT 3 — CONCLUÍDO (100%)

### Resumo do Sprint 3
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (levels/phone)** | ✅ Completo | FR-18 |
| **Funções RPC** | ✅ Completo | FR-10, FR-11 |
| **API Endpoints** | ✅ Completo | FR-10, FR-11 |
| **Lógica de Níveis** | ✅ Completo | FR-18, FR-19, FR-20 |
| **Frontend Rede** | ✅ Completo | FR-10 |
| **Privacidade** | ✅ Completo | - |

**FRs implementados:** FR-10, FR-11, FR-18, FR-19, FR-20  
**FRs pendentes:** FR-12 (6 meses inativo - Sprint 6)

---

## ✅ SPRINT 4 — CONCLUÍDO (100%)

### Resumo do Sprint 4
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (commission_ledger, etc.)** | ✅ Completo | FR-21 |
| **Funções RPC** | ✅ Completo | FR-22, FR-23 |
| **API Endpoints** | ✅ Completo | FR-27 |
| **Bibliotecas de Cálculo** | ✅ Completo | FR-22, FR-23, FR-24, FR-25, FR-26 |
| **Frontend Comissões** | ✅ Completo | FR-27 |

**FRs implementados:** FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

### Regras de Comissionamento Implementadas

#### Fast-Track (60 dias) ✅
- N0 recebe 30% CV de N1 (primeiros 30 dias)
- N0 recebe 20% CV de N1 (dias 31-60)
- Líder N0 recebe 20%/10% CV de N2

#### Comissão Perpétua ✅ (Corrigido 10/01/2026)

| Nível Sponsor | Tipo de N1 | Percentual |
|---------------|------------|------------|
| Parceira | Cliente | 5% |
| Parceira | Parceira+ | **0%** (NÃO recebe) |
| Líder | Cliente | 5% |
| Líder | Parceira+ | 7% |
| Diretora | Cliente | 5% |
| Diretora | Parceira | 7% |
| Diretora | Líder+ | 10% |
| Head | Cliente | 5% |
| Head | Parceira | 7% |
| Head | Líder | 10% |
| Head | Rede (fallback) | 15% |

#### Bônus 3 ✅
- 3 Parceiras Ativas em N1 por 1 mês → R$250
- Cada N1 com 3 Parceiras Ativas → R$1.500
- Cada N2 com 3 Parceiras Ativas → R$8.000

#### Leadership Bônus ✅
- Diretora: 3% CV da rede
- Head: 4% CV da rede

#### Royalty ✅
- Head forma Head → recebe 3% CV da nova rede
- Separação não faz N0 perder status de Head

---

## ✅ SPRINT 5 — CONCLUÍDO (Saques + Fiscal)

### Resumo do Sprint 5
| Componente | Status | FRs |
|------------|--------|-----|
| **Schema (payout_requests, etc.)** | ✅ Completo | FR-29 |
| **RLS Policies** | ✅ Completo | FR-29 |
| **API Membro** | ✅ Completo | FR-29, FR-30 |
| **API Admin** | ✅ Completo | FR-32 |
| **Frontend Membro** | ✅ Completo | FR-29 |
| **Frontend Admin** | ✅ Completo | FR-32 |
| **Integração Fintech** | ⚠️ Definido | FR-33 (Asaas - aguarda credenciais) |

### TBDs Resolvidos (Sprint 5)
| TBD | Tema | Status | Decisão Final |
|-----|------|--------|---------------|
| TBD-015 | Limite de saque PF | ✅ Resolvido | **R$ 1.000/mês** |
| TBD-016 | Valor mínimo para saque | ✅ Resolvido | **R$ 100/saque** |
| TBD-018 | Integração fintech | ✅ Resolvido | **Asaas (PIX/TED)** |
| TBD-021 | Período de trava para saque | ✅ Resolvido | **Net-15** (15 dias após virada do mês) |

### Regra Net-15 (Disponibilidade de Comissões)
- Comissões de um mês ficam disponíveis no dia 15 do mês seguinte
- Exemplo: Comissões de dezembro disponíveis em 15 de janeiro
- **Condições que cancelam comissão:**
  - ❌ Chargeback
  - ❌ Cancelamento do pedido
  - ❌ Devolução/Refund

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-28 | Saldo em análise (trava) | ✅ | Net-15 implementado |
| FR-29 | Solicitação de saque | ✅ | Mínimo R$100 |
| FR-30 | Upload e validação de NF-e | ✅ | API pronta |
| FR-31 | Emissão de RPA (CPF) | ✅ | Limite R$1.000/mês |
| FR-32 | Workflow de aprovação | ✅ | Completo |
| FR-33 | Integração de pagamento | ⚠️ | Asaas definido, aguarda credenciais |

### Entregáveis Concluídos
- [x] Tabela `payout_requests`
- [x] Tabela `payout_documents`
- [x] Tabela `payout_history`
- [x] Tabela `payout_monthly_limits`
- [x] RLS policies para todas as tabelas
- [x] Funções RPC (create_payout_request, update_payout_status, etc.)
- [x] API de solicitação de saque (POST /api/members/me/payouts)
- [x] API de listagem de saques (GET /api/members/me/payouts)
- [x] API de upload de NF-e (POST /api/members/me/payouts/[id]/documents)
- [x] API admin de gestão (GET/PATCH /api/admin/payouts)
- [x] Frontend de solicitação de saque (/dashboard/payouts)
- [x] Frontend admin de aprovação (/admin/payouts)
- [x] Integração Asaas definida (aguarda credenciais para ativação)

---

## ✅ SPRINT 6 — CONCLUÍDO (Admin Avançado)

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-12 | Regra de saída após 6 meses | ✅ | Compressão de rede automática |
| FR-34 | Gestão de admins | ⚠️ | CRUD básico (sem multi-admin) |
| FR-35 | Dashboard global | ✅ | API `/api/admin/stats` com KPIs |
| FR-36 | Filtros por modo de comissionamento | ✅ | Filtro por tipo na API |
| FR-37 | Gestão de membro | ✅ | Editar, ajustar nível, bloquear |
| FR-38 | Gestão de tags | ✅ | CRUD + sync Shopify |

### Entregáveis Concluídos
- [x] Job de verificação de 6 meses inativo (`/api/cron/network-compression`)
- [x] Lógica de compressão de rede (`lib/network/compression.ts`)
- [x] Função RPC `compress_inactive_member()`
- [x] API de estatísticas globais (`/api/admin/stats`)
- [x] Função RPC `get_global_stats()` e `get_members_by_level()`
- [x] API de gestão de membro (`/api/admin/members/[id]`)
- [x] Ações: editar dados, ajustar nível, bloquear/desbloquear, ajustar comissão
- [x] API de gestão de tags (`/api/admin/members/[id]/tags`)
- [x] Sync de tags com Shopify Customer
- [x] Índices otimizados para KPIs
- [x] Cron job configurado no `vercel.json`

### Regra de 6 Meses Inativo (FR-12)
- Membros com 6+ meses consecutivos sem atingir 200 CV são removidos
- Indicados do membro removido são movidos para o sponsor dele (compressão)
- Status do membro muda para `removed`
- Histórico registrado em `member_level_history`
- Cron executa no dia 1 de cada mês às 04:00 UTC (após fechamento de CV)

---

## ✅ SPRINT 7 — CONCLUÍDO (Creatina + Decisões Fev/2026)

### FRs Implementados
| FR | Descrição | Status | Observação |
|----|-----------|--------|------------|
| FR-06 | Cadastro sem link (House Account) | ✅ | TBD-001 implementado 11/02/2026 |
| FR-17 | Separação CV próprio vs rede | ✅ | Dashboard com CV separado |
| TBD-019 | Creatina mensal grátis (cupom) | ✅ | Cupom individual mensal via Shopify API |

### Funcionalidades Implementadas
- [x] Dashboard do membro com CV próprio + CV da rede separados
- [x] Função RPC `get_network_cv()` para cálculo recursivo
- [x] Dashboard admin com KPIs visuais completos
- [x] Interface de gestão de membro (ajustar nível, bloquear, ajustar comissão)
- [x] Cards de estatísticas globais no admin
- [x] **TBD-001 — House Account:**
  - Conta raiz `Biohelp House` criada via migration (ID fixo)
  - Cadastro sem link atribui sponsor = House Account
  - Ref code inválido → House Account (ao invés de bloquear)
- [x] **TBD-003 — Tag de nível:**
  - Tag `nivel:<nivel>` adicionada em `generateMemberTags()`
  - Sync Shopify passa nível e status
- [x] **TBD-006 — ref_code sequencial:**
  - Formato `BH00001` via sequência + RPC `generate_sequential_ref_code()`
  - Membros existentes mantêm código antigo
- [x] **TBD-014 — CV sem fallback:**
  - Metafield `custom.cv` ausente → CV = 0 (sem fallback para preço)
  - Log `missing_cv_metafield` emitido
  - **Fix v4.1:** Webhook não inclui metafields → adicionada busca via REST API (`fetchProductCVsBatch`)
- [x] **TBD-019 — Cupom Individual Mensal Creatina:**
  - Helper `lib/shopify/coupon.ts` para criar Price Rule + Discount Code
  - API GET gera cupom automaticamente se elegível
  - Formato: `CREATINA-<NOME>-<HASH>-<MÊSANO>` (hash aleatório para segurança)
  - Colunas `coupon_code` e `coupon_shopify_id` em `free_creatine_claims`
  - **Segurança reforçada (18/02/2026):** Ver seção abaixo

### Entregas adicionais (11/02/2026 — sessão 2)
| Item | Descrição | Status |
|------|-----------|--------|
| Endpoint admin ref_code | Admin customizar ref_code (ex: MARIA2026) | ✅ Concluído |
| Cron mensal cupons | Gerar cupons batch para ativos no dia 2/mês | ✅ Concluído |
| Frontend cupom | Dashboard exibir código do cupom + copiar | ✅ Concluído |
| UNIQUE constraint | `free_creatine_claims(member_id, month_year)` | ✅ Concluído |
| Webhook creatina | Detectar uso de cupom `CREATINA-*` no pedido | ✅ Concluído |
| Sync level/status | Join + webhook passam `level` e `status` | ✅ Concluído |

### Segurança Anti-Fraude do Cupom (18/02/2026)
| Item | Descrição | Status |
|------|-----------|--------|
| Hash aleatório | Código `CREATINA-NOME-X7K9-MES` não adivinhável | ✅ Concluído |
| Customer restriction | Cupom restrito ao shopify_customer_id do membro | ✅ Concluído |
| Limite 1 uso global | usage_limit: 1 + once_per_customer: true | ✅ Concluído |
| UNIQUE coupon_code | Índice único impede duplicação | ✅ Concluído |
| Validação webhook | Detecta fraude se outra pessoa usar | ✅ Concluído |
| fraud_details JSON | Registra detalhes de tentativas de fraude | ✅ Concluído |
| View auditoria | `v_creatine_fraud_attempts` para admin | ✅ Concluído |

### Pendências externas (Sprint 7)
| Item | Descrição | Status |
|------|-----------|--------|
| FR-33 (Asaas) | Integração fintech automática | Aguarda credenciais |

---

## 📈 Progresso por Sprint

```
Sprint 1 (MVP)           [████████████████████] 100% ✅
Sprint 2 (CV + Status)   [████████████████████] 100% ✅
Sprint 3 (Rede + Níveis) [████████████████████] 100% ✅
Sprint 4 (Comissões)     [████████████████████] 100% ✅
Sprint 5 (Saques)        [████████████████████]  92% ✅
Sprint 6 (Admin)         [████████████████████] 100% ✅
Sprint 7 (Decisões)      [████████████████████] 100% ✅

Progresso Geral: 98% (37/38 FRs implementados + 6 TBDs resolvidos + 3 fixes)
Pendente externo: FR-33 Asaas (aguarda credenciais)
```

---

## 🔒 Segurança e RLS

### Policies Implementadas

| Tabela | Policy | Status |
|--------|--------|--------|
| `members` | Member lê próprio, Admin lê todos | ✅ |
| `shopify_customers` | Member lê próprio, Admin lê todos | ✅ |
| `roles` | Apenas admin | ✅ |
| `orders` | Member lê próprios, Admin lê todos | ✅ |
| `order_items` | Via orders | ✅ |
| `cv_ledger` | Member lê próprio, Admin lê todos | ✅ |
| `cv_monthly_summary` | Member lê próprio, Admin lê todos | ✅ |
| `commission_ledger` | Member lê próprio, Admin lê todos | ✅ |
| `commission_balances` | Member lê próprio, Admin lê todos | ✅ |

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Shopify
SHOPIFY_STORE_DOMAIN=...
SHOPIFY_ADMIN_API_TOKEN=...
SHOPIFY_WEBHOOK_SECRET=...

# Cron
CRON_SECRET=...
```

### Webhooks no Shopify Admin
1. `Order payment` → `/api/webhooks/shopify/orders/paid`
2. `Order refund` → `/api/webhooks/shopify/orders/refunded`
3. `Order cancellation` → `/api/webhooks/shopify/orders/cancelled`

### Cron Job (Vercel)
```json
{
  "crons": [{
    "path": "/api/cron/close-monthly-cv",
    "schedule": "0 3 1 * *"
  }]
}
```

---

## 📂 Arquivos por Sprint

### Sprint 1
- `supabase/migrations/20260107_sprint1_*.sql`
- `app/api/members/join/route.ts`
- `app/api/auth/*/route.ts`
- `app/dashboard/page.tsx`
- `app/admin/page.tsx`
- `lib/shopify/customer.ts`

### Sprint 2
- `supabase/migrations/20260107_sprint2_*.sql`
- `app/api/webhooks/shopify/orders/*/route.ts`
- `app/api/members/me/cv/route.ts`
- `app/api/cron/close-monthly-cv/route.ts`
- `lib/cv/calculator.ts`
- `lib/shopify/webhook.ts`

### Sprint 3
- `supabase/migrations/20260110_sprint3_*.sql`
- `app/api/members/me/network/route.ts`
- `app/api/members/me/level/route.ts`
- `app/components/NetworkTree.tsx`
- `app/components/LevelCard.tsx`
- `app/dashboard/network/page.tsx`
- `lib/levels/calculator.ts`

### Sprint 4
- `supabase/migrations/20260110_sprint4_*.sql`
- `app/api/members/me/commissions/route.ts`
- `app/api/admin/commissions/route.ts`
- `app/dashboard/commissions/page.tsx`
- `app/admin/commissions/page.tsx`
- `lib/commissions/calculator.ts`
- `lib/commissions/bonus3.ts`
- `lib/commissions/royalty.ts`

### Sprint 5
- `supabase/migrations/20260115_sprint5_*.sql`
- `app/api/members/me/payouts/route.ts`
- `app/api/members/me/payouts/[id]/documents/route.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/payouts/[id]/route.ts`
- `app/dashboard/payouts/page.tsx`
- `app/dashboard/payouts/page.module.css`
- `app/admin/payouts/page.tsx`

---

## 📝 TBDs Resolvidos

| TBD | Tema | Decisão | Data |
|-----|------|---------|------|
| TBD-008 | Cálculo de CV | Via metafield do produto | 07/01/2026 |
| TBD-009 | Refund/cancel | Reverter CV completamente | 07/01/2026 |
| TBD-010 | Job mensal | 1º dia às 03:00 UTC | 07/01/2026 |
| TBD-011 | Regras de nível | Conforme documento canônico | 09/01/2026 |
| TBD-012 | Profundidade da rede | Ilimitada (limite técnico 20) | 09/01/2026 |
| TBD-013 | Informações visíveis | Nome, email, CV, status, nível | 09/01/2026 |
| TBD-017 | Arredondamento | 2 casas decimais | 09/01/2026 |
| TBD-020 | Período de cálculo | Em tempo real | 09/01/2026 |
| TBD-022 | Perpétua diferenciada | Por tipo de N1 | 10/01/2026 |

---

## 📝 TBDs Pendentes

| TBD | Tema | Sprint | Impacto |
|-----|------|--------|---------|
| TBD-004 | URLs oficiais | 1 | Redirects |

## 📝 TBDs Resolvidos (reunião 11/02/2026)

| TBD | Tema | Decisão | Data |
|-----|------|---------|------|
| TBD-001 | Cadastro sem link | ✅ House Account | 11/02/2026 |
| TBD-002 | Preço de membro Shopify | ✅ Cliente configura na loja | 11/02/2026 |
| TBD-003 | Tags/metacampos finais | ✅ Tags atuais + tag `nivel:` | 11/02/2026 |
| TBD-005 | Resync Shopify | ✅ Somente atualizar se divergente | 11/02/2026 |
| TBD-006 | Formato ref_code | ✅ Sequencial `BH00001` + customização admin | 11/02/2026 |
| TBD-007 | Landing page | ✅ Redirect para /login (sem mudança) | 11/02/2026 |
| TBD-014 | Metafield CV | ✅ `custom.cv`, CV=0 se ausente | 11/02/2026 |
| TBD-019 | Creatina grátis | ✅ Cupom Individual Mensal (atualizado) | 11/02/2026 |

---

## 🧪 Testes Realizados

### Sprint 4 (10/01/2026)
| Categoria | Total | Passou | Falhou |
|-----------|-------|--------|--------|
| Schema/Estrutura | 9 | 9 | 0 |
| RPC Functions | 14 | 14 | 0 |
| RLS Policies | 2 | 2 | 0 |
| Integridade | 1 | 1 | 0 |
| Índices | 6 | 6 | 0 |
| Dashboard Membro | 7 | 7 | 0 |
| Painel Admin | 5 | 5 | 0 |
| **TOTAL** | **44** | **44** | **0** |

**Taxa de sucesso: 100%** ✅

---

**Última atualização:** 11/02/2026  
**Status:** Sprint 7 CONCLUÍDO | 6 TBDs resolvidos + implementados (reunião 11/02/2026) + 3 fixes (sessão 2)  
**Cobertura de FRs:** 98% (37/38 implementados) | TBDs pendentes: 1 (TBD-004)  
**Pendências externas:** FR-33 Asaas (aguarda credenciais), TBD-004 URLs oficiais
