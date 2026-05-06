# F-V11 — Visão restrita da rede pro membro

## Metadata
- ID: F-V11
- Classe: B
- Status: **Done** (estática) / Pendente validação manual em dev server
- Onda: 4 (antecipada — independe de TBDs)
- Data início: 2026-04-28
- Data conclusão (build limpo): 2026-04-29
- Branch: `feat/F-V11-visao-restrita-rede`

## Contexto
Hoje o membro vê toda a árvore da rede recursivamente em `/dashboard/network` (a rota `GET /api/members/me/network` chama RPC `get_member_network` que retorna todos os descendentes). No modelo v2 ("não há mais múltiplos níveis"), o membro deve ver apenas:

- Seu sponsor (1 nível pra cima — quem o trouxe pro clube).
- Seus indicados diretos (1 nível pra baixo — quem ele trouxe).

Admin continua vendo a estrutura completa via rotas próprias (`/admin/*`). Esta feature toca **apenas a rota e UI do membro**, sem mexer em RLS, contratos ou regra de negócio. Independe de TBDs porque é refactor de visualização.

## Definition of Ready
- [x] RFs definidos
- [x] CAs testáveis
- [x] Arquivos permitidos listados
- [x] Anti-SPEC aplicável citada
- [x] TBDs bloqueantes resolvidos (nenhum)

## Requisitos Funcionais
- **RF-1:** A rota `GET /api/members/me/network` deve retornar (quando flag v2 ON):
  - Sponsor (1 objeto, ou `null` se for House Account / topo).
  - Lista de indicados diretos (`depth = 1` apenas).
  - **Não** retornar membros profundos (depth ≥ 2).
  - **Não** retornar `cv_rede`, `by_level` ou estatísticas multi-nível (CV não existe no v2).
- **RF-2:** A página `/dashboard/network` deve renderizar (quando flag v2 ON):
  - Card com info do sponsor (nome, ref_code, status). Caso `null` ou House Account, mensagem "Você foi cadastrada pela equipe Biohelp".
  - Lista/grid dos indicados diretos com: nome, ref_code, status, data de cadastro.
  - **Remover** árvore recursiva e estatísticas por profundidade (N0/N1/N2).
- **RF-3:** Comportamento controlado por `LRP_V2`:
  - `LRP_V2=false` → comportamento atual (rede completa) — preserva produção.
  - `LRP_V2=true` → comportamento restrito v2.

## Critérios de Aceite
- **CA-01:** Com `LRP_V2=true`, response da rota retorna apenas membros com `depth = 1` + objeto sponsor.
- **CA-02:** Com `LRP_V2=true`, payload **não inclui** campo `cv_rede`, `by_level` ou estatísticas multi-nível.
- **CA-03:** Com `LRP_V2=true`, página exibe card do sponsor (ou mensagem alternativa quando sponsor é House Account/null).
- **CA-04:** Com `LRP_V2=true`, página exibe os indicados diretos numa lista; **não renderiza** componente `NetworkTree`.
- **CA-05:** Com `LRP_V2=false`, comportamento atual permanece intocado (regression test do path antigo).
- **CA-06:** Membro tentando acessar dado de outro membro recebe 401/403/404 (RLS + filtros).

## Arquivos PERMITIDOS
- `app/api/members/me/network/route.ts` (refactor por flag) ✅
- `app/dashboard/network/page.tsx` (refactor por flag) ✅
- `app/dashboard/network/page.module.css` (sem alteração — não foi necessária)
- `app/components/SponsorCard.tsx` (NOVO componente) ✅
- `app/components/SponsorCard.module.css` (NOVO) ✅
- `app/components/DirectReportsList.tsx` (NOVO componente) ✅
- `app/components/DirectReportsList.module.css` (NOVO) ✅
- `lib/utils/featureFlags.ts` (consumo) ✅
- `types/database.ts` (adicionar `SponsorInfo`, `DirectReport`, `MemberNetworkResponseV2`) ✅
- `lib/network/v2.ts` (NOVO — adicionado pelo fluxo de escape do PLAYBOOK §11-B) ✅

### Justificativa do escape (lib/network/v2.ts)
- **Arquivo:** `lib/network/v2.ts`
- **Motivo:** Encapsular a lógica de busca v2 (sponsor + direct_reports) fora do route handler pra deixar a rota legível e a lógica isolável.
- **Impacto:** Zero em produção — função só executa com `LRP_V2=true` (default OFF).
- **Escopo:** Apenas leitura via Service Client, mesmo padrão do route handler antigo.
- **Contrato:** Retorna `MemberNetworkResponseV2` (já permitido em `types/database.ts`).
- **Testes:** Coberto pelos CAs CA-01 e CA-02 via rota.
- **Reclassificação:** Não muda. Continua classe B.

## Arquivos PROIBIDOS (Anti-SPEC v2 §3) — não tocados ✅
- `lib/network/compression.ts` (intocado)
- `app/components/NetworkTree.tsx` (intocado — admin ainda usa)
- `app/components/LevelCard.tsx` (intocado)
- Migrations / RLS policies / RPCs do banco (intocados)
- Tabelas `members`, `shopify_customers`, `orders` (intocadas)

