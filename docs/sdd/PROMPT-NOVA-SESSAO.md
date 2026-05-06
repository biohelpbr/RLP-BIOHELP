# Prompt para nova sessão do Claude Code (Biohelp LRP)

> Copie e cole o bloco entre `▼ COPIE A PARTIR DAQUI ▼` e `▲ COPIE ATÉ AQUI ▲` no início de uma nova sessão do Claude CLI. É self-contained — qualquer sessão consegue continuar o trabalho lendo só esse prompt + os arquivos que ele linka.
>
> Mantenha esse arquivo atualizado quando o estado do projeto evoluir significativamente (features concluídas, TBDs resolvidos, novas frentes abertas).

---

## ▼ COPIE A PARTIR DAQUI ▼

Você está continuando o trabalho no projeto **Biohelp LRP** (Loyalty Reward Program), um app Next.js 14 + Supabase + Shopify rodando em produção. Em 28/04/2026 o cliente declarou um pivô de produto que descontinua o modelo MLM/CV original (Sprints 1-7) e introduz um modelo de afiliação 1-nível com Founder@5.

### Passo zero — leia, em ordem, antes de qualquer ação:

1. `docs/sdd/PIVOT-V2.md` — fonte única de verdade do pivô. Delta v1→v2, backlog F-V01..F-V18 classificado A/B/C/D, Anti-SPEC v2 (§1-13), 26 TBDs (14 respondidos), plano em 7 ondas.
2. `docs/sdd/CRONOGRAMA-V2.md` — 5 sprints semanais + 2 dias buffer (06/05–11/06/2026) pra absorção do front Loveable + features novas.
3. `docs/sdd/LOVEABLE-IMPORT.md` — inventário do front Loveable, design tokens, mapeamento Loveable→Next, Anti-SPEC do import (tipos v1 hybrid).
4. `docs/sdd/PLAYBOOK.md` — workflow operacional (loop por feature, classes, estados CONTINUE/PAUSE/BLOQUEADO, template de SPEC, CI mínimo).
5. `docs/STATUS_IMPLEMENTACAO.md` — só a seção "PIVÔ V2" no topo. Estado atual e backlog. Tudo abaixo dessa seção é histórico do v1 (NÃO use como verdade).
6. `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` — texto enviado ao cliente via WhatsApp pedindo decisão dos TBDs (versão original).

### Regras críticas (não-negociáveis)

- **Anti-SPEC v2 é sagrada** (`PIVOT-V2.md` §3). Sem autorização explícita do humano, nunca tocar:
  - `members.sponsor_id`, `shopify_customers`, `orders`, `order_items`
  - Webhooks Shopify ativos (`/api/webhooks/shopify/*`)
  - RLS policies existentes
  - Migrations já aplicadas (sempre criar nova migration, nunca reverter)
  - ref_codes de membros existentes (formato `BH00001` mantém)
  - Código RPA/CPF (deprecated, mas remoção física só na onda 6 — F-V12)
  - **§12: tipos e mocks v1 do Loveable** (`_loveable_import/src/types/`, `lib/fake-api.ts`) — NUNCA importar pro código de produção.
  - **§13: pasta `_loveable_import/`** — gitignored, referência visual apenas. Nenhum import direto desse path em código de produção.
- **NÃO implementar nada de v1**: CV, níveis (Parceira/Líder/Diretora/Head), Fast-Track, Bônus 1/2/3, Leadership Bônus, Royalty, RPA/CPF, reset mensal, compressão de 6 meses inativo. Esse código vive em `lib/cv/`, `lib/levels/`, `lib/commissions/` mas está congelado.
- **Cadastro v2 exige ref obrigatório** (link OU código manual). House Account descontinuada (TBD-10).
- **Toda feature v2 atrás de feature flag `LRP_V2`** (default `false`). Helper em `lib/utils/featureFlags.ts` (`isV2Enabled()`).
- **Sem evidência objetiva no QA → nunca aprovado.** Matriz de Validação obrigatória pra B/C/D (CA → teste → tipo → status → evidência). Teste fake (`expect(true).toBe(true)`) não conta.
- **Em conflito de docs:** `PIVOT-V2.md` > `LOVEABLE-IMPORT.md` > `CRONOGRAMA-V2.md` > `PLAYBOOK.md` > SPECs específicas > `SPEC_Biohelp_LRP.md` (legado v1) > `WORKFLOW.md` (legado v1) > `documentos_projeto_iniciais_MD/*`.

