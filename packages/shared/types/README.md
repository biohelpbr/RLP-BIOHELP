# packages/shared/types

> Skeleton para tipos compartilhados (Zod). Atualmente VAZIO por decisão DL-003.
>
> Padrão atual: Zod inline em `lib/*`. Migração para esta pasta é gradual, feature a feature, sem big-bang.
>
> Quando criar um schema aqui:
> 1. Mova o Zod de `lib/<modulo>/schema.ts` para `packages/shared/types/<modulo>.ts`.
> 2. Atualize imports.
> 3. Atualize `docs/contracts/CONTRACTS.md` §1.
> 4. Adicione 1 linha em `docs/wiki/log.md`.
