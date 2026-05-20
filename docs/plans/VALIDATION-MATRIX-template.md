# Validation Matrix — F-NNN <nome>

> Template para o Prompt 3 (QA). Obrigatória para B/C/D.

| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | `<arquivo>::<nome do teste>` | unit / integration / contract / e2e / manual / smoke | passou / falhou / não coberto / N/A | `npm test -- ...` log / Playwright report / curl output / screenshot / Supabase MCP query / CI log com ✔ |

## O que conta como evidência
- Saída de `npm test` com teste nomeado e `✔ passed`.
- Playwright report.
- CI log com `✔ passed`.
- Migration aplicada em staging com `select` que comprova.
- Script de smoke com exit code 0.
- Screenshot com timestamp + URL.

## O que NÃO conta
- Afirmação do agente ("parece correto").
- Teste com `.skip` / `.only`.
- Cobertura genérica sem amarração ao CA.
- `expect(true).toBe(true)`.

## Resultado final do QA
- [ ] APROVADO — todos os CAs cobertos com evidência objetiva.
- [ ] MUDANÇAS_SOLICITADAS — CA(s) sem evidência: ...
- [ ] BLOQUEADO — motivo: ...