### Estado atual (snapshot 05/05/2026 — confira no STATUS_IMPLEMENTACAO.md se vier outra sessão depois)

**Concluído (sessões 28-29/04/2026 + 05/05/2026):**
- Onda 0 (documentação): `PIVOT-V2.md`, `PLAYBOOK.md`, `STATUS_IMPLEMENTACAO.md`, `QUESTIONARIO-CLIENTE-V2.md`, `PROMPT-NOVA-SESSAO.md`.
- Frente 1 (preparação de infra): `lib/utils/featureFlags.ts` criado. Vars `LRP_V2` e `CRON_DISABLED_V2` em `.env.example` e `.env.local` (default `false`).
- Frente 3 (shells dos módulos novos): `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/`.
- **F-V11** ✅ implementada e mergeada em `main` (29/04/2026). Branch `feat/F-V11-visao-restrita-rede` ainda existe localmente.
- Adequação documental V2 (29/04): banner DEPRECATED em 5 docs v1, `@deprecated` em 6 arquivos de código v1, CHANGELOG v5.0.
- **Reunião 29/04 PM com cliente** — Léo apresentou layout completo (partner + admin) feito em Loveable. 5 features novas catalogadas (F-V14..F-V18). Cronograma esticado pra início/meados de junho.
- **Documentação base da migração (05/05/2026):**
  - `docs/sdd/LOVEABLE-IMPORT.md` — inventário 33 páginas + design tokens + mapeamento + Anti-SPEC do import.
  - `docs/sdd/CRONOGRAMA-V2.md` — 5 sprints (06/05–09/06) + 2 dias buffer (10–11/06). Entrega final 11/06/2026.
  - 5 SPECs skeleton: `F-V14-vendas-manuais-membro/`, `F-V15-eventos-admin/`, `F-V16-painel-admin-completo/`, `F-V17-sso-shopify/`, `F-V18-tags-automaticas/`.
  - PIVOT-V2.md atualizado (Anti-SPEC §12-13, TBDs novos, Onda 7).
- **`_loveable_import/`** — ZIP do Loveable extraído na raiz (gitignored). URL: `https://lovable.dev/projects/c6cd387c-c9cf-4b03-a139-4b90f6e4e3f7`.

**Próxima ação imediata (05/05/2026):**
- **S1 do CRONOGRAMA-V2** (06–12/05/2026): fundação do front — Tailwind + shadcn + design tokens + shells. Branch `feat/S1-fundacao-loveable`.
- **F-V01** pode rodar paralelo a S1 se quiser começar backend antes do front.

**TBDs respondidos em 29/04 PM** (3 a mais → total 14/26): TBD-11 (ranking nº pessoas), TBD-19 (Cashin confirmado), TBD-14 refinado (`customer.credit` da Shopify).
**TBDs derivados na 29/04 PM:** TBD-23 (validade crédito Shopify), TBD-24 (eventos com entry-fee?), TBD-25 (preço sugerido manual?), TBD-26 (critério final ranking).
**Ainda bloqueado por TBDs:** F-V04 (TBD-1, 2), F-V07 (parte fiscal — TBD-1, 2), F-V10 (TBD-16), F-V13 (TBD-22 — pode ser absorvida por F-V15).

### O que fazer nesta sessão

Antes de qualquer código, confirmar com o usuário qual frente atacar:
1. **S1 do CRONOGRAMA-V2** (06–12/05) — fundação do front (Tailwind + shadcn + tokens + shells). Recomendação primária pós-05/05. Branch `feat/S1-fundacao-loveable`.
2. **F-V01** (cadastro com ref obrigatório) em paralelo a S1 — backend independente.
3. **F-V14, F-V15, F-V16, F-V17, F-V18** — SPECs skeleton já existem; refinar CAs antes de codar.
4. **Outra coisa?** Qualquer feature nova → criar SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` seguindo o template em `PLAYBOOK.md` antes de codar.

Para cada feature destravada que iniciar:
- Branch `feat/F-VNN-<slug>` a partir de `main` (ou `feat/Sn-<foco>` durante a sprint corrente).
- SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` com classe, DoR, RFs, CAs, arquivos permitidos, plano e matriz vazia.
- Toda lógica v2 atrás do flag `LRP_V2` (default OFF). Helper em `lib/utils/featureFlags.ts`.
- **Imports proibidos:** nada de `_loveable_import/*` no código de produção (Anti-SPEC §13). Use só como referência visual.
- QA em Validation Mode (PLAYBOOK §11-A) com matriz preenchida.
- Atualizar `STATUS_IMPLEMENTACAO.md` + `PIVOT-V2.md §2` + `CRONOGRAMA-V2.md` (sprint atual) quando concluir.

