# SUPER-PROMPT — Refino de UX da Academy (feedback Leonardo) — 05/jun

> Cole o bloco abaixo numa **nova sessão do Claude Code CLI** (cloud) neste repo.
> Auto-contido: convenções do projeto + o redesign pedido + teste E2E e design review.

---

## PROMPT (copiar a partir daqui)

Você é o agente executor neste repositório (Biohelp LRP — Next.js 14 App Router +
Supabase + Tailwind + design system próprio em `components/biohelp`). Tarefa:
**refinar a UX da Academy do MEMBRO** conforme o feedback do Leonardo (ele ajustou um
mockup no Lovable). Objetivo: **simples, visual, leve e funcional** — sem fricção.

### 0. Leitura obrigatória antes de tocar em código
1. `CLAUDE.md`, `AGENTS.md`, `docs/sdd/PIVOT-V2.md` §3 (Anti-SPEC), `docs/sdd/PLAYBOOK.md`.
2. `docs/wiki/index.md`, `TODO.md`, e a memória (`MEMORY.md` + `project_*.md`).
3. Use a skill **`impeccable`** para o trabalho de design/UX (hierarquia visual, espaçamento,
   tipografia, estados, responsivo). Este é um trabalho de front-end de interface.

### 1. Convenções não-negociáveis
- Branch `feat/academy-ux-refino`. Commits `feat(academy): ...` terminando com
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. **Um PR**, focado.
- Migrations em `supabase/migrations/<YYYYMMDD>_<slug>.sql`, **idempotentes + rollback
  comentado**, aplicadas via Supabase MCP (`apply_migration`). Projeto `rlp-biohelp`,
  ref `ikvwzfbkbwpiewhkumrj`.
- **Tudo editável pelo admin (CMS), sem deploy** — princípio do Eduardo. Campos novos
  (grupo da trilha, duração da aula) entram também no CMS admin (`/admin/academy`).
- CI N1 (lint+typecheck+build) verde. Rode `npx tsc --noEmit` e `npx next lint --file ...`.
- NÃO quebrar o que já existe: progresso (`markView`/aulas concluídas), tipos de conteúdo
  (`youtube|pdf|text`), banner de avisos na Academy (F-V26).

### 2. Estado atual (o que mexer)
- **Home da Academy** do membro: `app/dashboard/academy/page.tsx` — hoje é um grid simples
  de trilhas (`listPublishedTrails`), SEM agrupamento.
- **Página da trilha**: `app/dashboard/academy/[trailId]/page.tsx` — hoje renderiza **todas as
  aulas com o vídeo embedado em tamanho cheio** (via `ModulePlayer`), deixando a página enorme
  ("mega grande", reclamação do Leo).
- **Player**: `app/dashboard/academy/ModulePlayer.tsx` — iframe `aspect-video` por aula.
- **Dados**: `lib/content/queries.ts` + `lib/content/actions.ts`. Tabelas:
  `content_trails(id,title,description,cover_url,status,display_order)` e
  `content_modules(id,trail_id,title,kind,content_url,content_text,display_order)`.
- **Admin CMS**: `app/admin/academy/*` (`TrailForm`, `ModuleManager`).

### 3. O REDESIGN pedido (Leonardo) — 3 frentes

**A) "Grandes grupos" na home da Academy**
O Leo quer agrupar as trilhas em grupos temáticos grandes (ex.: **"Consumo e Rotina"** —
que engloba os Módulos 1, 2 e 3 — e **"Indicar pessoas e desenvolver a sua comunidade"**).
- Adicione um conceito de **grupo/categoria** às trilhas: campo `group_label` (text, nullable)
  em `content_trails` (migration idempotente) — **editável no CMS admin**.
- A home passa a renderizar **seções por grupo** (heading do grupo + as trilhas dele).
  Trilhas sem grupo caem numa seção padrão (ex.: "Geral") ou no fim.
- Visual com "pegada" (cards com capa, leve, arejado). Use `impeccable`.

