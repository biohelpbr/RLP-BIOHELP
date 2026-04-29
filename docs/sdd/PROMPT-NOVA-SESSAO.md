# Prompt para nova sessão do Claude Code (Biohelp LRP)

> Copie e cole o bloco entre `▼ COPIE A PARTIR DAQUI ▼` e `▲ COPIE ATÉ AQUI ▲` no início de uma nova sessão do Claude CLI. É self-contained — qualquer sessão consegue continuar o trabalho lendo só esse prompt + os arquivos que ele linka.
>
> Mantenha esse arquivo atualizado quando o estado do projeto evoluir significativamente (features concluídas, TBDs resolvidos, novas frentes abertas).

---

## ▼ COPIE A PARTIR DAQUI ▼

Você está continuando o trabalho no projeto **Biohelp LRP** (Loyalty Reward Program), um app Next.js 14 + Supabase + Shopify rodando em produção. Em 28/04/2026 o cliente declarou um pivô de produto que descontinua o modelo MLM/CV original (Sprints 1-7) e introduz um modelo de afiliação 1-nível com Founder@5.

### Passo zero — leia, em ordem, antes de qualquer ação:

1. `docs/sdd/PIVOT-V2.md` — fonte única de verdade do pivô. Delta v1→v2, backlog F-V01..F-V12 classificado A/B/C/D, Anti-SPEC v2, 18 TBDs, plano em 6 ondas.
2. `docs/sdd/PLAYBOOK.md` — workflow operacional (loop por feature, classes, estados CONTINUE/PAUSE/BLOQUEADO, template de SPEC, CI mínimo).
3. `docs/STATUS_IMPLEMENTACAO.md` — só a seção "PIVÔ V2" no topo. Estado atual e backlog. Tudo abaixo dessa seção é histórico do v1 (NÃO use como verdade).
4. `docs/sdd/QUESTIONARIO-CLIENTE-V2.md` — texto que foi enviado ao cliente via WhatsApp pedindo decisão dos 18 TBDs.

### Regras críticas (não-negociáveis)

- **Anti-SPEC v2 é sagrada** (`PIVOT-V2.md` §3). Sem autorização explícita do humano, nunca tocar:
  - `members.sponsor_id`, `shopify_customers`, `orders`, `order_items`
  - Webhooks Shopify ativos (`/api/webhooks/shopify/*`)
  - RLS policies existentes
  - Migrations já aplicadas (sempre criar nova migration, nunca reverter)
  - ref_codes de membros existentes (formato `BH00001` mantém)
  - House Account (TBD-16) e cupom de creatina (TBD-17) — sem decisão do cliente
  - Código RPA/CPF (deprecated, mas remoção física só na onda 6 — F-V12)
- **NÃO implementar nada de v1**: CV, níveis (Parceira/Líder/Diretora/Head), Fast-Track, Bônus 1/2/3, Leadership Bônus, Royalty, RPA/CPF, reset mensal, compressão de 6 meses inativo. Esse código vive em `lib/cv/`, `lib/levels/`, `lib/commissions/` mas está congelado.
- **Cadastro v2 exige ref obrigatório** (link OU código manual). Não cair em House Account em fluxo v2 sem confirmação do TBD-16.
- **Toda feature v2 atrás de feature flag `LRP_V2`** (default `false`). Helper em `lib/utils/featureFlags.ts` (`isV2Enabled()`).
- **Sem evidência objetiva no QA → nunca aprovado.** Matriz de Validação obrigatória pra B/C/D (CA → teste → tipo → status → evidência). Teste fake (`expect(true).toBe(true)`) não conta.
- **Em conflito de docs:** `PIVOT-V2.md` > `PLAYBOOK.md` > `SPEC_Biohelp_LRP.md` (legado v1) > `WORKFLOW.md` (legado v1) > `documentos_projeto_iniciais_MD/*`.

### Estado atual (snapshot — confira no STATUS_IMPLEMENTACAO.md se vier outra sessão depois)

