# F-V31 — Academy v2: Grandes Grupos como entidade + home por camadas

> Status: **SPEC completa** — todos os TBDs resolvidos com o cliente (12/06), pronta
> pra planejar implementação. Origem: feedback do Leonardo (BioHelp) 11–12/06,
> desenho no Lovable + planilha "Roteiros e Vídeos". Evolui F-V09 (CMS), F-V27
> (trava/fricção positiva) e F-V29 (agrupamento). **Re-nivela a trava do F-V27**
> (de trilha → grande grupo) e troca o `group_label` (texto) por entidade.

## Contexto / estado atual

Hoje a hierarquia da Academy é: **Grande Grupo › Módulo › Aula**, mas:
- "Grande Grupo" não é entidade — é só `content_trails.group_label` (texto livre,
  com datalist). Sem autonomia pra criar/gerenciar (F-V29).
- A **trava** (F-V27: `access_mode`, `lock_*`, `member_trail_activations`,
  `activateTrail`) está no nível da **trilha/módulo** (`content_trails`).
- A **home** (`/dashboard/academy`) agrupa por `group_label` mas já mostra os
  **módulos** direto (não há tela de "camadas").
- Aulas (`content_modules`) já têm `is_coming_soon` / `available_at` (F-V27 C).

Base a reusar (não recriar):
- `content_trails` (vira "Módulo"), `content_modules` (vira "Aula"), `content_views`
  (progresso "assistido").
- CMS: `TrailForm`, `ModuleManager`, `ModuleRow`. Membro: `LessonList`.
- F-V27: `lock_*`, ativação por membro, `activateTrail` → **migram pro grupo**.

### Decisões do cliente (11–12/06) — fechadas
1. Hierarquia mantém **3 níveis**: Grande Grupo › Módulo › Aula.
2. "Indicar" e "Revender" **são Grandes Grupos** com módulos/aulas dentro.
3. A **própria parceira** desbloqueia (self-unlock — fricção positiva do F-V27).
4. Autonomia pra criar **quantos Grandes Grupos** quiser.
5. Config por Grande Grupo: **título, descrição, texto do botão, ordem**. SEM
   ícone, SEM tag; cor **padrão branca, só com borda**.
6. **Sem barra de "evolução %"** — basta o "assistido / não assistido" por aula (já existe).
7. Conteúdo "Geral" também **vira Grande Grupo**.
8. Manter **"Em breve"** — e poder **pré-anunciar aula que ainda não foi gravada**
   (aula "Em breve" pode existir **só com título**, sem vídeo).
9. Grande Grupo e Módulo **não têm capa/imagem** — só a aula tem (thumb do vídeo).

---

## A. Nova entidade: Grande Grupo (`academy_groups`)

### A.1 Schema
```sql
create table academy_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) >= 2),
  description text null,
  -- trava (fricção positiva) — migra do F-V27, agora no grupo:
  access_mode text not null default 'open' check (access_mode in ('open','locked')),
  lock_cta_label  text null,
  lock_modal_title text null,
  lock_modal_body  text null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
-- RLS: admin manage; membros leem todos (gating de leitura é em código).
```
Sem `cover_url`, sem ícone, sem tag, sem cor (decisões 5 e 9).

### A.2 `content_trails` (Módulo) passa a apontar pro grupo
```sql
alter table content_trails add column group_id uuid references academy_groups(id) on delete set null;
```
- **Backfill:** pra cada `group_label` distinto existente, criar 1 `academy_groups`
  (title = group_label) e setar `content_trails.group_id`. Trilhas sem grupo →
  um grupo "Geral" (decisão 7).
- `group_label` fica **deprecated** (mantido só p/ rollback; UI para de usar).
- `content_trails.cover_url` deixa de ser exibido (módulo sem capa).

### A.3 Status do grupo
O grupo só aparece pro membro se tiver pelo menos 1 trilha `published`? **Não** —
o grupo aparece sempre (admin controla via futuras trilhas). Trava controla acesso,
não visibilidade. (TBD menor — confirmar se grupo vazio deve sumir da home.)

---

## B. Trava no nível do Grande Grupo (re-nivela F-V27)

### B.1 Migração da trava
`access_mode` + `lock_*` saem de `content_trails` e passam a valer em
`academy_groups` (§A.1). Trilhas que estavam `locked` no F-V27 → o grupo
correspondente herda `locked` + textos (best-effort no backfill).

### B.2 Ativação por membro → por grupo
```sql
create table member_group_activations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references academy_groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  activated_at timestamptz not null default now(),
  unique (group_id, member_id)
);
```
Migrar linhas de `member_trail_activations` (se houver) pro grupo do trail.
`member_trail_activations` fica deprecated.

### B.3 Action `activateGroup(groupId)`
Substitui `activateTrail`. Auth membro; guard "só grupo `locked`"; insert
idempotente (UNIQUE); revalida a home. Self-unlock (decisão 3).

### B.4 Gating de leitura (em código — service_role ignora RLS)
- Home: grupo `locked` e **sem** ativação do membro → card "Bloqueada" + CTA;
  clicar abre o modal ("Quero…") → `activateGroup`.
- Grupo aberto/ativado → entra nos módulos.

---

## C. Home em 2 cliques (camadas)

### C.1 `/dashboard/academy` — lista de Grandes Grupos
Cards **brancos com borda** (sem imagem): título, descrição, texto do botão.
Estado: **Aberta** / **Bloqueada** / **Ativada**. **Sem barra de evolução %**.

