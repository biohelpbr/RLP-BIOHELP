# TODO.md — Biohelp LRP (Harness v3.2)

> Estado vivo. Toda feature B/C/D precisa de Feature Contract inline (ou SPEC dedicada em `docs/sdd/features/F-VNN-<slug>/SPEC.md`).
> **Fonte de progresso histórica:** `docs/STATUS_IMPLEMENTACAO.md` (snapshot por sprint).
> **Tabela de status das features v2:** `docs/sdd/PIVOT-V2.md` §2.

**Última atualização:** 2026-06-05 (call 05/06 → blocos W1–W7; **W1 limpeza de dados de teste done** — PR #30 mergeado).

**Blocos da call 05/06 (W1–W7):** W1 limpar dados de teste dos números ✅ (PR #30) · W2 acessos admin (rperioli + Lais) + UI conceder/revogar ✅ (PR #31) · W3 editar e-mail do membro ⏳ · W4 CMS suporte (`app_settings` + `/admin/settings`) ⏳ · W5 aba Comercial ⏳ · W6 Academy CMS completo (PRIORIDADE) ⏳ · W7 auditoria "tudo é CMS" ⏳.

---

## 1. Backlog priorizado (v2 — fonte: `docs/sdd/PIVOT-V2.md` §2)

| ID | Feature | Classe | Sprint | Status | Bloqueio |
|---|---|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório (link OU código manual) | C | S2 | ⏳ Pendente | — |
| F-V02 | Integração Guru via webhook Shopify | D | S5 | ⏳ Pendente (precisa confirmar com Wink) | — |
| F-V03 | Status ativo = `subscription_paid` | C | S5 | ✅ Done (06/05) | — |
| F-V04 | Comissão 50% por assinatura de convidado | D | TBD | 🚫 Bloqueada | TBD-1, TBD-2 |
| F-V05 | Saldo + crédito Shopify 1:1 | C | S2 | ✅ UI Done; chamada `customer.credit` real pendente | — |
| F-V06 | Promoção a Founder ≥5 ativos | B | TBD | 🟡 Parcial | TBD-12 (hipótese padrão: definitivo) |
| F-V07 | Saque Founder Cashin + NF + triple resgate | D | S2/S5 | ✅ UI Done; Cashin live + NFe auto em S5 | — |
| F-V08 | Ranking de Founders | B | TBD | ✅ Destravada | — |
| F-V09 | Academy CMS | B | S4 | ✅ Done | — |
| F-V10 | Link WhatsApp Founder | A | TBD | 🚫 Bloqueada | TBD-16 |
| F-V11 | Visão restrita da rede | B | S1 | ✅ Done (29/04) | — |
| F-V12 | Cleanup v1 (CV, níveis, RPA) | D | Onda 6 | ⏳ Aguarda v2 estável | — |
| F-V13 | ~~Cupom creatina campanha~~ | — | — | ✅ Absorvida por F-V15 | — |
| F-V14 | Vendas manuais membro (CRM leve) | C | S2 | ✅ Done (06/05) | — |
| F-V15 | Eventos admin (criação + funil) | C | S4 | ✅ Done (06/05) | — |
| F-V16 | Painel admin completo (9 áreas) | B | S3-S4 | ✅ Done | — |
| F-V17 | SSO Shopify → Painel (App Proxy) | D | S5 | ✅ Done (06/05, default OFF) | — |
| F-V18 | Tags automáticas Líder/Influenciador | B | S3 | ✅ Done (06/05) | — |
| **F-V19** | **Fluxo Pré-cadastro → Guru → LRP → Shopify** | **D** | **S6 (22-25/05)** | **✅ MVP completo — 14/16 CAs verdes. Pendente: merge main + Guru real live.** | **—** |
| F-V20 | Resgate alinhado à Política Financeira Nutrition Club + UI Lovable | D | S6 | ✅ **Done 01/06** — PR #12 mergeado em main (`6c762bb`), E2E 22/22 PASS + smoke verde | — |
| F-V21 | Separar conta admin de identidade member (ADMIN001/ADMIN002/HOUSE têm member row → `ref_code` utilizável como sponsor + aparecem em `/admin/community`) | C | TBD | ⏳ Pendente (não-bloqueador go-live; registrado 31/05) | — |
| F-V22 | Avisos no painel (announcement bar CMS: msg + imagem + link + janela) | C | S6 | ✅ **Done 02/06** — deployado em main, banner da live 03/06 no ar (responsivo, ~30% reduzido). Follow-ups abertos: (a) decidir travar proporção do banner (3:1) p/ uploads previsíveis; (b) e-mail da live (Resend Pro) | — |
| F-V23 | Disparo de e-mail nativo no admin (Resend Pro) — segmentação + status | C | S7 | ✅ **Done 03/06** — PR #23 mergeado, envs Vercel + webhook Resend configurados, **teste real OK** (e-mail enviou/chegou/renderizou). ⚠️ **Cai no spam por REPUTAÇÃO** do domínio (Gmail: "previous messages from send.mail.bio-help.com were marked as spam") — não DNS. Follow-up: recuperar reputação (Postmaster Tools + report-not-spam + warm-up) ANTES de blast pra base | — |
| F-V24 | Cancelamento/estorno (Guru webhook + manual; imediato vs renovação) | D | S7 | ✅ **Done 03/06** — PR #25 mergeado (`9a98b25`). Webhook Guru já cobria os eventos automáticos; adicionado cancelamento **manual** no `/admin/community/[id]` (renovação vs imediato+Shopify revoke). Sem migration. Testar fluxo em produção | — |
| F-V25 | Busca de cliente no admin (`/admin/community`) | B | S7 | ✅ **Done 03/06** — PR #24 mergeado (`2975fd7`). Busca por nome/email/ref_code/telefone | — |
| F-V26 | Banner de avisos também na Academy (espelha F-V22) | B | S7 | ⏳ Pendente (P2). Contract inline §1.1 | — |
| F-V27 | Academy: refinar 3 trilhas + aulas/avisos programados por data | C | S7 | ⏳ Pendente (P2). Contract inline §1.1 | Léo refinar desenho no Lovable |
| F-V28 | Login alternativo com senha (emergência) | D | S7 | ✅ **Done 03/06** — PR #27 mergeado (`4773e74`). Admin gera senha provisória (mostrada + e-mail) no `/admin/community/[id]`; toggle código/senha na `/login`; troca obrigatória no 1º acesso (flag `app_metadata` + middleware → `/trocar-senha`). Sem migration. E2E 8/8 CAs. SPEC dedicada. | — |

**Próximas ações (snapshot 2026-05-25):**
- **F-V19 merge:** review final dos diffs → merge `feat/F-V19-fluxo-guru-pre-cadastro` em main.
- **F-V19 produção:** logar no Guru (credenciais recebidas) → configurar webhook → testar 1 transação → ligar `SHOPIFY_SUBSCRIPTION_SYNC_LIVE=true` quando Léo enviar variant id.
- **Follow-ups F-V19:** dashboard v2 ler `subscription_status` em vez de `status` legado; CA-13/14 fechar em QA pré-produção.
- Aguardando: respostas aos TBDs ainda abertos (1, 2, 8, 9, 12, 15, 16, 20, 21, 23-27) + items 1.3 (mockup minha comunidade), 1.4 (NF Biohelp), 1.6 (GURU_OFFER_ID), 1.7 (Shopify variant assinatura).

**Pedidos da call BioHelp&FlowCode (02/06):** registrados como F-V23–F-V28. Ordem sugerida: F-V23 (e-mail, mais urgente) → F-V24 (cancelamento) → F-V25 (busca) → F-V26 (banner Academy) → F-V27 (Academy trilhas) → F-V28 (login senha, reavaliar). Detalhe: `docs/wiki/context/F-V22.md` §follow-ups e SPECs F-V23/F-V24.

## 1.1 Feature Contracts inline — features da call 02/06 (B/C/D)

> F-V23 e F-V24 têm SPEC dedicada (links na tabela §1). Abaixo as demais.

### F-V25 — Busca de cliente no admin (B)
- **Pedido (Gabriel):** `/admin/community` só tem lista/paginação; não dá pra pesquisar um cliente. Atendimento trava.
- **Escopo:** campo de busca (nome / e-mail / `ref_code` / telefone) na página `/admin/community`, com filtro server-side. Sem mudança de schema.
- **Arquivos (proposto):** `app/admin/community/page.tsx` (+ query param `q`), `lib/admin/community*` (filtro). 
- **CA:** CA-1 buscar por nome/e-mail/código retorna o cliente; CA-2 vazio mostra "nenhum resultado"; CA-3 não-admin bloqueado.
- **Risco:** baixo. Não toca auth/pagamento.

### F-V26 — Banner de avisos também na Academy (B)
- **Pedido (Léo):** espelhar o banner de avisos (F-V22) na Academy, além da Visão Geral. "Abrir espaço pro banner" na Academy.
- **Escopo:** renderizar o mesmo `AnnouncementBar` (via `getActiveAnnouncement()`) no topo de `/dashboard/academy`. Reusa F-V22 inteiro — só adiciona o render.
- **Arquivos:** `app/dashboard/academy/page.tsx` (edição). 
- **CA:** CA-1 aviso ativo aparece na Academy igual na Visão Geral; CA-2 sem aviso = sem barra.
- **Liga com:** decisão aberta de proporção do banner (3:1) — resolver junto.

### F-V27 — Academy: refinar trilhas + aulas/avisos programados (C)
- **Pedido (Léo):** consolidar **3 trilhas** (Consumo/rotina · Revender produtos · Desenvolver comunidade) espelhando o desenho do Lovable; aula de boas-vindas (live) vira aula; e **aulas/avisos programados por data** ("no dia tal teremos conteúdo X") pra galera se programar, vídeo subido quando acontece.
- **Escopo:** estende F-V09 (Academy CMS). (a) ajustar/seed das 3 trilhas; (b) campo de "data programada" + estado "em breve" em conteúdos/aulas futuras; (c) badge/aviso de aula futura na trilha.
- **Arquivos (proposto):** `lib/content/*` (schema + queries — campo `scheduled_at`/`status`), `app/admin/academy/*` (form), `app/dashboard/academy/*` (exibição "em breve").
- **CA:** CA-1 3 trilhas refletem o desenho; CA-2 admin marca aula como futura com data → membro vê "em breve · dia X"; CA-3 ao subir o vídeo, deixa de ser "em breve".
- **Bloqueio:** Léo precisa refinar o desenho final no Lovable antes do seed das trilhas.

### F-V28 — Login alternativo com senha (D) — ✅ DONE 03/06
- **Pedido (Gabriel):** clientes não recebiam o código (caía no spam / limite diário do Resend free). Quer login com senha provisória como emergência.
- **Entregue (PR #27, `4773e74`):** admin gera senha provisória no `/admin/community/[id]` (mostrada pra copiar + e-mail Resend); `/login` com toggle código/senha (`signInWithPassword`, mesmo gate `check-email`); troca obrigatória no 1º acesso via flag `app_metadata.must_reset_password` + middleware → `/trocar-senha`. Sem migration. E2E validado (8/8 CAs). SPEC: `docs/sdd/features/F-V28-login-senha/SPEC.md`.

---

## 2. Em andamento

### F-V19 — Fluxo pré-cadastro Guru (branch `feat/F-V19-fluxo-guru-pre-cadastro`)
- **Classe:** D (webhook produção-crítico + sync Shopify + cria customer/order)
- **SPEC:** [docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md](docs/sdd/features/F-V19-fluxo-guru-pre-cadastro/SPEC.md)
- **Status:** ✅ MVP completo — 14/16 CAs verdes, 2 parciais (CA-13 static, CA-14 indireto). Branch pronta pra merge.
- **Branch:** `feat/F-V19-fluxo-guru-pre-cadastro` (3 commits código + 1 docs)
- **Próximo passo concreto:** merge em main + configurar webhook Guru real + Shopify sync live
- **DoR:** ✅ completa (ver SPEC)
- **Feature Contract:** SPEC atua como Feature Contract (Agent §7)
- **Escopo entregue:** landing + form + webhook Guru receiver (schema real via runbook) + simulate-guru + /welcome auto-login + sininho admin + cron diário. Shopify sync em mock (liga com SHOPIFY_SUBSCRIPTION_SYNC_LIVE=true quando Léo enviar variant id).

### Feedback pós-demo 13/05 (call 20/05 10h-11h) — branch `feat/feedback-pos-demo-20mai`

**Status:** 4 commits entregues (U1, A3, A4, A1). 7 itens C/D documentados em `docs/sdd/PERGUNTAS-CALL-20MAI.md` aguardando decisão da call. Roteiro de apresentação em `docs/sdd/ROTEIRO-DEMO-CALL-20MAI.md`.

#### Entregue nesta branch
- ✅ **U1** Copiar link membro retorna URL absoluta (fallback `https://rlp-biohelp.vercel.app`) — V2Dashboard
- ✅ **A4** Nome cliente em /admin/payouts vira link → /admin/community/[id]
- ✅ **A3** Texto "Fonte de dados" /admin/consumption reescrito (3 parágrafos explicando vendas auto vs Shopify reais)
- ✅ **A1** Spec change F-V18 v2 + F-V06: tag `auto:lider` removida, Influenciador vira `manual:influenciador`, FOUNDER conta por condição (`member_active_affiliate_count.active_count >= 5`)

#### Aguardando decisão na call de 20/05 (documentadas em `PERGUNTAS-CALL-20MAI.md`)
- 🟡 **A2** Diferenciar receita produto vs assinatura + valor Biohelp vs comissão (reabre TBD-1, TBD-2)
- 🟡 **A5+U6** Avisos/Notificações admin+user (1 ou 2 features?)
- 🟡 **U2** Página do membro em Minha comunidade (read-only, campos a definir)
- 🟡 **U3** Painel da comunidade do sponsor (visão upward)
- 🟡 **U4** Refator vendas manuais com `custo` + linhas múltiplas + totais (schema decisão: jsonb vs tabela filha)
- 🟡 **U5** Posts Founder com aprovação admin (nova tabela `community_posts` + workflow)

#### Liga com integração Guru
- F-V02 end-to-end com assinatura real — Wink envia credenciais Guru + reservar 1h pra test (decisão na call).

### Template de item

```
### F-VNN — <nome>
- **Classe:** A | B | C | D
- **SPEC:** `docs/sdd/features/F-VNN-<slug>/SPEC.md`
- **Status:** Em DoR | Em Implementação | Em QA | Em PR
- **Branch:** `feat/F-VNN-<slug>`
- **Próximo passo concreto:** ...
- **DoR (checklist):** ver SPEC §DoR
- **Feature Contract:** ver SPEC ou `docs/plans/feature-contracts/F-VNN.md` se >40 linhas
```

---

## 3. Backlog não priorizado / ideias

(vazio).

---

## 4. Pendentes técnicos (não-feature)

- Aplicar `LRP_V2=true` em produção quando todas as features S5 forem validadas pelo cliente.
- Onboarding Cashin live com Léo (TBD-19 ✅, mas credenciais sandbox/live ainda pendentes).
- Decidir prazo de validade do crédito Shopify (TBD-23).
- Dados reais de NF da Biohelp (CNPJ, razão social, endereço) — mover de hardcoded em `components/biohelp/WithdrawDialog.tsx` para env ou `system_config` (TBD-27).

---

## 5. Bugs

(vazio — usar `/triage-bugs` quando aparecer ≥2 bugs do cliente).

### Template de linha
| ID | Descrição | Repro | Classe | Domínio | Urgência | Impacto | Esforço | Modo | Status | Notas |
|---|---|---|---|---|---|---|---|---|---|---|
| BUG-NNN | ... | ... | A/B/C/D | auth/payouts/etc | P0/P1/P2 | crítico/médio | < 30min | fast-fix/standard | TRIADO/EM FIX/EM QA/RESOLVIDO | runbook? |

---

## 6. Decisões abertas / TBDs ao cliente

Fonte: `docs/sdd/PIVOT-V2.md` §4.1 (10 TBDs abertos).

Curtos prazos:
- TBD-23 (validade crédito Shopify), TBD-24 (eventos entry-fee?), TBD-25 (preço sugerido vendas manuais), TBD-26 (critério ranking Founder), TBD-27 (NF Biohelp dados).
- TBD-1/2 destravam F-V04 (comissão 50%) e parte de F-V07.
