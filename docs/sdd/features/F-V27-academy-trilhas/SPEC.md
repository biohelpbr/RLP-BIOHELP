# F-V27 — Academy: trilhas com trava (fricção positiva) + aulas "em breve"

> Status: **Done 10/06/2026** (decisão §A.3 validada pelo cliente 10/06 = Opção A,
> per-member). Branch `feat/F-V27-academy-trilhas`, ship dark atrás de `LRP_V2`.
> Migration `20260610_f-v27-academy-trilhas.sql` aplicada no remoto. Origem: pedido
> do Leonardo (BioHelp) 08/06, desenho do Eduardo no Lovable. Substitui o TODO P2
> "Academy: refinar trilhas + aulas/avisos programados".

## Contexto / estado atual
Hoje a Academy é **global**: `content_trails.status` ∈ `draft|published|archived`;
toda trilha `published` é vista por todos. Não há trava, ativação por membro, nem
"em breve". Os estados "Bloqueada / Ativada" e o modal "Você escolheu um novo
caminho" são **desenho** (Lovable), ainda não existem no código.

Base que já temos (reusar):
- `content_trails` (title, **description**=subtexto, group_label, status, display_order) — `supabase/migrations/20260506_f-v09-academy-content.sql:8-16`
- `content_modules` (title, kind, content_url/text, duration_minutes, order) — `:18-28`
- `content_views` (progresso por membro: started_at/completed_at) — `:30-37` → já dá o "35% de evolução"
- CMS admin: `TrailForm.tsx:12-28`, `ModuleManager.tsx`, `ModuleRow.tsx`
- Actions: `createTrail/updateTrail/deleteTrail/addModule/updateModule/...` — `lib/content/actions.ts`
- Zod: `trailInputSchema` (`lib/content/schema.ts:6-19`), `moduleInputSchema` (`:21-41`)

---

## A. Trilhas macro com nome, subtexto e estado (aberta vs travada)

### A.1 Schema
Nova coluna em `content_trails`:
```sql
alter table content_trails
  add column access_mode text not null default 'open'
    check (access_mode in ('open','locked'));
```
- `open` → comportamento de hoje (membro entra direto).
- `locked` → "fricção positiva" (precisa ativar — §B).

Nome (`title`) e subtexto (`description`) **já existem** — nada novo aí. O admin já
edita ambos no `TrailForm`. Só adicionar o seletor de `access_mode`.

### A.2 CMS
`TrailForm.tsx` + `trailInputSchema` ganham `access_mode` (radio Aberta/Travada).
`updateTrail`/`createTrail` (`lib/content/actions.ts:26,59`) passam o campo.

### A.3 ✅ DECIDIDO (cliente, 10/06) — ativação POR MEMBRO (Opção A)
Resposta do Leonardo: **só a BioHelp (admin) cria as travas**, parceiras não. A trava
é "fricção positiva" individual — pausa cada parceira e pergunta *"a partir desse
momento vamos te ensinar tudo, você quer mesmo?"*; ela responde *"quero"* e ativa
**pra ela mesma**. → confirma **Opção A (per-member)**: §B.1 (tabela
`member_trail_activations`) vale.

- ~~**Opção B: global.**~~ Descartada.

Decorrências:
- Autoria das travas = **admin-only** (já é o caso no CMS; nenhuma UI de criação pro membro).
- Fallback de cópia do modal (`lock_modal_*`, §B.2) usa o texto do cliente:
  título ~ "Você escolheu um novo caminho"; corpo ~ "A partir desse momento vamos te
  ensinar tudo. Você quer mesmo?"; CTA de ativar ~ "Quero".

---

## B. Trilha travada — fricção positiva (texto editável + ativação por membro)

### B.1 Schema (assumindo Opção A)
```sql
create table member_trail_activations (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references content_trails(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  activated_at timestamptz not null default now(),
  unique (trail_id, member_id)
);
-- RLS: membro lê/insere só as próprias linhas; admin lê todas.
```

