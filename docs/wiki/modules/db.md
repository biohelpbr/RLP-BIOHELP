# Module: db

> Supabase Postgres + RLS + migrations idempotentes.

## Responsabilidade
- Schema vivo em prod (projeto `rlp-biohelp`, ref `ikvwzfbkbwpiewhkumrj`).
- Migrations versionadas `YYYYMMDD_<slug>.sql` em `supabase/migrations/`.
- RLS policies em todas as tabelas com PII de membro.

## Arquivos principais
- `supabase/migrations/*.sql` — 15 arquivos (5 mais recentes em 06/05/2026, S5).
- `lib/supabase/server.ts` / `client.ts` — clients.

## Padrões
- **Idempotência:** `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, etc.
- **Rollback comentado** no topo de cada migration.
- **Aplicar via Supabase MCP** (`mcp__supabase__apply_migration`) em prod.

## Anti-SPEC aplicável
- Item 1: `members.sponsor_id`.
- Item 2: `shopify_customers` + tags.
- Item 3: `orders` + `order_items`.
- Item 5: RLS existentes.
- Item 6: nunca reverter migration — sempre criar nova.

## Estado atual
- ✅ 15 migrations aplicadas. S5 fechado.
