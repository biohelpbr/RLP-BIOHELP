# F-V29 — Academy UX refino (mockup Lovable do Leo) — Resultado E2E

**Data:** 2026-06-05 · **Branch:** `feat/academy-ux-refino` · **SPEC:** `docs/sdd/SUPERPROMPT-ACADEMY-UX-05JUN.md`

## Harness

Padrão `docs/sdd/SUPERPROMPT-CALL-05JUN.md` §2: conta descartável (`e2e-test+claude@bio-help.com`,
paid + admin, criada/destruída via `e2e-setup.mjs`), build de produção + `next start -p 3210`,
Playwright logado via "Entrar com senha". Migration `20260605_academy_group_duration.sql`
(idempotente + rollback comentado) aplicada via Supabase MCP antes do teste.

## Matriz de Validação

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-1 | Admin define "Grande grupo" = "Consumo e Rotina" nos Módulos 1/2/3 via `/admin/academy/[id]` (campo novo c/ datalist); home do membro renderiza seções "Consumo e Rotina" (3 trilhas) + "Geral" (Aula ao vivo, sem grupo) | e2e | ✅ PASS | `academy-home-grupos.png`, `academy-home-mobile.png` |
| CA-2 | `/dashboard/academy/[trailId]` mostra lista compacta: thumbnail YouTube (`img.youtube.com/vi/<id>/hqdefault.jpg`) + título + "3 min · Vídeo" + botão Assistir/Revisar; nenhum iframe embedado na lista | e2e | ✅ PASS | `academy-trilha-lista-compacta.png`, `academy-trilha-mobile.png` |
| CA-3 | Clique na aula abre Dialog reduzido (max-w-3xl) com autoplay; "Marcar como assistido" → badge "Assistido" + botão vira "Revisar" + progresso "1 de 2 aulas assistidas" | e2e | ✅ PASS | `academy-modal-player.png`, `academy-assistido-revisar.png` |
| CA-4 | Admin define `duration_minutes=3` na aula "Bem-vinda à Biohelp" via ModuleRow; membro vê "3 min"; aula sem duração mostra só "Vídeo" (duração real do vídeo: 3:01 — valor mantido em produção) | e2e | ✅ PASS | snapshot admin "YouTube · 3 min" + `academy-trilha-lista-compacta.png` |
| CA-5 | Nada quebrou: aula tipo pdf/link (gravação Drive) abre no modal com "Abrir conteúdo"; `markView` (started/completed) preservado (mesma server action); banner F-V26 inalterado (`getActiveAnnouncement` + `AnnouncementBar` mantidos na home — sem aviso ativo na janela do teste, validação por código); tipo `text` renderiza no modal com o mesmo `whitespace-pre-wrap` | e2e + código | ✅ PASS | snapshot trilha "Aula ao vivo" com modal "Abrir conteúdo" |

CI N1 local: `npx tsc --noEmit` ✅ · `npx next lint` (13 arquivos tocados) ✅ · `npx next build` ✅.

## Conteúdo de produção tocado durante o E2E (intencional, reversível via CMS)

- `group_label = "Consumo e Rotina"` nos Módulos 1/2/3 (conforme Apêndice do superprompt; "Aula ao vivo" ficou sem grupo → seção "Geral"). Nomes finais a confirmar com o Leo — editável no CMS.
- `duration_minutes = 3` em "Bem-vinda à Biohelp" (vídeo real tem 3:01). Demais durações: Leo preenche pelo CMS.

Conta de teste destruída (`E2E_DESTROYED`, incl. `content_views`); `e2e-setup.mjs` e logs removidos.