### B.2 Textos editáveis (autonomia do Leonardo)
Novas colunas em `content_trails` (usadas só quando `access_mode='locked'`):
```sql
alter table content_trails
  add column lock_cta_label  text,   -- botão do card travado ("Quero indicar e desenvolver")
  add column lock_modal_title text,  -- título do modal ("Você escolheu um novo caminho...")
  add column lock_modal_body  text;  -- corpo do modal ("Você vai aprender a...")
```
Editáveis no `TrailForm` (campos aparecem quando Travada). Fallbacks padrão se vazios.

### B.3 Fluxo (membro)
1. Trilha `locked` e **sem** ativação do membro → card "Bloqueada" com `lock_cta_label`.
2. Clica no CTA → modal (`lock_modal_title`/`body`) com "Voltar" e "Ativar trilha".
3. "Ativar trilha" → action `activateTrail(trailId)` insere em `member_trail_activations`
   (idempotente pelo UNIQUE). Estado vira "Ativada".
4. A partir daí: **fluxo de hoje** (vê módulos, progresso via `content_views`).

### B.4 Action nova
`activateTrail(trailId)` em `lib/content/actions.ts` (auth membro; insere ativação;
revalida `/dashboard/academy`). Guard: só ativa trilha `locked`.

### B.5 Gating de leitura
`/dashboard/academy` e `/dashboard/academy/[trailId]`: trilha `locked` só mostra os
módulos se houver linha em `member_trail_activations` pro membro; senão, card travado.
(Admin sempre vê tudo.)

---

## C. Aulas "em breve" (futuras) — data opcional ("os dois")

### C.1 Schema
Novas colunas em `content_modules`:
```sql
alter table content_modules
  add column available_at    timestamptz,                 -- data de liberação (opcional)
  add column is_coming_soon  boolean not null default false; -- trava manual
```

### C.2 Regra de exibição
Um módulo está **"em breve"** (aparece como teaser, não abre) quando:
```
is_coming_soon = true  OU  (available_at IS NOT NULL AND available_at > now())
```
Senão, está **liberado** (abre normal). Ou seja:
- Com **data** → libera sozinho quando a data chega (auto).
- **Manual** (is_coming_soon, sem data) → fica travado até o admin desmarcar.
- Os dois juntos: o que vier primeiro/valer a regra acima.

### C.3 UI membro
Módulo "em breve": mostra `title` + badge **"Em breve"** (+ "· DD/MM" se `available_at`),
não clicável, sem `content_url`. (Card de teaser, igual ao desenho.)

### C.4 CMS
`ModuleManager`/`ModuleRow` + `moduleInputSchema`/`moduleUpdateSchema` ganham:
checkbox "Em breve" + campo de data opcional. Actions `addModule`/`updateModule`
(`lib/content/actions.ts:101,157`) passam os campos.

---

## Migrations (1 arquivo)
`supabase/migrations/<data>_f-v27-academy-trilhas.sql`:
1. `content_trails`: + `access_mode`, `lock_cta_label`, `lock_modal_title`, `lock_modal_body`.
2. `content_modules`: + `available_at`, `is_coming_soon`.
3. `member_trail_activations` (+ RLS) — **só se Opção A**.

## Fora de escopo
- Notificação/e-mail quando uma aula "em breve" libera (pode virar follow-up).
- Animação do lock (polish visual) — segue o desenho do Eduardo no build.
- Reordenar a hierarquia macro além do `group_label` que já existe.

## Verificação (E2E)
1. Admin cria trilha Travada com textos custom → membro vê card "Bloqueada" + CTA.
2. Membro ativa → modal → "Ativada" → vê os módulos (progresso conta).
3. Outro membro ainda vê "Bloqueada" (prova por-membro).
4. Aula com `available_at` futura → "Em breve · DD/MM"; passa a data → abre sozinha.
5. Aula `is_coming_soon` sem data → travada até admin desmarcar.
