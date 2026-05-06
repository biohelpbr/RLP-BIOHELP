# CRONOGRAMA V2 — Migração do front Loveable + entregáveis até 11/06/2026

> Cronograma operacional sprint a sprint. Decorre de `PIVOT-V2.md` §5 (Onda 7) e detalha o plano declarado em `LOVEABLE-IMPORT.md` §5.
>
> **Janela total:** 06/05/2026 (qua) → 11/06/2026 (qui) — **5 sprints + 2 dias de buffer**.
> **Compromisso com cliente (reunião 29/04 PM):** entrega no início de junho/2026 (Léo: "esticar 10–15 dias"). Esta versão compacta vs cronograma inicial encurta 4 dias úteis (era 15/06).

**Data:** 2026-05-05 (versão compactada)
**Estado inicial:** branch `feat/F-V11-visao-restrita-rede` (mergeada). `_loveable_import/` extraído. Documentação base concluída.
**Transcript da reunião:** `documentos_escopo/BioHelp & FlowCode.txt`

---

## Visão geral

| Sprint | Período | Dias úteis | Foco | Estado |
|---|---|---|---|---|
| **S1** | 06–12/05 (qua–ter) | 5 | Fundação + 3 telas membro (Dashboard, Club, Profile) | ✅ Entregue 06/05/2026 (branch `feat/S1-fundacao-loveable`) |
| **S2** | 13–19/05 (qua–ter) | 5 | Membro finish (Store, Orders=F-V14, Finance triple) + Login refator | 🟡 Código entregue 05/05/2026 (branch `feat/S2-membro-finish`) — smoke + migrations pendentes do humano |
| **S3** | 20–26/05 (qua–ter) | 5 | Admin core (Overview, Community+F-V18, Growth, Consumption, Products) | ⏳ |
| **S4** | 27/05–02/06 (qua–ter) | 5 | Eventos (F-V15) + Academy (F-V09) + Finance/Payouts admin + OrdersAnalytics | ⏳ |
| **S5** | 03–09/06 (qua–ter) | 5 | F-V17 (SSO Shopify) + Cashin live + validação NF + QA + matrizes | ⏳ |
| **Buffer** | 10–11/06 (qua–qui) | 2 | Polimento + retrabalho de feedback do cliente | ⏳ |

> **Total: 27 dias úteis** (vs 30 da versão anterior — corte de ~13%).
> Sprints qua–ter: cada sprint fecha na **terça**, deixando a **quarta livre pra demo com cliente** (semelhante à reunião de 29/04 que foi quarta). Demos: 13/05, 20/05, 27/05, 03/06, 10/06.

---

## S1 — Fundação + Membro core start (06–12/05/2026)

**Objetivo:** projeto Next.js compila com Tailwind + shadcn instalados, design tokens v2 carregados, layouts navegáveis, **3 telas do partner já portadas** (Dashboard, Club, Profile — as mais simples, sem mutations).

### Entregáveis
- [ ] Tailwind 3 + plugins instalados em `tailwind.config.ts` (paths: `app/`, `components/`).
- [ ] `npx shadcn@latest init` rodado; `components.json` configurado pra Server Components.
- [ ] Primitivos shadcn essenciais: `button`, `card`, `input`, `label`, `tabs`, `dialog`, `sheet`, `dropdown-menu`, `tooltip`, `toast`, `sonner`, `avatar`, `badge`, `select`, `separator`, `skeleton`, `table`, `form`. Resto sob demanda.
- [ ] `app/globals.css` com tokens HSL do Loveable (`LOVEABLE-IMPORT.md` §2).
- [ ] Plus Jakarta Sans via `next/font/google` em `app/layout.tsx`.
- [ ] `lib/utils.ts` com `cn` helper.
- [ ] Deps runtime: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `recharts`, `sonner`, `lucide-react`, `date-fns`, `class-variance-authority`, `tailwind-merge`, `clsx`, `tailwindcss-animate`.
- [ ] `app/(member)/layout.tsx` (Server Component + sidebar client island) — espelhando `PartnerLayout` do Loveable.
- [ ] `app/admin/layout.tsx` (idem AdminLayout).
- [ ] `components/biohelp/` portado: `BHAvatar`, `BHCard`, `BHStat`, `PeriodFilter`, `NavLink`.
- [ ] **Páginas portadas (sem mutations, leitura simples):**
  - [ ] `app/(member)/dashboard/page.tsx` (cards de resumo)
  - [ ] `app/(member)/dashboard/club/page.tsx` (F-V11 já existe, só portar layout)
  - [ ] `app/(member)/dashboard/profile/page.tsx` (dados pessoais read-only)
