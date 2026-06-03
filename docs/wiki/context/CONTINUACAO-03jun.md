# Context pack — Continuação (sessão 03/06/2026)

> Handoff pra próxima sessão (Claude Code CLI). Leia também, em ordem:
> `docs/wiki/index.md` → este arquivo → `AGENTS.md` → `TODO.md` → SPEC da feature.

## Estado geral (o que foi feito na sessão 02-03/06)
Todas mergeadas em `main` e deployadas:
- **F-V22** Avisos no painel (announcement bar CMS) — `/admin/announcements` + barra no topo do `V2Dashboard`. Banner responsivo por aspect-ratio.
- **F-V23** Disparo de e-mail nativo no admin — `/admin/emails` (Resend Pro, segmentação, webhook de status). Infra 100% configurada (API key, envs Vercel, webhook Resend, Postmaster Tools).
- **F-V24** Cancelamento manual no admin — botões em `/admin/community/[id]`.
- **F-V25** Busca de cliente no admin — `/admin/community`.
- Eduardo (`eduardo.sousa@flowcode.cc`) promovido a **admin** (linha em `roles`). Login admin: entrar por **`admin.bio-help.com/admin-login`** (NÃO `/login`).

## ⏳ EM ABERTO — o que fazer nesta nova sessão

### F-V26 — Banner de avisos também na Academy (classe B) ← COMEÇAR POR AQUI
- **Pedido (Léo):** espelhar o banner de avisos (F-V22) na **Academy**, além da Visão Geral.
- **Implementação (simples — reusa F-V22 inteiro):** renderizar o `AnnouncementBar` no topo de `app/dashboard/academy/page.tsx`, igual está no `app/dashboard/V2Dashboard.tsx`.
  - Importar `getActiveAnnouncement` de `@/lib/announcements/queries` e `AnnouncementBar` de `@/components/biohelp`.
  - Buscar `const announcement = await getActiveAnnouncement()` e renderizar `{announcement && <AnnouncementBar announcement={announcement} />}` no topo do conteúdo.
- **Contract inline:** `TODO.md` §1.1 (F-V26). **CA:** aviso ativo aparece na Academy igual na Visão Geral; sem aviso = sem barra.
- **Decisão aberta (resolver junto):** travar a proporção do banner. Hoje é responsivo (`aspect-[2/1]` mobile → `sm:aspect-[12/5]` → `lg:aspect-[7/2]` + objectPosition center 58%) em `components/biohelp/AnnouncementBar.tsx`. O Eduardo queria avaliar travar em **3:1 (exportar 1800×600)** pra uploads previsíveis — perguntar a ele antes de mudar.

### F-V27 — Academy: 3 trilhas + aulas/avisos programados por data (classe C)
- **Pedido (Léo):** consolidar 3 trilhas (Consumo/rotina · Revender produtos · Desenvolver comunidade) espelhando o desenho do Lovable; aula de boas-vindas (live) vira aula; e **aulas programadas por data** ("no dia tal teremos X") com estado "em breve".
- **Bloqueio:** o **Léo precisa refinar o desenho final no Lovable** antes do seed das trilhas. Não começar sem isso.
- Estende F-V09 (Academy CMS). Arquivos prováveis: `lib/content/*` (schema+queries — adicionar `scheduled_at`/estado), `app/admin/academy/*`, `app/dashboard/academy/*`. Contract inline `TODO.md` §1.1.

### F-V28 — Login alternativo com senha (classe D) — 🟡 REAVALIAR
- **Pedido (Gabriel):** login com senha (clientes não recebiam o código). **Mas** o upgrade pro **Resend Pro** removeu o limite diário (causa principal). **Decisão pendente do cliente:** ainda é necessário pós-Pro? Confirmar antes de implementar (mexe em **auth**).

## Follow-ups (não-feature)
- **Reputação de e-mail (F-V23):** o teste real caiu no spam por **reputação** do domínio (Gmail penalizou `send.mail.bio-help.com` pelos códigos antigos). Infra está 100% (SPF/DKIM/DMARC/Postmaster). Recuperação = comportamento + tempo: **"report not spam"** nos 1ºs envios + **aquecimento gradual**. **NÃO blastar os 257 ainda** (piora). Monitorar reputação no Google Postmaster Tools (auto-verifica em horas; dados em ~24-48h). Ver memória `project_email_deliverability`.
- **Testar em produção (não bloqueia):** F-V24 (cancelar um membro de teste — renovação e imediato) e F-V25 (busca).

## Convenções do repo (lembrete)
- Branch: `feat/F-VNN-<slug>`. Commit: `feat(F-VNN): ...`. PR linkando SPEC + CAs.
- Migrations Supabase via MCP `apply_migration` (projeto `rlp-biohelp` ref `ikvwzfbkbwpiewhkumrj`), idempotentes + rollback comentado. **Confirmar antes** de tocar produção/Supabase remoto/Vercel.
- typecheck (`npx tsc --noEmit`) + lint (`npx next lint --file ...`) antes de commitar. CI N1 deve ficar verde.
- Padrões a espelhar: F-V22 (announcements) e F-V15 (events) são os modelos de CMS admin + render no dashboard.

## Handoff explícito
- **Última ação:** F-V24 e F-V25 mergeados e docs fechados (commits `9a98b25`, `2975fd7`, `dbec5c5`).
- **O que NÃO fiz / o próximo deve evitar:** não travei a proporção do banner (espera decisão do Eduardo); não comecei F-V27 (espera Léo no Lovable); não implementei F-V28 (espera decisão do cliente); não disparei e-mail pra base (reputação). Não normalizar ref_codes legados (Anti-SPEC).
