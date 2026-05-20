# tests/contract/

> Diretório skeleton. Decisão DL-004: sem test framework formal instalado hoje. Padrão atual: scripts `test-*.mjs` na raiz.
>
> Quando instalar Vitest/Jest, mover testes pra cá conforme tipo:
> - `unit/` — lógica pura
> - `integration/` — Supabase + chamadas externas mockadas
> - `contract/` — validação de Zod contra fixture
> - `e2e/` — Playwright fluxos completos