### C.2 `/dashboard/academy/grupo/[groupId]` — módulos do grupo
Lista as trilhas (Módulos) daquele grupo (sem capa). Gating: se o grupo está
travado e não ativado, nem chega aqui (volta pra home/abre modal).

### C.3 Aula — sem mudança estrutural
Clicar no módulo → `LessonList` (já existe): aulas com thumb, "assistido/não",
e teaser "Em breve". Mantém o player em modal.

> Rotas: a `/dashboard/academy/[trailId]` de hoje vira
> `/dashboard/academy/grupo/[groupId]` (grupo→módulos) + a tela de aulas do módulo.
> Detalhe de roteamento a fechar no plano de implementação.

---

## D. CMS dos Grandes Grupos (autonomia — decisão 4)

### D.1 Gestão de grupos no admin
Em `/admin/academy`: criar / editar / excluir / **reordenar** Grandes Grupos.
Form (`GroupForm`): **título, descrição, texto do botão, ordem** + radio
Aberta/Travada (+ textos do modal quando travada). Sem ícone/tag/cor/capa.

### D.2 Trilha (Módulo) escolhe o grupo
`TrailForm`: troca o campo de texto `group_label` por um **select de Grande Grupo**
(`group_id`). Migração preserva o vínculo atual.

---

## E. "Em breve" sem conteúdo (evolução do F-V27 C — decisão 8)

### E.1 Aula "Em breve" pode existir só com título
Hoje `content_modules` exige `content_url` (kind ≠ text) ou `content_text` (text)
— via CHECK no banco + `refine` no Zod. Relaxar: quando `is_coming_soon = true`
(ou `available_at` futuro), **dispensar a exigência de conteúdo**.
```sql
-- ajustar o CHECK de content_modules para permitir sem conteúdo quando is_coming_soon
```
`moduleInputSchema`/`moduleUpdateSchema`: refine condicional ao `is_coming_soon`.

### E.2 UI
Teaser "Em breve" já não abre conteúdo (F-V27). Garantir que aula sem `content_url`
nunca tente abrir player.

---

## F. Material complementar (PDFs) por Grande Grupo (pedido 12/06)

Cada Grande Grupo tem um espaço pra **anexar materiais em PDF** (material
complementar), separado dos módulos/aulas.

### F.1 Schema
```sql
create table academy_group_materials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references academy_groups(id) on delete cascade,
  title text not null,
  file_url text not null,          -- PDF no storage do Supabase
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
-- RLS: admin manage; membros leem (gating de leitura em código, junto com o grupo).
```

### F.2 Storage
Bucket Supabase **`academy-materials`** (reusa o padrão do upload de anúncios
F-V22 — `app/api/admin/announcements/upload`). Upload via CMS admin.

### F.3 CMS
Na edição do Grande Grupo: seção **"Materiais complementares"** — upload de PDF +
título + ordem + excluir.

### F.4 Membro
Na tela do grupo (lista de módulos), seção **"Materiais complementares"** com os
PDFs pra baixar/abrir. **Gated junto com o grupo** (§B.4) — só vê se aberto/ativado.

---

## Migrations (idempotentes + rollback comentado)
1. `academy_groups` (+ RLS).
2. `content_trails` + `group_id`; **backfill** group_label→grupo (+ grupo "Geral").
3. Copiar trava (`access_mode`/`lock_*`) das trilhas travadas → grupos.
4. `member_group_activations` (+ RLS) + migrar `member_trail_activations`.
5. `content_modules`: CHECK permite sem conteúdo quando `is_coming_soon`.
6. `academy_group_materials` (+ RLS) + bucket `academy-materials`.

## Fora de escopo
- Ícone / tag / cor por grupo (Leo dispensou).
- Barra de evolução % (dispensada).
- Capa de Grande Grupo / Módulo.
- Reordenar aulas além do que já existe (F-V27/W6).
- Importar a planilha "Roteiros e Vídeos" automaticamente (cadastro manual no CMS).

## Verificação (E2E)
1. Admin cria Grande Grupo "Revendedor" (Travada, textos custom) → membro vê card "Bloqueada".
2. Membro clica "Quero…" → modal → ativa → vê os **módulos** do grupo.
3. Outro membro ainda vê "Bloqueada" (prova por-membro).
4. Grupo aberto → módulos → aulas (3 cliques), "assistido/não" funciona; sem barra de %.
5. Aula "Em breve" criada **só com título** → teaser, não abre; com data, abre na virada.
6. Trilhas antigas migradas aparecem sob o grupo certo (group_label→grupo); "Geral" virou grupo.

## TBDs — todos resolvidos (12/06)
- **T1. ✅** Grande Grupo **vazio** (sem trilhas publicadas) → **some** da home.
- **T2. ✅** Módulo = **trilha com nome livre** (admin nomeia "Módulo 1" OU "FEEL"
  OU o que quiser), com as aulas dentro. **Sem** "Fase FLOW" como estrutura fixa —
  é só o `title` da trilha. As "Módulo 1/2/3" atuais migram como estão (renomeáveis no CMS).
- **T3. ✅** Ordem das aulas segue o **Nº** (o `display_order` que já existe).
- **T4. ✅** Material complementar (§F): **gated pelo grupo** (tem acesso ao grupo →
  baixa). Tipo de arquivo: **PDF** (padrão; outros formatos = follow-up se pedirem).
