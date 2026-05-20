# Runbook — Pausar/reativar crons (v1/v2)

## Crons configurados (`vercel.json`)
| Path | Schedule (UTC) | Versão | Gating |
|---|---|---|---|
| `/api/cron/close-monthly-cv` | `0 3 1 * *` | v1 | pausável via `CRON_DISABLED_V2=true` |
| `/api/cron/network-compression` | `0 4 1 * *` | v1 | pausável via `CRON_DISABLED_V2=true` |
| `/api/cron/generate-creatine-coupons` | `0 5 2 * *` | v1 (descontinuado) | — |
| `/api/cron/auto-tags` | `0 3 * * *` | v2 (F-V18) | só roda se `LRP_V2=true` |

## Pausar crons v1
1. Vercel → Settings → Environment Variables → `CRON_DISABLED_V2=true`.
2. Redeploy automático em ~30s.
3. Próxima execução: cron v1 vê env var e retorna 204 sem processar.

## Reativar crons v1
1. Remover `CRON_DISABLED_V2` ou setar `false`.
2. Aguardar próxima janela do cron.

## Pausar cron v2 (`auto-tags`)
- Setar `LRP_V2=false` → cron pula execução (mesmo gating do resto da v2).
- Ou setar `CRON_SECRET` inválido → 401 (não recomendado, mascara o bug).

## Validar execução de um cron localmente
- `npm run dev` + `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/auto-tags`.

## Pós go-live (11/06/2026)
- `LRP_V2=true` em prod.
- Setar `CRON_DISABLED_V2=true` para pausar v1.
- v2 `auto-tags` passa a rodar sozinho.
