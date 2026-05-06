# LOVEABLE-IMPORT — Mapeamento e plano de migração do front

> **Documento-mestre da absorção do front Loveable** dentro do app Next.js existente. Toda a migração do front (S1–S5 do `CRONOGRAMA-V2.md`) deve referenciar este documento.
>
> **Em conflito com qualquer outro doc:** `PIVOT-V2.md` > este doc > SPECs específicas das features F-V01..F-V18.

**Data:** 2026-05-05
**Origem:** projeto Loveable `biohelp-sparkle-hub` — fonte armazenada em `_loveable_import/` (gitignored). URL Loveable: `https://lovable.dev/projects/c6cd387c-c9cf-4b03-a139-4b90f6e4e3f7`.
**Decisão arquitetural:** Opção A (absorver dentro do Next.js). Justificativa em `PIVOT-V2.md` §6.

---

## 1. Inventário do que veio do Loveable

### 1.1 Stack original
- Vite 5 + React 18 + TypeScript 5.8
- Tailwind 3 + tailwindcss-animate + @tailwindcss/typography
- shadcn/ui (≈50 primitivos Radix-based) + lucide-react (ícones)
- React Router 6.30 (`BrowserRouter` + rotas client-side)
- TanStack Query 5 (`QueryClientProvider` global)
- React Hook Form 7 + @hookform/resolvers + Zod 3.25
- Recharts 2.15 (gráficos)
- Sonner + native shadcn `Toaster` (toasts)
- next-themes 0.3 (provider de tema escuro/claro)
- date-fns 3.6, react-day-picker 8.10
- Outros: cmdk, vaul, embla-carousel-react, input-otp, react-resizable-panels

### 1.2 Páginas (33 — `_loveable_import/src/pages/`)

**Auth (1):**
| Loveable | Status |
|---|---|
| `auth/Login.tsx` | Tabs "Sou Parceira" / "Sou Admin Biohelp" + magic link (Supabase já provê — backend pronto) |

**Partner — Nutrition Club (9 ativas + 4 redirects legacy):**
| Loveable | Equivalente Next existente | Decisão |
|---|---|---|
| `partner/Dashboard.tsx` | `app/dashboard/page.tsx` | Substituir |
| `partner/Store.tsx` | — | Criar (atalho pra loja Shopify) |
| `partner/Academy.tsx` | — | Criar (parte de F-V09) |
| `partner/Trail.tsx` (sub-rota `/academy/:trailId`) | — | Criar (parte de F-V09) |
| `partner/Orders.tsx` | `app/dashboard/sales/page.tsx` | Renomear `sales` → `orders` ou consolidar |
| `partner/Finance.tsx` | `app/dashboard/commissions/page.tsx` + `payouts/page.tsx` | Consolidar em `finance/` |
| `partner/Club.tsx` | `app/dashboard/network/page.tsx` | Substituir (F-V11 já restringe a sponsor + N1) |
| `partner/Profile.tsx` | — | Criar |
| `partner/Payouts.tsx` (legacy, mantida no router) | `app/dashboard/payouts/page.tsx` | Manter como sub-tela de Finance |
| `partner/Network.tsx`, `Training.tsx`, `Commissions.tsx`, `Triple3.tsx` | — | **NÃO migrar** — são redirects legacy do v1 |

**Admin (17 — 11 ativas + 6 legacy/sub):**
| Loveable | Equivalente Next existente | Decisão |
|---|---|---|
| `admin/Overview.tsx` | `app/admin/page.tsx` | Substituir |
| `admin/Community.tsx` | `app/admin/members/[id]/page.tsx` (parcial) | Criar lista (`/admin/community`) + manter detalhe |
| `admin/Growth.tsx` | — | Criar |
| `admin/Consumption.tsx` | — | Criar |
| `admin/Products.tsx` | `app/admin/products/page.tsx` | Substituir/atualizar layout |
| `admin/Events.tsx` | — | Criar (F-V15) |
| `admin/Finance.tsx` | `app/admin/commissions/page.tsx` | Consolidar |
| `admin/Payouts.tsx` | `app/admin/payouts/page.tsx` | Substituir layout |
| `admin/Academy.tsx` | — | Criar (CMS leve, F-V09) |
| `admin/Alerts.tsx` | — | **Pós-MVP** (Léo confirmou em 29/04 minuto 24:31) |
| `admin/Settings.tsx` | — | **Pós-MVP** — sidebar conforme reunião |
| `admin/MemberDetail.tsx` | `app/admin/members/[id]/page.tsx` | Substituir layout |
| `admin/Network.tsx` | — | **NÃO migrar** — conceito v1 (árvore multinível) |
| `admin/OrdersAnalytics.tsx` | — | Criar |