- [ ] Build limpa (`npm run build`) + lint zero.

### Definition of Done
- Acessar `/dashboard`, `/dashboard/club`, `/dashboard/profile` mostra layout Loveable navegável com dados reais (Supabase).
- Branch: `feat/S1-fundacao-loveable`. Merge ter 12/05.

### Riscos
- Conflitos entre dependências React 18.3 (Loveable usa) e o `package-lock` atual — pode precisar reset.
- shadcn em RSC: `Toaster`, `Sonner`, `Dialog` são client-only — checar `'use client'`.

---

## S2 — Membro finish + Login (13–19/05/2026)

**Objetivo:** todas as 7 telas do partner navegáveis com dados reais. Login Supabase com layout novo.

### Entregáveis
- [ ] `app/(member)/dashboard/store/page.tsx` — atalho pra Shopify (link externo se F-V17 não estiver pronta).
- [ ] `app/(member)/dashboard/orders/page.tsx` + `orders/new/page.tsx` — **F-V14** (vendas manuais). Migration `member_leads` + `member_sales` + RLS.
- [ ] `app/(member)/dashboard/finance/page.tsx` — F-V05 (saldo + créditos) + F-V07 (triple resgate). `WithdrawDialog` portado.
- [ ] `app/login/page.tsx` — refator visual pra match com `auth/Login.tsx` Loveable (tabs Parceira/Admin Biohelp + magic link). Lógica Supabase mantida.
- [ ] Server Actions: criar lead, criar venda, registrar pedido de resgate (PIX/Cashback/Crédito).

### Definition of Done
- F-V14 com matriz preenchida (CA-01 a CA-06 SPEC).
- Member com `LRP_V2=true` vê painel novo; com `false` vê painel v1.
- Branch: `feat/S2-membro-finish` (sub-branches por feature, rebased).

### Dependência
- F-V03 (status ativo) **NÃO** precisa estar live em S2 — pode mostrar estado real do `members.subscription_status` ou `null` por enquanto.

---

## S3 — Admin core (20–26/05/2026)

**Objetivo:** 5 áreas do admin navegáveis com dados reais. Tags automáticas funcionando.

### Entregáveis
- [ ] `app/admin/page.tsx` (Visão Geral) — F-V16, substitui current.
- [ ] `app/admin/community/page.tsx` + `[id]/page.tsx` — F-V16 + filtros por tag.
- [ ] `app/admin/growth/page.tsx` — gráficos Recharts (membros, receita, comissões, projeção 3 meses).
- [ ] `app/admin/consumption/page.tsx` — produtos + qty + receita + contribuição líquida (admin-only).
- [ ] `app/admin/products/page.tsx` — refator com preço sugerido manual + preço de custo (TBD-25 hipótese padrão).
- [ ] **F-V18 implementada:** cron diário + hook em F-V03 + tags `auto:lider`/`auto:influenciador` + badges na Comunidade. Migration `members.tags` jsonb + view `member_active_affiliate_count`.

### Definition of Done
- Admin navega 5 áreas com dados reais (não mocks).
- F-V18 com matriz completa (CA-01 a CA-06).
- Branch: `feat/S3-admin-core`.

---

## S4 — Eventos + Academy + Finance/Payouts admin (27/05–02/06/2026)

**Objetivo:** funcionalidades complementares do admin + Academy CMS.

### Entregáveis
- [ ] `app/admin/events/*` — **F-V15** completa (criação + funil + link/tag). Migration `events`, `event_*`, handler `/r/[slug]/route.ts`, hook em `webhooks/orders/paid`.
- [ ] `app/admin/academy/*` — **F-V09** CMS leve (upload de URLs YouTube + métricas globais). Migration `content_trails`, `content_modules`.
- [ ] `app/(member)/dashboard/academy/page.tsx` + `[trailId]/page.tsx` — consumo Academy pelo membro.
- [ ] `app/admin/finance/page.tsx` — agregação comissões (F-V04) + saldo (F-V05) — refator de `app/admin/commissions`.
- [ ] `app/admin/payouts/page.tsx` — refator visual + suporte a triple resgate.
- [ ] `app/admin/orders/page.tsx` — OrdersAnalytics com tipos `LRP/FIRST/NORMAL`.

### Definition of Done
- F-V15 + F-V09 com matrizes preenchidas.
- Migrations aplicadas em staging.

---