**B) Lista de aulas COMPACTA (a parte mais importante)**
Hoje cada aula é um vídeo gigante. O Leo quer uma **lista enxuta, 3–4 aulas visíveis por tela**,
no estilo do mockup "Comece por aqui": cada aula é uma **linha/card compacto** com:
- **thumbnail** pequena à esquerda (use a do YouTube: `https://img.youtube.com/vi/<id>/hqdefault.jpg`,
  derivada do `content_url` — sem campo novo),
- **título** + **duração** ("3 min"),
- **status**: badge "Assistido" (verde) quando concluída (já existe progresso via aulas
  concluídas) — senão nada,
- **botão** à direita: "Assistir" (não vista) ou "Revisar" (vista).
- O **vídeo NÃO fica embedado na lista**. Abre ao clicar — num **player menor** (modal/drawer,
  ou rota dedicada `…/[trailId]/[moduleId]`), não ocupando a tela inteira. Reduzir o tamanho do
  player é requisito explícito ("a aula dentro está mega grande, queria reduzir").

**C) Duração das aulas (pro "3 min")**
- Adicione `duration_minutes` (int, nullable) em `content_modules` (migration) — **editável no
  CMS admin** (`ModuleManager`). Exibir "X min" quando preenchido; ocultar quando nulo.
- (Não precisa buscar duração no YouTube automaticamente; é campo manual no CMS.)

### 4. Referência visual
Espelhe o mockup que o Leo ajustou no **Lovable** (prints anexados na call): seção "Comece por
aqui — Vídeos curtos com o passo a passo dos fundamentos", cards de aula compactos com
thumbnail + título + tempo + "Assistido"/Revisar/Assistir. Mantenha o design system Biohelp
(`components/biohelp`, tokens de cor/spacing). Responsivo (mobile-first; no mobile, 1 coluna
de cards compactos; 3–4 visíveis sem rolar muito).

### 5. CMS admin (manter o princípio)
No `/admin/academy` (`TrailForm`/`ModuleManager`), adicionar os campos novos:
- Trilha: `group_label` (input de grupo, com sugestão dos grupos já usados).
- Aula: `duration_minutes`.
Assim o Leo cria grupos/durações sozinho, sem código.

### 6. Aceite + testes (OBRIGATÓRIO)
- **CA-1** Home agrupa trilhas por grande grupo; admin define o grupo no CMS.
- **CA-2** Página da trilha mostra lista compacta (3–4 aulas/tela), com thumbnail+título+
  duração+status+botão; sem vídeos gigantes embedados.
- **CA-3** Clicar numa aula abre o player **reduzido** (modal/rota), e dá pra marcar como vista;
  o badge "Assistido"/"Revisar" reflete o progresso.
- **CA-4** Duração "X min" aparece quando preenchida no CMS.
- **CA-5** Nada quebrou: avisos na Academy, tipos pdf/text, progresso.
- **E2E (Playwright, logado)**: crie conta de teste descartável (paid + admin), faça build de
  produção (`npx next build`) + `npx next start -p 3210`, e valide CA-1..CA-5 navegando como
  membro; e no admin, crie um grupo + uma aula com duração e veja refletir no membro. No fim,
  destrua a conta e remova os arquivos temporários. (Padrão de harness E2E descrito no
  `docs/sdd/SUPERPROMPT-CALL-05JUN.md` §2 — reaproveite o `e2e-setup.mjs` de lá.)
- **Design review**: rode a skill `impeccable` no resultado e ajuste (hierarquia, densidade,
  estados hover/empty, contraste, mobile).

### 7. Fechamento
`tsc`/`lint`/`build` → E2E → screenshots no PR (antes/depois) → push → PR (CA cobertos +
evidências) → CI verde → merge. Atualizar `TODO.md`/wiki da Academy.

### Apêndice — conteúdo atual (referência de grupos/módulos)
Os Módulos 1/2/3 ("Bem-vinda", "Suplemento não é medicamento", "Coenzima Q10" … "Whey Protein")
fazem parte do grande grupo **"Consumo e Rotina"**. A lista completa de vídeos por módulo está em
`docs/sdd/SUPERPROMPT-CALL-05JUN.md` (Apêndice A). Confirmar com o Leo os nomes finais dos
grandes grupos e quais trilhas entram em cada um.

## FIM DO PROMPT