**Outros (2):**
| `Index.tsx` | `app/page.tsx` | Manter Next (redirect pra `/login` ou `/dashboard`) |
| `NotFound.tsx` | `app/not-found.tsx` | Criar |

### 1.3 Componentes biohelp custom (`_loveable_import/src/components/biohelp/`)

| Arquivo | Uso | Decisão na migração |
|---|---|---|
| `PartnerLayout.tsx` | Sidebar + mobile sheet do partner. **Sidebar items:** Visão Geral / Acesso à Loja / Academy / Minhas Vendas / Minha Comunidade / Resultado & Resgate / Meu Perfil. | Migrar como `app/(member)/layout.tsx` em RSC |
| `AdminLayout.tsx` | Sidebar admin: Visão Geral / Comunidade / Crescimento / Consumo / Produtos / Eventos / Financeiro / Resgates / Academy / Alertas / Configurações | Migrar como `app/admin/layout.tsx` em RSC |
| `BHComponents.tsx` | Átomos custom (BHAvatar, BHCard, BHStat etc) | Portar 1:1 |
| `PeriodFilter.tsx` | Dropdown de período (semana/mês/trimestre) usado em vários painéis | Portar 1:1 |
| `WithdrawDialog.tsx` | Modal de resgate (PIX / Cashback Cashin / Crédito Shopify) | Portar; **trocar lógica mock** por Server Action de F-V07 |

### 1.4 Componentes shadcn/ui (~50)
Todos pertinentes Radix; reaproveitar via `npx shadcn@latest add <name>` no projeto Next. Não copiar pasta `ui/` direto — usar instalador shadcn pra conseguir o `components.json` correto pra Next.

### 1.5 Libs (`_loveable_import/src/lib/`)
| Arquivo | Conteúdo | Decisão |
|---|---|---|
| `utils.ts` | `cn` helper (clsx + tailwind-merge) | Portar 1:1 |
| `fake-api.ts` | **DESCARTAR** — todos os mocks contêm modelo v1 (CV, Triple3, Fast-Track, ranks). | Não portar. Substituir por Server Components + Supabase. |
| `alerts.ts` | Mocks de alertas (pós-MVP) | Não portar agora |
| `trails.ts` | Mocks de trilhas Academy | Não portar; rever em F-V09 |

### 1.6 Tipos (`_loveable_import/src/types/index.ts`)
**🚨 DESCARTAR INTEGRALMENTE.** Os tipos contêm:
- `PartnerRank: PARTNER | LEADER | DIRECTOR | HEAD` — modelo v1 de níveis (REMOVIDO)
- `CommissionType: FAST_TRACK | PERPETUAL | TRIPLE3 | LEADERSHIP` — REMOVIDO
- `Triple3Progress`, `FastTrackPartner` — REMOVIDOS
- `Partner.currentMonthCV`, `activationTargetCV`, `networkCV` — CV não existe mais
- `AdminOverview.totalCVMonth`, `breakdownByRank` — REMOVIDOS

Tipos novos vão para Zod schemas em `lib/*` do Next, alinhados ao modelo V2 do `PIVOT-V2.md`.

---

## 2. Design tokens (replicar 1:1 no Next)

Cores HSL do Loveable (`_loveable_import/src/index.css` linhas 9-83). Todas vão pra `app/globals.css` do Next.

```css
/* Brand */
--bh-purple-deep: 256 47% 47%;     /* primary */
--bh-purple-medium: 256 45% 58%;
--bh-purple-soft: 258 60% 75%;
--bh-lavender: 268 67% 94%;
--bh-lavender-soft: 268 50% 97%;
--bh-lime: 68 75% 60%;             /* accent */
--bh-lime-soft: 68 60% 85%;
--bh-coral: 16 85% 60%;
--bh-coral-soft: 16 70% 90%;
--bh-blue: 235 75% 70%;
--bh-blue-soft: 235 60% 90%;

/* Semânticas */
--background, --foreground, --card, --popover, --primary,
--secondary, --muted, --accent, --destructive, --success,
--warning, --border, --input, --ring,
--sidebar-* (background/foreground/primary/accent/border/ring)

/* Gradientes */
--gradient-hero, --gradient-card, --gradient-accent,
--gradient-warm, --gradient-purple

/* Sombras */
--shadow-sm/md/lg/xl, --shadow-glow, --shadow-purple-glow
```