## Plano de implementação — execução
1. ✅ Branch `feat/F-V11-visao-restrita-rede` criada (29/04/2026).
2. ✅ Tipos v2 adicionados em `types/database.ts` (`SponsorInfo`, `DirectReport`, `MemberNetworkResponseV2` com discriminator `version: 'v2'`).
3. ✅ Helper `lib/network/v2.ts` com `getMemberNetworkV2(memberId)`.
4. ✅ Rota `app/api/members/me/network/route.ts` refatorada com gate `isV2Enabled()`. V1 LEGACY mantido intacto.
5. ✅ Componentes `SponsorCard` e `DirectReportsList` (TSX + CSS module) criados.
6. ✅ Página `app/dashboard/network/page.tsx` refatorada com type guard `isV2Response()` e dois sub-componentes internos `V2View` / `V1View`.
7. ✅ `npx tsc --noEmit` — sem erros.
8. ✅ `npx next build` — sem erros. Bundle de `/dashboard/network` ficou em 5.62 kB.

## Validation Mode — exercido (sem dev server)
- ✅ **Inputs inválidos:** rota é GET sem body. Único input é o `auth_user_id` da sessão Supabase Auth — autenticação garante validade.
- ✅ **Estado vazio — sem sponsor:** `SponsorCard` lida com `sponsor === null` mostrando mensagem "Você foi cadastrada pela equipe Biohelp".
- ✅ **Estado vazio — House Account:** flag `is_house_account` preenchida em `getMemberNetworkV2` quando `sponsor.id === HOUSE_ACCOUNT_ID`. UI mostra a mesma mensagem.
- ✅ **Estado vazio — sem indicados:** `DirectReportsList` renderiza empty state com "Sua rede está começando!" quando array vazio.
- ✅ **Permissões / vazamento:** `getMemberNetworkV2` recebe `member.id` resolvido a partir de `auth_user_id=user.id`. Sponsor é lido por `eq('id', member.sponsor_id)` (apenas o sponsor do próprio membro). Direct reports por `eq('sponsor_id', member.id)` (apenas filhos do próprio membro). Sem chance de cross-tenant.
- ✅ **Idempotência:** GET é puro, sem mutação. Múltiplas chamadas = mesmo resultado.
- ✅ **Toggle de flag determinístico:** `isV2Enabled()` lê `process.env.LRP_V2` no runtime do Server Component / Route Handler. Sem cache em memória que persista entre requests.
- ✅ **Diff fora do escopo:** todos os arquivos alterados estão na lista PERMITIDOS (com escape documentado para `lib/network/v2.ts`).

## Matriz de Validação
| CA | Teste | Tipo | Status | Evidência |
|---|---|---|---|---|
| CA-01 | `getMemberNetworkV2` faz apenas `.eq('sponsor_id', member.id)` (N1) e `.eq('id', sponsor_id)` (sponsor) — sem RPC recursiva | inspeção estática | ✅ Passou | `lib/network/v2.ts:60-78` |
| CA-02 | `MemberNetworkResponseV2` (TS estrito) não declara `cv_rede`, `by_level`, `stats` | typecheck | ✅ Passou | `types/database.ts:823-848` + `tsc --noEmit` 0 erros |
| CA-03 | `SponsorCard` renderiza para sponsor real, null e House Account | manual UI | ⏳ Pendente | requer dev server + flag ON |
| CA-04 | `V2View` em `page.tsx` não importa `NetworkTree`; `isV2Response` type guard direciona render | inspeção estática | ✅ Passou | `app/dashboard/network/page.tsx:127-160` (V2View não chama NetworkTree) |
| CA-05 | `route.ts` path else (LRP_V2=false) idêntico ao original; `V1View` em `page.tsx` mantém UI/cards/NetworkTree do v1 | inspeção estática | ✅ Passou | `app/api/members/me/network/route.ts:62-118` + `app/dashboard/network/page.tsx:166-262` |
| CA-06 | RLS não foi alterada; queries usam Service Client com filtros `.eq('id', member.sponsor_id)` e `.eq('sponsor_id', member.id)` que limitam ao escopo do próprio membro | inspeção estática | ✅ Passou | `lib/network/v2.ts:48-78` |
| **Validação manual final** | Toggle `LRP_V2=true/false` em `.env.local` + `npm run dev` + login real, verificar UI e payload | manual end-to-end | ⏳ Pendente | aguarda usuário rodar dev server |

## Rollback
Se der ruim em produção: `LRP_V2=false` no env volta a v1 imediatamente. Como nenhum schema/RLS muda, é rollback de 1 var. No Vercel: editar env var + redeploy (~1 min). Em local: editar `.env.local` + restart do dev server.

## Build/Lint
- `npx tsc --noEmit` → 0 erros (29/04/2026)
- `npx next build` → sucesso (29/04/2026). Bundle `/dashboard/network` = 5.62 kB First Load JS = 92.9 kB.
- ESLint: projeto sem `.eslintrc` configurado — `next lint` pede setup interativo. Pulado nesta sessão; build do Next valida tipos e parsing.

---

*Última atualização: 2026-04-29 (implementação concluída, validação manual pendente).*
