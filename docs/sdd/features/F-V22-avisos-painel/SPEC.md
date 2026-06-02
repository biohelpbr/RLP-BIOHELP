# F-V22 — Avisos no painel (announcement bar via CMS)

**Classe:** C · **Status:** ✅ Done (deployado em main 02/06) · **Data:** 2026-06-02

> **Estado/handoff detalhado:** `docs/wiki/context/F-V22.md` (inclui decisões em aberto sobre proporção do banner e follow-up de e-mail).

## Origem
Pedido do Léo + Matt (WhatsApp 02/06): colocar um aviso no painel divulgando a live
(amanhã 03/06 19h) e mandar e-mail. Matt pediu explicitamente **announcement bar no topo
da página, não popup** ("q a pessoa fecha no instinto"). Decisão de produto (via pergunta ao
dono 02/06): CMS admin-configurável + campo de imagem + link, reutilizável a cada evento.

## Escopo
Barra de aviso fixa no topo do dashboard do membro (`/dashboard` → `V2Dashboard`),
gerenciada por um CRUD no painel admin (`/admin/announcements`). Conteúdo: mensagem +
imagem opcional + link/CTA opcional + cor + janela de exibição (datas) + on/off.

**Fora de escopo (este F):** envio de e-mail pras membros (o "mandar e-mail" do pedido é
tarefa separada); segmentação por público; múltiplos avisos simultâneos (só o ativo mais
recente aparece).

## Decisões de produto
- **Não-fechável** pelo membro (Matt). Sem dismiss/localStorage.
- **Audiência:** todos os membros logados que abrem o `/dashboard` (não só `subscription=paid`).
  Mostrar a live também pra pendentes incentiva ativação. Trivial restringir depois se quiserem.
- **Só 1 no ar:** `getActiveAnnouncement()` retorna o ativo mais recente dentro da janela.
- **Imagem:** thumbnail (mantém formato "barra", não vira banner/popup).

## Contrato de arquivos (lista permitida)
- `supabase/migrations/20260602_f-v22-announcements.sql` (novo) — tabela + bucket público `announcements`.
- `lib/announcements/schema.ts` · `queries.ts` · `actions.ts` (novos).
- `components/biohelp/AnnouncementBar.tsx` (novo) + export em `components/biohelp/index.ts`.
- `app/api/admin/announcements/upload/route.ts` (novo) — upload de imagem admin-only.
- `app/admin/announcements/{page,new/page,[id]/page}.tsx` + `AnnouncementForm.tsx` + `AnnouncementToggle.tsx` (novos).
- `app/dashboard/V2Dashboard.tsx` (edição) — render da barra no topo.
- `components/layouts/AdminSidebar.tsx` (edição) — item "Avisos".

## Modelo de dados (`announcements`)
`id, message, image_url?, link_url?, cta_label?, variant(coral|primary|accent), active, starts_at?, ends_at?, created_at, updated_at`
RLS: admin gerencia tudo; leitura pública restrita a `active AND dentro da janela`.

## Critérios de aceite
- **CA-1** Admin cria aviso em `/admin/announcements/new` (mensagem obrigatória) → aparece como barra no `/dashboard` do membro.
- **CA-2** Admin sobe imagem (JPG/PNG/WEBP/GIF ≤5MB) → thumbnail aparece na barra.
- **CA-3** Aviso com link + CTA → botão "Participar/Saber mais" abre o link em nova aba.
- **CA-4** Toggle ativo/inativo na lista liga/desliga a barra na hora (revalidate `/dashboard`).
- **CA-5** `ends_at` no passado → barra some sozinha (sem precisar desativar manual).
- **CA-6** Sem aviso ativo → dashboard renderiza normal, sem barra.
- **CA-7** Não-admin não acessa `/admin/announcements` nem a rota de upload (403/redirect).

## Validação
- typecheck (`tsc --noEmit`) ✅ · lint ✅.
- Pendente: aplicar migration no Supabase remoto + deploy + teste E2E manual (criar aviso da live, ver no painel).
