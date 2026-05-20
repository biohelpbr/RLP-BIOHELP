# CLAUDE.md — ajustes específicos do Claude Code (Biohelp LRP)

> Documento curto. Regras universais para agentes ficam em `AGENTS.md`. Aqui só o que é específico do Claude Code rodando neste repo.

## Leitura inicial obrigatória (toda sessão)

Em ordem:
1. `docs/wiki/index.md` — mapa principal.
2. `docs/wiki/context/<F-NNN-atual>.md` se houver feature ativa.
3. `TODO.md` — estado vivo.
4. `AGENTS.md` — contrato comum (Anti-SPEC, classes, autonomia).
5. `docs/sdd/PIVOT-V2.md` §3 — Anti-SPEC v2 (sagrada).
6. `docs/sdd/PLAYBOOK.md` — workflow operacional.
7. `docs/wiki/log.md` últimas 30 linhas.
8. `git status`.

## Stack e atalhos

- **Next.js 14** (`app/` directory). Server Components + Server Actions + Route Handlers em `app/api/*`.
- **DB:** Supabase. Service client em `lib/supabase/server.ts`. Anon em `lib/supabase/client.ts`.
- **Shopify:** Admin API GraphQL + Webhooks. Cliente em `lib/shopify/`.
- **Tipos:** TypeScript estrito + Zod inline em `lib/*`. `packages/shared/types/` ainda vazio (migração lenta).
- **Testes:** scripts `test-*.mjs` na raiz. Sem framework formal. Para feature B/C/D, **evidência** via curl/screenshot/log do Supabase + 1 script test-*.mjs do CA principal.
- **CI:** `.github/workflows/ci.yml` N1 (lint + typecheck + build). N2/N3 manuais hoje.
- **Cron:** Vercel Cron via `vercel.json`. Pausáveis via `CRON_DISABLED_V2=true`.

## Feature flag

Todo código v2 atrás de `LRP_V2`. Helper em `lib/utils/featureFlags.ts` (`isV2Enabled()`).

Default em produção: `LRP_V2=false`. Toggle por env var.

## Migrations Supabase

Em `supabase/migrations/<YYYYMMDD>_<slug>.sql`. **Sempre idempotente** (CREATE IF NOT EXISTS, ALTER … IF NOT EXISTS, etc.). **Sempre com rollback comentado no topo**. Aplicar via Supabase MCP (`mcp__supabase__apply_migration`) — projeto `rlp-biohelp` ref `ikvwzfbkbwpiewhkumrj`.

## Webhooks Shopify

Em `app/api/webhooks/shopify/*`. Validação HMAC obrigatória (`lib/shopify/webhook.ts`). Hook v2 sempre dentro de `if (isV2Enabled())` + try/catch isolado — falha NUNCA derruba 200 (Anti-SPEC §4 PIVOT-V2).

## Comportamento esperado

- Use `Read`/`Glob`/`Grep` antes de modificar — sempre confirme estado atual.
- Use `Edit` para arquivos existentes; `Write` só para novos.
- Reporte progresso a cada CA validado.
- **Arquivo fora da lista permitida da SPEC → PARE.** Estado `BLOQUEADO — ARQUIVO FORA DO FEATURE CONTRACT`.
- **TBD novo (decisão do cliente que ninguém perguntou) → PARE.** Registre em `PIVOT-V2.md` §4 e relate.
- **Feature crescendo de classe → PARE.** Atualize SPEC, peça aprovação. Suba a classe, nunca desça.
- **Rodar comando do shell em produção / Vercel / Supabase remoto → CONFIRME antes.**
- **Anti-SPEC v2 violada → PARE.**

## Convenções

- Branch: `feat/F-VNN-<slug>` ou `fix/F-VNN-<slug>` ou `chore/<slug>`.
- Commit: `feat(F-VNN): <descrição>`, `fix:`, `chore:`, `docs:`.
- PR: linkar SPEC + listar CAs cobertos + anexar evidências da Matriz de Validação.

## Para fechar a sessão de uma feature

1. ✅ Atualizar `TODO.md` (mover feature de Em Andamento → Done).
2. ✅ Atualizar `docs/sdd/PIVOT-V2.md` §2 (status na tabela).
3. ✅ Atualizar `docs/STATUS_IMPLEMENTACAO.md` (snapshot do progresso).
4. ✅ Marcar SPEC do feature como `Status: Done` + data.
5. ✅ Linha em `docs/wiki/log.md` tipo `[RELEASE] F-VNN — ...`.
6. ✅ Se C/D: resumo ≤5 linhas em `docs/wiki/features/F-VNN.md`.
7. ✅ Se módulo afetado: atualizar `docs/wiki/modules/<mod>.md`.
8. ✅ Deletar `docs/wiki/context/F-VNN.md` se foi consumido.

## Para HANDOFF entre agentes (Claude → Codex / Cursor)

Antes de fechar: `/wiki context F-NNN` → cria/atualiza `docs/wiki/context/F-NNN.md` com:
- Estado atual (o que está feito, o que falta).
- Arquivos relevantes.
- Restrições da tarefa.
- Próximos passos concretos.
- Decisões abertas.
- Handoff explícito: "última ação", "o que NÃO fiz e o próximo deveria evitar".

Próximo agente lê: `docs/wiki/index.md` → `docs/wiki/context/F-NNN.md` → `AGENTS.md` → `TODO.md` → SPEC.