### Comportamento esperado

- Use `Read`/`Glob`/`Grep` antes de modificar — sempre confirme estado atual do código.
- Use `Edit` em arquivos existentes (não `Write`) salvo criação genuína de arquivo novo.
- Reporte progresso a cada CA validado, não de uma só vez no fim.
- **Se aparecer arquivo fora dos `Arquivos PERMITIDOS` da SPEC:** PARE imediatamente e relate `BLOQUEADO — ARQUIVO FORA DO FEATURE CONTRACT`. Apresente os 7 itens de justificativa do PLAYBOOK pra decidir se atualiza SPEC ou pausa.
- **Se aparecer TBD novo (decisão do cliente que ninguém perguntou):** PARE, registre em `PIVOT-V2.md` §4 e relate.
- **Se a feature crescer de classe** (ex.: B virou D porque acabou tocando migration ou flag de produção): PARE, atualize SPEC, peça aprovação. Suba a classe, nunca desça.
- **Se for rodar comando do shell em produção / Vercel / Supabase remoto:** PARE e confirme com o usuário antes.

### Convenções de commit/branch

- Branch: `feat/F-VNN-<slug>` ou `fix/F-VNN-<slug>`.
- Commit: `feat(F-VNN): <descrição>` ou `fix:`, `chore:`, `docs:`.
- PR: linkar SPEC, listar CAs cobertos, anexar evidências da matriz.

### Stack do projeto (referência rápida)

- **Front + back:** Next.js 14 (`app/` directory). Server Components + Server Actions + Route Handlers em `app/api/*`.
- **DB:** Supabase (Postgres + Auth + RLS). Service client em `lib/supabase/server.ts`.
- **Pagamento Shopify:** Admin API + Webhooks. Cliente HTTP em `lib/shopify/`.
- **Tipos:** TypeScript estrito. Zod inline em `lib/*` (não usa `packages/shared/types/`).
- **Testes:** scripts em `test-*.mjs` na raiz. Sem framework de teste formal ainda — feature B/C/D usa testes manuais com evidência (curl, screenshot, log do Supabase).
- **CI:** ainda informal. `npm run lint` + `npm run build`. Pra D, faz staging em Vercel preview deploy.
- **Cron:** Vercel Cron via `vercel.json` (close-monthly-cv, network-compression — ambos pausáveis via `CRON_DISABLED_V2=true`).

### Para fechar a sessão

Quando terminar a feature ativa:
- ✅ Atualizar `STATUS_IMPLEMENTACAO.md` (linha de status da feature).
- ✅ Atualizar `PIVOT-V2.md` §2 (status da feature na tabela).
- ✅ Marcar SPEC como `Status: Done` + data.
- ✅ Atualizar este `PROMPT-NOVA-SESSAO.md` (seção "Estado atual") pra próxima sessão pegar o contexto.
- ✅ Em PR aberto: anexar matriz de validação preenchida.

Comece lendo os 4 arquivos da seção "Passo zero". Quando terminar, faça um resumo de 5 linhas do estado e proponha a próxima ação concreta.

## ▲ COPIE ATÉ AQUI ▲

---

*Última atualização: 2026-05-05 — Reunião 29/04 PM com cliente: 5 features novas (F-V14..F-V18), 3 TBDs resolvidos (11/14/19), 4 derivados (23/24/25/26). Loveable absorvido como referência. Documentação base da migração concluída: LOVEABLE-IMPORT.md, CRONOGRAMA-V2.md (compactado), 5 SPECs skeleton. Anti-SPEC §12-13 (Loveable). Onda 7 (front) com S1–S5+buffer = entrega 11/06/2026.*
