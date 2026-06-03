# Wiki Log — Biohelp LRP

> Histórico cronológico vivo. Tipos: `[INGEST]`, `[RELEASE]`, `[BUGFIX]`, `[VALIDATION]`, `[DECISION]`, `[MVP]`, `[REORG]`.
> Manter ≤ 200 linhas. Arquivar lotes antigos em `wiki/log-archive-YYYY-QN.md` quando estourar.

## 2026-06-03

- [2026-06-03] [RELEASE] **F-V25 Busca no admin** (PR #24 `2975fd7`) + **F-V24 Cancelamento manual** (PR #25 `9a98b25`) mergeados em main. F-V25: busca ilike (nome/email/ref_code/telefone) em `/admin/community`, form GET server-side. F-V24: cancelamento manual em `/admin/community/[id]` (`adminCancelRenewal` mantém acesso até fim do ciclo; `adminCancelImmediate` corta agora + revoga tag Shopify). Descoberta: o webhook Guru **já cobria** os eventos automáticos (subscription_canceled→cancela renovação, subscription_expired→corta+remove tag, refund→notifica admin) — o TBD do payload Guru já estava resolvido; só faltava o controle manual. Sem migration. typecheck+lint+CI verdes. Eduardo promovido a admin (linha em `roles`).
- [2026-06-03] [RELEASE] **F-V23 Disparo de e-mail nativo no admin** deployado em `main` (PR #23 `eb0d75a`). `/admin/emails` (composer + segmentação + status), envio em lotes via `resend.batch.send`, From `comunidade@mail.bio-help.com`. Migration `email_campaigns`+`email_campaign_recipients` aplicada. Infra configurada via browser: API key `rlp-biohelp-app`, envs Vercel (`RESEND_API_KEY`/`RESEND_FROM`/`RESEND_WEBHOOK_SECRET`), webhook Resend (`/api/webhooks/resend`, 5 eventos). **Teste real OK** (envia/chega/renderiza). ⚠️ **Cai no spam por REPUTAÇÃO** do domínio (Gmail diz explicitamente que `send.mail.bio-help.com` tinha mensagens marcadas como spam antes — os códigos de auth). NÃO é DNS — DKIM/SPF/return-path/DMARC todos verificados e alinhados. **Follow-up:** recuperar reputação (Postmaster Tools + report-not-spam + warm-up) ANTES de blast pra base. Eduardo promovido a admin (linha em `roles`). Login admin = entrar por `admin.bio-help.com/admin-login` (não `/login`, senão middleware joga pro painel).

## 2026-06-02

- [2026-06-02] [DECISION] **Call BioHelp&FlowCode (Léo + Gabriel)** — registrados 6 pedidos como features F-V23–F-V28 no TODO/PIVOT. **F-V23** disparo de e-mail nativo no admin (Resend **Pro contratado hoje**; mais urgente; precisa DKIM no Cloudflare p/ não cair no spam) · **F-V24** cancelamento/estorno (Guru webhook + manual; imediato corta acesso já, só-renovação mantém até fim do ciclo) · **F-V25** busca de cliente no admin · **F-V26** banner de avisos também na Academy (espelha F-V22) · **F-V27** Academy 3 trilhas + aulas/avisos programados por data · **F-V28** login com senha (🟡 reavaliar — Pro resolve a causa do "código não chega"). SPECs dedicadas: F-V23, F-V24. Demais: Feature Contract inline TODO §1.1. Causa do "código não chegava" = limite diário do Resend free (resolvido pelo Pro) + spam por DKIM ausente.
- [2026-06-02] [RELEASE] **F-V22 Avisos no painel** deployado em `main` (PR #22 `39a9b3d` + 3 fixes UX `0a90f3c`). Migration aplicada no Supabase remoto + bucket público `announcements`. Aviso da live "Encontro de Boas-Vindas" (03/06 19h, Zoom) criado e no ar, expira 03/06 22h. Banner ficou **responsivo por aspect-ratio** (aspect-[2/1] mobile → sm:[12/5] → lg:[7/2]) + objectPosition center 58%, ~30% reduzido a pedido, testado em 1280px e 390px. Imagem re-recortada via canvas (removida margem preta da arte 16:9). **Decisões em aberto** (ver `docs/wiki/context/F-V22.md`): travar proporção do banner (recomendado 3:1, 1800×600) p/ uploads previsíveis; e-mail da live (Resend Pro). Docs fechados: TODO/PIVOT/SPEC.
- [2026-06-02] [MVP] **F-V22 Avisos no painel** (classe C) — código pronto, pendente migration remota + deploy. Pedido Léo+Matt (WhatsApp): aviso da live (03/06 19h) no topo do painel, **announcement bar não popup**. Decisão de produto: CMS admin-configurável (`/admin/announcements`) com mensagem + **imagem (upload)** + link/CTA + cor + janela de datas + on/off, reutilizável a cada evento. Nova tabela `announcements` + bucket público `announcements` (`20260602_f-v22-announcements.sql`). Barra renderizada no topo do `V2Dashboard` via `getActiveAnnouncement()` (só o ativo mais recente na janela). typecheck + lint verdes. SPEC: `docs/sdd/features/F-V22-avisos-painel/`. **Separado deste F:** o "mandar e-mail pra todas" do pedido continua tarefa à parte.

## 2026-06-01

- [2026-06-01] [RELEASE] F-V20 mergeada em `main` via PR #12 squash → commit `6c762bb`. Smoke manual no preview Vercel verde + E2E 22/22 PASS prévio. Branch `feat/F-V20-politica-financeira-lovable` deletada. wiki/features/F-V20.md criada; wiki/modules/payouts.md atualizada com regras Política Financeira (R$ 7,50 / mín R$ 500 / INSS+IRRF só PF / janela 7d). Pronto pra go-live de hoje.
- [2026-06-01] [BUGFIX] **F-V19 admin login series** (commits `f4c4693` + `f574538` + `b1dd011` em main, hotfix direto). Gabriel reportou que login em `admin.bio-help.com/admin-login` caía em painel de parceira em vez de admin. Causa-raiz em 3 camadas:
  1. `V2Login.tsx:72` hardcoded `router.replace("/dashboard")` ignorava origem admin-login.
  2. `app/auth/callback/route.ts` default `/dashboard` quando sem `next`. Emails antigos sem `next=/admin` caíam em painel.
  3. **`middleware.ts:76`** `protectedRoutes.some(r => pathname.startsWith(r))` com `'/admin'` matching `'/admin-login'`. Middleware redirecionava `/admin-login` pra `/login?redirect=/admin-login` antes do V2Login renderizar. Fix: usar `pathname === route || pathname.startsWith(route + '/')`.
  Validado E2E via Gabriel (3 screenshots de overview/finance/community do admin) + Eduardo (Playwright direto na prod admin).
- [2026-06-01] [DECISION] Limpeza de dados de teste pré go-live. Deletados via SQL transacional: 20 members (16 óbvios + 4 ambíguos selecionados pelo cliente: BH00011/BH00012/BH00015/BH00016), 17 orders (9 vinculados + 8 órfãos pós SET NULL), 13 commission_ledger, 5 payout_requests, 4 member_sales, 16 auth.users (15 vinculados + 1 órfão `ldccapital.com.br`), 2 cv_monthly_summary HOUSE. **Mantido:** 4 members reais (ADMIN002 financeiro@bio-help.com / BH00014 leonardo@bio-help.com / BH00021 sturmfeevale@gmail.com / HOUSE sistema), 1886 guru_webhook_events (audit log). Member `BH00022 eduardo.sousa@flowcode.cc` re-criado depois pra smoke F-V20.
- [2026-06-01] [DECISION] Supabase Auth URL Configuration ajustada via Dashboard. Site URL mantida `https://painel.bio-help.com`. **Redirect URLs allow-list (estava vazia, virou 3):** `https://painel.bio-help.com/**`, `https://admin.bio-help.com/**`, `https://rlp-biohelp-*.vercel.app/**`. Sem allow-list, confirm-links de signups novos caíam no Site URL fallback em vez de irem pro `emailRedirectTo` correto. Bug colateral observado: usuários novos clicavam confirm link e iam parar num deploy v1 antigo (UI com tabs "Sou Parceira/Sou Admin Biohelp" + botão verde). Follow-up: identificar e desligar deploy v1 órfão se ainda servindo na rota raiz da Site URL.

## 2026-05-31

- [2026-05-31] [BUGFIX] F-V20 CA-21 — banner `credit-success-msg` somia logo após render. Causa: `useEffect` de reset no `WithdrawDialog` tinha `available` nas deps; `revalidatePath` no server action mudava o saldo, re-disparava o effect e zerava `successMsg`. Fix: remover `available` das deps (reset só na transição fechado→aberto). E2E CLI reportou 21/22 PASS; este fix fecha o 22º. Commit `<after-fix>`.
- [2026-05-31] [VALIDATION] E2E F-V20 rodado em sessão separada do Claude Code (via `E2E-PROMPT.md`) — 21 PASS / 1 FAIL / 0 SKIPPED. FAIL único era CA-21 (banner crédito, corrigido na mesma data). Resto verde: migration idempotente confirmada, breakdown PF=R$807,50 / PJ=R$992,50 / Crédito=R$50 corretos, persistência banco em members, janela 7d bloqueia saque, CTA bank-setup-prompt funciona. Relatório completo em `docs/sdd/features/F-V20-politica-financeira-lovable/E2E-RESULT.md`.
- [2026-05-31] [RELEASE] F-V20 implementada (Classe D) — refator de Resgate alinhado à Política Financeira Nutrition Club + UI Lovable. Migration `20260531_f-v20-member-bank-data.sql` (10 colunas em members + constraint + índice) aplicada via Supabase MCP idempotente. Modalidades renomeadas (Crédito loja/PF RPA/PJ NF), taxa fixa R$ 7,50, mínimo R$ 500 PF+PJ, INSS+IRRF só PF, modal "Regras do Resgate" novo, dados bancários movidos pro /profile (autopreenche dialog), snapshot bancário em payout_requests, janela 7d após alterar dados bancários. CI N1 verde. Branch `feat/F-V20-politica-financeira-lovable` commit `de7e351`. Pendente: E2E em sessão separada (prompt em SPEC).

## 2026-05-25

- [2026-05-25] [RELEASE] F-V19 implementada — fluxo pré-cadastro Guru → LRP → Shopify completo. 14/16 CAs verdes, 2 parciais (CA-13 static, CA-14 indireto). Branch `feat/F-V19-fluxo-guru-pre-cadastro` com 3 commits de código + 1 commit docs. Pendente: merge em main após review + Guru real live (credenciais recebidas, runbook pronto). Follow-ups: dashboard v2 ler `subscription_status` em vez de `status` legado; CA-13/14 fechar em QA pré-produção.

## 2026-05-22

- [2026-05-22] [SPEC] F-V19 criada — fluxo pré-cadastro Guru → LRP → Shopify; SPEC + plano em docs/sdd/; demo MVP 22/05 15h. Runbook `webhook-guru-debug.md` documenta payload real do Digital Manager Guru (sem HMAC — valida via `api_token` no body; `webhook_type` discriminator; `last_status` para subscription, `status` para transaction) — diverge da SPEC original em 7 pontos; schema Zod CORRIGIDO no runbook pra aplicar manualmente em `lib/subscriptions/providers/guru.ts` na próxima sessão.

## 2026-05-20

- [2026-05-20 09:55] [INGEST] Feedback cliente pós-demo 13/05 recebido via Google Docs (5 itens admin + 6 itens user). Triagem: 3 fast-fixes (U1, A3, A4) + 1 spec change implementado (A1 — drop auto:lider, manual:influenciador, FOUNDER ≥5 ativos) + 7 itens C/D documentados em `docs/sdd/PERGUNTAS-CALL-20MAI.md` e `docs/sdd/ROTEIRO-DEMO-CALL-20MAI.md` para call de hoje 10h-11h com Léo/Matt/Gabriel/Matheus. WhatsApp: Matt pediu validar ponto-a-ponto + integrar Guru para assinatura real (F-V02 end-to-end). Cashin credenciais sandbox pendentes.
- [2026-05-20] [RELEASE] Branch `feat/feedback-pos-demo-20mai` — 4 commits: U1 copiar link absoluto (V2Dashboard), A4 link nome cliente em /admin/payouts → /admin/community/[id], A3 texto fonte de dados /admin/consumption reescrito sem ambiguidade, **A1 spec change F-V18+F-V06**: tag `auto:lider` removida, `auto:influenciador` removida, Influenciador vira tag manual `manual:influenciador`, FOUNDER passa a contar por condição real (member_active_affiliate_count >= 5) em vez de tag persistida. Anti-SPEC v2 §1-13 preservada. Typecheck ✅.
- [2026-05-20] [DECISION] A1 cliente autorizou (chat 09:30) mudar regra: ≥5 vira Founder direto (não Líder); Influenciador é tag manual aplicada pelo admin. SPEC F-V18 v2 documentada inline no auto-classifier.ts. **Estado PAUSE técnico**: a mudança altera comportamento de F-V18 (que estava Done) — autorização humana explícita registrada.

## 2026-05-19

- [2026-05-19] [VALIDATION] CI N1 local executado pós-reorg: `npm run lint` ✅ (apenas warnings preexistentes de exhaustive-deps / no-img-element — nenhum erro novo), `npx tsc --noEmit` ✅ (0 erros), `npm run build` ✅ (Next 14 build completo, todas as rotas geradas). Nenhuma regressão introduzida pela reorg.
- [2026-05-19] [REORG] Adotado Harness v3.2 em modo bridge aditivo. Criados AGENTS.md / CLAUDE.md / TODO.md (raiz), docs/product/PRD.md, docs/specs/SPEC.md, docs/contracts/CONTRACTS.md, docs/plans/ (CURRENT_REALITY, DECISIONS_LOG, risk-classification, templates), docs/wiki/ (este arquivo + índice + overview + architecture + modules + runbooks), docs/decisions/adr/, docs/legacy/v1/ (com 5 docs v1 movidos), packages/shared/types/, tests/{unit,integration,contract,e2e}/, .github/workflows/ci.yml. **Zero código de produção tocado.** Branch: `chore/harness-v3.2-reorg`. Referência: `.claude/harness-v3.2-manual.html`. PR pendente de abertura humana.

## 2026-05-13

- [2026-05-13] [RELEASE] Demo cliente executada com sucesso. Roteiro em `docs/ROTEIRO_DEMONSTRACAO_RAPIDO.md` + ajuste pós-demo registrado em commit `5d9aed2` e `d8e3e91`.

## 2026-05-06

- [2026-05-06] [RELEASE] S5 entregue — F-V03 (subscription status), F-V17 (SSO App Proxy), F-V07b (Cashin live mock+sandbox), F-V07c (NFe validator). 2 migrations aplicadas via Supabase MCP (`f_v03_subscription_status`, `f_v17_auth_audit`). Branch `feat/S5-integracoes`. Detalhe: `docs/STATUS_IMPLEMENTACAO.md` §S5.
- [2026-05-06] [RELEASE] S3 entregue — F-V18 tags auto (Líder/Influenciador), 5 áreas admin v2. Migration `f_v18_tags_and_affiliate_count`. 2 bugs corrigidos no smoke (cache fetch no-store + jsonb `cs` filter).
- [2026-05-06] [RELEASE] S4 entregue — F-V15 eventos + F-V09 Academy + Finance/Payouts admin refator. 2 migrations (`f_v15_events`, `f_v09_academy_content`). F-V13 absorvida por F-V15.
- [2026-05-06] [RELEASE] S2 entregue — F-V14 vendas manuais + F-V05 saldo/créditos + F-V07 triple resgate UI. 3 migrations.

## 2026-05-05

- [2026-05-05] [RELEASE] S1 entregue — fundação Loveable (Tailwind 3 + shadcn 17 primitivos + tokens HSL + Plus Jakarta + componentes biohelp + sidebars). 3 telas membro v2 atrás de `LRP_V2`.

## 2026-04-29

- [2026-04-29] [RELEASE] F-V11 mergeada — visão restrita da rede (sponsor + N1).
- [2026-04-29] [DECISION] Reunião 29/04 PM — 5 features novas catalogadas (F-V14..F-V18). 3 TBDs resolvidos (11/14/19). 4 derivados (23/24/25/26). Cronograma esticado para 11/06/2026.

## 2026-04-28

- [2026-04-28] [DECISION] Pivot v2 declarado pelo cliente. MLM CV-based descontinuado. Modelo v2: afiliação 1-nível + Founder@5 + créditos Shopify + Cashin. Documento canônico criado: `docs/sdd/PIVOT-V2.md`.