## S5 — Integrações finais + QA (03–09/06/2026)

**Objetivo:** SSO Shopify funcional, Cashin live, validações automáticas, matriz por feature preenchida.

### Entregáveis
- [ ] **F-V17 SSO Shopify:** PoC validada (Multipass ou App Proxy) → implementação → rollout gradual com flag `LRP_V2_SSO=false` por default.
- [ ] **Cashin live:** `lib/payouts/v2/cashin.ts` integrado com API real (sandbox + prod), webhook de status do pagamento.
- [ ] **Validação automática NF:** `lib/payouts/v2/nfe-validator.ts` — formato + dados básicos. Inválida → erro síncrono no upload.
- [ ] Matriz de Validação preenchida pra todas as features migradas (F-V05, F-V07, F-V11, F-V14, F-V15, F-V16, F-V17, F-V18 mínimo).
- [ ] Smoke test em staging com `LRP_V2=true` por 5 dias antes de prod.
- [ ] **Runbook:** como ativar flag em prod, rollback, ownership.

### Definition of Done
- Staging estável.
- Demo final com cliente quarta 10/06/2026.

---

## Buffer (10–11/06/2026 — 2 dias úteis)

**Objetivo:** polimento + retrabalho de feedback do cliente da demo de 10/06.

### Foco
- Ajustes visuais (espaçamentos, animações de fricção positiva na Academy, microcopy).
- Edge cases: usuário sem ref, evento sem produtos elegíveis, conexão Cashin lenta.
- Performance: lazy load de gráficos, prefetch de páginas adjacentes.
- Documentação operacional final no `STATUS_IMPLEMENTACAO.md`.

**Entrega final: 11/06/2026 (quinta-feira).**

---

## Onde estão os riscos (em ordem de probabilidade × impacto)

1. **F-V17 SSO Shopify** — Multipass exige plano Plus. Se não for Plus, fallback App Proxy. PoC obrigatória. **Mitigação:** PoC já em S1 em paralelo, não esperar S5.
2. **F-V04 ainda bloqueada** (TBD-1 e 2) — sem ela, F-V07 fica sem valor de comissão. **Mitigação:** UI de F-V07 (cadastro bancário, upload NF) pode rodar em S2/S5 com valor placeholder.
3. **Cashin documentação** — se API for confusa, S5 atrasa. **Mitigação:** ler doc na S1, fazer chamadas curl em sandbox em S2.
4. **Mudança de escopo** vinda do cliente em demo. **Mitigação:** registrar como TBD novo, NÃO entra na sprint corrente.

---

## Sincronização com cliente

- **Demos quartas-feiras:** 13/05, 20/05, 27/05, 03/06, 10/06. Cada uma fecha visualmente o sprint anterior.
- **Pause-points obrigatórios:** mudança de escopo numa demo → vira TBD no `PIVOT-V2.md` §4.1, não entra na sprint corrente.
- **TBDs ainda abertos** (12 — `PIVOT-V2.md` §4.1) — cobrar resposta nas demos. Cada TBD não respondido bloqueia sub-feature; documentar no STATUS_IMPLEMENTACAO.

---

## Pós-MVP (não está neste cronograma)

| Item | Origem |
|---|---|
| `admin/Alerts` UI | Reunião 29/04 PM (Léo: "depois a gente pode ver como que a gente vai fazer") |
| `admin/Settings` (gestão admins via UI) | idem |
| Foto-comida → calorias (modelo ReAct) | Reunião 29/04 PM (~28:00–30:00) |
| Registro de treino + Apple Watch / Google Fit | idem |
| Gamificação tipo Iron Man (equipes + viagem) | Reunião 29/04 PM (~30:31–31:30) |

---

## Como o agente trabalha durante o cronograma

1. **Cada sprint = uma branch principal** (`feat/Sn-foco`) com sub-branches por feature, rebased na sprint principal antes do merge na terça.
2. **Toda feature B/C/D** → matriz de validação preenchida antes do merge.
3. **Anti-SPEC §12-13** (tipos v1 do Loveable) — checar em cada PR, rejeitar imports de `_loveable_import/`.
4. **Reuniões geram TBDs novos** → para na hora, registra em `PIVOT-V2.md` §4.1, não entra na sprint corrente.
5. **Atualizar este doc** ao fim de cada sprint com status, bloqueios encontrados e ajustes de escopo.

---

*Última atualização: 2026-05-05 — versão compactada (corte de 4 dias úteis vs versão anterior). Entrega final 11/06/2026.*
