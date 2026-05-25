# Wiki Log — Biohelp LRP

> Histórico cronológico vivo. Tipos: `[INGEST]`, `[RELEASE]`, `[BUGFIX]`, `[VALIDATION]`, `[DECISION]`, `[MVP]`, `[REORG]`.
> Manter ≤ 200 linhas. Arquivar lotes antigos em `wiki/log-archive-YYYY-QN.md` quando estourar.

## 2026-05-25

- [2026-05-25] [RELEASE] F-V19 implementada — fluxo pré-cadastro Guru → LRP → Shopify completo. 14/16 CAs verdes, 2 parciais (CA-13 static, CA-14 indireto). Branch `feat/F-V19-fluxo-guru-pre-cadastro` com 3 commits de código + 1 commit docs. Pendente: merge em main após review + Guru real live (credenciais recebidas, runbook pronto). Follow-ups: dashboard v2 ler `subscription_status` em vez de `status` legado; CA-13/14 fechar em QA pré-produção.

## 2026-05-22

- [2026-05-22] [SPEC] F-V19 criada — fluxo pré-cadastro Guru → LRP → Shopify; SPEC + plano em docs/sdd/; demo MVP 22/05 15h. Runbook `webhook-guru-debug.md` documenta payload real do Digital Manager Guru (sem HMAC — valida via `api_token` no body; `webhook_type` discriminator; `last_status` para subscription, `status` para transaction) — diverge da SPEC original em 7 pontos; schema Zod CORRIGIDO no runbook pra aplicar manualmente em `lib/subscriptions/providers/guru.ts` na próxima sessão.

## 2026-05-20

- [2026-05-20 09:55] [INGEST] Feedback cliente pós-demo 13/05 recebido via Google Docs (5 itens admin + 6 itens user). Triagem: 3 fast-fixes (U1, A3, A4) + 1 spec change implementado (A1 — drop auto:lider, manual:influenciador, FOUNDER ≥5 ativos) + 7 itens C/D documentados em `docs/sdd/PERGUNTAS-CALL-20MAI.md` e `docs/sdd/ROTEIRO-DEMO-CALL-20MAI.md` para call de hoje 10h-11h com Léo/Matt/Gabriel/Matheus. WhatsApp: Matt pediu validar ponto-a-ponto + integrar Guru para assinatura real (F-V02 end-to-end). Cashin credenciais sandbox pendentes.
- [2026-05-20] [RELEASE] Branch `feat/feedback-pos-demo-20mai` — 4 commits: U1 copiar link absoluto (V2Dashboard), A4 link nome cliente em /admin/payouts → /admin/community/[id], A3 texto fonte de dados /admin/consumption reescrito sem ambiguidade, **A1 spec change F-V18+F-V06**: tag `auto:lider` removida, `auto:influenciador` removida, Influenciador vira tag manual `manual:influenciador`, FOUNDER passa a contar por condição real (member_active_affiliate_count >= 5) em vez de tag persistida. Anti-SPEC v2 §1-13 preservada. Typecheck ✅.
- [2026-05-20] [DECISION] A1 cliente autorizou (chat 09:30) mudar regra: ≥5 vira Founder direto (não Líder); Influenciador é tag manual aplicada pelo admin. SPEC F-V18 v2 documentada inline no auto-classifier.ts. **Estado PAUSE técnico**: a mudança altera comportamento de F-V18 (que estava Done) — autorização humana explícita registrada.

## 2026-05-19

- [2026-05-19] [VALIDATION] CI N1 local executado pós-reorg: `npm run lint` ✅ (apenas warnings preexistentes de exhaustive-deps / no-img-element — nenhum erro novo), `npx tsc --noEmit` ✅ (0 erros), `npm run build` ✅ (Next 14 build completo, todas as rotas geradas). Nenhuma regressão introduzida pela reorg.
- [2026-05-19] [REORG] Adotado Harness v3.2 em modo bridge aditivo. Criados AGENTS.md / CLAUDE.md / TODO.md (raiz), docs/product/PRD.md, docs/specs/SPEC.md, docs/contracts/CONTRACTS.md, docs/plans/ (CURRENT_REALITY, DECISIONS_LOG, risk-classification, templates), docs/wiki/ (este arquivo + índice + overview + architecture + modules + runbooks), docs/decisions/adr/, docs/legacy/v1/ (com 5 docs v1 movidos), packages/shared/types/, tests/{unit,integration,contract,e2e}/, .github/workflows/ci.yml. **Zero código de produção tocado.** Branch: `chore/harness-v3.2-reorg`. Referência: `.claude/harness-v3.2-manual.html`. PR pendente de abertura humana.

## 2026-05-13

- [2026-05-13] [RELEASE] Demo cliente executada com sucesso. Roteiro em `docs/ROTEIRO_DEMONSTRACAO_RAPIDO.md` + ajuste pós-demo registrado em commit `5d9aed2` e `d8e3e91`.

## 2026-05-06

- [2026-05-06] [RELEASE] S5 entregue — F-V03 (subscription status), F-V17 (SSO App Proxy), F-V07b (Cashin live mock+sandbox), F-V07c (NFe validator). 2 migrations aplicadas via Supabase MCP (`f_v03_subscription_status`, `f_v17_auth_audit`). Branch `feat/S5-integracoes`. Detalhe: `docs/STATUS_IMPLEMENTACAO.md` §S5.
- [2026-05-06] [RELEASE] S3 entregue — F-V18 tags auto (Líder/Influenciador), 5 áreas admin v2. Migration `f_v18_tags_and_affiliate_count`. 2 bugs corrigidos no smoke (cache fetch no-store + jsonb `cs` filter).
- [2026-05-06] [RELEASE] S4 entregue — F-V15 eventos + F-V09 Academy + Finance/Payouts admin refator. 2 migrations (`f_v15_events`, `f_v09_academy_content`). F-V13 absorvida por F-V15.
- [2026-05-06] [RELEASE] S2 entregue — F-V14 vendas manuais + F-V05 saldo/créditos + F-V07 triple resgate UI. 3 migrations.

## 2026-05-05

- [2026-05-05] [RELEASE] S1 entregue — fundação Loveable (Tailwind 3 + shadcn 17 primitivos + tokens HSL + Plus Jakarta + componentes biohelp + sidebars). 3 telas membro v2 atrás de `LRP_V2`.

## 2026-04-29

- [2026-04-29] [RELEASE] F-V11 mergeada — visão restrita da rede (sponsor + N1).
- [2026-04-29] [DECISION] Reunião 29/04 PM — 5 features novas catalogadas (F-V14..F-V18). 3 TBDs resolvidos (11/14/19). 4 derivados (23/24/25/26). Cronograma esticado para 11/06/2026.

## 2026-04-28

- [2026-04-28] [DECISION] Pivot v2 declarado pelo cliente. MLM CV-based descontinuado. Modelo v2: afiliação 1-nível + Founder@5 + créditos Shopify + Cashin. Documento canônico criado: `docs/sdd/PIVOT-V2.md`.