**Tipografia:** `Plus Jakarta Sans` (Google Fonts, weights 300–800).
**Raio padrão:** `--radius: 0.75rem`.
**Tema escuro:** já preparado (`.dark { ... }`). Replicar.
**Animações utilitárias:** `animate-float`, `animate-pulse-soft`, `animate-shimmer`, `animate-fade-in`, `animate-slide-up`, `animate-scale-in`.

---

## 3. Mapeamento Loveable → Next App Router (rotas finais)

> Convenção: `app/(member)/` = grupo de rota com layout do partner; `app/admin/` = layout admin. Login em `app/login/page.tsx`.

| Rota Loveable | Rota Next final | Feature | Sprint |
|---|---|---|---|
| `/auth/login` | `/login` (já existe) | F-V01 (refator) + F-V17 (SSO) | S1 |
| `/partner/dashboard` | `/dashboard` | F-V11 + F-V03 + F-V05 | S2 |
| `/partner/store` | `/dashboard/store` | F-V17 (SSO Shopify) | S2 |
| `/partner/academy` | `/dashboard/academy` | F-V09 | S4 |
| `/partner/academy/:trailId` | `/dashboard/academy/[trailId]` | F-V09 | S4 |
| `/partner/orders` | `/dashboard/orders` | F-V14 (vendas manuais) | S2 |
| `/partner/finance` | `/dashboard/finance` | F-V05 + F-V07 (triple resgate) | S2 |
| `/partner/club` | `/dashboard/club` | F-V11 (visão restrita já entregue) | S2 |
| `/partner/profile` | `/dashboard/profile` | F-V01 (dados ref + bank) | S2 |
| `/partner/payouts` (legacy) | `/dashboard/finance/payouts` | F-V07 | S4 |
| `/admin/overview` | `/admin` | F-V16 | S3 |
| `/admin/community` | `/admin/community` | F-V16 + F-V18 (tags Líder/Influenciador) | S3 |
| `/admin/community/:id` | `/admin/community/[id]` | F-V16 | S3 |
| `/admin/growth` | `/admin/growth` | F-V16 | S3 |
| `/admin/consumption` | `/admin/consumption` | F-V16 | S3 |
| `/admin/products` | `/admin/products` (já existe) | refator layout | S3 |
| `/admin/events` | `/admin/events` | F-V15 | S4 |
| `/admin/finance` | `/admin/finance` | F-V04 + F-V16 | S4 |
| `/admin/payouts` | `/admin/payouts` (já existe) | F-V07 | S4 |
| `/admin/academy` | `/admin/academy` | F-V09 (CMS) | S4 |
| `/admin/orders-analytics` | `/admin/orders` | F-V16 | S4 |
| `/admin/alerts` | — | **PÓS-MVP** | — |
| `/admin/settings` | — | **PÓS-MVP** | — |

**Rotas legacy do Loveable que NÃO migram:**
- `/partner/network`, `/partner/training`, `/partner/commissions`, `/partner/triple3` (já são redirects no Loveable, refletem v1)
- `/admin/network` (árvore multinível v1)
- `/admin/members` (vira `/admin/community`)

---

## 4. Anti-SPEC do import (NÃO importar)

Itens que existem no Loveable mas **não devem entrar no app Next**:

1. **Tipos v1** em `_loveable_import/src/types/index.ts`:
   - `PartnerRank`, `CommissionType`, `Triple3Progress`, `FastTrackPartner`
   - Campos `currentMonthCV`, `activationTargetCV`, `networkCV`, `totalCVMonth`, `breakdownByRank`
2. **Mocks v1** em `_loveable_import/src/lib/fake-api.ts`:
   - `mockPartner` com FastTrack/Triple3
   - `mockCommissions` com tipos `FAST_TRACK | PERPETUAL | TRIPLE3 | LEADERSHIP`
   - `mockNetwork` com árvore multinível
3. **Páginas v1**: `partner/Network.tsx`, `partner/Triple3.tsx`, `partner/Training.tsx` (substituída por Academy), `partner/Commissions.tsx` (vira parte de Finance), `admin/Network.tsx`
4. **Sidebar items legacy**: nenhum dos 4 níveis (PARTNER/LEADER/DIRECTOR/HEAD) — tags v2 são `PRE_FOUNDER`, `FOUNDER`, e tags automáticas `LIDER` (≥5 ativos) e `INFLUENCIADOR` (≥40 ativos) (F-V18).
5. **Indicadores v1 no design**: barras de progresso de `200 CV / activationTargetCV`, gráficos `MonthlyStats.cv` — substituir por indicador de "assinatura paga" (F-V03) e "comissões 50%" (F-V04).

