# PRD — Biohelp LRP v2

> **Espelho consolidado.** Fonte de verdade canônica: `docs/sdd/PIVOT-V2.md` §1 e §2.
> Este arquivo serve à conformidade Harness v3.2 §4 (estrutura padrão `docs/product/PRD.md`). Em conflito, **PIVOT-V2.md prevalece**.

## Sumário executivo

**Produto:** Biohelp LRP — programa de afiliação **1-nível** para a marca Biohelp (suplementos / clube de assinatura na Shopify).

**Modelo (v2):** Comissão 50% direta por assinatura paga de convidado (1 nível). Saldo conversível 1:1 em **Crédito Shopify**. Parceira vira **Founder** ao atingir **5 ativos** no clube e destrava saque cash via **Cashin/PIX** com NF de serviço (CNPJ) ou Cashin direto (CPF — TBD-20). Tags automáticas Líder (≥5) / Influenciador (≥40) — F-V18.

**Stack/Produção:** Next.js 14 + Supabase + Shopify Admin API. Em produção em `https://rlp-biohelp.vercel.app`. Pivot v2 declarado 28/04/2026. Sprints S1–S5 entregues 29/04 → 06/05/2026. Demo cliente 13/05/2026 ✅. Buffer 10–11/06. **Go-live 11/06/2026** (`LRP_V2=true`).

## Histórico

Modelo v1 era **MLM CV-based** (5 sprints v1 entregues ~98% FRs até 02/2026). Em 28/04/2026 cliente realinhou para **afiliação simplificada** (motivos: complexidade jurídica MLM, dificuldade de onboarding, retenção fraca em níveis profundos). v1 deprecated mas código **congelado** (cleanup só em F-V12, onda 6 — pós v2 estável). Histórico completo: `docs/sdd/PIVOT-V2.md` §1.

## Usuários

### Parceira (membro)
- Entra **via ref obrigatório** (link OU código manual — F-V01).
- Registra **leads/vendas manuais** (CRM leve — F-V14).
- Vê saldo + sponsor + indicados diretos (visão restrita — F-V11).
- Resgata via **3 métodos** (triple resgate — F-V07): Cashin / Crédito Shopify 1:1 / PIX+NF.
- Vira **Founder** ao atingir 5 ativos no clube (F-V06).
- Tags automáticas: Líder (≥5 ativos) e Influenciador (≥40 acumulado) — F-V18.

### Founder (Parceira promovida)
- Destrava saque cash via Cashin/PIX (F-V07).
- CNPJ pode emitir NF; CPF cai em fluxo TBD-20 (Cashin direto / limite legal).
- Ranking entre Founders (F-V08) — critério inicial = nº de pessoas no clube; final em TBD-26.

### Admin Biohelp
- **Painel completo 9 áreas** (F-V16): Visão Geral, Comunidade (com tags), Crescimento, Consumo, Produtos, Eventos (F-V15), Financeiro, Resgates (triple), Academy (F-V09).
- Aprovação **manual** de saques + validação **automática** de NF (F-V07c).

## Features v2

Tabela curta de status. Detalhe completo, classes, bloqueios e ondas em `docs/sdd/PIVOT-V2.md` §2.

| ID | Feature | Classe | Status |
|---|---|---|---|
| F-V01 | Cadastro com ref obrigatório | C | ⏳ Pendente |
| F-V02 | Integração Guru via webhook Shopify | D | ⏳ Pendente |
| F-V03 | Status ativo = subscription_paid | C | ✅ Done (06/05) |
| F-V04 | Comissão 50% por assinatura | D | 🚫 TBD-1/2 |
| F-V05 | Saldo + crédito Shopify 1:1 | C | ✅ UI Done |
| F-V06 | Promoção a Founder ≥5 ativos | B | 🟡 Parcial |
| F-V07 | Saque triple (Cashin + Crédito + PIX+NF) | D | ✅ UI Done |
| F-V08 | Ranking de Founders | B | ✅ Destravada |
| F-V09 | Academy CMS | B | ✅ Done |
| F-V10 | Link WhatsApp Founder | A | 🚫 TBD-16 |
| F-V11 | Visão restrita da rede | B | ✅ Done (29/04) |
| F-V12 | Cleanup v1 | D | ⏳ Onda 6 |
| F-V14 | Vendas manuais membro | C | ✅ Done (06/05) |
| F-V15 | Eventos admin | C | ✅ Done (06/05) |
| F-V16 | Painel admin completo | B | ✅ Done |
| F-V17 | SSO Shopify (App Proxy) | D | ✅ Done (default OFF) |
| F-V18 | Tags automáticas | B | ✅ Done (06/05) |

## TBDs abertos

10 TBDs ainda em aberto (1, 2, 8, 9, 12, 15, 16, 20, 21, e derivados 23–27). Fonte: `docs/sdd/PIVOT-V2.md` §4.1.

## Não-objetivos (pós-MVP)

Explicitamente fora de escopo até decisão futura:
- Foto-comida (calorias).
- Registro de treino + integrações Apple Watch / Google Fit.
- Gamificação "Iron Man".
- `admin/Alerts` e `admin/Settings` (gestão de admins via UI — fica via SQL direto).
- Modelo MLM CV-based (v1) — descontinuado, código congelado até F-V12.

## Restrições de produção

Ver Anti-SPEC v2 em `docs/sdd/PIVOT-V2.md` §3 e espelho em `docs/specs/SPEC.md` §6 (13 itens sagrados — não mexer sem autorização humana).

## Métrica de sucesso

- ✅ Demo cliente 13/05/2026 entregue.
- ⏳ Switch `LRP_V2=true` em prod em **11/06/2026** sem incidente.
- ⏳ Cliente valida pelo menos 3 fluxos críticos (cadastro com ref, saque triple, painel admin) em ambiente prod.

## Referências canônicas

- `docs/sdd/PIVOT-V2.md` — fonte de verdade v2 (sempre prevalece).
- `docs/sdd/PLAYBOOK.md` — workflow operacional vivo.
- `docs/sdd/CRONOGRAMA-V2.md` — sprints S1–S5 + buffer + go-live.
- `docs/sdd/LOVEABLE-IMPORT.md` — design system + Anti-SPEC do import.
- `docs/sdd/RUNBOOK-GOLIVE-11062026.md` — runbook do go-live.
- `docs/sdd/features/F-VNN-<slug>/SPEC.md` — SPEC por feature (≥18).
- `docs/STATUS_IMPLEMENTACAO.md` — progresso por sprint.