**Concluído (sessões 28-29/04/2026):**
- Onda 0 (documentação): `PIVOT-V2.md`, `PLAYBOOK.md`, `STATUS_IMPLEMENTACAO.md` atualizado, `QUESTIONARIO-CLIENTE-V2.md`, este `PROMPT-NOVA-SESSAO.md`.
- Frente 1 (preparação de infra): `lib/utils/featureFlags.ts` criado. Vars `LRP_V2` e `CRON_DISABLED_V2` em `.env.example` e `.env.local` (default `false`).
- Frente 3 (shells dos módulos novos): criados — `lib/subscriptions/`, `lib/commissions-v2/`, `lib/credits/`, `lib/founder/`, `lib/content/`. Cada um com types stub + TODO marcando o TBD que destrava.
- F-V11 SPEC criada: `docs/sdd/features/F-V11-visao-restrita-rede/SPEC.md` (status: Approved).
- **Adequação documental V2 (29/04/2026):** banner DEPRECATED nos 5 docs v1 (`SPEC_Biohelp_LRP.md`, `ACCEPTANCE.md`, `DECISOES_TBD.md`, `WORKFLOW.md`, `PR_TEMPLATE.md`); comentário `@deprecated` em 6 arquivos de código v1 (`lib/cv/calculator.ts`, `lib/levels/calculator.ts`, `lib/commissions/{calculator,bonus3,royalty}.ts`, `lib/network/compression.ts`); entrada v5.0 no `docs/CHANGELOG.md`; insumos do cliente persistidos (`documentos_escopo/Fluxo.txt`); índice `docs/README.md` reorganizado priorizando v2. **Importante:** todo o código v1 continua funcional (flag `LRP_V2=false` por default) — adequação foi sinalização, não remoção.

**Próxima ação imediata (29/04/2026 — pós-respostas):**
- **F-V11** já entregue ✅.
- **F-V01, F-V02, F-V03, F-V05** ✅ destravadas — qualquer uma pode começar. Recomendação: F-V01 primeiro (porta de entrada).
- **F-V06, F-V07** 🟡 parciais (podem começar com hipóteses padrão / partes não bloqueadas).

**Ainda bloqueado por TBDs abertos** (12 em `PIVOT-V2.md` §4.1): F-V04, F-V08, F-V09, F-V10, F-V13.

**TBDs respondidos em 29/04/2026** (11/18) — `PIVOT-V2.md` §4.2:
- **3** Cashin/PIX (Asaas descartado) · **4** aprovação manual + validação NF automática · **5** CPF via Cashin/crédito · **6** sem ERP · **7** Guru → Shopify webhook · **10** House Account descontinua · **13** ativo sem prazo (inativo TBD-21) · **14** saldo→crédito 1:1 sem prazo · **17** creatina vira campanhas (F-V13 nova) · **18** RPA/CPF descontinua.

**TBDs derivados (novos)**: 19 (Cashin confirmado?), 20 (Founder CPF?), 21 (prazo saldo inativo), 22 (UX campanhas creatina).

### O que fazer nesta sessão

Antes de qualquer código, pergunte ao usuário:
1. **Implementar F-V01** (cadastro com ref obrigatório)? Recomendação primária — porta de entrada do v2. TBD-10 resolvido (House Account descontinua). Hipóteses padrão documentadas pra TBD-8 (link de inativo bloqueia novos cadastros) e TBD-9 (código manual imutável).
2. **Implementar F-V02** (integração Guru via webhook Shopify)? Classe D — antes de mergear, **confirmar com Wink** se a abordagem Shopify-first cobre todos os eventos do Guru ou se precisa webhook direto do Guru também.
3. **Implementar F-V03** (status ativo = subscription_paid)? Depende de F-V02 estar em curso.
4. **Implementar F-V05** (saldo + créditos Shopify 1:1)? Pode rolar paralela — sem bloqueios pra a parte ativa; prazo do inativo (TBD-21) tem hipótese padrão (90 dias).
5. **Outra coisa?** Qualquer feature nova → criar SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` seguindo o template em `PLAYBOOK.md` antes de codar.

Para cada feature destravada que iniciar:
- Branch `feat/F-VNN-<slug>` a partir de `main` (ou da última branch mergeada).
- SPEC em `docs/sdd/features/F-VNN-<slug>/SPEC.md` com classe, DoR, RFs, CAs, arquivos permitidos, plano e matriz vazia.
- Toda lógica v2 atrás do flag `LRP_V2` (default OFF). Helper em `lib/utils/featureFlags.ts`.
- QA em Validation Mode (PLAYBOOK §11-A) com matriz preenchida.
- Atualizar `STATUS_IMPLEMENTACAO.md` + `PIVOT-V2.md §2` quando concluir.

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

*Última atualização: 2026-04-29 segunda sessão — TBDs respondidos pelo cliente (11/18). F-V01, F-V02, F-V03, F-V05 destravadas. 4 TBDs derivados criados (19/20/21/22). F-V13 nova feature (cupom de creatina como campanha configurável). Anti-SPEC §8/9/10 atualizadas, novo §11 (provider de pagamento). CHANGELOG v5.1.*