Toda página migrada **deve** declarar no início da SPEC quais elementos visuais do Loveable foram **descartados** por modelagem v1.

---

## 5. Plano de migração (5 sprints + buffer)

> **Versão compactada (05/05/2026):** S1 já inclui 3 telas membro além da fundação. Detalhe em `CRONOGRAMA-V2.md`.

### S1 — Fundação + Membro core start (06–12/05/2026)
1. Instalar Tailwind 3 + plugins (`tailwindcss-animate`, `@tailwindcss/typography`) no Next.
2. Instalar shadcn/ui via `npx shadcn@latest init` + adicionar primitivos usados (lista no §1.4 — provavelmente todos).
3. Portar design tokens de `index.css` → `app/globals.css`.
4. Portar `lib/utils.ts` (cn helper).
5. Adicionar dependências runtime: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `recharts`, `sonner`, `lucide-react`, `date-fns`, `class-variance-authority`, `tailwind-merge`, `clsx`.
6. Criar shells: `app/(member)/layout.tsx` (PartnerLayout) e `app/admin/layout.tsx` (AdminLayout) — Server Components com children client onde precisar (sidebar interativo).
7. Portar `BHComponents.tsx`, `PeriodFilter.tsx`, `NavLink.tsx` (átomos custom).
8. **Saída de S1:** projeto Next com Tailwind+shadcn+tokens prontos, layouts navegáveis vazios, design system funcional.

### S2 — Painel Membro core (13–19/05/2026)
- Portar Dashboard, Store, Orders, Finance, Club, Profile.
- Conectar dados reais via Supabase (Server Components).
- Plugar `WithdrawDialog` em F-V05 + F-V07 (triple resgate).
- Toda lógica atrás de `LRP_V2`.

### S3 — Painel Admin core (20–26/05/2026)
- Portar Overview, Community, Growth, Consumption, Products.
- Implementar F-V18 (tags Líder/Influenciador) na Community.
- Conectar dados reais.

### S4 — Eventos + Academy + Finance/Payouts admin (27/05–02/06/2026)
- F-V15 (Eventos admin) + Events.tsx.
- F-V09 (Academy CMS — admin posta global).
- Finance + Payouts admin.
- Orders Analytics.

### S5 — Integrações finais + QA (03–09/06/2026)
- F-V17 (SSO Shopify → Painel).
- Cashin live (TBD-19 destrava).
- Validações automáticas de NF (F-V07).
- Matriz de Validação preenchida por feature.

### Buffer (10–11/06/2026 — 2 dias úteis)
- Polimento + edge cases + ajustes de feedback da demo de 10/06.
- Revisão de fricção positiva (Academy bloqueada/ativada).
- **Entrega final: 11/06/2026.**

**Pós-MVP (não estão neste cronograma):** Alertas, Settings (gestão de admins via UI), foto-comida, treino, Apple Watch, gamificação Iron Man-style.

---

## 6. Como o agente trabalha durante a migração

1. Cada página migrada é uma **feature classe B ou C** (B se só visual + Supabase reads, C se inclui mutations/Server Actions).
2. Antes de criar a página: cabeçalho da SPEC declara **quais elementos do Loveable foram descartados** (lista do §4).
3. **Imports proibidos**: nenhum arquivo de `_loveable_import/` pode ser importado pelo código de produção. Use `_loveable_import/` só como **referência visual**.
4. **Cores e classes Tailwind**: usar as semânticas (`bg-primary`, `text-foreground`, `border-sidebar-border`) — nunca hardcode HSL nem cor v1 (`#FF...`).
5. **Server Components first.** Use Client Component só onde precisar de estado/interação (sidebar collapse, dialogs, forms).
6. Toda mudança visual atrás de `LRP_V2` quando a rota tiver equivalente v1 ainda em produção.

---

## 7. Status atual da migração

| Sprint | Período | Status |
|---|---|---|
| S1 — Fundação + Membro core start | 06–12/05 | 🚧 Aguardando início |
| S2 — Membro finish + Login | 13–19/05 | ⏳ |
| S3 — Admin core | 20–26/05 | ⏳ |
| S4 — Eventos+Academy+Finance | 27/05–02/06 | ⏳ |
| S5 — Integrações | 03–09/06 | ⏳ |
| Buffer | 10–11/06 | ⏳ |

**Entrega final: 11/06/2026.** Atualizar conforme avanço. Última edição: 2026-05-05 (versão compactada).
