# Runbook — Aplicar migration Supabase

## Projeto
- **Nome:** `rlp-biohelp`
- **Ref:** `ikvwzfbkbwpiewhkumrj`
- **Console:** https://supabase.com/dashboard/project/ikvwzfbkbwpiewhkumrj

## Quando usar
- Toda feature C/D com mudança de schema.
- Coluna nova, tabela nova, índice, RLS policy nova.

## Pré-requisitos
- Arquivo `supabase/migrations/YYYYMMDD_<slug>.sql` criado.
- **Idempotente:** `CREATE … IF NOT EXISTS`, `ALTER … ADD COLUMN IF NOT EXISTS`, etc.
- **Rollback comentado** no topo do arquivo (bloco SQL completo, recuperável).
- Testado localmente em branch separada (não há Supabase local — usar Studio query direto se necessário).

## Aplicação em prod (via Supabase MCP)
```
mcp__supabase__apply_migration(
  project_id: "ikvwzfbkbwpiewhkumrj",
  name: "f_v<NN>_<slug>",   // sem extensão .sql
  query: "<conteúdo do arquivo>"
)
```

## Validação pós-aplicação
1. `mcp__supabase__list_tables` — confirmar tabela/coluna apareceu.
2. SELECT de smoke: `mcp__supabase__execute_sql({ project_id, query: "SELECT … LIMIT 5" })`.
3. Registrar em `docs/wiki/log.md` tipo `[RELEASE]` com nome da migration.
4. Atualizar `docs/contracts/CONTRACTS.md` §3 se for nova tabela/coluna pública.

## NÃO fazer
- ❌ Reverter migration existente (Anti-SPEC §6) — sempre criar nova migration reversa.
- ❌ `supabase db reset` — banco de prod.
- ❌ Aplicar sem o bloco "Rollback" comentado.
- ❌ Mexer em RLS policy existente sem feature classe D com Anti-SPEC explícita.

## Em caso de falha
- Migration parcialmente aplicada: criar migration reversa imediata + investigar.
- Erro de sintaxe: corrigir arquivo, repor via MCP (idempotência cobre re-execução).
