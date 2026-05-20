# docs/legacy/v1/ — Snapshot pré-pivot v2 (28/04/2026)

> Arquivos aqui são **somente leitura**. Banners `DEPRECATED V2` já estão no topo de cada arquivo.
> Fonte de verdade vigente: `docs/sdd/PIVOT-V2.md` + `docs/sdd/PLAYBOOK.md`.

## Conteúdo

| Arquivo | Descrição | Data congelado |
|---|---|---|
| `WORKFLOW.md` | Workflow v1 (FRs por sprint, MLM CV-based) | 28/04/2026 |
| `SPEC_Biohelp_LRP.md` | SPEC técnica v1 | 28/04/2026 |
| `Biohelp_LRP_Escopo_Projeto_v1.md` | Escopo formal v1 (FR-01..FR-38) | 28/04/2026 |
| `Biohelp_LRP_Matriz_Esforco_Impacto_Completa_FULL.md` | Matriz esforço × impacto v1 | 28/04/2026 |
| `Biohelp_LRP_Cronograma_Completo_Detalhado_FULL.md` | Cronograma v1 | 28/04/2026 |

## Por que ainda existem

- Código v1 (`lib/cv/`, `lib/levels/`, `lib/commissions/`, `lib/network/compression*`) ainda vive em prod atrás do flag `LRP_V2=false`. Cleanup físico só na onda 6 / F-V12 (`docs/sdd/PIVOT-V2.md` §5).
- Auditoria / compliance fiscal pode precisar consultar regras v1 originais.

## Por que NÃO removemos

Manual Harness v3.2 §17 (Cenário C): "Adoção gradual, sem tocar no que funciona. Nenhum refactor preventivo." Remover docs v1 quebraria links em código deprecated e em `STATUS_IMPLEMENTACAO.md` (histórico).

## Arquivos v1 que continuam fora desta pasta (intencional)

- `documentos_projeto_iniciais_MD/Biohelp___Loyalty_Reward_Program.md` — regras de negócio canônicas v1, ainda referenciadas em `docs/sdd/PIVOT-V2.md` para entender o que está sendo descontinuado. Mantém posição com banner DEPRECATED já presente.
- Assets PNG / DOCX em `documentos_projeto_iniciais_MD/` — insumo bruto cliente.
