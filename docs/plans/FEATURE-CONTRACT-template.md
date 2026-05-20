# Feature Contract — F-NNN <nome>

> Template canônico do Harness v3.2. Use **inline no TODO.md** se < 40 linhas; copie para `docs/plans/feature-contracts/F-NNN.md` se passar de 40 linhas (típico C/D).
> Para features v2 com SPEC dedicada em `docs/sdd/features/F-VNN-<slug>/SPEC.md`, a SPEC **é** o Feature Contract — não duplicar. Apenas referenciar.

## Metadata
- ID: F-NNN
- Classe: A | B | C | D
- Branch: `feat/F-NNN-<slug>`
- CI alvo: N1 | N2 | N3
- RFs cobertos: ...
- SPEC: `docs/sdd/features/F-NNN-<slug>/SPEC.md` (se aplicável)

## Objetivo
1-3 frases. Qual o problema, qual o resultado esperado, qual onda do PIVOT-V2.

## Definition of Ready
- [ ] RFs vinculados
- [ ] CAs claros e testáveis
- [ ] Classe confirmada
- [ ] Arquivos permitidos listados
- [ ] Arquivos PROIBIDOS listados (Anti-SPEC)
- [ ] Testes esperados (unit / integration / contract / e2e / smoke)
- [ ] Zod necessário (ou decisão "não")
- [ ] Dependências externas
- [ ] Impacto em banco
- [ ] Impacto em produção (staging, rollback, feature flag)
- [ ] TBDs bloqueantes resolvidos

## Critérios de Aceite
- CA-01: ...
- CA-02: ...

## Escopo incluído
...

## Escopo excluído (Anti-SPEC aplicável)
- Item X da PIVOT-V2.md §3 ...
- ...

## Arquivos que PODEM ser alterados
- `lib/...`
- `app/...`
- `supabase/migrations/<data>_<slug>.sql`

## Arquivos que NÃO podem ser alterados
- (qualquer alteração exige pausa)

## Contratos Zod (a usar/criar)
- ...

## Testes obrigatórios (matriz)
| Teste | Tipo | CA | Arquivo |
|---|---|---|---|
| ... | unit | CA-01 | ... |

## Comandos obrigatórios (CI no nível alvo)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- (testes adicionais)

## Infra/Produção (só C/D)
- **Migration:** `<arquivo>` (idempotente, rollback comentado)
- **Env:** `<vars>`
- **Staging:** Vercel preview branch
- **Feature flag:** `LRP_V2_<nome>=false` default
- **Rollback plan:** ...

## Anti-SPEC relevante
- Item N da `PIVOT-V2.md` §3 ...

## Matriz de Validação (preencher no QA)
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | ... | ... | TODO | ... |

## Gate de autonomia
- CONTINUE | PAUSE | BLOQUEADO (preencher conforme execução)
